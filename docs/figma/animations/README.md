# Figma animation capture

What was tried, in order, to get authoritative animation/motion data out of
Figma for this project, and what actually worked.

## 1. Direct API/MCP paths -- checked first, none expose motion for this file

- **REST API.** Figma's REST API has no animation/prototype-transition
  endpoint at all -- node trees carry static geometry only. Not attempted for
  that reason; there is nothing to call.
- **`figma-desktop` MCP's `get_motion_context` tool.** This is the one real
  API surface for Figma motion data: "keyframe animation data for a Figma
  node... keyframe tracks with easing curves, pre-computed CSS/@keyframes."
  Confirmed to exist via a live `tools/list` call against the running Dev
  Mode MCP server (`http://127.0.0.1:3845/mcp`, verified up via an
  `initialize` handshake). Calling it against node `2548:13160` (and with no
  node id at all) returned the same error every other content tool on that
  server returns: "make sure their paid Figma seat includes Dev Mode access."
  Blocked by the seat entitlement documented in `README.md`, not by
  anything specific to motion data -- see `COLORS-RECONCILIATION-46.md` for
  the full live-attempt log across all three MCP servers plus the REST
  client, from the same session.
- **`figma-framelink` MCP.** No motion-specific tool in its tool list
  (`get_figma_data`, `get_screenshot` only); not applicable.

## 2. Sanity-checked the approach with `review brainstorm` before touching the desktop app

Per repo convention, ran
`review brainstorm "How can we capture animations from a Figma file when the
REST API/MCP tools expose only static frames..."` before doing any UI
automation. Its conclusion, in short: treat a checked-in `.lottie` file as
the authoritative source when one exists (exact keyframes, deterministic,
reviewable) rather than re-deriving motion from screenshots; reserve
automated Figma-desktop UI capture as a last resort, never as a standing
pipeline, because it risks entitlement circumvention, document mutation, and
convincing-but-wrong output. That shaped the order of investigation below:
check for an existing authoritative source first, only fall back to
screenshotting the desktop app if none exists.

## 3. Checked the Figma desktop app itself (open, with the target file loaded)

The Figma desktop app was running on this machine with the `Conloca` file
already open (confirmed via `computer.windows()`), so canvas inspection and
Present-mode navigation were both actually exercised, not assumed unavailable:

- Selected the `Animated sections - Banner` layer and zoomed to it. It is a
  **static documentation frame**, not an interactive prototype: three
  labelled thumbnails per banner ("Banner 1", "Banner 2", "Banner 3"), each
  in "(Separate)" and "(Timeline adjusted)" variants, plus "All banner
  animations combined" -- the designer's own way of laying out keyframes
  side by side as flat artwork, matching the PNGs already present in
  `/Users/ultra/Documents/figma-exports/` (e.g. "Banner 1 animation (Timeline
  adjusted)-1.png"). No smart-animate connections exist between these
  frames.
- Entering Present mode (clicking the file's own Play button) opens a
  33-frame click-through -- Figma's default flow across every top-level frame
  on the page, not a designed banner interaction. Paging through it lands on
  ordinary page content (blog article, homepage sections), not an animated
  transition.
- **Notable side finding, out of scope for this task:** `docs/QUESTIONS-DESIGNER.md`'s
  localization-banner section records "no Banner 1 or Banner 3 files were
  delivered." The canvas above shows Figma frames literally named "Banner 1
  animation" and "Banner 3 animation" do exist in the file (as static
  reference art, matching image exports already sitting in
  `/Users/ultra/Documents/figma-exports/`). Worth a follow-up question to the
  designer about whether those are usable assets or leftover exploration --
  not resolved here, since it is unrelated to issue #46.

Conclusion: there is no Figma-native interactive animation in this file to
click through and screenshot-burst. The one real animated UI element on the
page -- the localization/"Locales" panel -- already has its authoritative
source checked into the repo as `public/banner-2.lottie`.

## 4. What actually produced these frames

`public/banner-2.lottie` is a real dotLottie archive (a zip containing a
Lottie JSON animation plus its embedded raster assets), not a placeholder --
opening it confirms real keyframe data (`fr: 60, ip: 0, op: 120`, i.e. 60fps,
120 frames, a 2.000s clip). Rather than reconstruct approximate motion from
screen recordings, this is a **direct, lossless render of that real source**,
driven by the same `@lottiefiles/dotlottie-web` player the site itself uses
(`src/components/LottieBanner.tsx`):

