/**
 * Exports the design's raster assets from Figma into `src/assets/figma/`.
 *
 * Run with `bun run figma:export`. Needs FIGMA_PAT in the environment; see the
 * "Figma asset export" section of AGENTS.md.
 *
 * Deliberately built on `GET /v1/files/:key/images` (every image *fill* in the
 * file, one response) rather than a `GET /v1/images` render per node. Both are
 * Tier 1, the most rate-limited tier, so one call for all eight assets instead
 * of eight calls is the difference between finishing and being throttled —
 * which is what happened to the original extraction.
 *
 * Re-running skips assets whose reference, width and quality already match the
 * manifest, which saves bandwidth and encode time. It does *not* save quota:
 * the single Tier 1 request happens before any of that, so a no-op run still
 * costs one call.
 */
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
  stat,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FigmaClient, tokenFromEnv } from "./figma-client.ts";
import { ExitCode, FigmaError } from "./figma/errors.ts";
import {
  assertEncoderAvailable,
  discardOriginal,
  inspectImage,
  optimizeAsset,
} from "./figma/optimize.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = resolve(ROOT, "src/assets/figma");
const FILE_KEY = "OxxksZFS8hzKoFTeSRdFGs";
/** Assets are encoded at twice their design width, which covers retina displays. */
const RETINA_SCALE = 2;

/**
 * Image fills worth pulling, keyed by Figma's `imageRef`. Named rather than
 * dumped wholesale so the filenames on disk say what each asset is — the refs
 * themselves are opaque hashes.
 *
 * The 27x27 flag icons that also appear as fills are omitted on purpose: they
 * already ship inside `public/banner-2.lottie`.
 */
interface WantedAsset {
  ref: string;
  name: string;
  note: string;
  /** Rendered width in the 1440 design; the WebP is capped at twice this. */
  designWidth: number;
  /** WebP quality. Photographs tolerate 80; flat UI needs more to stay crisp. */
  quality: number;
}

const WANTED: readonly WantedAsset[] = [
  {
    ref: "49da61454b1d3e49",
    name: "hero-panel",
    note: "Full product dashboard screenshot used as the hero visual — sidebar, stat cards, activity list and video still, all one image",
    designWidth: 931,
    quality: 90,
  },
  {
    ref: "a1762f3486f62a5c",
    name: "hero-backdrop-a",
    note: "Hero video container backdrop, 800x838",
    designWidth: 800,
    quality: 80,
  },
  {
    ref: "c86040899b8d1030",
    name: "hero-backdrop-b",
    note: "Hero video container backdrop, 800x838",
    designWidth: 800,
    quality: 80,
  },
  {
    ref: "4ca778739defffbf",
    name: "feature-section-bg-a",
    note: "Feature section background, 1424x814",
    designWidth: 1424,
    quality: 80,
  },
  {
    ref: "bd6e7ba663052226",
    name: "feature-section-bg-b",
    note: "Feature section background, 1424x814",
    designWidth: 1424,
    quality: 80,
  },
  {
    ref: "247c5d379fa0e0fc",
    name: "bento-card",
    note: "Bento card artwork, 682x665",
    designWidth: 682,
    quality: 85,
  },
  {
    ref: "4aeba4b18d2c7297",
    name: "avatar",
    note: "Collaborator avatar, 40x40",
    designWidth: 40,
    quality: 90,
  },
  {
    ref: "bd393d2ff199c756",
    name: "cursor-profile",
    note: "Cursor profile image, 59x59",
    designWidth: 59,
    quality: 90,
  },
];

interface ManifestEntry {
  ref: string;
  file: string;
  bytes: number;
  note: string;
  /**
   * Effective encoder inputs, recorded so a later run can tell whether the
   * export settings changed. `maxWidth` rather than the design width, so that
   * altering the retina multiplier also invalidates existing entries.
   */
  maxWidth: number;
  quality: number;
}

/** A wanted asset paired with the download URL Figma returned for it. */
type ResolvedAsset = WantedAsset & { url: string };

