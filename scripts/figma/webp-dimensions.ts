/**
 * Reads the canvas width/height out of a WebP RIFF container, covering the
 * two chunk types this repo's `cwebp` pipeline actually produces: VP8X
 * (extended — used whenever the source carries alpha, which every asset
 * exported so far does) and simple VP8 (lossy, no alpha). Returns undefined
 * for anything else rather than guessing, matching `inspectImage`'s PNG/JPEG
 * parsers in `optimize.ts`.
 */
export function readWebpDimensions(buffer: Buffer): { width: number; height: number } | undefined {
  if (
    buffer.length < 30 ||
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    return undefined
  }

  const fourCC = buffer.toString('ascii', 12, 16)

  if (fourCC === 'VP8X') {
    // A conformant VP8X chunk is always exactly 10 bytes (1 flags + 3
    // reserved + 3 width-1 + 3 height-1); reading the dimension fields
    // without checking this would treat an unrelated/corrupt chunk's bytes
    // as canvas dimensions instead of refusing to guess.
    if (buffer.readUInt32LE(16) !== 10) {
      return undefined
    }
    // Payload starts right after the 8-byte chunk header (FourCC + size):
    // 1 flags byte, 3 reserved, then two 24-bit little-endian
    // (dimension - 1) fields.
    const width = buffer.readUIntLE(24, 3) + 1
    const height = buffer.readUIntLE(27, 3) + 1
    return { width, height }
  }

  if (fourCC === 'VP8 ') {
    // Simple lossy bitstream: 3-byte frame tag, then a 3-byte start code
    // (0x9d 0x01 0x2a) present on every keyframe (the first frame always is
    // one), then two 16-bit little-endian fields whose top 2 bits are a
    // scaling hint — the dimension itself is the low 14 bits. The chunk size
    // is variable here (unlike VP8X's fixed 10), but must still cover the 10
    // bytes read below — otherwise a corrupt/truncated chunk followed by an
    // unrelated one would have that next chunk's bytes read as dimensions.
    if (buffer.readUInt32LE(16) < 10) {
      return undefined
    }
    const bitstreamStart = 20
    if (
      buffer[bitstreamStart + 3] !== 0x9d ||
      buffer[bitstreamStart + 4] !== 0x01 ||
      buffer[bitstreamStart + 5] !== 0x2a
    ) {
      return undefined
    }
    const width = buffer.readUInt16LE(bitstreamStart + 6) & 0x3fff
    const height = buffer.readUInt16LE(bitstreamStart + 8) & 0x3fff
    return { width, height }
  }

  return undefined
}
