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

### `agent-browser` caveats

Every one of these cost an agent on this project real time, and none of them is
visible from the tool's own `--help`. They are listed here so the next agent
reads them instead of rediscovering them.

**`--full` capture does not fire reveal gating.** `agent-browser screenshot
--full` does not reliably fire the scroll events `Reveal`'s `whileInView` gating
depends on for content that starts below the initial viewport fold — captured
this way, such an element can be stuck at its pre-reveal `opacity: 0` even
though a real scrolling visitor sees it correctly (verified by scrolling to it
and reading its computed `opacity` back — it flips to `1`). A blank region in a
`--full` diff near the fold is worth checking with a real `scroll` command
before treating it as a fidelity bug.

**Set the viewport with `set viewport`, never with flags on `open`.** `open`
has no `--width` / `--height` options — they appear nowhere in its flag list, so
a run started that way is left at the default size, and a fidelity comparison
made against it comes out measuring the wrong breakpoint while still looking
valid. Size the page explicitly:

```bash
agent-browser set viewport 1440 900 1   # third argument is deviceScaleFactor
```

Pass a scale of `1` for anything feeding `scripts/visual-diff.ts`, for the same
reason the reference exports are 1x — the script has no notion of scale.

**`eval` is refused outright inside an isolated agent worktree.** The isolation
guard rejects any command containing the word `eval`, so `agent-browser eval
'...'` never runs for a worktree-isolated agent. The refusal is easy to
misdiagnose because it talks about *git*: "this command runs a string through
eval, which can't be verified to stay inside the worktree ... a worktree-isolated
agent's git operations must target its own worktree". That is the guard, not
`agent-browser`, and no amount of rewriting the JavaScript will get past it.
Two separate agents lost time to this independently.

Use the structured readers instead — they cover most of what `eval` was reached
for, and return parsed values rather than strings to re-parse:

| Instead of `eval` | Use |
| --- | --- |
| Reading geometry (`getBoundingClientRect`) | `agent-browser get box <selector>` |
| Reading computed style | `agent-browser get styles <selector>` |
| Reading text content | `agent-browser get text <selector>` |
| Counting matches | `agent-browser get count <selector>` |
| Structure of the page | `agent-browser snapshot` |

For anything genuinely beyond those, capture a screenshot and read it back, or
hand the measurement to a non-isolated agent.

**Screenshot capture can hang machine-wide.** Chrome for Testing's
`Page.captureScreenshot` has hung on this host while `eval`, `open`, `get title`
and even PDF capture all succeeded on the same session — every screenshot call
timing out with exit code 124, with a macOS hang report logged against the
binary. It is not a page problem, a network problem, or your code. The working
path is the dedicated headless binary:

```bash
export AGENT_BROWSER_EXECUTABLE_PATH=/path/to/puppeteer-cache/chrome-headless-shell/.../chrome-headless-shell
```

Rebooting is the likely full cure — uptime was 44 days when this was found.

**Name your session, or you are sharing one.** With no `--session`, every
command lands in the session literally called `default` — shared by every agent
on the machine that also omitted the flag. Two agents then drive the same
browser: one navigates out from under the other's capture, and either one's
plain `agent-browser close` kills the other's work. Claim your own name on the
first command and keep using it:

```bash
export AGENT_BROWSER_SESSION=hero-fidelity   # or pass --session on every command
```

Check who is already out there before you start, and confirm your own name:

```bash
agent-browser session list   # active sessions, with the current one arrowed
agent-browser session        # the name this shell is using
```

**Close your own session; never `close --all`.** The `--all` form closes *every*
session on the machine, including other agents' live browsers — one agent's
cleanup killed a peer's session mid-run. Orphaned daemons accumulate at roughly
11 Chrome processes each, and five orphans reached 55 processes during this
project, so skipping cleanup entirely is not the alternative either. Close the
session you named, `agent-browser close --session <yours>`, and leave the rest
alone.

**Serialize capture work across agents — the dispatcher owns this.** All agents
share one daemon and one Chrome pool. Four parallel visual-fidelity agents
produced 79 concurrent Chrome processes here; the daemon's IPC socket started
returning `EAGAIN` and no stable frame could be produced for anybody — including
agents that needed a single screenshot. There is no host-wide lock, so this
cannot be enforced from inside an agent: whoever *dispatches* the agents decides
which ones may capture, and holds the rest until those report back. Non-browser
work (extraction, token generation, docs) parallelises freely; capture work does
not. If you are an agent rather than the dispatcher, run `agent-browser session
list` first — a peer's session already open is a reason to check in, not to
start a second capture beside it.

