/**
 * Reports whether the Lottie canvas is actually painting pixels.
 *
 * A blank canvas and a working one look identical in a page screenshot when the
 * animation is clipped or still loading, so this samples the canvas bitmap
 * itself. It exists because a plausible-looking "fix" once left the canvas
 * entirely blank while the page screenshot still looked reasonable — the
 * numbers below are what caught it.
 *
 *   agent-browser get cdp-url > /tmp/cdp.txt
 *   node scripts/canvas-probe.mjs /tmp/cdp.txt <url> [scrollY] [dpr]
 *
 * A healthy banner reports hundreds of distinct colours and a large opaque
 * pixel count; a broken one reports 1 colour, 0 opaque pixels, and a bitmap
 * left at Chrome's 300x150 default. With `dpr` set above 1 it also shows
 * whether the player's devicePixelRatio cap is holding: bitmap dimensions
 * should track the CSS size, not the emulated density.
 */
import { attachToPage, connect, makeEvaluate, readBrowserWsUrl, sleep } from './lib/cdp.mjs'

const [, , wsFile, pageUrl, scrollY = '2000', dpr = '1'] = process.argv
if (!wsFile || !pageUrl) {
  process.stderr.write('usage: canvas-probe.mjs <file-with-cdp-ws-url> <url> [scrollY] [dpr]\n')
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
await sleep(2500)

await evaluate(`window.scrollTo(0, ${Number(scrollY)}); true`)
// The player loads WASM and the .lottie payload before it paints anything, so
// a shorter wait reports a blank canvas that is merely still loading.
await sleep(4000)

const report = await evaluate(
  `(async () => {
  const canvas = document.querySelector('[data-lottie-banner] canvas');
  if (!canvas) return { found: false };
  const rect = canvas.getBoundingClientRect();
  const base = {
    found: true,
    cssWidth: Math.round(rect.width),
    cssHeight: Math.round(rect.height),
    bitmapWidth: canvas.width,
    bitmapHeight: canvas.height,
    onScreen: rect.bottom > 0 && rect.top < innerHeight,
  };
  // A canvas whose control has been transferred to an OffscreenCanvas cannot be
  // read back with getContext('2d'), so round-trip it through an ImageBitmap
  // into a scratch canvas instead.
  try {
    const bmp = await createImageBitmap(canvas);
    const scratch = document.createElement('canvas');
    scratch.width = Math.min(160, bmp.width);
    scratch.height = Math.min(160, bmp.height);
    const ctx = scratch.getContext('2d');
    ctx.drawImage(bmp, 0, 0, scratch.width, scratch.height);
    const data = ctx.getImageData(0, 0, scratch.width, scratch.height).data;
    const colours = new Set();
    let opaque = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 8) opaque++;
      colours.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
    }
    return { ...base, distinctColours: colours.size, opaquePixels: opaque, sampled: data.length / 4 };
  } catch (e) {
    return { ...base, readError: String((e && e.message) || e) };
  }
})()`,
  { awaitPromise: true },
)

process.stdout.write(JSON.stringify({ devicePixelRatio: Number(dpr), ...report }, null, 2) + '\n')

if (report.found && report.opaquePixels === 0) {
  process.stderr.write('canvas painted nothing — the player is not rendering\n')
  client.close()
  process.exit(1)
}

client.close()
