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
import { writeFileSync, renameSync, unlinkSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { dirname, basename, join } from 'node:path'

export function atomicWriteFileSync(
  path: string,
  data: Parameters<typeof writeFileSync>[1],
): void {
  // Created as a sibling so the rename stays on one filesystem; a rename
  // across devices fails with EXDEV.
  const temp = join(dirname(path), `.${basename(path)}.tmp-${randomBytes(8).toString('hex')}`)

  try {
    writeFileSync(temp, data, { flag: 'wx' })
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
