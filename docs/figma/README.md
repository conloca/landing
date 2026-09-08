# Figma extraction

Two extraction passes against the same file, file key `OxxksZFS8hzKoFTeSRdFGs`,
breakpoints/frame section `40002391:9972`
([open in Figma](https://www.figma.com/design/OxxksZFS8hzKoFTeSRdFGs/Conloca?node-id=40002391-9972)).
`DESIGN-SPEC.md` is the readable write-up; everything else here is the raw
evidence behind it — node trees for measurements, plus rendered PNGs and
per-page dumps for anything a node tree alone can't answer.

The first pass (2026-08-25) captured the full desktop node tree and
whole-file renders. The second (2026-08-27, see `extraction-manifest.json`)
went back for the narrow-breakpoint node trees and the designer's colour
token names, using the batching workaround documented below.

## Read this before planning any Figma work

**This data cannot be cheaply re-fetched.** The node-tree endpoints
(`/v1/files/:key/nodes`, `/v1/files/:key`) are quota-limited to roughly six
calls per month on a View/Collab seat. Measured on the project token: HTTP 429
with `Retry-After` of about three days, `plan: starter`,
`X-Figma-Rate-Limit-Type: low`. **A Dev or Full seat is required to extract
anything more.** Treat the files here as irreplaceable until that seat exists.

### The two image endpoints are not the same thing

Confusing them wastes calls against a six-per-month budget, so be precise:

| Endpoint | Keyed by | Returns | Quota |
| --- | --- | --- | --- |
| `GET /v1/images/:key` — **render** | node id (`40002427:16388`) | a freshly rendered PNG of that node | Same tight tier as the node tree |
| `GET /v1/files/:key/images` — **image fills** | `imageRef` hash (`a1762f34…`) | the original bitmaps already placed in the design | **Separate, far looser** |

The renders in `renders/` came from the **render** endpoint — that is why
`img-*.json` here is keyed by node id. The product assets that ship in the app
came from the **image fills** endpoint, which returned 200 immediately while
node fetching was still rate-limited. For anything that is an existing bitmap
in the design, reach for image fills first; only node renders need the
expensive endpoint.

### Batching node fetches through `/v1/files/:key`

`/v1/files/:key/nodes` is the endpoint that exhausts fast. `/v1/files/:key`
itself is metered separately and accepts the same comma-separated `ids`
parameter, returning every requested node in one call — that is the way
through once `/nodes` is spent. The narrow-breakpoint and colour-token trees
in this directory came from one such call, made while `/nodes` was still
rate-limited:

```
GET /v1/files/:key?ids=2548:13160,40002164:36164,40002441:868,40002427:20368,40002426:4064
```

`2548:13160` is the Colors *page*; requesting it returns both token frames
beneath it, including `40002164:36164` (Semantics). The `Components` page
came along in the same response because the API returns the enclosing
document skeleton regardless — that's why `nodes-components.json` exists
even though it wasn't explicitly requested.

**Published styles and components are empty.** `/v1/files/:key/styles`,
`/components` and `/component_sets` all return `200` with empty arrays —
nothing in this file is published to a library, so those endpoints are not an
alternative route to the tokens.

### Pacing rules for any future extraction

These are the rules that matter, written here so this document stands on its
own:

- Honour `Retry-After` when present; it is authoritative and can be measured in
  **days**, not seconds. Do not treat a 429 as transient without reading it.
- Back off exponentially with jitter when there is no `Retry-After`, and cap
  the attempt count. Six blind retries against a monthly wall is a guaranteed
  loss — that exact mistake was made here.
- Bound concurrency. Never fire node renders in parallel.
- Pace the render endpoint far more conservatively than metadata endpoints.
- Batch every node you need into a single `ids` list against `/v1/files/:key`
  (see above) — a second call may be three days away.

`scripts/figma-client.ts` implements all of the above and is on `main`.

## What is missing

Do not assume the gap is an oversight — these were never obtained:

- **The 1440 desktop node tree's raw JSON is not stored alongside the other
  breakpoints.** `nodes.json` in this directory *is* that tree — extracted in
  the first pass — but `nodes-breakpoints.json` (the second pass) only holds
  the three narrow frames; see the breakpoints table below.
- **Figma Variables.** `/v1/files/:key/variables/local` returns 403 — see
  `vars.json`, which lists the scopes the token actually holds and shows
  `file_variables:read` is not among them. The error reads like a token-scope
  problem, and that reading is wrong: **the scope is not offerable on this
  plan at all**, confirmed against Figma's own token-creation dialog, so
  reissuing the token does not help. `DESIGN-SPEC.md` is correct that this
  endpoint needs an Enterprise entitlement. Use `COLOR-TOKENS.md` instead,
  which carries the same information from the designer's generated
  documentation frame, and do not spend time regenerating tokens for it.

The Colors page (node `2548:13160`) was originally in this list too — six
fetch attempts with correct backoff all returned 429 against the monthly
wall. It was later obtained in the second pass via the `ids`-batching
workaround above and is now `nodes-colors.json` / `COLOR-TOKENS.md`. The
page's own node record (assembled from that same fetch plus the page-level
shell already captured in `file-depth2.json`) is `node-2548-13160.json`; the
line-by-line reconciliation against `tokens/tokens.json` is
`COLORS-RECONCILIATION-46.md`. A live re-attempt on 2026-09-08 against all
three configured Figma access paths (the REST client, `figma-framelink` MCP,
and the `figma-desktop` Dev Mode MCP) reconfirmed the same seat-tier and
seat-entitlement blocks documented throughout this file — see
`COLORS-RECONCILIATION-46.md` for the exact live error text from each.

## Files

| File | What it is |
| --- | --- |
| `DESIGN-SPEC.md` | The build spec written from this material — start here |
| `COLOR-TOKENS.md` | The designer's own colour token names and values, and how our semantic roles map onto them |
| `nodes.json` | Full desktop (1440) node tree from the first pass. **The authoritative source** for every spacing, font size, colour and radius measurement in this project |
| `nodes-breakpoints.json` | Raw node trees for the 393, 640 and 1024 frames, keyed by node id |
| `nodes-colors.json` | Raw node tree of the `Color tokens - Semantics` frame, the source for `COLOR-TOKENS.md` |
| `nodes-components.json` | Raw node tree of the `Components` page — the design system's own component definitions (button, header, segmented control, avatar, badge, logo, carousel progress) |
| `extraction-manifest.json` | When the second pass was fetched, and the Figma file's `version` and `lastModified` at that moment. Check it before trusting a measurement from `nodes-breakpoints.json`, `nodes-colors.json` or `nodes-components.json` — if the file has moved on, the snapshot is stale |
| `outline.txt` | Annotated tree — layout mode, gaps, padding, fills and effects per node. Easier to scan than `nodes.json` |
| `copy.txt` | Every string in document order with its type style |
| `anim.json` | The `Conloca - Animations` section, which documents the designer's scroll and stacking intent |
| `file-depth2.json` | All pages and top-level frames, depth 2 |
| `shallow-*.json` | Shallow fetches of three top-level sections, keyed by node id |
| `vars.json` | The Variables 403 response, kept as evidence of the token's scopes |
| `img-*.json` | Node id to rendered-image URL maps from the render endpoint. The URLs themselves have expired; the node ids are the durable part |
| `renders/frame-*.png` | Full-page renders at all four designed breakpoints |
| `renders/sec-s*.png` | Per-section desktop renders |
| `node-2548-13160.json` | The Colors page's own node record, assembled from `file-depth2.json` (page shell) and `nodes-colors.json` (the Semantics frame's full content) |
| `COLORS-RECONCILIATION-46.md` | Issue #46's reconciliation: designer colour names vs. `tokens/tokens.json`, plus the 2026-09-08 live re-verification log across every REST/MCP path |
| `animations/` | A real, frame-accurate render of `public/banner-2.lottie` (the one animated UI element in this design), sampled at 100ms intervals — see `animations/README.md` for how and why, since Figma exposes no click-through prototype for it |

