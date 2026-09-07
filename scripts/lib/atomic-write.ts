// Writes a file without ever following a symlink planted at the destination.
//
// The tools here take an output path on the command line and spend real time
// computing what to write. A guard can only check that path up front, so the
// path can still change while the work runs. Two properties close that window:
// the temporary file is created with an exclusive-create flag under a random
// name, so the write can only land on a file this process just made; and the
// move into place is a rename, which replaces the destination's directory
// entry rather than writing through a symlink sitting there.
//
// This is a local development tool, not a security boundary — a swap of the
// *containing directory* between the guard and the rename is still possible.
// The value here is mostly the ordinary one: a crash mid-write cannot leave a
// truncated file where a good one used to be.
import { writeFileSync, renameSync, unlinkSync, lstatSync, chmodSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { dirname, basename, join } from 'node:path'

export function atomicWriteFileSync(path: string, data: Parameters<typeof writeFileSync>[1]): void {
  // Created as a sibling so the rename stays on one filesystem; a rename
  // across devices fails with EXDEV.
  const temp = join(dirname(path), `.${basename(path)}.tmp-${randomBytes(8).toString('hex')}`)

  // The rename replaces the destination's directory entry with a fresh inode,
  // so the temp file's own (umask-derived) mode is what survives — an existing
  // 0600 output would silently widen to the process's default (commonly 0644),
  // exposing a previously private file. Preserve it, but only when the
  // destination is currently a REGULAR file: a symlink's lstat mode describes
  // the link itself (always effectively 0777), not a permission worth
  // carrying onto the real file that's about to replace it.
  let preserveMode: number | null = null
  try {
    const destinationStats = lstatSync(path)
    if (destinationStats.isFile()) {
      preserveMode = destinationStats.mode & 0o777
    }
  } catch {
    // Destination doesn't exist yet — nothing to preserve.
  }

  try {
    writeFileSync(temp, data, { flag: 'wx' })
    if (preserveMode !== null) {
      chmodSync(temp, preserveMode)
    }
    renameSync(temp, path)
  } catch (error) {
    try {
      unlinkSync(temp)
    } catch {
      // Nothing to clean up — the failure happened before the file existed.
    }
    throw error
  }
}
