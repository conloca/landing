/**
 * `feature-grid/bento-assets.ts` hand-writes each asset's pixel
 * width/height, and states in its own comment that they "must stay in sync
 * with the actual file" — a stale literal renders a silently stretched
 * image, not an error. Nothing enforced that sync before this file:
 * `inspectImage` in `optimize.ts` parses source PNG/JPEG headers, not the
 * committed WebP *output*.
 *
 * The integration test below reads the committed `.webp` bytes directly and
 * cross-checks them against `BENTO_ASSETS`, so a future re-export with
 * different pixel dimensions fails loudly here instead of shipping a
 * distorted image. `bento-assets.ts` has no image imports of its own
 * (that's why it's importable from here at all — bun:test has no Vite-style
 * asset loader, so importing `illustrations.tsx`, which does
 * `import x from '*.webp'`, would fail outright).
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BENTO_ASSETS } from '../../src/components/sections/feature-grid/bento-assets.ts'
import { readWebpDimensions } from './webp-dimensions.ts'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const BENTO_DIR = join(SCRIPT_DIR, '../../src/assets/figma/bento')

/** Minimal VP8X container: just enough of the RIFF shell to carry dimensions. */
function vp8x(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(30)
  buffer.write('RIFF', 0, 'ascii')
  buffer.writeUInt32LE(22, 4)
  buffer.write('WEBP', 8, 'ascii')
  buffer.write('VP8X', 12, 'ascii')
  buffer.writeUInt32LE(10, 16)
  buffer.writeUIntLE(width - 1, 24, 3)
  buffer.writeUIntLE(height - 1, 27, 3)
  return buffer
}

/** Minimal simple-lossy VP8 container: frame tag + start code + dimensions. */
function vp8Simple(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(30)
  buffer.write('RIFF', 0, 'ascii')
  buffer.writeUInt32LE(22, 4)
  buffer.write('WEBP', 8, 'ascii')
  buffer.write('VP8 ', 12, 'ascii')
  buffer.writeUInt32LE(10, 16)
  buffer.set([0x9d, 0x01, 0x2a], 23)
  buffer.writeUInt16LE(width, 26)
  buffer.writeUInt16LE(height, 28)
  return buffer
}

describe('readWebpDimensions', () => {
  test('reads a VP8X (extended/alpha) container', () => {
    expect(readWebpDimensions(vp8x(682, 440))).toEqual({ width: 682, height: 440 })
  })

  test('reads dimensions spanning multiple bytes of the 24-bit VP8X field', () => {
    // 335-1=334 crosses the low byte's 255 boundary; a byte-order slip
    // would silently truncate or scramble this.
    expect(readWebpDimensions(vp8x(335, 192))).toEqual({ width: 335, height: 192 })
  })

  test('returns undefined for a VP8X chunk whose size field is not the conformant 10', () => {
    // A corrupt/foreign chunk masquerading as VP8X must not have its bytes
    // read as canvas dimensions.
    const buffer = vp8x(682, 440)
    buffer.writeUInt32LE(4, 16)
    expect(readWebpDimensions(buffer)).toBeUndefined()
  })

  test('reads a simple lossy VP8 (no-alpha) container', () => {
    expect(readWebpDimensions(vp8Simple(1024, 768))).toEqual({ width: 1024, height: 768 })
  })

  test('masks off the VP8 scale bits rather than including them in the dimension', () => {
    const buffer = vp8Simple(320, 240)
    // Set the top 2 "scale" bits on both fields; the real dimension bits
    // (bottom 14) must still read back untouched.
    buffer.writeUInt16LE(buffer.readUInt16LE(26) | 0xc000, 26)
    buffer.writeUInt16LE(buffer.readUInt16LE(28) | 0xc000, 28)
    expect(readWebpDimensions(buffer)).toEqual({ width: 320, height: 240 })
  })

  test('returns undefined for a VP8 chunk whose declared size is too small to hold the dimensions', () => {
    // Simulates a corrupt/truncated chunk followed by unrelated bytes; those
    // bytes must not get read as if they were still this chunk's payload.
    const buffer = vp8Simple(1024, 768)
    buffer.writeUInt32LE(4, 16)
    expect(readWebpDimensions(buffer)).toBeUndefined()
  })

  test('returns undefined for a non-RIFF or non-WEBP buffer', () => {
    expect(readWebpDimensions(Buffer.from('GIF89a', 'ascii'))).toBeUndefined()
    expect(readWebpDimensions(Buffer.alloc(4))).toBeUndefined()
  })

  test('returns undefined for a chunk type this parser does not model (e.g. VP8L)', () => {
    const buffer = vp8x(1, 1)
    buffer.write('VP8L', 12, 'ascii')
    expect(readWebpDimensions(buffer)).toBeUndefined()
  })

  test('returns undefined rather than guessing on a truncated VP8 start code', () => {
    const buffer = vp8Simple(640, 480)
    buffer[23] = 0x00 // corrupt the start code
    expect(readWebpDimensions(buffer)).toBeUndefined()
  })
})

describe('bento illustration dimensions stay in sync with bento-assets.ts', () => {
  const specs = Object.values(BENTO_ASSETS)
  const files = readdirSync(BENTO_DIR).filter((file) => file.endsWith('.webp'))

  test('every asset on disk has a matching entry in BENTO_ASSETS', () => {
    expect(files.length).toBeGreaterThan(0)
    const declaredFiles: string[] = specs.map((spec) => spec.file)
    for (const file of files) {
      expect(declaredFiles).toContain(file)
    }
    // And the reverse: no entry points at a file that no longer exists.
    for (const file of declaredFiles) {
      expect(files).toContain(file)
    }
  })

  for (const spec of specs) {
    test(`${spec.file} matches its declared width/height`, () => {
      const actual = readWebpDimensions(readFileSync(join(BENTO_DIR, spec.file)))
      expect(actual).toEqual({ width: spec.width, height: spec.height })
    })
  }
})
