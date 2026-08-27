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
import { readFileSync } from 'node:fs'
import { isSameFile } from './lib/same-file.ts'
import { atomicWriteFileSync } from './lib/atomic-write.ts'

const [, , refPath, livePath, outPath] = process.argv

if (!refPath || !livePath || !outPath) {
  console.error(
    'usage: bun run scripts/visual-diff.ts <reference.png> <live.png> <diff-output.png>',
  )
  process.exit(1)
}

// Reference renders come from a rate-limited Figma export, so overwriting one
// is expensive and slow to undo. isSameFile asks the filesystem rather than
// comparing strings, which is what catches a case-only difference on the
// case-insensitive filesystem this is developed on.
const collidingInput = [refPath, livePath].find((input) =>
  isSameFile(outPath, input),
)
if (collidingInput !== undefined) {
  console.error(
    `refusing to write the diff over an input file: "${outPath}" is the same file as "${collidingInput}"`,
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

// Not a plain writeFileSync: the guard above runs before the decode-and-diff
// work, so the output path can still change underneath it. See atomic-write.ts.
atomicWriteFileSync(outPath, PNG.sync.write(diff))

const totalPixels = width * height
const mismatchPercent = (mismatchedPixels / totalPixels) * 100

// Written straight to stdout rather than via console.log: this is the tool's
// machine-readable result, meant to be piped into jq or a CI step, and the
// repo's leftover-marker gate blocks console.log as a stray debug statement.
process.stdout.write(
  `${JSON.stringify(
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
  )}\n`,
)
