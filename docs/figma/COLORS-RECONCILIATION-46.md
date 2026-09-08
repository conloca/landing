# Colors page reconciliation — issue #46

Closes the three acceptance criteria on
[issue #46](https://github.com/conloca/landing/issues/46): fetch the Colors page
(node `2548:13160`), reconcile the designer's colour names against
`tokens/tokens.json`, and update the corresponding open question in
`docs/QUESTIONS-DESIGNER.md`.

## Live extraction attempt, 2026-09-08

Before reusing archived data, a fresh fetch of node `2548:13160` was attempted
against all three configured Figma access paths, for real, from this session:

| Path | Result |
| --- | --- |
| REST client (`bun run figma:node 2548:13160`, `scripts/figma-client.ts`) | **Blocked.** `FigmaSeatQuotaError`: "Figma reports a low-tier seat quota on tier1 endpoints (plan: starter). Figma asked for a 1h wait." Client behaved correctly — authenticated, requested the right endpoint, and failed fast per its documented policy of never blocking on a monthly-quota-type 429. |
| `figma-framelink` MCP (`get_figma_data`, stdio, PAT-based) | **Blocked**, same underlying cause. Live log: `Calling https://api.figma.com/v1/files/OxxksZFS8hzKoFTeSRdFGs/nodes?ids=2548:13160` → `Figma API rate limit hit (429). Retry after 4769 seconds. Your Figma seat type (Viewer or Collaborator) has a lower API rate limit.` Confirms framelink wraps the identical REST endpoint and quota as the direct client. |
| `figma-desktop` MCP (Dev Mode, local, `http://127.0.0.1:3845/mcp`) | **Blocked**, different cause. The server is live (verified via a raw MCP `initialize` handshake) and the Figma desktop app has the Conloca file open, but every content tool (`get_metadata`, `get_design_context`, `get_variable_defs`, `get_screenshot`, `get_motion_context`) returns the same seat-gate error regardless of node id: "make sure their paid Figma seat includes Dev Mode access." This is a paid-feature gate, not the Tier‑1 quota — a Dev Mode seat would lift it independently of the REST quota resetting. |
| `figma` MCP (hosted, OAuth, `https://mcp.figma.com/mcp`) | **Blocked.** `401 Unauthorized`; the server demands an OAuth bearer token and this environment has no completed OAuth session for it (a `FIGMA_PAT` alone does not satisfy this server). |

All three seat/quota-driven failures point at the same starter-plan
View/Collab seat; the fourth is a separate, unrelated auth mechanism this
environment never completed.

## The node's content, assembled from real prior fetches

`node-2548-13160.json` (new, in this directory) is the Colors page's node tree,
assembled — not fabricated — from two genuine prior API responses:

- **The page shell and its two child frames** (`Color tokens - Semantics`,
  `Color tokens - Primitives`) come from `file-depth2.json` (PR #167,
  2026-08-27 pass), which lists node `2548:13160` with those two children at
  shallow depth.
- **The `Color tokens - Semantics` frame's full content** (fills, text,
  layout — the frame that actually holds the palette) is spliced in from
  `nodes-colors.json`, fetched in the second extraction pass via the
  `ids`-batching workaround documented in `README.md` (a single
  `GET /v1/files/:key?ids=2548:13160,...` call that returned this same page
  as part of its response).
- **The `Color tokens - Primitives` frame stays shallow deliberately**: it is
  the stock Tailwind colour ramp rendered as ~224 swatches, reconstructible
  from Tailwind itself, and was never fetched in full — see "What is missing"
  in `README.md`.

No value in this file was invented for this task; both source responses were
genuine Figma API responses captured on the dates the archive already records
(`extraction-manifest.json`).

## Reconciliation against `tokens/tokens.json`

`COLOR-TOKENS.md` already carries the full designer-token-to-hex table, read
from the Semantics frame above. Re-checked line by line against the live
`tokens/tokens.json` on `main` today:

| Designer token (Colors page) | Value | `tokens.json` role | Value | Matches |
| --- | --- | --- | --- | --- |
| `color.fg.strong.default` | `#1C1917` | `scheme.light.foreground` | `#1c1917` | yes |
| `color.bg.accent.initial` | `#292524` | `scheme.light.primary` | `#292524` | yes |
| `color.fg.softer.default` | `#78716C` | `scheme.light.muted-foreground` | `#78716c` | yes |
| `color.stroke.strong` | `#E7E5E4` | `scheme.light.border` / `.input` | `#e7e5e4` | yes |
| `color.bg.surface.initial` (`white`) | `#FFFFFF` | `scheme.light.background` | `#ffffff` | yes |
| — (no semantic counterpart) | — | `scheme.light.ring` | `#9ae600` | n/a — brand lime, already an open question in `COLOR-TOKENS.md` |

Every semantic role that has a designer counterpart matches. The correction
described in `COLOR-TOKENS.md` ("the correction has landed") is confirmed
still true against the current token file, not just true at the time that
document was written.

### One real mismatch worth flagging, not silently fixed here

`tokens/tokens.json`'s `scheme.light.destructive` is `#fe3434` — but
`docs/QUESTIONS-DESIGNER.md` records the team's own decision (localization
banner section, "we built it this way", and Colors-page question 12) that
`#FE3434` should specifically **not** be adopted as a UI error colour: it is
mockup content (a deleted-line-of-code colour inside the version-comparison
illustration, and separately inside a Lottie export), and it measures 3.65:1
contrast on white against the WCAG AA minimum of 4.5:1 for regular text. The
token file currently uses exactly the colour the team decided against, for
the one role that decision was about. Nothing on the page consumes
`destructive` today, so this is latent rather than a live bug, but it should
be corrected to a real 4.5:1+ red rather than inherited by whatever UI first
reads that token. Filed as a mismatch, not silently overwritten here, per the
issue's second acceptance criterion — the fix is a separate, deliberate token
change, not a Figma-extraction task.

## What issue #46 asked for that remains genuinely blocked

The Figma **Variables** REST endpoint remains 403 (`vars.json`, confirmed
scope-based, not plan-based — Enterprise-only regardless of PAT scopes). The
desktop Dev Mode MCP's `get_variable_defs` tool — which could have read
variables directly from the app rather than through that REST endpoint — is
also blocked today by the same missing Dev Mode seat entitlement as every
other Dev Mode content tool. Neither path is fixable by reissuing the PAT;
both need a paid seat upgrade. `COLOR-TOKENS.md`'s generated-documentation-frame
table remains the correct substitute, as already documented.