async function main(): Promise<void> {
  // Preflight before any network call: on a low-tier seat every Tier 1 request
  // is a meaningful slice of the monthly allowance, and spending one only to
  // discover the encoder is absent is pure waste.
  assertEncoderAvailable();

  const client = new FigmaClient({ token: tokenFromEnv() });
  await mkdir(OUT_DIR, { recursive: true });
  const previous = await readManifest();

  console.error(
    "figma: fetching image fill URLs (1 Tier 1 request for the whole file)",
  );
  const fills = await client.getImageFills(FILE_KEY);

  const resolved = matchRefs(fills.meta.images);

  // Fail before spending any bandwidth or encoder time. An earlier version
  // checked this at the end, which meant a single stale reference downloaded
  // and encoded the other seven assets, overwrote the manifest with an
  // incomplete list, and only then exited non-zero — leaving the directory and
  // its manifest disagreeing about what exists.
  if (resolved.length !== WANTED.length) {
    const found = new Set(resolved.map((item) => item.name));
    const missing = WANTED.filter((item) => !found.has(item.name)).map(
      (item) => item.name,
    );
    throw new FigmaError(
      `Only ${resolved.length} of ${WANTED.length} wanted assets matched; missing: ${missing.join(", ")}.`,
      ExitCode.Failure,
      "An image reference in WANTED no longer matches the file. Re-check the refs against the current Figma document.",
    );
  }
  console.error(`figma: matched all ${resolved.length} wanted assets`);

  // Created after the calls that can fail early (auth, rate limit, ref
  // mismatch), so those paths cannot leave an orphaned directory in /tmp.
  const scratchDir = await mkdtemp(resolve(tmpdir(), "conloca-figma-"));
  const manifest: ManifestEntry[] = [];
  try {
    for (const item of resolved) {
      manifest.push(
        await materialize(
          client,
          item,
          previous.get(`${item.name}.webp`),
          scratchDir,
        ),
      );
    }
  } finally {
    await rm(scratchDir, { recursive: true, force: true });
  }

  await writeFile(
    resolve(OUT_DIR, "manifest.json"),
    `${JSON.stringify({ fileKey: FILE_KEY, assets: manifest }, null, 2)}\n`,
    "utf8",
  );
  console.error(
    `figma: manifest written, ${manifest.length} asset(s) in src/assets/figma/`,
  );
}

/**
 * Figma's fill map is keyed by full-length imageRefs while the node tree we
 * scanned recorded truncated ones, so match on prefix and require it to be
 * unambiguous rather than silently taking the first hit.
 */
function matchRefs(
  urls: Readonly<Record<string, string | null>>,
): ResolvedAsset[] {
  const keys = Object.keys(urls);
  const matched: ResolvedAsset[] = [];

  for (const wanted of WANTED) {
    const hits = keys.filter(
      (key) => key.startsWith(wanted.ref) || wanted.ref.startsWith(key),
    );
    if (hits.length === 0) {
      console.error(
        `figma: no fill found for ${wanted.name} (${wanted.ref.slice(0, 12)}…)`,
      );
      continue;
    }
    if (hits.length > 1) {
      console.error(
        `figma: ambiguous ref for ${wanted.name}, skipping (${hits.length} matches)`,
      );
      continue;
    }
    const key = hits[0];
    if (key === undefined) continue;
    const url = urls[key];
    if (typeof url !== "string" || url.length === 0) {
      console.error(`figma: ${wanted.name} has no downloadable URL`);
      continue;
    }
    matched.push({ ...wanted, ref: key, url });
  }
  return matched;
}

/**
 * Downloads one asset if absent, converts it to a size-capped WebP, and drops
 * the original. Idempotent: an existing `.webp` short-circuits the whole thing,
 * so a run interrupted by a quota resumes instead of re-downloading.
 */