1. Loaded the player against `public/banner-2.lottie` in a headless browser
   tab, off a local static file server.
2. Read the animation's own reported timing directly from the loaded player:
   **duration 2.000s, 120 total frames** -- exactly matching the frame count
   `docs/QUESTIONS-DESIGNER.md` already describes ("visible for exactly one
   frame out of a hundred and twenty").
3. Sampled 20 points at roughly even spacing across the 2-second clip
   (`player.setFrame(n)` for the 20 frame numbers nearest to 19 equal steps
   through all 120 frames, then read the canvas back as a PNG via
   `canvas.toDataURL('image/png')` -- not a raw screenshot buffer, which this
   capture attempt initially got wrong; see the note below). Because the
   120 available frames don't divide evenly into 20, the real spacing is
   ~100-117ms, not a perfectly uniform 100ms -- the table below gives the
   exact millisecond value for every sample rather than assuming evenness.

**A note on how this was captured, for anyone re-running it:** the first
attempt piped Puppeteer's raw `elementHandle.screenshot()` / `page.screenshot()`
buffers directly out of the browser-automation sandbox, which silently
produced non-PNG garbage bytes (wrong file signature, confirmed by both a
manual hex dump and this repository's own `bun run check:figma`, which now
fully decodes every required PNG with `pngjs` rather than trusting a
signature alone -- see `scripts/check-figma-archive.ts`).
Round-tripping a plain string through the same channel (`canvas.toDataURL()`
inside `page.evaluate`, decoded outside the browser sandbox) produced correct,
valid PNGs instead. That is the method actually used for the files here.

## Frame timing

| File | Sample # | Lottie frame | Time | Phase |
| --- | --- | --- | --- | --- |
| frame-00.png | 0 | 0 | 0ms | hold (start) |
| frame-01.png | 1 | 6 | 100ms | hold (start) |
| frame-02.png | 2 | 13 | 217ms | hold (start) |
| frame-03.png | 3 | 19 | 317ms | hold (start) |
| frame-04.png | 4 | 25 | 417ms | hold (start) |
| frame-05.png | 5 | 31 | 517ms | hold (start) |
| frame-06.png | 6 | 38 | 633ms | **motion begins** |
| frame-07.png | 7 | 44 | 733ms | motion |
| frame-08.png | 8 | 50 | 833ms | motion |
| frame-09.png | 9 | 56 | 933ms | motion |
| frame-10.png | 10 | 63 | 1050ms | motion settling |
| frame-11.png | 11 | 69 | 1150ms | motion settling |
| frame-12.png | 12 | 75 | 1250ms | hold (end) |
| frame-13.png | 13 | 81 | 1350ms | hold (end) |
| frame-14.png | 14 | 88 | 1467ms | hold (end) |
| frame-15.png | 15 | 94 | 1567ms | hold (end) |
| frame-16.png | 16 | 100 | 1667ms | hold (end) |
| frame-17.png | 17 | 106 | 1767ms | hold (end) |
| frame-18.png | 18 | 113 | 1883ms | hold (end) |
| frame-19.png | 19 | 119 | 1983ms | hold (end) |

The rendered byte size of each captured PNG independently confirms the phase
boundaries without any manual judgement call: frames 01-05 are byte-identical
at 75,064 bytes each (a genuine static hold -- frame 00 differs at 75,666
bytes only because the player's very first rendered frame includes one-time
canvas initialization overhead, not a visual difference), frames 06-11 each
differ from their neighbours (real motion -- sizes 75,370 / 77,303 / 77,333 /
76,062 / 74,585 / 74,132 bytes -- the panel rows re-order and the "Kyle"
cursor and highlight move), and frames 12-19 are byte-identical again at
73,570 bytes (the final hold). That lines up closely with
`docs/QUESTIONS-DESIGNER.md`'s independently-documented timing for this clip:
a still opening for the first 0.6s, then 0.62s of real motion, then a still
close for the last 0.78s -- motion in the captured frames spans roughly
633ms-1150ms, consistent with that window given 100ms-scale sampling.

This confirms the clip plays once and freezes on its final frame (frame-19,
matching the last frame of "hold (end)"), consistent with the resolved
question in `docs/QUESTIONS-DESIGNER.md` ("keep play-once and freeze on the
final frame").
