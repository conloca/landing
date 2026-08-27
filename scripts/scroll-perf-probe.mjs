/**
 * Scroll-performance probe for the pinned ScrollStack section.
 *
 * Drives a real Chrome over CDP: a scripted wheel-scroll through the pinned
 * range while recording per-frame timings and Blink's own layout/paint
 * counters, so a regression shows up as numbers rather than an impression.
 *
 * Open the page first (`agent-browser open <url>`), then point this at the
 * browser's WebSocket endpoint, which `agent-browser get cdp-url` prints:
 *
 *   agent-browser get cdp-url > /tmp/cdp.txt
 *   node scripts/scroll-perf-probe.mjs /tmp/cdp.txt <url> [label] [mode] [dpr]
 *
 *   label  free-text tag echoed in the output, to keep runs apart
 *   mode   `asis` (default) or `nolottie`, which removes the Lottie banners
 *          before measuring, to separate their cost from everything else
 *   dpr    device pixel ratio to emulate, default 1. Pass 2 for a Retina
 *          machine: anything canvas-backed costs four times as much there, so
 *          a default-ratio run understates it badly.
 *
 * The URL is passed as a file rather than an argument because the endpoint
 * contains characters that shells and command guards handle inconsistently.
 */
import { attachToPage, connect, makeEvaluate, readBrowserWsUrl, sleep } from './lib/cdp.mjs'

const [, , wsFile, pageUrl, label = 'run', mode = 'asis', dpr = '1'] = process.argv
if (!wsFile || !pageUrl) {
  process.stderr.write(
    'usage: scroll-perf-probe.mjs <file-with-cdp-ws-url> <url> [label] [asis|nolottie] [dpr]\n',
  )
  process.exit(2)
}
if (mode !== 'asis' && mode !== 'nolottie') {
  process.stderr.write(`unknown mode "${mode}" (expected asis or nolottie)\n`)
  process.exit(2)
}

const client = await connect(readBrowserWsUrl(wsFile))
const sessionId = await attachToPage(client, pageUrl)
const evaluate = makeEvaluate(client, sessionId)

await client.send('Page.enable', {}, sessionId)
await client.send('Runtime.enable', {}, sessionId)
await client.send('Performance.enable', {}, sessionId)

// Headless defaults to a device pixel ratio of 1, which understates the cost of
// anything canvas-backed: a Retina visitor rasterises four times the pixels.
// Override it explicitly so every run states the density it measured.
await client.send(
  'Emulation.setDeviceMetricsOverride',
  { width: 1440, height: 900, deviceScaleFactor: Number(dpr), mobile: false },
  sessionId,
)

await client.send('Page.navigate', { url: pageUrl }, sessionId)
await sleep(2500)

// Anchor on the section's own marker, not on the `.sticky` utility class: any
// other sticky element on the page (a nav bar being the obvious one) would
// otherwise silently redirect the sweep to the wrong scroll range while still
// printing plausible numbers.
const geometry = await evaluate(`(() => {
  const section = document.querySelector('[data-scroll-stack]');
  if (!section) return { sectionTop: null };
  return {
    pageHeight: document.documentElement.scrollHeight,
    stickyCount: section.querySelectorAll('.sticky').length,
    canvasCount: document.querySelectorAll('canvas').length,
    sectionTop: Math.round(section.getBoundingClientRect().top + window.scrollY),
    sectionHeight: section.offsetHeight,
  };
})()`)

if (geometry.sectionTop === null) {
  process.stderr.write('no [data-scroll-stack] section found (page not hydrated?)\n')
  process.exit(4)
}

if (mode === 'nolottie') {
  await evaluate(`(() => {
    for (const el of document.querySelectorAll('[data-lottie-banner]')) el.remove();
    return true;
  })()`)
}

// Settle at the top of the section before recording. Everything above this
// point — navigation, the mode's DOM surgery, the jump-scroll's relayout — is
// setup cost, and must land outside the measurement window or a `nolottie` run
// would carry the cost of its own node removal into the very deltas that are
// supposed to show the saving.
await evaluate(`window.scrollTo(0, ${geometry.sectionTop}); true`)
await sleep(400)

// Sample the animated value alongside the timing. The two failure modes look
// identical to a viewer but are opposites in the data: dropped frames show as
// gaps in *timing* while values advance evenly, whereas stepping shows as
// plateaus and jumps in *value* while timing stays perfectly even. Recording
// only one of them cannot tell you which you are looking at.
await evaluate(`(() => {
  window.__frames = [];
  window.__values = [];
  window.__longTasks = [];
  const card = document.querySelector('[data-scroll-stack-card="0"]');
  if (!card) throw new Error('no [data-scroll-stack-card="0"] element to sample');
  // Read the inline style motion writes, not the computed one. Calling
  // getComputedStyle on an element motion has just dirtied forces a style
  // recalculation every frame, which inflates the very recalcStyleCount and
  // frame timings this probe reports alongside the values.
  const readScale = () => {
    const t = card.style.transform;
    // motion writes the literal string "none" when every transform is at its
    // default, so treating only the empty string as scale 1 would drop those
    // frames entirely — and they are exactly the held frames this metric counts.
    if (!t || t === 'none') return 1;
    const scale = t.match(/scale(?:X)?\\(([^,)]+)/);
    if (scale) return Math.round(parseFloat(scale[1]) * 100000) / 100000;
    const matrix = t.match(/matrix(?:3d)?\\(([^,]+),/);
    return matrix ? Math.round(parseFloat(matrix[1]) * 100000) / 100000 : null;
  };
  let last = performance.now();
  const tick = (now) => {
    window.__frames.push(now - last);
    window.__values.push(readScale());
    last = now;
    window.__raf = requestAnimationFrame(tick);
  };
  window.__raf = requestAnimationFrame(tick);
  try {
    window.__lt = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__longTasks.push(Math.round(e.duration));
    });
    window.__lt.observe({ entryTypes: ['longtask'] });
  } catch {}
  return true;
})()`)