async function materialize(
  client: FigmaClient,
  item: ResolvedAsset,
  previous: ManifestEntry | undefined,
  scratchDir: string,
): Promise<ManifestEntry> {
  const webpName = `${item.name}.webp`;
  const webpPath = resolve(OUT_DIR, webpName);
  const maxWidth = item.designWidth * RETINA_SCALE;
  const existingBytes = await sizeOf(webpPath);

  // Resume only when the *inputs* also match. Keying purely on "a file with
  // this name exists" meant that changing a ref, width or quality left the old
  // asset in place while the manifest recorded the new settings against it.
  // `maxWidth` rather than `designWidth` is recorded so that changing
  // RETINA_SCALE also invalidates every entry.
  if (
    existingBytes !== undefined &&
    previous !== undefined &&
    sameInputs(previous, item, maxWidth)
  ) {
    if (existingBytes === previous.bytes) {
      console.error(
        `figma: ${webpName} already current (${kb(existingBytes)}), skipping`,
      );
      return {
        ...describe(item, maxWidth),
        file: webpName,
        bytes: existingBytes,
      };
    }
    console.error(
      `figma: ${webpName} size differs from the manifest, re-exporting`,
    );
  } else if (existingBytes !== undefined) {
    console.error(
      `figma: ${webpName} exists but its source or settings changed, re-exporting`,
    );
  }

  const bytes = await client.download(item.url);
  // Figma's fill URLs serve whatever format was originally uploaded, so the
  // container has to come from the bytes rather than being assumed.
  const info = inspectImage(Buffer.from(bytes));
  if (info === undefined) {
    throw new FigmaError(
      `${item.name} is in a format this pipeline cannot encode.`,
      ExitCode.Failure,
      "Only PNG and JPEG fills are supported; extend inspectImage in scripts/figma/optimize.ts.",
    );
  }

  // The original lands in a scratch directory outside the repository: when
  // Figma serves an asset whose extension matches the output, the two paths
  // would otherwise be identical and discarding the "original" would delete
  // the freshly encoded result.
  const scratch = resolve(scratchDir, `${item.name}.${info.extension}`);
  // codeql[js/http-to-file-access] `info.extension` (folded into `scratch`
  // above) is typed 'png' | 'jpg' (see scripts/figma/optimize.ts) --
  // inspectImage derives it from the response bytes' magic-byte header, but
  // the return value is one of those two literals regardless of what the
  // header actually says, so the downloaded bytes cannot inject an arbitrary
  // path segment into this write.
  await writeFile(scratch, bytes);

  const { sourceBytes, targetBytes } = await optimizeAsset({
    source: scratch,
    target: webpPath,
    scratchDir,
    sourceWidth: info.width,
    maxWidth,
    quality: item.quality,
  });
  await discardOriginal(scratch);

  const saved = Math.round((1 - targetBytes / sourceBytes) * 100);
  console.error(
    `figma: ${webpName} ${kb(sourceBytes)} -> ${kb(targetBytes)} (-${saved}%)`,
  );
  return { ...describe(item, maxWidth), file: webpName, bytes: targetBytes };
}

/** The subset of a manifest entry that decides whether a re-export is needed. */
export function sameInputs(
  previous: Pick<ManifestEntry, "ref" | "maxWidth" | "quality">,
  item: Pick<ResolvedAsset, "ref" | "quality">,
  maxWidth: number,
): boolean {
  return (
    previous.ref === item.ref &&
    previous.maxWidth === maxWidth &&
    previous.quality === item.quality
  );
}

function describe(
  item: ResolvedAsset,
  maxWidth: number,
): Omit<ManifestEntry, "file" | "bytes"> {
  return { ref: item.ref, note: item.note, maxWidth, quality: item.quality };
}

async function sizeOf(path: string): Promise<number | undefined> {
  try {
    return (await stat(path)).size;
  } catch {
    return undefined;
  }
}

async function readManifest(): Promise<Map<string, ManifestEntry>> {
  try {
    const raw = await readFile(resolve(OUT_DIR, "manifest.json"), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || !("assets" in parsed))
      return new Map();
    const assets = (parsed as { assets: unknown }).assets;
    if (!Array.isArray(assets)) return new Map();
    return new Map(
      assets
        .filter((entry): entry is ManifestEntry => isManifestEntry(entry))
        .map((entry) => [entry.file, entry]),
    );
  } catch {
    return new Map();
  }
}

function isManifestEntry(value: unknown): value is ManifestEntry {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ManifestEntry>;
  return (
    typeof candidate.file === "string" && typeof candidate.ref === "string"
  );
}

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// Guarded so the pure helpers above can be imported by tests without the
// import itself starting an export.
if (import.meta.main) {
  main().catch((error: unknown) => {
    if (error instanceof FigmaError) {
      console.error(`\n${error.message}\n→ ${error.remedy}`);
      process.exit(error.exitCode);
    }
    console.error(error);
    process.exit(1);
  });
}