### Why the node trees are committed when reference renders are not

`AGENTS.md`'s general rule is that Figma reference renders stay out of the
repository and get regenerated from the source file, because the image
endpoint is cheap and still answers. The JSON node trees and the PNGs in
`renders/` here are a deliberate, documented exception to that default: the
endpoints that produced them are exhausted for roughly three days at a time
and allow only about six calls a month on this plan, so a lost snapshot
cannot simply be refetched — it blocks whoever needs it until the quota
returns. That is why they are stored here instead, and why
`extraction-manifest.json` records the file version the second pass came
from. See "A note on size" below for the specific cost/tradeoff reasoning
behind committing the renders.

The node-tree JSON is pretty-printed and float precision is rounded to four
decimals, so git can diff it line by line. That inflates the working-tree
size, but it compresses well in the pack — render-bounds duplicates and
vector path geometry are stripped; everything consulted for measurements
(layout, typography, fills, hierarchy, bounding boxes) is intact.

## Breakpoints

| Width | Node id | Frame name | Tree stored here |
| --- | --- | --- | --- |
| 393 | `40002441:868` | `Homepage - Developers - <640` | yes — 986 nodes, 13 levels (`nodes-breakpoints.json`) |
| 640 | `40002427:20368` | `Homepage - Developers - 1024 / 640` | yes — 948 nodes, 13 levels (`nodes-breakpoints.json`) |
| 1024 | `40002426:4064` | `Homepage - Developers - 1280 / 1024` | yes — 976 nodes, 13 levels (`nodes-breakpoints.json`) |
| 1440 | `40002427:16387` | `Homepage - Developers - >1280` | yes — first pass, stored as `nodes.json` rather than in `nodes-breakpoints.json` |

Before the three narrow trees existed, responsive work was done by eyeballing
PNG renders (see `renders/frame-*.png`); it no longer needs to be for
measurements, though the renders remain useful for visual diffing (see
`scripts/visual-diff.ts` and "Using the renders" below).

