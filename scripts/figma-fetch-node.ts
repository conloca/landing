/**
 * Fetches an arbitrary node subtree and writes it as JSON.
 *
 * `bun run figma:node <nodeId> [outFile]`
 *
 * Separate from `figma-export.ts` because it is a patient, one-shot tool: node
 * fetches are Tier 1 and a contended quota can push `Retry-After` well past
 * what an automated export should ever block on. This deliberately waits much
 * longer than the export's defaults, on the assumption a human asked for it
 * and would rather wait than re-run.
 */
import { writeFile } from 'node:fs/promises'
import { FigmaClient, tokenFromEnv } from './figma-client.ts'
import { FigmaError } from './figma/errors.ts'

const FILE_KEY = 'OxxksZFS8hzKoFTeSRdFGs'

async function main(): Promise<void> {
  const [nodeId, outFile] = process.argv.slice(2)
  if (nodeId === undefined) {
    throw new FigmaError(
      'No node id given.',
      2,
      'Usage: bun run figma:node <nodeId> [outFile] — for example 2548:13160',
    )
  }

  const client = new FigmaClient({
    token: tokenFromEnv(),
    // Patient settings: a contended Tier 1 quota can ask for several minutes,
    // and re-running only puts this request at the back of the same queue.
    maxAttempts: 10,
    maxRetryAfterMs: 20 * 60_000,
    backoffCapMs: 120_000,
  })

  const started = Date.now()
  const nodes = await client.getFileNodes(FILE_KEY, [nodeId])
  const elapsed = Math.round((Date.now() - started) / 1000)

  const target = outFile ?? `node-${nodeId.replace(':', '-')}.json`
  await writeFile(target, `${JSON.stringify(nodes, null, 2)}\n`, 'utf8')
  console.error(`figma: wrote ${target} after ${elapsed}s`)
}

main().catch((error: unknown) => {
  if (error instanceof FigmaError) {
    console.error(`\n${error.message}\n→ ${error.remedy}`)
    process.exit(error.exitCode)
  }
  console.error(error)
  process.exit(1)
})
