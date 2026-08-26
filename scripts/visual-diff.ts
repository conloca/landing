#!/usr/bin/env bun
// Pixel-diffs a Figma reference render against a live screenshot at the same
// width. Heights commonly differ (placeholder assets, real vs. mocked
// content) — only the overlapping region is compared, and the leftover
// height on the taller image is reported separately rather than silently
// padded or cropped away.
//
// This only compares the region where both images still start from the same
// y=0 origin. A height difference anywhere above the compared region shifts
// everything below it out of alignment, so a nonzero mismatch on a full-page
// run can mean "misaligned", not "wrong" — treat per-section crops (see
// AGENTS.md) as the reliable signal, and a full-page run as a sanity check.
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const [, , refPath, livePath, outPath] = process.argv

if (!refPath || !livePath || !outPath) {
  console.error(
    'usage: bun run scripts/visual-diff.ts <reference.png> <live.png> <diff-output.png>',
  )
  process.exit(1)
}

const resolvedOut = resolve(outPath)
if (resolvedOut === resolve(refPath) || resolvedOut === resolve(livePath)) {
  console.error(
    `refusing to write the diff over an input file (output path resolves to ${resolvedOut})`,
  )
  process.exit(1)
}

function loadPng(path: string): PNG {
  return PNG.sync.read(readFileSync(path))
}

const ref = loadPng(refPath)
const live = loadPng(livePath)

if (ref.width !== live.width) {
  console.error(
    `width mismatch: reference is ${ref.width}px, live is ${live.width}px — capture the live screenshot at the reference's CSS width and device pixel ratio 1 (Figma exports here are 1x)`,
  )
  process.exit(1)
}

const width = ref.width
const height = Math.min(ref.height, live.height)
const heightDelta = Math.abs(ref.height - live.height)

// pixelmatch requires both input buffers to be exactly width*height*4 bytes
// matching the dimensions passed in — slicing to the overlapping region's
// row count isn't enough on its own, the underlying data must be re-cropped
// to match, or it throws on the full (mismatched) buffer lengths.
function cropTop(png: PNG, cropHeight: number): PNG {
  const cropped = new PNG({ width: png.width, height: cropHeight })
  PNG.bitblt(png, cropped, 0, 0, png.width, cropHeight, 0, 0)
  return cropped
}

const refCropped = cropTop(ref, height)
const liveCropped = cropTop(live, height)

const diff = new PNG({ width, height })
const mismatchedPixels = pixelmatch(
  refCropped.data,
  liveCropped.data,
  diff.data,
  width,
  height,
  { threshold: 0.1 },
)

writeFileSync(outPath, PNG.sync.write(diff))

const totalPixels = width * height
const mismatchPercent = (mismatchedPixels / totalPixels) * 100

console.log(
  JSON.stringify(
    {
      reference: refPath,
      live: livePath,
      diffImage: outPath,
      comparedWidth: width,
      comparedHeight: height,
      referenceHeight: ref.height,
      liveHeight: live.height,
      heightDeltaPx: heightDelta,
      mismatchedPixels,
      mismatchPercent: Number(mismatchPercent.toFixed(3)),
    },
    null,
    2,
  ),
)
