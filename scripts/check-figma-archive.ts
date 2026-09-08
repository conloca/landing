#!/usr/bin/env bun
// Guards the preserved Figma extraction in docs/figma/.
//
// Two properties are asserted here rather than in prose, because
// .gitattributes marks that directory `-diff`: a reviewer literally cannot
// eyeball those files in a pull request, so "we grepped it once" is not a
// durable guarantee.
//
//   1. No signed-URL credentials anywhere in the archive. The JSON envelopes
//      originally carried a pre-signed S3 `thumbnailUrl` containing an AWS
//      access key id; it was emptied. A future refresh could reintroduce that
//      shape invisibly.
//   2. renders-manifest.json still describes the PNGs that are actually on
//      disk. The manifest's recorded widths are what makes the renders usable
//      as visual-diff references; a silent 2x re-export would leave the
//      numbers lying.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const ARCHIVE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'docs',
  'figma',
)
const MANIFEST = join(ARCHIVE, 'renders-manifest.json')

// Matched on URL *shape*, not on bare words: a credential only counts when it
// appears as a query parameter. Matching bare markers would false-positive on
// any prose that names them — this directory's own documentation does exactly
// that when it explains the check — which would otherwise force per-file
// exclusions, and an exclusion list is how a gate quietly stops covering the
// file someone actually edits.
const SIGNED_URL_MARKERS = /[?&](AWSAccessKeyId|X-Amz-[A-Za-z-]+|Signature|Expires)=/
const FIGMA_TOKEN = /\bfigd_[A-Za-z0-9_-]{8}/

// Every file the archive is expected to contain. This is an allowlist by
// design: nothing already here may disappear without a deliberate edit to this
// list, which shows up in a reviewable diff. `.gitattributes` marks most of
// these `linguist-generated`, so GitHub's UI labels them "generated" — the
// exact misconception that invites a tidy-up PR to delete data that cannot be
// refetched without a Figma Dev seat.
const REQUIRED_FILES = [
  'DESIGN-ANNOTATIONS.md',
  'DESIGN-SPEC.md',
  'README.md',
  'anim.json',
  'animations/README.md',
  'animations/frame-00.png',
  'animations/frame-01.png',
  'animations/frame-02.png',
  'animations/frame-03.png',
  'animations/frame-04.png',
  'animations/frame-05.png',
  'animations/frame-06.png',
  'animations/frame-07.png',
  'animations/frame-08.png',
  'animations/frame-09.png',
  'animations/frame-10.png',
  'animations/frame-11.png',
  'animations/frame-12.png',
  'animations/frame-13.png',
  'animations/frame-14.png',
  'animations/frame-15.png',
  'animations/frame-16.png',
  'animations/frame-17.png',
  'animations/frame-18.png',
  'animations/frame-19.png',
  'COLORS-RECONCILIATION-46.md',
  'copy.txt',
  'file-depth2.json',
  'img-desktop1440.json',
  'img-mobile393.json',
  'img-sections.json',
  'img-small640.json',
  'img-tablet1024.json',
  'node-2548-13160.json',
  'nodes-breakpoints.json',
  'nodes-colors.json',
  'nodes-components.json',
  'nodes.json',
  'outline.txt',
  'renders-manifest.json',
  'shallow-40002207-12482.json',
  'shallow-40002391-9972.json',
  'shallow-40002448-4665.json',
  'vars.json',
]

// The credential matcher is the whole point of this gate, and CI only ever
// runs it against a clean archive — so the failing path is never exercised
// unless it is exercised deliberately. These fixtures pin the contract so a
// well-meaning "simplification" of the regex fails loudly here instead of
// silently ceasing to catch leaks.
const MUST_MATCH = [
  'https://s3.example/x?X-Amz-Credential=AKIAEXAMPLE&X-Amz-Signature=abc',
  'https://s3.example/x?AWSAccessKeyId=AKIAEXAMPLE&Signature=zz&Expires=1',
]
const MUST_NOT_MATCH = [
  'carrying no `AWSAccessKeyId`, `Signature`, `X-Amz-*` or `Expires` parameters',
  'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/c66a5cfe-dba6',
]

// Same fixture-pinning discipline as the signed-URL matcher above: the
// figd_ token regex is the other half of `checkForCredentials`, and it had
// no self-test until now, so a "simplification" of it could have silently
// stopped catching Figma personal access tokens while CI stayed green.
const TOKEN_MUST_MATCH = ['figd_AbCdEfGh12345678']
const TOKEN_MUST_NOT_MATCH = [
  'the `figd_` prefix identifies a Figma personal access token',
  'figd_short',
]

interface RenderEntry {
  file: string
  nodeId: string
  width: number
  height: number
}

const failures: string[] = []

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

// Extension is not a trustworthy type boundary: a text file renamed to
// `.png` would otherwise both skip the credential scan below (which trusts
// the extension) and pass `checkRequiredFilesPresent` (which only checks
// existence). Checking the real signature closes both gaps with one read.
function looksLikeRealPng(path: string): boolean {
  const header = readFileSync(path).subarray(0, 8)
  return header.length === 8 && header.equals(PNG_SIGNATURE)
}

function walkScannableFiles(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      out.push(...walkScannableFiles(path))
    } else if (!name.endsWith('.png') || !looksLikeRealPng(path)) {
      // Scan every non-PNG file, not just known text extensions: a future
      // addition under an unrecognized extension (.svg, .url, no extension)
      // must not silently bypass the credential scan. A `.png` file that
      // is not actually a PNG (wrong signature) is scanned too, rather than
      // trusted on its extension alone.
      out.push(path)
    }
  }
  return out
}

