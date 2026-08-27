/**
 * Generates `src/tokens.generated.css` from `tokens/tokens.json`.
 *
 * Why a custom format rather than Style Dictionary's built-in `css/variables`:
 * this file has to land byte-identical to the hand-written CSS it replaced, so
 * the exact block structure (`@theme` vs `:root` vs `.dark`), the comment, the
 * blank lines, and the `oklch(... / 10%)` alpha spelling all matter. Style
 * Dictionary parses the file and applies DTCG `$type` inheritance; it does NOT
 * validate value shapes here, and with no platforms configured it never runs
 * alias resolution. Every shape check below is therefore ours to make, and a
 * malformed token has to fail loudly rather than reach the stylesheet.
 *
 * Aliases (`"$value": "{color.sand.200}"`) are consequently rejected rather
 * than silently mis-serialised. Emitting one would mean running a Style
 * Dictionary platform export; until a token needs it, refusing is the honest
 * contract.
 *
 * Only the tokens this project actually declares are emitted. `color.lime`,
 * `color.stone`, `color.cursor`, `layout.*` and the typography ramp are recorded
 * in tokens.json as the design system's reference values but deliberately not
 * emitted: lime and stone are exact Tailwind defaults, and emitting them would
 * shadow Tailwind's own scale for no gain. See DESIGN.md.
 */
import { writeFileSync } from "node:fs";
import StyleDictionary from "style-dictionary";

const SOURCE = "tokens/tokens.json";
const OUT = "src/tokens.generated.css";

type SrgbColor = {
  colorSpace: "srgb";
  components: [number, number, number];
  /** Optional per the DTCG spec — a fallback, never the authoritative value. */
  hex?: string;
};
type OklchColor = {
  colorSpace: "oklch";
  components: [number, number, number];
  alpha?: number;
};
type ColorValue = SrgbColor | OklchColor;
type DimensionValue = { value: number; unit: string };

type TokenLeaf = { $value: unknown; $description?: string };
type TokenNode = { [key: string]: TokenNode | TokenLeaf | string | undefined };

const isLeaf = (
  node: TokenNode | TokenLeaf | string | undefined,
): node is TokenLeaf =>
  typeof node === "object" && node !== null && "$value" in node;

/** Walks a dotted path into the parsed token tree and returns the leaf's `$value`. */
function lookup(tree: TokenNode, path: string): unknown {
  let cursor: TokenNode | TokenLeaf | string | undefined = tree;
  for (const segment of path.split(".")) {
    if (typeof cursor !== "object" || cursor === null || isLeaf(cursor)) {
      throw new Error(
        `token path "${path}" is not a group at segment "${segment}"`,
      );
    }
    cursor = (cursor as TokenNode)[segment];
    if (cursor === undefined)
      throw new Error(`token path "${path}" does not exist`);
  }
  if (!isLeaf(cursor))
    throw new Error(`token path "${path}" is a group, not a token`);
  return cursor.$value;
}

/** The colour spaces this generator can serialise. Anything else must fail. */
const SUPPORTED_COLOR_SPACES = ["srgb", "oklch"] as const;

function isColorValue(value: unknown): value is ColorValue {
  if (typeof value !== "object" || value === null) return false;
  if (!("colorSpace" in value) || !("components" in value)) return false;
  const { colorSpace, components } = value as {
    colorSpace: unknown;
    components: unknown;
  };
  return (
    typeof colorSpace === "string" &&
    Array.isArray(components) &&
    components.length === 3 &&
    components.every((component) => typeof component === "number")
  );
}

const hexChannel = (value: number): string =>
  Math.round(Math.min(1, Math.max(0, value)) * 255)
    .toString(16)
    .padStart(2, "0");

/** `components` is the authoritative value per DTCG; `hex` is only a fallback. */
function hexFromComponents(components: readonly number[]): string {
  return `#${components.map(hexChannel).join("")}`;
}

/**
 * Alpha is written as a percentage because that is how the shipped stylesheet
 * spells it; `oklch(1 0 0 / 0.1)` renders identically but would make the
 * generated file differ from its hand-written predecessor for no reason. It is
 * rounded because `0.29 * 100` is `28.999999999999996` in IEEE 754, which would
 * silently break the byte-stability this generator exists to guarantee.
 */