**The 393 layout is a different composition, not a narrowed desktop** — see
`DESIGN-SPEC.md`. Read the tree rather than assuming the desktop structure
scales.

### Which node each render came from

The filenames carry no node ids, so the mapping is recorded in
**`renders-manifest.json`** — file, node id, layer name, and verified pixel
dimensions for all ten renders. Prefer that file over the table below if you
are writing anything that consumes these programmatically; the table is the
same data for humans.

Layer names are absent for the tablet, small and mobile breakpoints because
only the desktop node tree was fetched in the first pass — the same gap
described above, since closed for measurements (if not layer names) by
`nodes-breakpoints.json`.

| Render | Node id | Layer name |
| --- | --- | --- |
| `renders/sec-s0-hero.png` | `40002427:16388` | Frame 610 |
| `renders/sec-s1-three-features.png` | `40002427:16418` | Frame 609 |
| `renders/sec-s2-everything.png` | `40002427:16760` | Frame 1618873213 |
| `renders/sec-s3-feature-grid.png` | `40002427:16814` | Frame 1618873184 |
| `renders/sec-s4-pricing.png` | `40002427:17148` | Frame 1618873226 |
| `renders/sec-s5-footer.png` | `40002427:17255` | Frame 1618873228 |

The four `frame-*.png` breakpoint renders correspond to `img-desktop1440.json`,
`img-tablet1024.json`, `img-small640.json` and `img-mobile393.json`
respectively, each of which holds the single node id that was rendered.

## Using the renders

They are exported at **1x**, which is what `scripts/visual-diff.ts` expects —
it compares at equal CSS width with device pixel ratio 1. Verified widths:
`frame-desktop1440` 1440, `frame-tablet1024` 1024, `frame-small640` 640,
`frame-mobile393` 393. They are kept as PNG deliberately: that tool reads PNG
only, so converting them would break their primary use.

**`sec-s0-hero.png` is the one exception and will not diff as-is.** It is
1592×980, not 1440 wide, because the hero's dashboard panel is rotated and
deliberately bleeds past the right edge of the frame — the render covers the
node's full painted bounds rather than the 1440 viewport. `visual-diff.ts`
hard-fails on unequal widths, so crop it to the leftmost 1440 columns before
comparing against a 1440 capture. The other five section renders are 1440 wide
and need no preparation.

Per-section crops are the more reliable comparison signal. A full-page run is a
sanity check at best, because any height difference above the compared region
shifts everything below it out of alignment and inflates the mismatch.

The `thumbnailUrl` field in each JSON envelope has been emptied. It carried an
expired pre-signed S3 URL containing an AWS access key id, which would have
tripped the repository's secret-scanning gate. No design data was affected.

The rendered-image URLs retained in `img-*.json` are a **different** shape:
bare S3 object URLs with no query string, carrying no `AWSAccessKeyId`,
`Signature`, `X-Amz-*` or `Expires` parameters. Being unsigned, they do not
"expire" so much as simply stop resolving once Figma reaps the object — either
way the node ids beside them are the durable part.

Because `.gitattributes` suppresses the diff on these files, no reviewer can
eyeball that claim. It is therefore enforced mechanically rather than by
promise: **`bun run check:figma`** scans the directory for signed-URL query
parameters and Figma tokens, asserts the irreplaceable files still exist, and
validates `renders-manifest.json` against the PNGs on disk in both directions
(no missing entries, no unlisted renders). The `figma-archive` workflow runs it
on any pull request touching `docs/figma/`, so a refresh that reintroduces a
credential fails CI rather than merging invisibly.

## `DESIGN-SPEC.md` describes the state at extraction time

Its closing "what was extracted, and gaps" section is a snapshot from
2026-08-25 and has since been partly overtaken: it reports that no assets were
exported (they were later, via the image-fills endpoint) and lists vertical
slice directories as captured (those were reading aids, are derived from the
frames above, and are deliberately not kept here). Where the two documents
disagree about what exists, **this README is the current inventory**; the spec
remains accurate about the design itself.

## A note on size

`renders/` is about 20 MB and roughly triples the repository. That cost was
accepted because the files are irreplaceable while the token lacks a Dev seat,
and because they never churn — written once, never edited, so they add no
delta history beyond the initial blobs.

**Be aware this was a one-way door.** Once these blobs are in history, adopting
Git LFS later does not reclaim the space: forward-only adoption leaves the
existing objects in place, and `git lfs migrate` rewrites history, invalidating
every clone, branch and fork. The alternatives — Git LFS, a GitHub Release
asset, or a sibling archive repository, none of which pin 20 MB into every
future clone — were all options for *this* commit and not afterwards. Since
the data never churns, it does not actually need to be version-pinned
alongside the code; only this README does.

In-repo was chosen for bluntness: the files are worthless if someone has to
know they exist somewhere else to find them, and losing them costs a paid seat
to recover. That was judged worth a permanent 20 MB. If the team prefers one
of the alternatives, the moment to say so is before this merges.
