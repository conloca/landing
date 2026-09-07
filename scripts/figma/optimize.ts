/**
 * Downscale-and-convert step for exported Figma assets.
 *
 * Figma stores the original upload, not the rendered size, so a 40x40 avatar
 * arrives as a 1392x1643 PNG and a panel backdrop as a 21 MB JPEG. Shipping
 * those unmodified would add tens of megabytes to a landing page, so every
 * asset is resized to twice its design size (enough for retina, no more) and
 * re-encoded as WebP.
 *
 * Shells out to `cwebp` for the encode — it handles PNG and JPEG input and is
 * a single Homebrew/apt package — but reads image dimensions from the file
 * header directly. An earlier version used macOS `sips` for that, which fails
 * silently on Linux: `spawnSync` returns a null status, the width comes back
 * undefined, the resize is skipped, and a full-resolution image is committed
 * with no warning. Parsing the header is both portable and one less process.
 */
import { spawnSync } from 'node:child_process'
import { rename, stat, unlink } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { ExitCode, FigmaError } from './errors.ts'

export interface OptimizeRequest {
  /** Absolute path to the downloaded original. Must differ from `target`. */
  source: string
  /** Absolute path for the generated `.webp`. */
  target: string
  /**
   * Directory for the intermediate encode, unique per run. Encoding to a
   * fixed path next to `target` let two overlapping exports write through
   * each other: one process renames the scratch file away while the other
   * still holds a descriptor to that inode and keeps writing — into what is
   * by then the published asset.
   */
  scratchDir: string
  /**
   * Source width, already known to the caller from sniffing the downloaded
   * bytes. Passed in rather than re-derived: reading the original back off
   * disk and walking its header a second time is the largest data in the
   * pipeline being touched twice for nothing.
   */
  sourceWidth: number
  /** Twice the design's rendered width; a cap, not a forced resize. */
  maxWidth: number
  /** 0-100. Photographic assets tolerate ~80; flat UI needs more. */
  quality: number
}

export interface OptimizeResult {
  sourceBytes: number
  targetBytes: number
}

/**
 * Confirms `cwebp` is usable before any network work happens. Discovering it
 * lazily meant a machine without the encoder still spent a Tier 1 API call and
 * a multi-megabyte download before failing — on a low-tier seat that call is a
 * meaningful fraction of the monthly allowance.
 */
export function assertEncoderAvailable(): void {
  const result = spawnSync('cwebp', ['-version'], { encoding: 'utf8' })
  if (result.error !== undefined || result.status !== 0) {
    throw new FigmaError(
      'cwebp is not installed, so exported assets cannot be optimized.',
      ExitCode.Config,
      'Install it: `brew install webp` on macOS, `apt install webp` on Debian/Ubuntu.',
    )
  }
}

/**
 * Encodes one asset. `cwebp -resize W 0` preserves aspect ratio, and is only
 * applied when the source is genuinely wider than the cap so small assets are
 * never upscaled.
 *
 * Encodes to a sibling temporary file and renames on success: `cwebp` writing
 * straight to `target` would leave a truncated but plausible-looking file if
 * the process died mid-write, which the caller's resume check would then treat
 * as a finished asset.
 */
export async function optimizeAsset(request: OptimizeRequest): Promise<OptimizeResult> {
  if (request.source === request.target) {
    throw new FigmaError(
      `Refusing to optimize ${request.source} onto itself.`,
      1,
      'Download originals to a scratch path distinct from the published asset.',
    )
  }

  const sourceBytes = (await stat(request.source)).size
  const scratch = resolve(request.scratchDir, `${basename(request.target)}.tmp`)

  const args = ['-quiet', '-q', String(request.quality), '-metadata', 'none']
  if (request.sourceWidth > request.maxWidth) {
    args.push('-resize', String(request.maxWidth), '0')
  }
  args.push(request.source, '-o', scratch)

  const result = spawnSync('cwebp', args, { encoding: 'utf8' })
  if (result.error !== undefined || result.status !== 0) {
    await unlink(scratch).catch(() => undefined)
    throw cwebpFailure(request.source, result.error, result.stderr)
  }

  await rename(scratch, request.target)
  return { sourceBytes, targetBytes: (await stat(request.target)).size }
}