const before = await client.send('Performance.getMetrics', {}, sessionId)

// A scroll sweep is inherently sequential: dispatching every wheel event at
// once would land as one jump and measure nothing about per-frame cost during
// a scroll, and the 16ms pacing is what makes the sweep resemble a real one.
// Both awaits below are therefore deliberate, not a missed Promise.all.
const steps = 60
const perStep = Math.round(geometry.sectionHeight / steps)
for (let i = 0; i < steps; i++) {
  // eslint-disable-next-line no-await-in-loop -- deliberate; see above
  await client.send(
    'Input.dispatchMouseEvent',
    { type: 'mouseWheel', x: 720, y: 450, deltaX: 0, deltaY: perStep, pointerType: 'mouse' },
    sessionId,
  )
  // eslint-disable-next-line no-await-in-loop -- deliberate; see above
  await sleep(16)
}
await sleep(500)

const after = await client.send('Performance.getMetrics', {}, sessionId)
const frames = await evaluate(`(() => {
  cancelAnimationFrame(window.__raf);
  try { window.__lt.disconnect(); } catch {}
  const f = window.__frames.filter((d) => d > 0);
  const sorted = [...f].sort((a, b) => a - b);
  const pct = (p) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0;
  return {
    frames: f.length,
    mean: +(f.reduce((a, b) => a + b, 0) / (f.length || 1)).toFixed(2),
    p50: +pct(0.5).toFixed(2),
    p95: +pct(0.95).toFixed(2),
    worst: +Math.max(...f, 0).toFixed(2),
    over32ms: f.filter((d) => d > 32).length,
    over50ms: f.filter((d) => d > 50).length,
    longTasks: window.__longTasks.length,
    longTaskTotalMs: window.__longTasks.reduce((a, b) => a + b, 0),
  };
})()`)

// Characterise the value sequence: how often it fails to move at all between
// frames, and how big its jumps are when it does. A continuous animation moves
// a little on nearly every frame; a stepped one sits still and then lurches.
const valueMotion = await evaluate(`(() => {
  const v = window.__values.filter((x) => typeof x === 'number');
  const moving = [];
  let held = 0;
  let longestHold = 0;
  for (let i = 1; i < v.length; i++) {
    const d = Math.abs(v[i] - v[i - 1]);
    if (d < 1e-5) {
      held++;
      longestHold = Math.max(longestHold, held);
    } else {
      held = 0;
      moving.push(d);
    }
  }
  const sorted = [...moving].sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
  const biggest = sorted.length ? sorted[sorted.length - 1] : 0;
  return {
    samples: v.length,
    first: v[0] ?? null,
    last: v[v.length - 1] ?? null,
    framesWithNoChange: v.length - 1 - moving.length,
    longestUnchangedRun: longestHold,
    medianStep: +median.toFixed(5),
    largestStep: +biggest.toFixed(5),
    // Spread of step sizes. NOT a smoothness score, and it reads backwards if
    // used as one: uniformly quantised stepping scores exactly 1.0, because
    // every jump is the same size, while genuinely continuous spring motion
    // scores well above 1 as each impulse decays. Read it only alongside
    // framesWithNoChange, which is the real discriminator. Few moving frames
    // plus a spread near 1.0 is the stepping signature.
    stepSizeSpread: median > 0 ? +(biggest / median).toFixed(1) : null,
  };
})()`)

const read = (set, name) => set.metrics.find((m) => m.name === name)?.value ?? 0
const delta = (name) => +(read(after, name) - read(before, name)).toFixed(4)

process.stdout.write(
  JSON.stringify(
    {
      label,
      mode,
      devicePixelRatio: Number(dpr),
      geometry,
      frames,
      valueMotion,
      blink: {
        layoutCount: delta('LayoutCount'),
        recalcStyleCount: delta('RecalcStyleCount'),
        layoutDurationMs: +(delta('LayoutDuration') * 1000).toFixed(1),
        recalcStyleDurationMs: +(delta('RecalcStyleDuration') * 1000).toFixed(1),
        scriptDurationMs: +(delta('ScriptDuration') * 1000).toFixed(1),
        taskDurationMs: +(delta('TaskDuration') * 1000).toFixed(1),
      },
    },
    null,
    2,
  ) + '\n',
)

client.close()
