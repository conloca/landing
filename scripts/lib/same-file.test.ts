// Regression coverage for the guard that stops a tool writing its output over
// its own input. The case-only collision it was written for reproduces solely
// on a case-insensitive filesystem (macOS/APFS here), so rather than skipping
// elsewhere — a skipped test reads as a passing one — each case asserts the
// behaviour that is correct for the filesystem actually under it.
import { describe, expect, test, beforeAll, afterAll } from 'bun:test'
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  symlinkSync,
  linkSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { isSameFile } from './same-file.ts'

let dir: string
let caseInsensitive: boolean

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'same-file-'))
  writeFileSync(join(dir, 'Ref.png'), 'reference')
  // Probed with readFileSync, deliberately NOT with isSameFile: deriving the
  // filesystem's behaviour from the function under test makes the case
  // assertion below vacuous, because a broken implementation reports
  // "case-sensitive" and is then only held to the case-sensitive expectation.
  try {
    readFileSync(join(dir, 'ref.png'))
    caseInsensitive = true
  } catch {
    caseInsensitive = false
  }
})

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('isSameFile', () => {
  test('identical paths are the same file', () => {
    expect(isSameFile(join(dir, 'Ref.png'), join(dir, 'Ref.png'))).toBe(true)
  })

  test('unnormalised relative segments resolve to the same file', () => {
    // Built as a raw string, not via join(), which would normalise the
    // segments away and leave this identical to the test above. `sub` does not
    // exist, so an implementation that only consulted inode identity would
    // fail to stat it and wrongly report two different files — this isolates
    // the lexical fast path.
    const unnormalised = `${dir}/./sub/../Ref.png`
    expect(isSameFile(join(dir, 'Ref.png'), unnormalised)).toBe(true)
  })

  test('genuinely different files are not the same file', () => {
    writeFileSync(join(dir, 'live.png'), 'live')
    expect(isSameFile(join(dir, 'Ref.png'), join(dir, 'live.png'))).toBe(false)
  })

  test('a path that does not exist cannot collide', () => {
    expect(isSameFile(join(dir, 'nope-a.png'), join(dir, 'nope-b.png'))).toBe(false)
  })

  // The regression: string comparison of resolved paths returns false here,
  // because "Ref.png" and "ref.png" differ as strings while naming one file.
  test('a case-only difference is caught when the filesystem folds case', () => {
    const differsOnlyByCase = isSameFile(join(dir, 'ref.png'), join(dir, 'Ref.png'))

    if (caseInsensitive) {
      expect(differsOnlyByCase).toBe(true)
      // Guard against a fix that only special-cases lowercasing: the resolved
      // strings really are different, so a string-based implementation passes
      // the collision through and destroys the reference.
      expect(resolve(join(dir, 'ref.png'))).not.toBe(resolve(join(dir, 'Ref.png')))
    } else {
      // On a case-sensitive filesystem these are two distinct files and
      // "ref.png" does not exist, so refusing to write would be wrong.
      expect(differsOnlyByCase).toBe(false)
    }
  })

  test('a symlink pointing at an input is caught', () => {
    const link = join(dir, 'link-to-ref.png')
    symlinkSync(join(dir, 'Ref.png'), link)
    expect(isSameFile(link, join(dir, 'Ref.png'))).toBe(true)
  })

  test('a hard link to an input is caught', () => {
    const hard = join(dir, 'hardlink-to-ref.png')
    linkSync(join(dir, 'Ref.png'), hard)
    expect(isSameFile(hard, join(dir, 'Ref.png'))).toBe(true)
  })
})