// Runs before the archive scan: if the matcher itself is broken, a clean
// result from the scan below would be meaningless.
function selfTestCredentialMatcher(): void {
  for (const sample of MUST_MATCH) {
    if (!SIGNED_URL_MARKERS.test(sample)) {
      failures.push(
        `credential matcher self-test: failed to match a known signed URL (${sample.slice(0, 48)}…) — the regex no longer detects leaks`,
      )
    }
  }
  for (const sample of MUST_NOT_MATCH) {
    if (SIGNED_URL_MARKERS.test(sample)) {
      failures.push(
        `credential matcher self-test: false positive on safe text (${sample.slice(0, 48)}…)`,
      )
    }
  }
  for (const sample of TOKEN_MUST_MATCH) {
    if (!FIGMA_TOKEN.test(sample)) {
      failures.push(
        `credential matcher self-test: failed to match a known Figma token (${sample.slice(0, 48)}…) — the regex no longer detects leaks`,
      )
    }
  }
  for (const sample of TOKEN_MUST_NOT_MATCH) {
    if (FIGMA_TOKEN.test(sample)) {
      failures.push(
        `credential matcher self-test: false positive on safe text (${sample.slice(0, 48)}…)`,
      )
    }
  }
}

function checkForCredentials(): void {
  for (const path of walkScannableFiles(ARCHIVE)) {
    const text = readFileSync(path, 'utf8')
    for (const [index, line] of text.split('\n').entries()) {
      if (SIGNED_URL_MARKERS.test(line)) {
        failures.push(`${path}:${index + 1} contains a signed-URL parameter`)
      }
      if (FIGMA_TOKEN.test(line)) {
        failures.push(`${path}:${index + 1} contains a Figma access token`)
      }
    }
  }
}

function checkRequiredFilesPresent(): void {
  for (const name of REQUIRED_FILES) {
    if (!existsSync(join(ARCHIVE, name))) {
      failures.push(
        `${name} is missing — it cannot be refetched without a Figma Dev seat`,
      )
    }
  }
}

// Existence alone doesn't prove a required `.png` is actually a usable
// image — this caught a real bug during development, where a screenshot
// pipeline silently wrote non-PNG bytes under a `.png` name and every other
// check here still passed. A signature check alone is not enough either: a
// truncated file (real 8-byte header, then arbitrary bytes) still "looks
// like" a PNG by signature but is not decodable. Every required PNG is
// therefore fully decoded with `pngjs` (already a project dependency, used
// by `scripts/visual-diff.ts`), not just signature-checked, and not just the
// ones `checkManifest` already covers via renders-manifest.json.
function checkRequiredPngsAreReal(): void {
  for (const name of REQUIRED_FILES) {
    if (!name.endsWith('.png')) continue
    const path = join(ARCHIVE, name)
    if (!existsSync(path)) continue // already reported by checkRequiredFilesPresent
    if (!looksLikeRealPng(path)) {
      failures.push(`${name} exists but is not a valid PNG (wrong signature)`)
      continue
    }
    try {
      PNG.sync.read(readFileSync(path))
    } catch (error) {
      failures.push(`${name} has a valid PNG signature but fails to decode: ${String(error)}`)
    }
  }
}

// PNG dimensions live in the IHDR chunk: 8-byte signature, 4-byte length,
// 4-byte type, then width and height as big-endian uint32. The signature and
// length are validated so a truncated or non-PNG file reports what is wrong
// rather than throwing a RangeError out of a buffer read.
function pngSize(path: string): { width: number; height: number } | null {
  const header = readFileSync(path).subarray(0, 24)
  if (header.length < 24) return null
  if (!header.subarray(0, 8).equals(PNG_SIGNATURE)) return null
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) }
}

function checkManifest(): void {
  if (!existsSync(MANIFEST)) {
    failures.push(`${MANIFEST} is missing`)
    return
  }
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as {
    renders: RenderEntry[]
  }
  const listed = new Set<string>()
  for (const entry of manifest.renders) {
    listed.add(entry.file)
    const path = join(ARCHIVE, entry.file)
    if (!existsSync(path)) {
      failures.push(`${entry.file} is listed in the manifest but not on disk`)
      continue
    }
    const size = pngSize(path)
    if (size === null) {
      failures.push(`${entry.file} is not a readable PNG`)
      continue
    }
    if (size.width !== entry.width || size.height !== entry.height) {
      failures.push(
        `${entry.file} is ${size.width}x${size.height} but the manifest says ${entry.width}x${entry.height}`,
      )
    }
  }

  // The manifest is documented as the complete render inventory, so an
  // unlisted PNG is a broken contract, not a harmless extra.
  const rendersDir = join(ARCHIVE, 'renders')
  if (!existsSync(rendersDir)) {
    failures.push('renders/ is missing entirely')
    return
  }
  for (const name of readdirSync(rendersDir)) {
    if (!name.endsWith('.png')) continue
    if (!listed.has(`renders/${name}`)) {
      failures.push(`renders/${name} is on disk but absent from the manifest`)
    }
  }
}

selfTestCredentialMatcher()
checkForCredentials()
checkRequiredFilesPresent()
checkRequiredPngsAreReal()
// A malformed manifest throws rather than reporting; catching it keeps the
// accumulated diagnostics readable instead of losing them to a stack trace.
try {
  checkManifest()
} catch (error) {
  failures.push(`renders-manifest.json could not be validated: ${String(error)}`)
}

if (failures.length > 0) {
  process.stdout.write(`figma archive check FAILED:\n`)
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`)
  process.exit(1)
}

process.stdout.write('figma archive check passed\n')
