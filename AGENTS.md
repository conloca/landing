# Agent guide

Repository instructions for coding agents (Claude Code, Codex, etc.). This is the
canonical file; the other agent-guide filename is a symlink to it, so every agent
reads the same guide.

## What this repo is

The Conloca marketing landing page: a statically generated single page. There is no
server at runtime — `bun run build` emits a `dist/` directory of static files.

## Stack

| Concern        | Choice                                                            |
| -------------- | ----------------------------------------------------------------- |
| Package manager| bun                                                               |
| Bundler        | Vite 7, aliased to `rolldown-vite` (Rust bundler, Oxc-based)       |
| React plugin   | `@vitejs/plugin-react` (uses Oxc, not Babel, under rolldown-vite)  |
| Linter         | `oxlint` (Oxc). There is no ESLint.                                |
| UI framework   | React 19                                                          |
| Styling        | Tailwind CSS v4, CSS-first config inside `src/index.css`           |
| Components     | shadcn/ui (radix base, nova preset) in `src/components/ui`         |
| Animation      | `motion` (Framer Motion v13) + `@lottiefiles/dotlottie-react`      |
| Types          | TypeScript, `strict` plus `exactOptionalPropertyTypes`             |

`vite` in `package.json` is an alias: `"vite": "npm:rolldown-vite@^7.3.1"`. Keep the
`overrides` and `resolutions` entries in sync with it, or transitive dependencies
will pull in stock Vite alongside it.

## Commands

```bash
bun install
bun run dev        # dev server
bun run build      # client build -> SSR build -> prerender into dist/index.html
bun run preview    # serve dist/
bun run lint       # oxlint
bun run typecheck  # tsc --noEmit
```

## How static generation works

Three steps, wired together by the `build` script:

1. `vite build` — client bundle into `dist/`, with `index.html` still holding the
   `<!--app-html-->` marker.
2. `vite build --ssr src/entry-server.tsx` — server bundle into `dist-ssr/`. The
   entry is passed on the command line, not via `build.ssr`: rolldown-vite resolves
   the HTML input first and rejects the build otherwise.
3. `scripts/prerender.ts` — imports the server bundle, renders through React 19's
   `prerender()` from `react-dom/static`, and splices the markup into
   `dist/index.html`. Missing marker or empty markup is a hard build failure.

Every component therefore runs twice: once with no DOM on the build machine, once
during `hydrateRoot`. Browser APIs must be deferred to an effect.

## Animation rules

These are load-bearing. Breaking them ships a page that is blank to crawlers or to
anyone whose JavaScript fails.

- **The prerendered HTML must contain all content, visible.** Never put an initial
  `opacity: 0` or transform into markup that reaches the server output.
- Entrance animations are gated on the `js-ready` class, which the inline boot
  script in `index.html` adds before first paint. That script also arms a 2.5s
  timer that strips the class again; `src/entry-client.tsx` disarms it on boot. If
  the bundle never runs, content reappears instead of staying hidden.
- The hiding rule lives inside `@media (prefers-reduced-motion: no-preference)`, so
  reduced-motion users get the content with no animation at all.
- Use `Reveal` (`src/components/motion/Reveal.tsx`) for scroll-triggered entrances
  rather than hand-rolling `whileInView` per section.
- `useHydrated()` uses `useSyncExternalStore`, not state-in-effect. Keep it that way;
  it avoids a cascading render and cannot desync the two passes.

## Lottie

`src/components/LottieBanner.tsx` owns the dotLottie player. Three constraints:

- It renders nothing during the prerender pass — the player touches canvas on mount.
- The WebAssembly binary is served from our own origin via `setWasmUrl`. Upstream
  defaults to fetching it from jsdelivr, which a CSP or a CDN outage kills silently.
  `public/dotlottie-player.wasm` is copied from `@lottiefiles/dotlottie-web`; when
  bumping that package, re-copy the file.
- Playback waits for the player's `load` event before `play()`. Calling play on a
  constructed-but-unloaded player is silently dropped and the banner freezes on
  frame 0.

## Conventions

- Conventional commits, one logical change each.
- `bun run lint && bun run typecheck` must pass before committing. Do not use
  `--no-verify`.
- No `any`, no `as any`, no `@ts-ignore`. Model the type instead.

## Writing reports for people (Telegram, PR bodies, spec summaries)

These are read by a human, not another agent, so optimize for being understood:

- Never invent abbreviations or compress terms into fragments. Write the full term.
- Prefer fewer points explained in full sentences over more points compressed into
  jargon. A short list of clear sentences beats a long list of cryptic stubs.
- Expand every non-obvious term at first use (name it in full, then abbreviate if you
  must reuse it).
- When a message exceeds the channel's length limit, cut secondary content — drop whole
  points — rather than compressing the wording of what remains.

## Visual fidelity checks against Figma

`scripts/visual-diff.ts` pixel-diffs a Figma reference render against a live
screenshot at the same width, using `pixelmatch` + `pngjs`:

```bash
bun run visual-diff <reference.png> <live.png> <diff-output.png>
```

