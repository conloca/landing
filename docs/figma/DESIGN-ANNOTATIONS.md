# Figma designer annotations

The designer (Saba) left short callout notes directly on the Figma canvas, each
connected to the specific part of the page it explains by a curved arrow (a Figma
vector layer named `Curved`). The Figma MCP tools this project uses
(`get_design_context`, `get_metadata`) return each note's text and position, but not
which arrow points at which element — that only shows up visually, on the canvas.
This document is that visual pass, done once: every note found, read, matched to the
part of the page it explains, and checked against what this codebase actually does
today.

Source file: `Conloca`, key `yOHv995S8IvhS5jEdQS4uV`. All notes below live as direct
children of the `Conloca - Homepage` canvas section (`40002207:12482`), which also
holds the two full-page variants, `Homepage - Developers` (`40002172:6194`) and
`Homepage - Content editors` (`40002207:13631`). No other section in the file
(the animated-banner mockups, the bento-grid animation mockup, the header/hero
animation mockup, the blog section, the breakpoints section) had any loose
note-and-arrow pairs — this appears to be the complete set.

## What the connector looks like

Every note is a small rounded rectangle (272 px wide) holding the callout text, sitting
in the empty margin to the left of the `Homepage - Developers` frame (around
`x ≈ 294–331` in canvas coordinates, with the frame itself starting at `x = 754`) or, for
the one note about the hero video, in the gap between the two frame variants
(`x ≈ 2374`, between the Developers frame's right edge at `x = 2194` and the
Content-editors frame's left edge at `x = 2947`). Each note has its own `Curved` vector
— a single bent line, no arrowhead marker — running from near the note's top edge to a
point 350–450 px to its right, roughly at the frame's left edge, at very nearly the same
canvas `y` as the note. That last part is the reliable signal for automating this later:
**a note and its arrow share the same `y` within about 50 px, and the arrow's far end
lands close to the target frame's edge at that `y`** — so the first thing worth trying,
for this specific style of annotation, is pairing every loose text/frame node with the
nearest loose `Curved` vector at a similar `y`, then reading off which section of the
target frame sits at that `y` from a layout spec like this file's own frame/section
table (see `DESIGN-SPEC.md` §2). This file was produced by doing exactly that match by
eye, not by a script — the automation itself is future work, not attempted here.

## The notes

| #   | Note (node id)   | Arrow (node id)  | Canvas y                                                | Text (verbatim)                                                                                                                                                                                                                                                                     | Points at                                                                                              | Status                                              |
| --- | ---------------- | ---------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| 1   | `40002543:9677`  | `40002543:9674`  | 359                                                     | "Segmented control switches page content between "developers" and "content editors" versions (See on the right"                                                                                                                                                                     | The `conloca-segmented-control` toggle at the top of the hero                                          | **Gap** — see below                                 |
| 2   | `40002543:9673`  | `40002265:19031` | 626                                                     | "Added a badge to show that Conloca works only with the Astro projects"                                                                                                                                                                                                             | The green "BUILT FOR ASTRO" badge in the hero                                                          | Matches implementation                              |
| 3   | `40002543:9672`  | `40002265:19036` | 833                                                     | "This is the automatic carousel of short, quick messages about how conloca works."                                                                                                                                                                                                  | The rotating text strip below the badge (`CarouselRail`)                                               | Partial — see below                                 |
| 4   | `40002265:19038` | `40002265:19037` | 517 (x≈2374, in the gap between the two frame variants) | "The product walkthrough video (I can record if needed) to demonstrate the core features and give the user a sense of what Conloca is really about. Videos can be different for Developer and Content editor versions of the page. Example from Tokens Studio landing page: [link]" | The dashboard screenshot / play-button video panel in the hero                                         | **Gap** — see below                                 |
| 5   | `40002265:19382` | `40002265:19381` | 1561                                                    | "Need correct code snippet to place here"                                                                                                                                                                                                                                           | The code-editor mockup inside the first feature card, "One source of truth, two ways to work"          | Placeholder, already tracked                        |
| 6   | `40002265:19040` | `40002265:19039` | 1884                                                    | "3 feature display banners to explain 3 main selling points of the product."                                                                                                                                                                                                        | The three pinned/stacking feature cards as a group (this codebase's `ThreeFeatures` + `ScrollStack`)   | Matches implementation                              |
| 7   | `40002265:19380` | `40002265:19379` | 3345                                                    | "Need correct code snippet to place here"                                                                                                                                                                                                                                           | The diff/pull-request mockup inside the third feature card, "Review, merge, and revert content in Git" | Placeholder, already tracked                        |
| 8   | `40002265:19042` | `40002265:19041` | 4865                                                    | "Feature bento grid to give more details about most essential features. This is the same for developers and Content editors."                                                                                                                                                       | The bento grid of feature tiles below the three feature cards                                          | Matches implementation, useful new fact (see below) |

## What each one means for the codebase

**#1 — segmented control (gap).** The note says outright what the toggle does:
switch the whole page's copy and images between a "developers" and a "content
editors" reading, and it points at a second, fully-drawn page variant sitting right
next to this one in Figma (`Homepage - Content editors`, `40002207:13631`) to prove
it. Today `SegmentedControl` in `Hero.tsx` is rendered with a hardcoded
`activeIndex={0}` and no `onChange` — clicking it does nothing, and no other section
reads which audience is selected. This was already an open question in
`QUESTIONS-DESIGNER.md` (designer-list question 1); this note is the designer's own
answer to it, in her own words, and confirms the content-editors variant is meant to
ship, not just a drawn-but-unplanned alternate.

**#3 — automatic carousel (partial).** "Automatic" is the operative word: the note
describes it switching on its own. The current `CarouselRail` renders one fixed
message with a static progress-bar graphic; nothing rotates and nothing is
time-driven. This matches a requirement already discussed directly with the designer
in this project (five-second auto-advance, a filling progress bar, pause on hover) —
this note is independent confirmation from the file itself, not a new requirement.

**#4 — hero video (gap, and it resolves an open question).** Two things line up
here. First, it's explicit that the video should differ between the two audience
variants ("Videos can be different for Developer and Content editor versions of the
page") — today there is exactly one dashboard screenshot, shared regardless of which
segmented-control tab is active, so once the toggle in #1 is wired up, this section
needs its own audience-conditioned asset too. Second, the note offers a placeholder
plan ("I can record if needed") and a reference for tone/format — an example screen
from the Tokens Studio landing page — which is worth opening before building a
placeholder from scratch.

**#8 — bento grid (confirms scope, not a gap).** Implementation already matches; the
useful new fact is the second sentence — the designer states this grid's content is
identical for both audiences. That means the upcoming content-editors work (#1) does
not need to touch the bento grid section at all, which narrows that task.

**#5 and #7 — code-snippet placeholders (already tracked, not re-opened here).**
Both notes are the designer flagging that the mockup inside that feature card is a
stand-in and the real code example still needs to be supplied. This is the same gap
`QUESTIONS-DESIGNER.md` already raises in its designer-list question 2 (which mockup
becomes a Lottie file, a static image, or real HTML) — nothing here narrows that
question further, so it stays open there rather than being duplicated in two places.

**#2 and #6 — already correct.** Both notes describe exactly what this codebase
already builds (the Astro badge, and the three pinned feature cards); no action
needed.

## Not investigated here

This pass is documentation only — none of the gaps above were implemented as part of
producing this file. In particular:

- The segmented control's interactivity and the content-editors text/image model
  (#1) is a substantial feature (real state, a per-audience content model pulled from
  the `Homepage - Content editors` frame, and every section that varies by audience
  wired to it) — out of scope for a documentation pass.
- The audience-conditioned hero video (#4) needs an actual second video asset (or a
  placeholder) before there's anything to wire up.
