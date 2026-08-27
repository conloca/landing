/**
 * Tests for the image header parsers.
 *
 * These exist because a wrong answer here is *silent*: `optimizeAsset` skips
 * the resize when it cannot establish a width, so a mis-parse ships a
 * full-resolution asset rather than failing. That is the exact bug the
 * previous `sips`-based implementation had, and the JPEG walker is easy to get
 * subtly wrong — fill bytes and length-less markers both look benign.
 */
import { describe, expect, test } from 'bun:test'
import { inspectImage } from './optimize.ts'
import { parseRetryAfter } from '../figma-client.ts'
import { sameInputs } from '../figma-export.ts'

/** Minimal PNG: signature, then an IHDR whose width/height sit at bytes 16-23. */
function png(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(24)
  buffer.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)
  buffer.write('IHDR', 12, 'ascii')
  buffer.writeUInt32BE(width, 16)
  buffer.writeUInt32BE(height, 20)
  return buffer
}

interface JpegSegment {
  marker: number
  payload?: Buffer
  /** Extra 0xFF fill bytes before the marker; legal per the spec. */
  fill?: number
}

/** Assembles a JPEG from segments so each structural case can be built exactly. */
function jpeg(segments: readonly JpegSegment[]): Buffer {
  const parts: Buffer[] = [Buffer.from([0xff, 0xd8])]
  for (const segment of segments) {
    parts.push(Buffer.alloc(segment.fill ?? 0, 0xff))
    parts.push(Buffer.from([0xff, segment.marker]))
    if (segment.payload !== undefined) {
      const length = Buffer.alloc(2)
      length.writeUInt16BE(segment.payload.length + 2)
      parts.push(length, segment.payload)
    }
  }
  return Buffer.concat(parts)
}

/** SOF payload after its length field: precision, height, width, components. */
function sofPayload(width: number, height: number): Buffer {
  const payload = Buffer.alloc(7)
  payload.writeUInt8(8, 0)
  payload.writeUInt16BE(height, 1)
  payload.writeUInt16BE(width, 3)
  payload.writeUInt8(3, 5)
  return payload
}

describe('inspectImage', () => {
  test('reads PNG dimensions', () => {
    expect(inspectImage(png(1440, 900))).toEqual({ extension: 'png', width: 1440 })
  })

  test('reads a baseline JPEG', () => {
    const data = jpeg([{ marker: 0xc0, payload: sofPayload(4096, 2304) }])
    expect(inspectImage(data)).toEqual({ extension: 'jpg', width: 4096 })
  })

  test('reads a progressive JPEG (SOF2)', () => {
    const data = jpeg([{ marker: 0xc2, payload: sofPayload(800, 600) }])
    expect(inspectImage(data)?.width).toBe(800)
  })

  test('skips APP and DQT segments to reach the frame header', () => {
    const data = jpeg([
      { marker: 0xe1, payload: Buffer.alloc(120, 0x41) },
      { marker: 0xdb, payload: Buffer.alloc(64, 0x10) },
      { marker: 0xc0, payload: sofPayload(1920, 1080) },
    ])
    expect(inspectImage(data)?.width).toBe(1920)
  })

  test('tolerates 0xFF fill bytes before a marker', () => {
    const data = jpeg([
      { marker: 0xe0, payload: Buffer.alloc(14, 0x00), fill: 3 },
      { marker: 0xc0, payload: sofPayload(1024, 768), fill: 5 },
    ])
    expect(inspectImage(data)?.width).toBe(1024)
  })

  test('does not read a length from a marker that has none', () => {
    // A restart marker carries no length; treating the next two bytes as one
    // lands mid-payload and yields a plausible but wrong width downstream.
    const data = jpeg([
      { marker: 0xd0 },
      { marker: 0xc0, payload: sofPayload(640, 480) },
    ])
    expect(inspectImage(data)?.width).toBe(640)
  })

  test('does not mistake payload bytes that look like a frame marker', () => {
    const payload = Buffer.alloc(40, 0x00)
    payload.writeUInt8(0xff, 10)
    payload.writeUInt8(0xc0, 11)
    const data = jpeg([
      { marker: 0xe1, payload },
      { marker: 0xc0, payload: sofPayload(2560, 1440) },
    ])
    expect(inspectImage(data)?.width).toBe(2560)
  })

  test('returns undefined for formats the encoder cannot handle', () => {
    const gif = Buffer.from('GIF89a', 'ascii')
    expect(inspectImage(gif)).toBeUndefined()
    expect(inspectImage(Buffer.alloc(4))).toBeUndefined()
  })

  test('returns undefined rather than guessing on a truncated frame header', () => {
    const truncated = jpeg([{ marker: 0xc0, payload: sofPayload(800, 600) }]).subarray(0, 8)
    expect(inspectImage(truncated)).toBeUndefined()
  })
})

describe('sameInputs', () => {
  const previous = { ref: 'abc123', maxWidth: 1862, quality: 90 }
  const item = { ref: 'abc123', quality: 90 }

  test('treats an unchanged asset as current', () => {
    expect(sameInputs(previous, item, 1862)).toBe(true)
  })

  test('invalidates when the Figma image reference changed', () => {
    // The designer swapped the artwork; keeping the old file would leave the
    // manifest recording a new ref against stale bytes.
    expect(sameInputs(previous, { ...item, ref: 'def456' }, 1862)).toBe(false)
  })

  test('invalidates when quality changed', () => {
    expect(sameInputs(previous, { ...item, quality: 75 }, 1862)).toBe(false)
  })

  test('invalidates when the effective width changed', () => {
    // Comparing designWidth instead of maxWidth would miss a RETINA_SCALE
    // change, silently keeping every asset at the old resolution.
    expect(sameInputs(previous, item, 1396)).toBe(false)
  })
})

describe('parseRetryAfter', () => {
  test('reads the documented integer-seconds form', () => {
    expect(parseRetryAfter('120')).toBe(120)
    expect(parseRetryAfter('0')).toBe(0)
  })

  test('reads the HTTP-date form', () => {
    const future = new Date(Date.now() + 60_000).toUTCString()
    const seconds = parseRetryAfter(future)
    expect(seconds).toBeGreaterThan(50)
    expect(seconds).toBeLessThanOrEqual(60)
  })

  test('clamps a past date to zero instead of sleeping a negative time', () => {
    expect(parseRetryAfter(new Date(Date.now() - 60_000).toUTCString())).toBe(0)
  })

  test('falls back to undefined on garbage so the caller uses backoff', () => {
    expect(parseRetryAfter('soon')).toBeUndefined()
    expect(parseRetryAfter(null)).toBeUndefined()
    expect(parseRetryAfter('-5')).toBeUndefined()
  })
})
