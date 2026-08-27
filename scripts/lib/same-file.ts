// Answers "do these two paths denote the same file on disk?" for the guards
// that refuse to write a tool's output over one of its inputs.
//
// Comparing resolved path strings is not enough. This repo is developed on
// macOS/APFS, which is case-insensitive: `Ref.png` and `ref.png` are one file
// but two different strings, so a string guard waves the collision through and
// the input is destroyed. Symlinks and hard links defeat string comparison for
// the same reason. Identity is therefore decided by the filesystem itself —
// device plus inode — with the string comparison kept only as a fast path for
// the case where the output does not exist yet.
import { statSync } from 'node:fs'
import { resolve } from 'node:path'

function inodeIdentity(path: string): string | null {
  try {
    // statSync follows symlinks deliberately: writing through a symlink
    // overwrites its target, so the target is what must be protected.
    const stats = statSync(path)
    return `${stats.dev}:${stats.ino}`
  } catch {
    // Missing file, or an unreadable parent directory. A path that cannot be
    // stat'd is not an existing input, so nothing of value can be clobbered.
    return null
  }
}

export function isSameFile(a: string, b: string): boolean {
  if (resolve(a) === resolve(b)) return true

  const identityA = inodeIdentity(a)
  if (identityA === null) return false

  return identityA === inodeIdentity(b)
}