function cwebpFailure(
  source: string,
  error: Error | undefined,
  stderr: string | null,
): FigmaError {
  const missing = error !== undefined && 'code' in error && error.code === 'ENOENT'
  if (missing) {
    return new FigmaError(
      'cwebp is not installed, so exported assets cannot be optimized.',
      ExitCode.Config,
      'Install it: `brew install webp` on macOS, `apt install webp` on Debian/Ubuntu.',
    )
  }
  const detail = (stderr ?? '').trim() || error?.message || 'no output'
  return new FigmaError(
    `cwebp failed for ${source}: ${detail}`,
    ExitCode.Failure,
    'Check the source file is a valid image.',
  )
}

/**
 * Container and pixel width, read from the file header.
 *
 * Format detection and dimension reading live together deliberately: when they
 * were separate, the downloader recognised formats (WebP, GIF) that the
 * encoder step could not measure, so such a fill would download, write a
 * scratch file, and only then abort — leaving the scratch file behind.
 * Supporting exactly one set of formats in one place makes that unrepresentable.
 */
export interface ImageInfo {
  extension: 'png' | 'jpg'
  width: number
}

/** Returns undefined for anything this pipeline cannot encode. */
export function inspectImage(data: Buffer): ImageInfo | undefined {
  const png = readPngWidth(data)
  if (png !== undefined) return { extension: 'png', width: png }
  const jpeg = readJpegWidth(data)
  if (jpeg !== undefined) return { extension: 'jpg', width: jpeg }
  return undefined
}

function readPngWidth(data: Buffer): number | undefined {
  const isPng =
    data.length >= 24 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  return isPng ? data.readUInt32BE(16) : undefined
}

/** Markers that carry no length field and must not be skipped by one. */
function isStandaloneMarker(marker: number): boolean {
  const isRestart = marker >= 0xd0 && marker <= 0xd7
  return isRestart || marker === 0x01 || marker === 0xd8 || marker === 0xd9
}

/**
 * Walks JPEG segments to the start-of-frame marker, the only place the
 * dimensions live. Segments are skipped by their declared length rather than
 * by scanning, so payload bytes can never be mistaken for a marker.
 *
 * Two details in the spec make a naive walk return a plausible but wrong
 * number instead of failing — which is worse than not reading at all, because
 * the caller then skips the resize and commits a full-resolution asset:
 *
 *   - Any number of 0xFF fill bytes may precede a marker, so the byte after
 *     0xFF is not necessarily the marker itself.
 *   - Restart, SOI, EOI and TEM markers have no length field, so advancing by
 *     a "length" read from the following two bytes lands mid-payload.
 */
function readJpegWidth(data: Buffer): number | undefined {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return undefined
  let offset = 2

  while (offset + 1 < data.length) {
    if (data[offset] !== 0xff) return undefined
    // Consume fill bytes; the marker is the first non-0xFF byte after them.
    let markerAt = offset + 1
    while (markerAt < data.length && data[markerAt] === 0xff) markerAt += 1
    const marker = data[markerAt]
    if (marker === undefined) return undefined

    // SOF0-SOF15, excluding the non-frame markers interleaved in that range
    // (DHT 0xC4, JPG 0xC8, DAC 0xCC).
    const isFrameStart =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
    if (isFrameStart) {
      // Segment layout: length (2), precision (1), height (2), width (2).
      return markerAt + 7 < data.length ? data.readUInt16BE(markerAt + 6) : undefined
    }

    if (isStandaloneMarker(marker)) {
      offset = markerAt + 1
      continue
    }
    if (markerAt + 2 >= data.length) return undefined
    const length = data.readUInt16BE(markerAt + 1)
    if (length < 2) return undefined
    offset = markerAt + 1 + length
  }
  return undefined
}

/** Removes the downloaded original once its WebP exists. */
export async function discardOriginal(path: string): Promise<void> {
  await unlink(path).catch(() => undefined)
}