**Confirm a capture is not blank before you measure against it.** A capture that
silently came back empty scores as a huge, plausible-looking mismatch, and every
number derived from it is meaningless — this project once attested a whole batch
of section fidelity figures against an image whose changed regions were a blank
band. Look at the PNG, or check it for a large uniform area, before trusting any
percentage computed from it.

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

## Reaping stale agent worktrees

Worktree isolation (dispatching each agent into its own `git worktree` so
parallel agents don't race on one checkout) has no matching cleanup step, so
the count only grows: one pass on this project found 41, up from an original
11, with disk and `git worktree list` noise as the visible cost and an
accidental bulk-delete of real work as the expensive one.

**Only a human operator runs the removal steps below** — or an agent a
human has explicitly told to remove one specific, named worktree, never an
agent self-directing a sweep of the whole fleet. The reason isn't caution
for its own sake: the one check this whole procedure hinges on — is a given
worktree's owning agent actually finished — depends on knowing every agent
any session on the machine has dispatched, and no session can see another
session's dispatches. A dispatched agent that picks up a "reap worktrees"
ticket can audit and report but should not delete anything itself unless a
human names the specific worktree after seeing that report — and the
report needs enough in it for the human to actually decide, not just a
verdict: per worktree, its path, branch, `HEAD`, the time you evaluated it,
and the result of each gate below (pass, fail, or unconfirmed), so the
human is naming a worktree based on your evidence, not your one-word
conclusion. That naming authorizes a `(path, HEAD)` pair, not just a path —
if the worktree's current `HEAD` doesn't match what the report said when
the human named it, treat the authorization as stale and don't remove it;
something happened in that worktree between the report and the removal.
Naming satisfies the liveness gate for that one worktree only — every
other gate below (self-exclusion, clean status, the `clean -ndX` verdict,
the `.env` verdict, ancestry or merged-PR confirmation) still has to pass
before removal; naming isn't a blanket go-ahead, and it never overrides
self-exclusion even if the named path happens to be the one you're running
in.

**Invariants — these hold regardless of who runs the sweep:**

- Never evaluate the worktree you are currently running in. Capture your own
  `git rev-parse --show-toplevel` once at the start and skip that path
  unconditionally — it is guaranteed to look reapable (clean, `HEAD` at
  `origin/main`) at the exact moment it's freshly dispatched and about to
  start real work.
- The candidate set is dispatcher-created worktrees only —
  `.claude/worktrees/agent-*` — never the main working tree, and never a
  worktree a human created by hand for their own use (`git worktree add`
  off `main` with no agent behind it looks identical to an abandoned one by
  every check below; this section doesn't apply to it, full stop, not as a
  reap criterion but as a scope filter). Snapshot in this exact order —
  `git worktree list --porcelain` first, *then* the live-agent list —
  because the reverse order is unsafe: a worktree dispatched between the
  two reads would be in the worktree snapshot but missing from an
  already-taken live list, and would look abandoned when it's brand new.
  Only evaluate candidates present in the worktree snapshot; one dispatched
  after it is out of scope for this run regardless of how clean it looks
  when you get to it.
- Liveness comes before git state, and it must cover every session on the
  machine, not just the operator's own. An agent that hasn't written its
  first file yet is clean and its `HEAD` is trivially an ancestor of
  `origin/main` — indistinguishable from a genuinely abandoned worktree by
  git state alone, and this is equally true of a read-only agent (a code
  reviewer, say) that never writes at all for its entire lifetime. Do not
  infer liveness from a lock's absence, and not from "no process has the
  path open" — an agent idle between tool calls holds no such handle
  either.
- Check every remaining worktree individually, never as a batch, and never
  on age or branch naming alone. `git worktree prune` (the last step below)
  is the one necessary exception — it only deregisters metadata for
  worktrees whose directory is already gone, never touches a live directory
  or its files, and skips locked entries; run `git worktree prune -nv`
  first if you want to see what it would drop before doing it for real.
- Never pass `--force` to `git worktree remove`, and never unlock a
  worktree in order to remove it — a lock is a claim someone made
  deliberately. If removal refuses on a lock or on dirty state, leave that
  worktree and say why in your report; don't force past the refusal.

**Current manual procedure** (see the closing note below — this is deliberately
being replaced by a script):

For a worktree that passes the invariants above, refresh `origin/main` with
an explicit destination refspec — a bare `fetch origin main` is not
guaranteed to update `refs/remotes/origin/main`, which lets a stale local
ref make a force-pushed or rebase-merged-away commit look reachable — then
check cleanliness and ancestry. **If the fetch itself fails** (network,
auth, remote outage), stop and leave this worktree unconfirmed; never fall
through to evaluating it against whatever `refs/remotes/origin/main`
already happened to be:

Run the fetch on its own, once per sweep (it's refreshing a ref shared by
every worktree, not something to repeat per candidate), and confirm it
actually succeeded before touching anything else:

```bash
git -C "<main-checkout>" fetch origin main:refs/remotes/origin/main
```

If that command's exit status is nonzero, stop the entire sweep — every
worktree is now unconfirmed, not just the one you were looking at. Only
once it has genuinely succeeded, evaluate each candidate:

```bash
git --no-optional-locks -C "<worktree>" status --porcelain --untracked-files=all   # must be empty; --no-optional-locks so this read doesn't take .git/index.lock out from under a live agent's own commands; explicit --untracked-files flag so a global status.showUntrackedFiles=no can't hide real work
git -C "<worktree>" merge-base --is-ancestor HEAD refs/remotes/origin/main; echo "ancestor=$?"  # the full ref, not the short name — a stray local branch or tag named origin/main takes priority in git's disambiguation and would make this trivially true
git -C "<worktree>" clean -ndX                                              # dry run: what removal would also take (ignored files, not shown by status --porcelain)
if [ -f "<worktree>/.env" ]; then cmp -s "<worktree>/.env" "<main-checkout>/.env" && echo "env=identical" || echo "env=differs"; else echo "env=absent"; fi
gd="$(git -C "<worktree>" rev-parse --git-dir)"; for f in rebase-merge rebase-apply MERGE_HEAD CHERRY_PICK_HEAD BISECT_LOG; do if [ -e "$gd/$f" ]; then echo "sequencer=$f in progress"; fi; done; true   # a paused rebase/bisect/merge/cherry-pick has clean status and an ancestor HEAD — the checks above see nothing wrong; trailing `true` keeps this line's exit status 0 on every healthy worktree, matching the "nonzero = unreadable" contract below
```

Any of these commands erroring out (nonzero exit from `status` or `clean`,
or a `merge-base` exit other than `0` or `1`) means the worktree itself is
gone or unreadable, not that the checks below rendered a verdict — a
`status`/`clean` call against a missing directory prints nothing and looks
identical to "clean" if you only look at stdout. Treat any such error as
unconfirmed and leave the worktree for `git worktree prune` rather than
reading empty output as a pass.

**A worktree paused mid-rebase or mid-bisect passes every check above and
still cannot be safely removed.** Its working tree is clean (a paused
rebase has no uncommitted changes), and its detached `HEAD` is typically an
ancestor of `origin/main`, so both the status and ancestry gates read as a
pass. `git worktree remove`'s own clean-check guards modified files,
untracked files, locks, and submodules — it has no notion of sequencer
state, so an unforced remove deletes `.git/worktrees/<name>/` wholesale,
`rebase-merge/`/`rebase-apply/`/`BISECT_LOG` included, and the in-progress
operation is unrecoverable. If the loop above printed any `sequencer=...`
line for a candidate, treat it as unconfirmed — leave it for a human to
resolve the paused operation first, regardless of what every other gate
says.

These are templates, not commands to paste literally: put each path into a
shell variable first (`wt="$(...)"`) and reference `"$wt"`, rather than
typing the literal path text into the command line — double-quoting a
pasted-in string still lets the shell expand `$(...)` or backticks inside
it, which a variable assignment followed by `"$var"` does not.

The `clean -ndX` line needs a verdict, not just a look: anything it lists
outside an expected allow-list (`node_modules/`, `dist/`, build caches, and
`.env` — handled by the line above) is unexplained ignored content that the
unforced `remove` below will delete without complaint; escalate rather than
guessing it's fine. For `.env`: `env=absent` or `env=identical` both mean
proceed (most candidates will show `absent` — `git worktree add` doesn't
copy ignored files, that's expected, not an error). `env=differs` means
stop and escalate that one specifically, and never `cat` or `diff` either
file's contents into your output or a report.

A squash- or rebase-merged branch fails the ancestor check even though its
PR is genuinely done, because GitHub rewrites the commits in both cases —
that failure looks identical to a worktree that's just behind. Don't guess
which one it is. Confirm instead: `gh pr view --json
state,headRefOid,baseRefName,mergeCommit -- "<branch>"` (`--` before the
branch matters — a branch literally named `--repo=owner/repo` would
otherwise be parsed as a flag; `gh pr list` defaults to open PRs and won't
surface a merged one), and require all of: `state == MERGED`, `baseRefName
== main`, `headRefOid` equal to `git -C "<worktree>" rev-parse HEAD`
(catches a branch that gained commits after its PR merged, which never
landed anywhere), and `git -C "<main-checkout>" merge-base --is-ancestor
<mergeCommit.oid> refs/remotes/origin/main` exits 0 — that last check is
what actually proves the merge is reachable from `main` right now, rather
than merely having happened at some point in the past (a force-push to
`main` after the merge can make the first three true while this one
correctly fails). If any of these don't hold, leave the worktree and name
it in your report for a human decision.

Once every gate above has passed — including a fresh `fetch`, not just
clean status, the `clean -ndX` verdict, the `.env` verdict, and ancestry or
merged-PR confirmation — re-run all of them immediately before this step,
not just once when you first audited the worktree. Re-fetching matters
here specifically: `main` can move between the audit and the removal, and
re-checking ancestry against an hours-old `refs/remotes/origin/main` is the
exact stale-ref hazard this whole procedure fetches to avoid in the first
place. Time passes between an audit and a human acting on it; re-running
everything, fetch included, costs one round of commands and closes the gap
between "was safe" and "is safe right now." Only then remove it:

```bash
git worktree remove -- "<path>"       # unforced: git's own clean-check runs again here
git branch -d -- "<branch>"           # skip for a detached worktree, and try -D if -d refuses
git worktree prune
```

`git branch -d`'s refusal or success is not additional proof either way —
it depends on upstream-tracking state (whether `fetch --prune` already ran,
whether GitHub's delete-branch-on-merge fired) that has nothing to do with
whether the worktree was safe to remove. Safety came from the checks above;
once you have one of those, `-d` refusing just means use `-D`. Either way,
delete only `<branch>` as recorded in the worktree snapshot you evaluated —
never a branch that is also checked out in another worktree (`branch -d`
refuses this on its own) or that anything else still points at. Treat
`main` as the standing example of a branch never appropriate to delete via
this procedure, not as the only one — the same applies to any other
long-lived branch the repository treats as a merge target.

**The liveness gate has exactly two accepted proofs — nothing else
satisfies it.** Either (a) you, the operator, personally attest — in
writing, before evaluating anything — that you've checked every session on
this machine for agents currently out (this is what "the live-agent list"
in the snapshot step above means: your own written sweep, not a lock, a
process list, or a guess), or (b) a human has personally confirmed no
session has an agent out in that one specific worktree — not merely read
an audit report and inferred liveness from its git-state columns, since
those are exactly the signal this section says can't establish it — and
then named it. That naming counts as proof for that worktree alone and
nothing else; every other gate (self-exclusion, clean status, `clean
-ndX`, `.env`, ancestry or merged-PR) still has to pass. If
neither (a) nor (b) holds for a given worktree, don't run the removal steps
against it — audit and report instead. This gate is only as good as your
actual visibility into every session dispatching agents, not just your
own, and there is currently no mechanism in this repo that gives you that
visibility for certain — which is exactly the gap a real dispatch-side
lease or lock (see #93) is meant to close.

**Run this sweep as a step of ticket-driven cleanup, not on a timer** —
whoever is dispatching agents notices the count (`git worktree list | wc -l`)
climbing past a level that stops being "a handful of active dispatches," and
files or reopens a ticket for it. This is a fixed decision procedure written
as prose for a human to execute (and for an agent to audit against, per the
note near the top of this section) each time, which is a bad fit for
something whose failure mode is bulk data loss. Turning it into a
report-only script that prints a verdict and reason per worktree, and never
deletes anything itself — plus giving dispatch a real lease/lock mechanism
so liveness stops being a matter of attestation — is filed as
[issue #93](https://github.com/conloca/landing/issues/93) rather than done
here. Cite that issue (or this section, until it lands) instead of
re-deriving the procedure from memory; it also tracks the edge cases this
prose version doesn't fully close (the already-gone and
detached-with-no-branch worktree states, and a defined verdict vocabulary).

### Script: `bun run worktree:audit`

`scripts/worktree-audit.ts` runs the gates above (clean status, the
`clean -ndX` ignored-content check, the `.env` comparison, sequencer state,
ancestry or merged-PR confirmation, and a best-effort liveness scan) against
every `.claude/worktrees/agent-*` worktree, or against specific paths passed
as arguments, and prints a PASS, FAIL, or UNCONFIRMED verdict per worktree.
It is report-only: it never deletes a worktree, a branch, or any file, and
never runs `git worktree remove` or `git branch -d` itself. Treat its output
the same way as a manual audit under this section — evidence for a human to
act on, not an automatic go-ahead.

## Figma asset export

`bun run figma:export` pulls the design's raster assets into `src/assets/figma/`
and writes a `manifest.json` describing each one.

Requirements: `FIGMA_PAT` in the environment (bun loads `.env` automatically for
scripts it runs; the MCP servers below are a separate case that needs the manual
`set -a` export), and **`cwebp` on PATH** — `brew install webp`, or
`apt install webp`. The script exits 2 with that instruction if it is absent.

An asset is re-fetched only when its image reference, target width or quality
differs from what `manifest.json` records, so a settings change takes effect
while an unchanged run avoids re-downloading and re-encoding. Note this saves
bandwidth, not quota: the single Tier 1 request happens before the skip check,
so even a no-op run costs one call.

`bun run test` covers the image-header parsers and `Retry-After` handling —
the places where a wrong answer would be silent rather than loud.

### Why there is a custom client

`scripts/figma-client.ts` wraps the REST API with rate limiting. This is not
incidental: Figma splits endpoints into three cost tiers, and the ones asset
export needs are the most restricted.

| Tier | Endpoints | Dev/Full seat budget |
| --- | --- | --- |
| 1 | `GET file`, `GET file nodes`, **`GET images`** | 10/min Starter, 15/min Professional, 20/min Org and Enterprise |
| 2 | comments, variables, webhooks, projects | 25–100/min |
| 3 | components, metadata, users, analytics | 50–150/min |

A **View or Collab seat gets roughly six Tier 1 calls per month**, which is what
silently defeated the first extraction attempt in this repo. Figma reports that
case as `X-Figma-Rate-Limit-Type: low`, and the client fails fast on it with
exit code 5 rather than sleeping through a multi-day `Retry-After` — waiting
cannot fix a monthly quota, only a different seat can.

**This project's token is in exactly that state.** Measured 2026-08-26:

| Endpoint | Result |
| --- | --- |
| `GET /v1/files/:key/images` (image fills) | 200, repeatedly, no throttling |
| `GET /v1/files/:key/nodes` | 429, `Retry-After` ≈ 3 days, plan `starter`, type `low` |
| `GET /v1/files/:key/variables/local` | 403 — token lacks the `file_variables:read` scope |
| `GET /v1/files/:key/styles` | 200, but an empty array (no published styles) |

Two consequences. First, the image-fills endpoint is evidently metered
separately from node fetches despite both being documented as Tier 1 — which is
the only reason asset export works on this seat, and why the exporter is built
on fills rather than node renders. Second, **reading node trees or rendering
SVGs from this file needs a Dev or Full seat**; no amount of retrying
substitutes for it. `bun run figma:node <id>` waits far longer than the export
does and still reports the seat quota rather than hanging.

The `file_variables:read` failure is a *token scope* problem, not a plan one —
personal access token scopes are fixed at creation, so it needs a new token
rather than an upgrade. The client detects this and names the missing scope.

The client honours `Retry-After` when present, falls back to exponential
backoff with full jitter when it isn't, paces requests through a per-tier token
bucket *before* hitting the limit, and caps concurrency. Defaults assume the
Starter allowance, since the plan is only revealed on a 429.

Exit codes: `2` configuration, `3` auth, `4` transient rate limit that outlived
the retry budget, `5` seat quota.

### Prefer image fills over per-node renders

`GET /v1/files/:key/images` returns the source URL for *every* image fill in the
file in a single Tier 1 call. `GET /v1/images` renders one request per node.
For the eight assets this project needs, that is one call instead of eight
against the tightest budget in the API — use the fills endpoint unless a
rendered vector export is specifically required.

Two traps worth knowing. Fill URLs serve whatever format was originally
uploaded, so the file extension must come from the bytes rather than being
assumed — two assets here are JPEGs that a naive exporter wrote as `.png`. And
Figma stores originals, not rendered sizes: the 40×40 avatar arrives as a
1392×1643 PNG. Everything is therefore downscaled to twice its design width and
re-encoded as WebP by `scripts/figma/optimize.ts`, which took the eight assets
from roughly 50 MB to under 800 KB.

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

### Exporting assets: use the image-fills endpoint, not the render endpoint

`/v1/images/:key?ids=...` renders nodes on demand and is metered by **render
cost**. Exporting a few tall frames exhausts it, after which it returns HTTP 429
for a long time. This is what blocked the original design extraction and left
the hero as a hand-built DOM approximation.

`/v1/files/:key/images` is a **different quota** and was not rate-limited even
while the render endpoint was. It returns a map of every image fill in the file:

```
imageRef -> pre-signed S3 URL
```

So for anything that is an image *fill* (photos, screenshots, blurred colour
fields — most raster assets in this file), prefer it:

1. Find the `imageRef` values in the node tree: walk `nodes.json` for nodes
   whose `fills[]` contain `{"type": "IMAGE", "imageRef": "..."}`.
2. `GET /v1/files/:key/images` once to get the whole map.
3. Download the URLs you need, then recompress before committing
   (`magick in.png -resize <2x-display-width> -strip -quality 84 out.webp`
   typically cuts a screenshot by an order of magnitude).

Two things that endpoint does **not** do:

- **It returns the uploaded source image, not the fill as rendered.** The
  node's `fills[].scaleMode` (`FILL` / `FIT` / `CROP` / `TILE`) and, for
  `CROP`, its `imageTransform`, are not baked in. Commit the raw original for
  a cropped fill and the section renders with different framing than the
  design while every measurement still "matches". Read `scaleMode` and either
  crop at recompress time or reproduce it with `object-fit`/`object-position`.
- **The URLs are pre-signed and expire.** Download immediately; never persist
  one in a committed file or a checked-in extraction dump.

The render endpoint is still the only option for **vector** exports (SVG of a
logo or icon), which have no `imageRef`.

### Read rotated nodes' geometry carefully

For a node with a non-zero `rotation`, Figma's `absoluteBoundingBox` is the
axis-aligned box **around the rotated shape**, not the node's own rect. Using
its width and height directly renders the element too large.

Ask the API for the real rect first: request the node with `geometry=paths`
and read its `size` (and `relativeTransform`). A plain `/v1/files/:key/nodes`
call omits both — they come back `null` — which is the only reason the
arithmetic below is ever needed.

When you only have the bounding box, invert it. For rotation `t`:

```
AABB_w = W·|cos t| + H·|sin t|
AABB_h = W·|sin t| + H·|cos t|
```

The absolute values matter: `rotation` is signed (`-180..180`), and dropping
them on a negative angle silently yields a box *narrower* than the element.
Solve the pair for `W` and `H`, and keep the same centre — the rotation does
not move it. Note also that Figma measures counter-clockwise-positive, the
opposite of CSS `rotate()`, so negate `t` before putting it in a transform.

Worked example: a frame reporting 931.53x781.61 at `t = -1.5°` is really
912x758. Solving the same pair with signed sines instead gives 952.98x806.83
— wrong, ~4% too large in both axes, and plausible enough to ship.

The inversion is ill-conditioned near 45° (the determinant goes to zero), so
treat it as the fallback it is.

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

## Design tokens

The palette, font families, the light/dark semantic scheme and the radius base
are **generated**, not hand-written. `tokens/tokens.json` (W3C DTCG format) is
the source of truth; `bun run tokens` regenerates `src/tokens.generated.css`,
and both `dev` and `build` run it first.

`src/tokens.generated.css` is a build artifact and is gitignored — never edit it
directly. To change a design value, edit the token and regenerate.

[`DESIGN.md`](DESIGN.md) documents the palette, type ramp, geometry and the
pipeline itself, including one known wart in how Tailwind scans the generated
file.
