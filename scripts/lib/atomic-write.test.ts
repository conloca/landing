// Exercises atomicWriteFileSync itself, not a re-implementation of what it
// does. Asserting POSIX semantics with local writeFileSync/renameSync calls
// would stay green if the production write were simplified back to a plain
// writeFileSync, which is exactly the regression worth catching.
import { describe, expect, test, beforeAll, afterAll } from 'bun:test'
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  symlinkSync,
  lstatSync,
  openSync,
  closeSync,
  chmodSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { atomicWriteFileSync } from './atomic-write.ts'

let dir: string

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'atomic-write-'))
})

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('atomicWriteFileSync', () => {
  test('writes the file when the destination is free', () => {
    const destination = join(dir, 'plain.txt')
    atomicWriteFileSync(destination, 'CONTENT')
    expect(readFileSync(destination, 'utf8')).toBe('CONTENT')
  })

  test('overwrites an existing regular file', () => {
    const destination = join(dir, 'existing.txt')
    writeFileSync(destination, 'OLD')
    atomicWriteFileSync(destination, 'NEW')
    expect(readFileSync(destination, 'utf8')).toBe('NEW')
  })

  // The destination's mode must survive being replaced — the rename swaps in
  // a fresh inode, so without preserving it explicitly a private 0600 output
  // would silently widen to the process's default umask mode.
  test('preserves the mode of an existing regular file it overwrites', () => {
    const destination = join(dir, 'private.png')
    writeFileSync(destination, 'OLD', { mode: 0o600 })
    chmodSync(destination, 0o600)

    atomicWriteFileSync(destination, 'NEW')

    expect(readFileSync(destination, 'utf8')).toBe('NEW')
    expect(lstatSync(destination).mode & 0o777).toBe(0o600)
  })

  // The regression this module exists for: a plain writeFileSync to the same
  // destination would follow the symlink and destroy the file it points at.
  test('replaces a symlink at the destination instead of writing through it', () => {
    const protectedFile = join(dir, 'reference.png')
    writeFileSync(protectedFile, 'REFERENCE')
    const destination = join(dir, 'out.png')
    symlinkSync(protectedFile, destination)

    atomicWriteFileSync(destination, 'DIFF')

    expect(readFileSync(protectedFile, 'utf8')).toBe('REFERENCE')

    // Open first and read through the resulting descriptor rather than
    // re-opening by path after the lstat check below — that check-then-open
    // ordering is exactly the TOCTOU pattern CodeQL's js/file-system-race
    // flags, since a race could swap what the path resolves to in between.
    const fd = openSync(destination, 'r')
    try {
      expect(lstatSync(destination).isSymbolicLink()).toBe(false)
      expect(readFileSync(fd, 'utf8')).toBe('DIFF')
    } finally {
      closeSync(fd)
    }
  })

  test('leaves no temporary file behind on success', () => {
    const destination = join(dir, 'clean.txt')
    atomicWriteFileSync(destination, 'CONTENT')
    expect(readdirSync(dir).filter((name) => name.includes('.tmp-'))).toEqual([])
  })

  test('writes binary data unchanged', () => {
    // Production passes a Buffer from PNG.sync.write, never a string.
    const destination = join(dir, 'binary.bin')
    const payload = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff])
    atomicWriteFileSync(destination, payload)
    expect(readFileSync(destination).equals(payload)).toBe(true)
  })

  test('cleans up the temporary file when the rename fails', () => {
    // The destination is an existing directory, so the temp file is written
    // successfully and renameSync then fails with EISDIR. That is the only
    // path where the cleanup does real work — a destination inside a missing
    // directory fails before any temp file exists, and would pass this
    // assertion even with the cleanup deleted.
    const destination = join(dir, 'blocked')
    mkdirSync(destination)

    expect(() => atomicWriteFileSync(destination, 'CONTENT')).toThrow()
    expect(readdirSync(dir).filter((name) => name.includes('.tmp-'))).toEqual([])
  })
})
