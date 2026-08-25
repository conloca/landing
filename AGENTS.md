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