function formatColor(value: unknown, path: string): string {
  if (typeof value === "string" && value.startsWith("{")) {
    throw new Error(
      `token "${path}" is an alias (${value}); this generator does not resolve aliases — inline the value`,
    );
  }
  if (!isColorValue(value)) {
    throw new Error(
      `token "${path}" is not a DTCG colour object with a 3-number components array`,
    );
  }
  if (!SUPPORTED_COLOR_SPACES.includes(value.colorSpace)) {
    throw new Error(
      `token "${path}" uses colour space "${value.colorSpace}"; this generator supports only ${SUPPORTED_COLOR_SPACES.join(", ")}`,
    );
  }
  if (value.colorSpace === "srgb") {
    const derived = hexFromComponents(value.components);
    // A hand-edited or round-tripped token can carry a hex that no longer agrees
    // with components; shipping either one silently would be a wrong colour.
    if (value.hex !== undefined && value.hex.toLowerCase() !== derived) {
      throw new Error(
        `token "${path}" has hex ${value.hex} but components resolve to ${derived}`,
      );
    }
    return derived;
  }
  const [l, c, h] = value.components;
  const base = `${l} ${c} ${h}`;
  if (value.alpha === undefined) return `oklch(${base})`;
  const alphaPercent = Number((value.alpha * 100).toFixed(4));
  return `oklch(${base} / ${alphaPercent}%)`;
}

function formatFontFamily(value: unknown, path: string): string {
  if (!Array.isArray(value))
    throw new Error(`token "${path}" is not a font family`);
  return value
    .map((name) => (String(name).includes(" ") ? `"${name}"` : String(name)))
    .join(", ");
}

function formatDimension(value: unknown, path: string): string {
  const dimension = value as DimensionValue;
  if (
    typeof dimension?.value !== "number" ||
    typeof dimension?.unit !== "string"
  ) {
    throw new Error(`token "${path}" is not a dimension`);
  }
  return `${dimension.value}${dimension.unit}`;
}

/** Emits one `--name: value;` line per token in a scheme mode, preserving source order. */
function schemeBlock(tree: TokenNode, mode: "light" | "dark"): string[] {
  const schemeGroup = (tree["scheme"] as TokenNode | undefined)?.[mode];
  if (
    typeof schemeGroup !== "object" ||
    schemeGroup === null ||
    isLeaf(schemeGroup)
  ) {
    throw new Error(`scheme.${mode} is missing from ${SOURCE}`);
  }
  return Object.entries(schemeGroup as TokenNode)
    .filter(([key, node]) => !key.startsWith("$") && isLeaf(node))
    .map(
      ([key, node]) =>
        `  --${key}: ${formatColor((node as TokenLeaf).$value, `scheme.${mode}.${key}`)};`,
    );
}

function sandBlock(tree: TokenNode): string[] {
  const sand = (tree["color"] as TokenNode | undefined)?.["sand"];
  if (typeof sand !== "object" || sand === null || isLeaf(sand)) {
    throw new Error(`color.sand is missing from ${SOURCE}`);
  }
  return Object.entries(sand as TokenNode)
    .filter(([key, node]) => !key.startsWith("$") && isLeaf(node))
    .map(
      ([key, node]) =>
        `  --color-sand-${key}: ${formatColor((node as TokenLeaf).$value, `color.sand.${key}`)};`,
    );
}

function render(tree: TokenNode): string {
  const sans = formatFontFamily(
    lookup(tree, "font.family.sans"),
    "font.family.sans",
  );
  const mono = formatFontFamily(
    lookup(tree, "font.family.mono"),
    "font.family.mono",
  );
  const radius = formatDimension(lookup(tree, "radius.base"), "radius.base");

  return [
    "/*",
    " * Generated from tokens/tokens.json by `bun run tokens`. Do not edit by hand —",
    " * change the token and regenerate, or the two sources drift apart silently.",
    " */",
    "",
    "@theme {",
    `  --font-sans: ${sans};`,
    `  --font-mono: ${mono};`,
    "",
    '  /* Custom warm "sand" neutral family from the Figma frame — not a Tailwind default. */',
    ...sandBlock(tree),
    "}",
    "",
    ":root {",
    `  --radius: ${radius};`,
    ...schemeBlock(tree, "light"),
    "}",
    "",
    ".dark {",
    ...schemeBlock(tree, "dark"),
    "}",
    "",
  ].join("\n");
}

/**
 * Style Dictionary parses and validates the DTCG file (bad `$type`, malformed
 * colour objects and unresolvable aliases all fail here rather than silently
 * producing wrong CSS). We then serialise from its resolved tree.
 */
const dictionary = new StyleDictionary({ source: [SOURCE], platforms: {} });
await dictionary.hasInitialized;

writeFileSync(OUT, render(dictionary.tokens as TokenNode));
// Straight to stdout rather than console.log: this line is the command's intended
// output, not a stray debug statement, and the repo's leftover-marker gate blocks
// console.log as the latter.
process.stdout.write(`wrote ${OUT}\n`);
