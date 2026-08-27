# Figma extraction

Raw source material extracted from the Figma file behind this landing page.
`DESIGN-SPEC.md` is the readable write-up; everything else here is the evidence
behind it.

Source: file key `OxxksZFS8hzKoFTeSRdFGs`, frame `40002391:9972`, captured
2026-08-25 (file `lastModified` 2026-08-25T12:11:13Z).

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

`scripts/figma-client.ts` implements all of the above — added in commit
`355b2ac`, which at the time of writing had not yet merged to `main`. If that
file is not present in your checkout, the rules above are what you need to
reimplement.

## What is missing

Do not assume the gap is an oversight — these were never obtained:

- **Node trees for the 640, 1024 and 393 breakpoints.** Only the 1440 desktop
  frame has one. For the other three the renders in `renders/` are the *only*
  record, so their measurements can be read visually but not queried. Anyone
  doing mobile or tablet work will otherwise waste time looking for numbers
  that do not exist.
- **The file's "Colors" page** (node `2548:13160`), which holds the designer's
  own naming for the palette. Six fetch attempts with correct backoff all
  returned 429 against the monthly wall. Colour *values* in `DESIGN-SPEC.md`
  were counted from the node tree and are correct; the *names* are ours, not
  the designer's.

  `DESIGN-SPEC.md` separately names a `Color tokens - Semantics` node
  `40002164:36164`. That is **not** the same object: `2548:13160` is confirmed
  as a top-level page in `file-depth2.json`, while `40002164:36164` does not
  appear there and so is a frame nested somewhere inside. If you get a Dev seat
  and have calls to spend, fetch the page first — it is the broader target.
- **Figma Variables.** `/v1/files/:key/variables/local` returns 403 — see
  `vars.json`, which lists the scopes the token actually holds and shows
  `file_variables:read` is not among them. The error reads like a token-scope
  problem, and that reading is wrong: **the scope is not offerable on this
  plan at all**, confirmed against Figma's own token-creation dialog, so
  reissuing the token does not help. `DESIGN-SPEC.md` is correct that this
  endpoint needs an Enterprise entitlement. Do not spend time regenerating
  tokens for it.

## Files

| File | What it is |
| --- | --- |
| `DESIGN-SPEC.md` | The build spec written from this material — start here |
| `nodes.json` | Full desktop node tree. **The authoritative source** for every spacing, font size, colour and radius measurement in this project |
| `outline.txt` | Annotated tree — layout mode, gaps, padding, fills and effects per node. Easier to scan than `nodes.json` |
| `copy.txt` | Every string in document order with its type style |
| `anim.json` | The `Conloca - Animations` section, which documents the designer's scroll and stacking intent |
| `file-depth2.json` | All pages and top-level frames, depth 2 |
| `shallow-*.json` | Shallow fetches of three top-level sections, keyed by node id |
| `vars.json` | The Variables 403 response, kept as evidence of the token's scopes |
| `img-*.json` | Node id to rendered-image URL maps from the render endpoint. The URLs themselves have expired; the node ids are the durable part |
| `renders/frame-*.png` | Full-page renders at all four designed breakpoints |
| `renders/sec-s*.png` | Per-section desktop renders |

### Which node each render came from

The filenames carry no node ids, so the mapping is recorded in
**`renders-manifest.json`** — file, node id, layer name, and verified pixel
dimensions for all ten renders. Prefer that file over the table below if you
are writing anything that consumes these programmatically; the table is the
same data for humans.

Layer names are absent for the tablet, small and mobile breakpoints because
only the desktop node tree was ever fetched — the same gap described above.

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
