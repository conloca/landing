# Figma extraction

Design source: file key `OxxksZFS8hzKoFTeSRdFGs`, breakpoints section
`40002391:9972` ([open in Figma](https://www.figma.com/design/OxxksZFS8hzKoFTeSRdFGs/Conloca?node-id=40002391-9972)).

These files are the authoritative source for measurements — spacing, type sizes,
colours, radii. Prefer them over reading values off a rendered PNG.

## What is here

| File | What it is |
| --- | --- |
| `DESIGN-SPEC.md` | The written build spec: breakpoints, section-by-section layout, type ramp, component mapping. Start here. |
| `COLOR-TOKENS.md` | The designer's own colour token names and values, and how our semantic roles map onto them. |
| `nodes-colors.json` | Raw node tree of the `Color tokens - Semantics` frame, the source for `COLOR-TOKENS.md`. |
| `nodes-breakpoints.json` | Raw node trees for the 393, 640 and 1024 frames, keyed by node id. |
| `nodes-components.json` | Raw node tree of the `Components` page — the design system's own component definitions (button, header, segmented control, avatar, badge, logo, carousel progress). |
| `extraction-manifest.json` | When this was fetched, and the Figma file's `version` and `lastModified` at that moment. Check it before trusting a measurement — if the file has moved on, the snapshot is stale. |

### Why these are committed when reference renders are not

`AGENTS.md` says Figma reference renders stay out of the repository and get
regenerated from the source file. That rule holds for the PNGs, because the image
endpoint still answers — they are cheap to reproduce.

These node trees are the opposite case. The endpoint that produces them is
exhausted for roughly three days at a time and allows about six calls a month on
this plan, so a lost snapshot cannot simply be refetched; it blocks whoever needs
it until the quota returns. That is why they are stored, and why
`extraction-manifest.json` records the file version they came from.

The JSON is pretty-printed and float precision is rounded to four decimals, so git
can diff it line by line. That makes the working-tree size look large (~6.5 MB),
but it compresses about 17:1 — roughly 400 KB in the pack. Render-bounds
duplicates and vector path geometry are stripped; everything consulted for
measurements (layout, typography, fills, hierarchy, bounding boxes) is intact.

## Breakpoints

| Width | Node id | Frame name | Tree stored here |
| --- | --- | --- | --- |
| 393 | `40002441:868` | `Homepage - Developers - <640` | yes — 986 nodes, 13 levels |
| 640 | `40002427:20368` | `Homepage - Developers - 1024 / 640` | yes — 948 nodes, 13 levels |
| 1024 | `40002426:4064` | `Homepage - Developers - 1280 / 1024` | yes — 976 nodes, 13 levels |
| 1440 | `40002427:16387` | `Homepage - Developers - >1280` | **no** — see below |

`nodes-breakpoints.json` holds the three narrow frames only. The 1440 desktop tree
was extracted separately and earlier; its measurements are written up in
`DESIGN-SPEC.md` rather than stored raw here. Fetch it the same way if you need the
tree itself.

Before the three narrow trees existed, responsive work was done by eyeballing PNG
renders; it no longer needs to be.

**The 393 layout is a different composition, not a narrowed desktop** — see
`DESIGN-SPEC.md`. Read the tree rather than assuming the desktop structure scales.

## Fetching more — read this before you try

The REST API is quota-limited on this account and the limits are **not** what they
first appear.

**`/v1/files/:key/nodes` is exhausted.** It returns `429` with
`x-figma-plan-tier: starter`, `x-figma-rate-limit-type: low`, and a `retry-after`
of roughly three days. Buying a Dev seat did **not** change this — the tier is a
property of the organisation's plan, not of the seat.

**`/v1/files/:key` still works, and accepts the same `ids` parameter.** This is the
way through: it is metered separately from `/nodes`, and a comma-separated `ids`
list returns every requested node in a single request. Everything in this directory
came from one such call while `/nodes` was rate-limited — this exact one:

```
GET /v1/files/:key?ids=2548:13160,40002164:36164,40002441:868,40002427:20368,40002426:4064
```

`2548:13160` is the Colors *page*; requesting it returns both token frames beneath
it, including `40002164:36164` (Semantics). The `Components` page came along in the
same response because the API returns the enclosing document skeleton regardless.

The same asymmetry exists for images: `/v1/images/` is metered by render cost and
trips easily, while **`/v1/files/:key/images`** returns the image-fill URLs from a
separate quota and has not failed. That is how the raster assets in
`src/assets/figma/` were exported.

**`/v1/files/:key/variables/local` is closed.** It needs the `file_variables:read`
scope, which this account cannot grant at token creation — the error helpfully
lists every scope the token *does* hold, and that one is not among them. Use
`COLOR-TOKENS.md`, which carries the same information from the designer's generated
documentation frame.

**Published styles and components are empty.** `/v1/files/:key/styles`,
`/components` and `/component_sets` all return `200` with empty arrays — nothing in
this file is published to a library, so those endpoints are not an alternative
route to the tokens.

A rate-limit-aware fetcher (`scripts/figma-client.ts`) — which honours
`Retry-After`, paces requests and fails with a legible error rather than silently
burning a slot — exists on an open pull request but is **not on `main` yet**. Once
it lands, use it instead of raw `curl`. Until then, mind the quota by hand: batch
every node you need into a single `ids` list, because a second call may be three
days away.
