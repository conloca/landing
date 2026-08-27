/**
 * Screenshot a page region at an explicit device pixel ratio.
 *
 * Exists because the usual capture tooling shoots at a ratio of 1, which cannot
 * show what a Retina visitor sees — and that difference is the entire question
 * when judging a change to rendering resolution.
 *
 *   agent-browser get cdp-url > /tmp/cdp.txt
 *   node scripts/dpr-shot.mjs /tmp/cdp.txt <url> <out.png> [dpr] [scrollY]
 *
 * Pair two of these through `bun run visual-diff` to put a number on whether a
 * resolution change is visible.
 */
import { writeFileSync } from 'node:fs'
import { attachToPage, connect, makeEvaluate, readBrowserWsUrl, sleep } from './lib/cdp.mjs'

const [, , wsFile, pageUrl, outPath, dpr = '2', scrollY = '2000'] = process.argv
if (!wsFile || !pageUrl || !outPath) {
  process.stderr.write(
    'usage: dpr-shot.mjs <file-with-cdp-ws-url> <url> <out.png> [dpr] [scrollY]\n',
  )
  process.exit(2)
}

const client = await connect(readBrowserWsUrl(wsFile))
const sessionId = await attachToPage(client, pageUrl)
const evaluate = makeEvaluate(client, sessionId)

await client.send('Page.enable', {}, sessionId)
await client.send('Runtime.enable', {}, sessionId)
await client.send(
  'Emulation.setDeviceMetricsOverride',
  { width: 1440, height: 900, deviceScaleFactor: Number(dpr), mobile: false },
  sessionId,
)
await client.send('Page.navigate', { url: pageUrl }, sessionId)
await sleep(3000)
await evaluate(`window.scrollTo(0, ${Number(scrollY)}); true`)
// Long enough for scroll-gated reveals to run and for the Lottie player to have
// painted; a shorter wait captures content that a real visitor would see.
await sleep(4000)

const shot = await client.send('Page.captureScreenshot', { format: 'png' }, sessionId)
writeFileSync(outPath, Buffer.from(shot.data, 'base64'))
process.stdout.write(`wrote ${outPath} at devicePixelRatio ${dpr}\n`)

client.close()
