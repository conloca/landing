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
  'DESIGN-SPEC.md',
  'README.md',
  'anim.json',
  'copy.txt',
  'file-depth2.json',
  'img-desktop1440.json',
  'img-mobile393.json',
  'img-sections.json',
  'img-small640.json',
  'img-tablet1024.json',
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

interface RenderEntry {
  file: string
  nodeId: string
  width: number
  height: number
}

const failures: string[] = []

function walkTextFiles(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      out.push(...walkTextFiles(path))
    } else if (/\.(json|txt|md)$/.test(name)) {
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
}

function checkForCredentials(): void {
  for (const path of walkTextFiles(ARCHIVE)) {
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

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

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