**Reference renders are not committed to this repo** — they're a byproduct of the
Figma extraction pass (see Figma MCP servers below), regenerated from the source
file rather than checked in, to keep the repo lean. Export all four breakpoint
frames (393/640/1024/1440) and, for finer-grained diffing, per-section crops of the
desktop frame, at 1x scale (device pixel ratio 1 — this script has no notion of
scale and a 2x export will silently compare against the wrong breakpoint's
layout). Capture the live equivalents with `agent-browser` against `bun run
preview`, at the reference frame's exact CSS width.

Both inputs must be the same width or the script refuses to compare them. Height
mismatches (real content vs. placeholder assets) are reported, not silently
cropped or padded — only the top overlapping region is compared. That makes a
**full-page run a sanity check, not the reliable signal**: a height difference in
an early section (expected wherever an asset Figma's export never gave us renders
as a placeholder) shifts everything below it out of alignment, so the mismatch
percentage there reflects misalignment, not fidelity. Diff **per-section crops**
for a comparison you can actually act on. The diff image highlights mismatched
pixels in red; treat placeholder-asset regions as expected noise, not a fidelity
bug to chase to zero.

**A capture caveat, confirmed empirically:** `agent-browser screenshot --full`
does not reliably fire the scroll events `Reveal`'s `whileInView` gating depends
on for content that starts below the initial viewport fold — captured this way,
such an element can be stuck at its pre-reveal `opacity: 0` even though a real
scrolling visitor sees it correctly (verified by scrolling to it and reading its
computed `opacity` back — it flips to `1`). A blank region in a `--full` diff
near the fold is worth checking with a real `scroll` command before treating it
as a fidelity bug.

**A second capture caveat, equally empirical:** `agent-browser open --width <w>
--height <h>` silently ignores those flags and opens at the default viewport.
Size the window first with `agent-browser set viewport <w> <h>`, then `open`.
Missing this is expensive on any breakpoint-dependent defect: several captures
during the fidelity pass were taken as 1024px but were really 1280px, and since
the bug under investigation only reproduced below the `xl` breakpoint, it seemed
to appear and vanish at random. Where a screenshot is the evidence for a fix,
re-capture after the final edit and confirm the image reflects the revision you
are actually proposing — a screenshot of an intermediate attempt that review
later rejected looks exactly as convincing.

## Figma MCP servers

Three servers are registered in `.mcp.json` (project scope, so every agent on the
repo picks them up). Project-scoped servers need a one-time approval: run `claude`
in this directory and approve them, or they stay in `Pending approval`.

| Server | Transport | Auth | Use it for |
| --- | --- | --- | --- |
| `figma` | HTTP, `https://mcp.figma.com/mcp` | OAuth | Figma's own hosted server. Broadest feature set, works on every plan and seat. Link-based: give it a Figma URL as context. |
| `figma-desktop` | HTTP, `http://127.0.0.1:3845/mcp` | none (local) | Dev Mode server inside the Figma desktop app. Reads the current selection, and reaches Code Connect mappings and variables. Needs a Dev or Full seat on a paid plan. |
| `figma-framelink` | stdio, `figma-developer-mcp` | `FIGMA_PAT` | Third-party (Framelink). Works headlessly with just a personal access token, no desktop app and no OAuth. Best fit for background agents. Tools: `get_figma_data`, `download_figma_images`. |

### Token

`figma-framelink` needs a Figma personal access token. `.mcp.json` refers to it as
`${FIGMA_PAT}`, expanded from the environment of the process that launches Claude
Code — `.env` is **not** read automatically. Export it before starting a session:

```bash
set -a && . ./.env && set +a && claude
```

`.env` is gitignored; `.env.example` documents the variable name. Never inline the
token into `.mcp.json`, which is committed.

### Prerequisites for `figma-desktop`

1. Figma desktop app installed and running.
2. The target file open in it.
3. Dev Mode MCP server enabled: Figma menu -> Preferences -> Enable Dev Mode MCP server.
4. A Dev or Full seat on a Professional, Organization, or Enterprise plan. View or
   Collab seats and the Starter plan are capped at 6 tool calls per month.
5. A frame selected, for the tools that act on the current selection.

### Authenticating the official server

Run `/mcp` inside Claude Code, pick `figma`, choose Authenticate, and allow access.
It is free while the server is in beta, and becomes usage-based later.

### Why the Framelink version is pinned exactly

`.mcp.json` pins `figma-developer-mcp@0.13.2` with no caret. The repo default is
caret ranges, and this is the documented exception: the server is fetched by `npx`
at launch and runs with `FIGMA_API_KEY` in its environment. A caret range would
auto-execute any future patch or minor release — including a compromised one —
with a live Figma credential handed to it. Bump this deliberately, after checking
the release.

## Language: English only, everywhere in the repository

Everything committed to this repository is written in English — source code,
identifiers, comments, commit messages, `README.md`, `DESIGN.md`, and every file
under `docs/`, including the designer-facing ones. No Cyrillic in committed
files.

This covers documents whose reader is not an engineer. A designer-facing
question list is still written in English; write it in plain, jargon-free
English rather than switching language.

Conversation outside the repository — chat, Telegram, pull request discussion
with a Russian-speaking teammate — is unaffected. The rule is about what lands
in version control, which is read by contributors and agents who may not share
a first language.

To check before committing:

```bash
git ls-files | grep -vE 'node_modules|bun.lock' \
  | xargs grep -lP '[\x{0400}-\x{04FF}]' 2>/dev/null
```
