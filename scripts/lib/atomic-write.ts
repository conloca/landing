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
import { writeFileSync, renameSync, unlinkSync, lstatSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { dirname, basename, join } from 'node:path'

// Mirrors same-file.ts's inodeIdentity: stat, extract a derived value, and
// swallow ENOENT to a sentinel — the destination not existing yet means
// there's nothing of its metadata worth carrying forward.
function existingFileMode(path: string): number | null {
  try {
    const stats = lstatSync(path)
    // Only a REGULAR file's mode is worth preserving. A symlink's lstat mode
    // describes the link itself (always effectively 0777), not a permission
    // worth carrying onto the real file that's about to replace it.
    return stats.isFile() ? stats.mode & 0o777 : null
  } catch {
    return null
  }
}

export function atomicWriteFileSync(path: string, data: Parameters<typeof writeFileSync>[1]): void {
  // Created as a sibling so the rename stays on one filesystem; a rename
  // across devices fails with EXDEV.
  const temp = join(dirname(path), `.${basename(path)}.tmp-${randomBytes(8).toString('hex')}`)

  // The rename replaces the destination's directory entry with a fresh inode,
  // so the temp file's own mode is what survives onto the destination — an
  // existing 0600 output must not widen to the process's default (commonly
  // 0644) even for the instant between the write and the rename, since a
  // concurrent reader watching the directory could open the temp file the
  // moment it appears and see the sensitive content at the wider mode. Pass
  // the preserved mode straight to the file's creation instead of `chmod`ing
  // it afterward, so there is no window where it's ever wider than final.
  //
  // A `mode` passed to `writeFileSync` is still masked by the process umask
  // at creation time — `open(2)`'s `mode` argument is `mode & ~umask`, exactly
  // as if no mode had been given — so an existing mode with bits in
  // umask-cleared positions (e.g. 0664 under the common 022 umask) would
  // silently narrow to 0644, the opposite of "preserve". Clearing the umask
  // for the single creation call (and restoring it immediately after, in a
  // `finally`) makes the requested mode land exactly, with the same no-window
  // guarantee as above: `process.umask` changes the process-wide mask
  // in-place, so a concurrent reader observes either the un-widened mode from
  // this call or the still-applicable prior mask, never an intermediate one.
  const mode = existingFileMode(path) ?? 0o666

  try {
    const previousUmask = process.umask(0)
    try {
      writeFileSync(temp, data, { flag: 'wx', mode })
    } finally {
      process.umask(previousUmask)
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
