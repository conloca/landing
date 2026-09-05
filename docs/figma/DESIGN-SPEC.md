# Conloca landing — build spec (from Figma)

Source file: `Conloca` — key `OxxksZFS8hzKoFTeSRdFGs`, last modified 2026-08-25T12:11:13Z.
Extracted from the REST API node tree plus rendered PNGs of all four breakpoints.

**What Conloca is** (needed to write correct markup): a Git-native headless CMS for Astro
sites. Content lives as MDX/JSON files in the customer's repository; developers work in the
IDE, non-technical editors work in a visual editor, and both write to the same files. Selling
points: Git history, pull-request review, and localisation.

---

## 1. Frames and breakpoints

The target node in the shared URL (`40002391-9972`) is not a single frame — it is a **section
containing four breakpoint frames**. All four are the "Developers" variant of the page:

| Frame                               | Node id          | Width | Height | Role                         |
| ----------------------------------- | ---------------- | ----- | ------ | ---------------------------- |
| Homepage - Developers - >1280       | `40002427:16387` | 1440  | 6459.6 | Desktop, the reference frame |
| Homepage - Developers - 1280 / 1024 | `40002426:4064`  | 1024  | 7976.9 | Tablet                       |
| Homepage - Developers - 1024 / 640  | `40002427:20368` | 640   | 8757.3 | Large phone / small tablet   |
| Homepage - Developers - <640        | `40002441:868`   | 393   | 8310.6 | Phone                        |

Reading the frame names as breakpoint ranges gives Tailwind-compatible boundaries:

- `< 640` → phone layout
- `640 – 1023` → the 640 frame
- `1024 – 1279` → the 1024 frame
- `≥ 1280` → the 1440 frame

The 1440 frame is a canvas width, not a max width. Content is capped at **1376 px** (1440 minus
32 px of horizontal page padding), which is the real container width.

**A second page variant exists that we were not asked to build.** Section
`Conloca - Homepage` (`40002207:12482`) holds `Homepage - Developers` **and**
`Homepage - Content editors` — two full page variants for the two audiences. Only the
Developers variant has breakpoints drawn. See question 1 in the designer list.

**A third section, `Conloca - Animations` (`40002448:4665`), specifies motion.** Its frame
`40002450:2700` contains a group literally named **`Scrolling`** (1424×3460) that stacks the
hero and the three feature cards, with the site header pulled out as a sibling. This is the
designer's notation for a scroll-driven, pinned/stacking treatment of that block. It is the
single most important animation signal in the file and is not derivable from the static frames.

---

## 2. Page structure — desktop (1440)

Six top-level sections, vertical flow.

### S0 — Header + hero (`40002427:16388`, 1440×960)

**Header** (`conloca-header` instance, 1440×82, padding 24/32): inner bar 1376×34,
`SPACE_BETWEEN`.

- Left: `conloca-logo` 117×28, wordmark + glyph, fill `#1C1917`.
- Right group (gap 31, centred): text links `How it works`, `Docs`, `Pricing`, `Blog`
  (Inter 400 16/19.36, `#1C1917`), then a button pair with gap 8:
  - `Try Demo` — white fill, 1 px `#E7E5E4` border, radius 8, padding 10, text Inter 500 14.
  - `Get Started` — fill `#292524`, same border colour as fill, radius 8, text `#FAFAF9`.
  - Both buttons carry a 14×14 leading **and** trailing icon slot.

**Hero** (`Hero section`, 1440×878, horizontal padding 32). Inner `Main container` 1376×878 is a
Figma **grid, 1 row × 8 columns**, holding two children:

- `Text content` — 506 wide, full height, vertical, gap 32, padding 60 top / 60 bottom.
  - `conloca-segmented-control` 275×43, fill `#F5F5F4`, radius 14, padding 2. Two tabs:
    `Developers` (active — white fill, radius 12, drop shadow 4) and `Content editors`
    (inactive, label `#78716C`). Labels Inter Variable 500 16/27.2.
  - H1 `Keep content in your repo. Give editors a visual editing interface` —
    **Inter Display 700, 48 px, line-height 48 px**, `#1C1917`, box 432×192.
  - Astro badge 162×33, fill `#F7FEE7`, radius 12, padding 8. Contains an Astro glyph and the
    label `Built for astro` in Inter 700 14/16.94 **uppercased**, `#5EA500`. Behind the glyph
    sits a 20×20 ellipse `#5EA500` with a **34 px layer blur** — a glow, not a shape.
  - Between the badge and the carousel there is deliberate empty space: the upper group is
    587 px tall but only ~316 px of content. See question 6.
  - `Text carousel and CTA group`, gap 24:
    - `Text carousel` (horizontal, gap 16): a 2 px wide vertical progress rail of three
      `conloca-carousel-progress` bars, track `#E7E5E4`, fill `#A8A29E`, radius 1000 — the
      first is partly filled. Beside it, 432×81 of body copy, Inter 700 16/27.2, `#44403C`:
      _"Map your React components to typed schemas and MDS blocks in the IDE. Visual edits
      respect the structure you define and stay in Git."_
      Three bars implies **three rotating slides; only one slide's copy exists.** Question 5.
    - `CTA Buttons` gap 12: `Get started` (dark) and `Try Demo` (white).
- `Visual content` — 854×878, absolutely positioned children (no auto-layout).
  - `Video container` 800×838, radius 28, three stacked **image fills** (a soft blurred
    gradient photo backdrop).
  - `Video frame` 932×782 — **wider than its parent, so it is clipped on the right**. Radius
    20 on the left corners only, 0 on the right, confirming the crop is intentional. Three
    stacked drop shadows (blur 6, 16, 64). Its fill is an image: a screenshot of the Conloca
    dashboard, rotated/skewed slightly.
  - `Play button` 57×57, fill `#000000` at 20 % opacity, radius 1000, 25×25 play glyph
    `#FAFAF9`. So the hero visual is **a video with a play affordance**, not a static image.
  - A small inset thumbnail (a person at a desk) sits bottom-left of the dashboard frame —
    picture-in-picture, part of the same image fill.

### S1 — Three feature cards (`40002427:16418`, 1440×2538)

Wrapper: vertical, gap 8, padding 72 top / 8 sides / 8 bottom.

Every card: **1424×814, radius 28, padding 24, 1 px `#F5F5F4` border, an image fill (blurred
abstract photo) plus a `#000000` 20 % overlay.** All text on the cards is therefore light.
Each card repeats the `Developers / Content editors` segmented control at top-left, here with a
translucent track (`#F5F5F4` at 10 %) and the inactive label in `#FAFAF9`.

Card body is `Content` 1374×721.

**Card 1 — "One source of truth, two ways to work"** (text left, visual right)

- `Text container` 440 wide, vertical, gap 24, aligned to the **bottom** (`primaryAxis: MAX`).
  - H2 Inter Display 700 48/48, `#FAFAF9`.
  - Body Inter 400 16/27.2, `#FFFFFF`: _"Developers work in the IDE. Editors work visually.
    Every change goes back to the same MDX files in Git."_
  - Buttons: `Get started` (dark) + `Read docs` (white).
- `Visual container` 860×721 holding a frame named **`Lootie animation` 1095×831** — larger
  than its container, so clipped. It is composed of two mockups:
  - A JSON editor card 418×542: title bar `hero-section.vx.json` (Roboto Mono 400 16) with a
    lime `{ }` glyph `#7CCF00`; body is a syntax-coloured schema snippet; a red collaborator
    cursor labelled **`Niko`** (`#F24835`).
  - A visual-editor card 743×697, radius 24, white, three stacked shadows: a toolbar with a
    device segmented control (monitor / tablet / phone icons), undo/redo, and a dark `Publish`
    button; below it a rendered landing block with the lime `Open source` eyebrow, headline
    _"Turn text to video in minutes"_, body copy, and a lime `#9AE600` CTA chip
    _"Create a free AI video"_; a floating vertical toolbar (reorder / delete / more); a
    purple collaborator cursor labelled **`Mariam`** (`#A259FE`).
  - **This is a second Lottie animation that we have not been given.** See question 2.

**Card 2 — "Localization without manual syncing"** (visual left, text right)

- `Visual container` 687×721 (left) contains `Group 38`, **801×1334** — it overflows the
  container by 278 px above and 335 px below and 133 px to the right, and is clipped to the
  container box. **This is the `Banner 2 animation.lottie` we were given** (its canvas is
  849×1334; the extra ~48 px is blur bleed).
  - Content: a `Locales` panel — `English (en) · Source`, `Deutsch (de) · 1 Change`,
    `Français (fr) · 2 Changes`, `Español (en) · Up to date`, `日本語 (ja) · Up to date`,
    footer _"2 locales need updates"_ with a `Review` button, header action `+ New locale`.
    A cyan collaborator cursor labelled **`Kyle`** (`#00BFFF`).
  - Behind it, a dimmed column of skeleton content cards; two of them carry amber `#FBBF24`
    ellipses with a **114 px layer blur** as highlight glows.
- `Text container` 687 wide (right), vertical, gap 24, bottom-aligned.
  - H2 `Localization without manual syncing`, Inter Display 700 48/48.
  - Body: _"Update the source structure once. Each locale follows the same versioned structure.
    When content changes, Conloca flags the locales that need updating."_
  - Buttons `Get started` + `Read docs`.

**Card 3 — "Review, merge, and revert content in Git"** (visual on top, text below)

- `Content` switches to **vertical, `SPACE_BETWEEN`**.
- `Visual container` 1374×625: a pull-request diff card — file `homepage.vx.json`, `+1` / `-1`
  chips, hunk header `@@ -39,10 +39 @@`, a removed line `"label": "Get started"` on
  `#FFDBDB` with `#FE3434` text and an added line `"label": "Create account"` on `#EBF8D9`;
  an amber cursor labelled **`Danny`**; a footer row with avatar, `Chris · 4h ago`,
  _"Translated CTA text"_, and a dark `Merge pull request` button.
- `Text container` 1374×96 becomes **horizontal**, gap 24, bottom-aligned: H2 on the left,
  body copy in the middle, the two buttons pushed right.

### S2 — Statement (`40002427:16760`, 1440×667)

Horizontal, centred, padding **196 top and bottom**, 32 sides. Plain white background.

Two-line headline, **Inter Display 900, 72 px, line-height 72 px**, centred:

- line 1 `Everything you need` — `#1C1917`
- line 2 `nothing you don't` — lime `#9AE600`

Four small elements float around the headline, each rotated a few degrees, overlapping the
text: a white pill _"changes published"_ with a lime status dot; a red Git glyph tile
(`#F03C2E`); a purple Astro glyph tile (`#BC52EE`); a white pill _"homepage-eng.vx.json"_ with
a file icon. Pills are Inter 500 14/16.94. This section is the strongest candidate for a
scroll-parallax treatment — see question 12.

### S3 — Feature bento grid (`40002427:16814`, 1440×1004)

Figma **grid, 3 rows × 4 columns**, horizontal padding 32, card radius 32. Seven cards, all on
a near-white sand tint (`#F5F6EF` / `#F6F7F1`) with a subtle noise effect:

| Card | Title                        | Body                                                                     | Span                  |
| ---- | ---------------------------- | ------------------------------------------------------------------------ | --------------------- |
| 1    | Sceduled Publishing _(typo)_ | Set a date and time for content to go live automatically                 | 2 cols × 2 rows, left |
| 2    | Git-native workflow          | Every change is a commit. Branch, preview, and merge                     | 2 cols, top right     |
| 3    | Type content in Markdown     | Just type the page contents in Makrdown. Conloca will render it _(typo)_ | 2 cols, right         |
| 4    | Media library                | Upload assets once and reference them anywhere                           | 1 col, bottom         |
| 5    | Data collections             | Model and reuse structured data collections                              | 1 col, bottom         |
| 6    | Reusable fragments           | Define and reuse larger content as fragments                             | 1 col, bottom         |
| 7    | Full version history         | Build a block once, reuse it across every page                           | 1 col, bottom         |

Card titles Inter 700 20/30, bodies Inter 400 20/30 in `#78716C`. Each card holds a bespoke
illustration (a scheduling UI with a `Publish` button and an avatar ring; a branch diagram in
lime; overlapping Markdown/preview cards; stacked `.PNG/.JPEG/.GIF/.MP4` file tiles; a data
table; a drag-and-drop fragment outline; a version-history timeline with
_"Edited homepage.mdx · 2m ago"_).

Note card 7's body text ("Build a block once, reuse it across every page") describes reusable
fragments, not version history — the copy for cards 6 and 7 looks swapped. Question 16.

### S4 — Pricing (`40002427:17148`, 1440×1199)

Vertical, gap 48, padding 196 top / 96 bottom / 32 sides.

Header row: H2 `Choose a plan that fits you the best` (Inter Display 700 48/48) on the left; a
`Monthly / Annual` segmented control on the right, `Monthly` active.

Three cards, 1376 wide total, gap 12. Each card splits into a **white upper block** (radius,
white fill) and a **tinted lower feature list** that visually extends below it:

|        | Simple                                            | Pro                                           | Business                                          |
| ------ | ------------------------------------------------- | --------------------------------------------- | ------------------------------------------------- |
| Price  | `$8` / Month                                      | `$15` / Month                                 | `$200` / Month                                    |
| Pitch  | For small teams getting their site off the ground | For growing teams shipping content more often | For larger teams managing sites, brands & markets |
| CTA    | `Choose simple` (outline)                         | `Choose pro` (dark fill)                      | `Choose business` (outline)                       |
| Badge  | —                                                 | `Best value`, lime `#9AE600` pill             | —                                                 |
| Border | none                                              | lime `#9AE600`, card lifted                   | none                                              |

Feature lists (Inter 500 16/27.2, each row a check glyph + label):

- **Simple**: 3 seats included ($5 per additional seat) · 5 seats max · 1 repository ·
  1GB repository storage · 1GB media storage
- **Pro**: 10 seats included ($7 per additional seat) · 20 seats max · Unlimited repositories ·
  20GB repository storage · 100GB media storage · Choose data residency (US/EU) ·
  Basic access control · Support
- **Business**: 30 seats included ($10 per additional seat) · No seat limit ·
  Unlimited repositories · 30GB repository storage · 1TB media storage ·
  Choose data residency (US/EU) · Advanced access control and Audit trail · Priority support

Below the cards, centred: a `Compare plans` button (Inter 500 14).

Price numerals are Inter 900 32/48; the `/ Month` suffix Inter 400 16/24; plan names Inter 500
24/36.

### S5 — Footer (`40002427:17255`, 1440×92)

A single dark bar, padding 8, radius (rounded, matching the card language). Logo left in
`#FAFAF9`; on the right the links `How it works`, `Docs`, `Pricing`, `Blog`, `Open source` and
a white `Get started` button (Inter 500 12).

**There is no full footer** — no legal links, no copyright, no social, no company details.
Question 17.

---

## 3. Responsive behaviour

Read from the rendered frames (the node trees for the three narrow frames could not be fetched
— see "Gaps" below — so these are observations from the renders, which are reliable for layout
intent but not for exact pixel values).

**≥ 1280 (1440 frame)** — the reference layout described above.

**1024** — same structural layout as desktop: white hero, text left / visual right, full text
navigation, segmented control present. The hero visual **bleeds off the right edge of the
viewport** rather than shrinking. Feature cards keep the side-by-side arrangement with the
visual clipped harder.

**640** — a real breakpoint change, not just narrowing:

- The header collapses to logo + `Try Demo` + `Get Started` + a **hamburger**. The text links
  disappear.
- The hero inverts: it becomes a **dark, full-bleed rounded card** carrying the blurred
  gradient image, with white text, centred. The Astro badge moves **above** the headline. The
  CTA pair is centred. The video mockup sits below the text rather than beside it.
- **The `Developers / Content editors` segmented control is gone entirely.** Question 3.
- The carousel progress rail rotates from a vertical bar stack to **horizontal dashes** under
  centred body copy.
- Feature cards stack: heading, body, buttons, then the visual below.

**393** — as 640, tightened: the header drops `Try Demo`, keeping logo + `Get Started` +
hamburger. Bento grid becomes a single column. Pricing cards stack, and `Compare plans` moves
up beside the `Monthly / Annual` toggle.

---

## 4. Design tokens

### Colour

Counted from every fill, stroke, gradient stop and shadow in the desktop frame. The palette is
**Tailwind `stone` for neutrals, `lime` for the accent, plus a custom warm off-white "sand"
family that is not in Tailwind**.

**Neutrals — exact Tailwind `stone` matches, no divergence:**

| Hex       | Uses | Tailwind    | Role                                        |
| --------- | ---- | ----------- | ------------------------------------------- |
| `#FFFFFF` | 136  | `white`     | card surfaces, light text                   |
| `#1C1917` | 96   | `stone-900` | primary text, logo, icons                   |
| `#FAFAF9` | 62   | `stone-50`  | text on dark, icons on dark                 |
| `#78716C` | 57   | `stone-500` | muted text, inactive tab labels             |
| `#A8A29E` | 37   | `stone-400` | line numbers, carousel fill, disabled icons |
| `#F5F5F4` | 27   | `stone-100` | segmented-control track, card borders       |
| `#E7E5E4` | 21   | `stone-200` | button borders, carousel track              |
| `#292524` | 21   | `stone-800` | primary button fill, footer bar             |
| `#44403C` | 18   | `stone-700` | hero carousel body copy                     |

**Lime accent — exact Tailwind `lime` matches:**

| Hex       | Tailwind   | Role                                                                            |
| --------- | ---------- | ------------------------------------------------------------------------------- |
| `#9AE600` | `lime-400` | the brand accent: "nothing you don't", Pro card border and badge, in-mockup CTA |
| `#7CCF00` | `lime-500` | JSON glyph, inline emphasis                                                     |
| `#BBF451` | `lime-300` | mockup strokes                                                                  |
| `#ECFCCA` | `lime-100` | tint fills                                                                      |
| `#F7FEE7` | `lime-50`  | Astro badge background                                                          |
| `#5EA500` | `lime-600` | Astro badge text and glow                                                       |
| `#497D00` | `lime-700` | dark lime text                                                                  |

**Custom "sand / olive" family — NOT Tailwind, needs its own tokens.** This is the tint that
gives the bento cards and mockups their warm cast:

`#F5F6EF` (50 uses, the dominant one) · `#F6F7F1` · `#F8F8F5` · `#F5F4EE` · `#EAECDB` ·
`#D6DBBD` · `#D5DABC` (27 uses) · `#9FAB70` · `#4F5833` · `#40472D` · `#1C2013`

**Collaborator cursor colours** — one per named person, used as identity colours:

| Hex                     | Person | Note                                                |
| ----------------------- | ------ | --------------------------------------------------- |
| `#F24835`               | Niko   | red                                                 |
| `#A259FE`               | Mariam | purple                                              |
| `#FBBF24` (`amber-400`) | Danny  | amber                                               |
| `#00BFFF`               | Kyle   | deepskyblue, a raw CSS keyword colour — question 10 |

**Semantic / diff:** `#FFDBDB` removed-line background, `#FE3434` removed-line text,
`#EBF8D9` added-line background. Third-party brand: `#F03C2E` Git, `#BC52EE` Astro.

**Shadows:** the standard shadow colour is `#101828` (28 uses) at low opacity, with `#000000`
and `#0C0C0D` also present. Elevated cards use a **three-shadow stack at blur 6 / 16 / 64**.

**Relationship to the Lottie's palette:** the animation uses stone + amber. The landing is
stone + **lime**. Amber appears on the landing only as the highlight glow inside that same
animation and as Danny's cursor. So the two agree on neutrals but the page accent is lime, and
the amber in the banner is a local highlight, not a brand colour.

### Typography

Four families, all freely licensable — no licensing problem:

| Family             | Licence                         | Used for                                       |
| ------------------ | ------------------------------- | ---------------------------------------------- |
| **Inter**          | SIL Open Font License           | all body, UI, labels, buttons                  |
| **Inter Display**  | same family, `opsz` display cut | every H1/H2 and the statement headline         |
| **Inter Variable** | the variable build of Inter     | segmented-control labels only                  |
| **Roboto Mono**    | Apache 2.0                      | file names, code snippets, diffs, line numbers |

`Inter`, `Inter Display` and `Inter Variable` are three names for one family. Inter v4 exposes
Display through the `opsz` axis, so a single variable font file can serve all three — but the
design treats them as separate styles, and one identical style (500 16/27.2) is drawn with both
`Inter` and `Inter Variable`. Question 9.

**Type ramp** (the styles that actually matter for the page; sizes below ~16 px belong to
mockup interiors, not page chrome):

| Role                | Family        | Weight | Size / line-height      | Colour                                 |
| ------------------- | ------------- | ------ | ----------------------- | -------------------------------------- |
| Statement headline  | Inter Display | 900    | 72 / 72                 | `#1C1917` + `#9AE600`                  |
| H1, H2              | Inter Display | 700    | 48 / 48                 | `#1C1917` on light, `#FAFAF9` on cards |
| Price               | Inter         | 900    | 32 / 48                 | `#1C1917`                              |
| Plan name           | Inter         | 500    | 24 / 36                 | `#1C1917`                              |
| Bento card title    | Inter         | 700    | 20 / 30                 | `#1C1917`                              |
| Bento card body     | Inter         | 400    | 20 / 30                 | `#78716C`                              |
| Body / feature list | Inter         | 500    | 16 / 27.2               | varies                                 |
| Card body copy      | Inter         | 400    | 16 / 27.2               | `#FFFFFF`                              |
| Hero carousel copy  | Inter         | 700    | 16 / 27.2               | `#44403C`                              |
| Nav link            | Inter         | 400    | 16 / 19.36              | `#1C1917`                              |
| Button label        | Inter         | 500    | 14 / 14                 | `#FAFAF9` / `#1C1917`                  |
| Eyebrow (uppercase) | Inter         | 700    | 12 / 20.4 or 14 / 16.94 | `#5EA500`, `#4F5833`                   |
| Code / filename     | Roboto Mono   | 400    | 16 / 21.1               | `#1C1917`                              |

Letter-spacing is `0` everywhere except the collaborator name chips (`0.14`). Line-heights are
pixel values, not ratios: 48/48 is a **1.0** ratio on headings, and 16/27.2 is **1.7** on body.

### Geometry

| Token                    | Value                                                |
| ------------------------ | ---------------------------------------------------- |
| Page horizontal padding  | 32 px (8 px for the feature-card wrapper and footer) |
| Content max width        | 1376 px                                              |
| Feature card             | 1424×814, radius 28, padding 24                      |
| Bento card radius        | 32 px                                                |
| Button radius            | 8 px, padding 10 px, gap 6 px                        |
| Segmented control        | radius 14 outer / 12 inner, padding 2, gap 2         |
| Badge / pill radius      | 12 px                                                |
| Progress bar radius      | 1000 px (full)                                       |
| Card stack gap           | 8 px                                                 |
| Section vertical padding | 196 px top (statement, pricing)                      |
| Elevation                | drop shadows at blur 6, 16 and 64 stacked            |

---

## 5. Component inventory → shadcn/ui

**Maps cleanly onto shadcn:**

| Design element                                                        | shadcn component | Notes                                                                                                                                               |
| --------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Try Demo` / `Get Started` / `Get started` / `Read docs` / `Choose *` | `button`         | needs `default` (dark), `outline` (white + `stone-200` border) and a lime variant for the in-mockup CTA; all support leading **and** trailing icons |
| `Developers / Content editors`, `Monthly / Annual`                    | `tabs`           | styled as a pill segmented control, not shadcn's default underline                                                                                  |
| Pricing cards, bento cards                                            | `card`           | the pricing card's split white-block-over-tinted-list needs custom structure                                                                        |
| `Best value`                                                          | `badge`          | lime fill                                                                                                                                           |
| Mobile hamburger menu                                                 | `sheet`          | contents not designed — question 4                                                                                                                  |
| Collaborator avatars                                                  | `avatar`         | with a lime ring in one bento illustration                                                                                                          |

**Bespoke, hand-built:**

- **Vertical carousel progress rail** — three 2 px bars with a partial fill, rotating to
  horizontal dashes under 640. No shadcn equivalent.
- **Collaborator cursor chip** — pointer glyph plus a rounded name label, four identity colours.
  Appears in three mockups.
- **Statement section with floating rotated chips** — bespoke layout and motion.
- **Bento grid** — a 3×4 CSS grid with two spanning cards.
- **All product mockups** (JSON editor, visual editor, diff view, locales panel, scheduling UI,
  branch diagram, media tiles, version timeline). These are the bulk of the work and the main
  open question: are they images, Lottie animations, or real DOM? Question 2.
- **Hero video player** — image poster plus play button; no player chrome designed.

---

## 6. Where the `Banner 2` Lottie belongs

Confirmed, with coordinates.

- **Placement**: feature card 2, "Localization without manual syncing", inside
  `Content` → `Visual container` (**687×721**, the left half of the card).
- **The animation's own box** is `Group 38`, **801×1334** — a portrait block far taller than
  its container.
- **Overflow**: the group's top edge sits **278 px above** the container's top, its bottom
  **335 px below**, and its right edge **133 px past** the container's right. It is clipped on
  all four sides; only a roughly central 687×721 window is visible, biased slightly upward.
- **Match to the file**: the supplied `Banner 2 animation.lottie` has a 849×1334 canvas and
  contains exactly this artwork — the `Locales` panel, the `Kyle` cursor, and the dimmed
  skeleton-card column behind it. The 849 vs 801 difference is the blurred glow bleeding past
  the group bounds.

**Practical consequence for the build**: the component must render the Lottie at its natural
aspect ratio, anchored so the `Locales` panel lands in the visible window, with
`overflow: hidden` on a 687×721 (fluid) container. Scaling it to _fit_ the container would
shrink the panel to illegibility. On phone the same visual is scaled down and pushed to the
bottom-right of the card, still clipped.

---

## 7. Assets to export

**The raster assets are now exported** into `src/assets/figma/`, with
`src/assets/figma/manifest.json` describing each one. Run `bun run figma:export` to refresh
them; see "Figma asset export" in `AGENTS.md`.

The original extraction failed here with HTTP 429 because it rendered each node individually
through `GET /v1/images`, the most rate-limited endpoint in the API. The export now takes the
image-fill URLs for the whole file in a single request instead, which is why it completes
without hitting the limit at all.

**One correction that matters for implementation:** the hero's product-dashboard panel is a
single screenshot (`hero-panel.webp`), not a composition to rebuild in markup. It already
contains the sidebar, the four stat cards, the full seven-entry activity list, and the video
still. Section 2's description of that panel describes what is _inside the image_.

The vector assets in the table below (logo, glyphs, tiles) are still un-exported — they need
`GET /v1/images?format=svg`, which is a per-node render rather than a fill:

| Asset                                    | Node id                         | Format                                 |
| ---------------------------------------- | ------------------------------- | -------------------------------------- |
| `conloca-logo` (wordmark + mark)         | `40002160:4377`                 | SVG                                    |
| Logo mark alone (`Union`)                | `40002065:1894`                 | SVG                                    |
| Astro badge glyph                        | inside `40002427:16388`         | SVG                                    |
| Git tile, Astro tile (statement section) | inside `40002427:16760`         | SVG                                    |
| Hero video poster + gradient backdrops   | image fills in `40002427:16388` | PNG @2x                                |
| Feature-card background photos (×3)      | image fills in `40002427:16418` | PNG @2x, or replace with CSS gradients |
| Bento illustrations (×7)                 | inside `40002427:16814`         | PNG @1x (MCP), see note below          |

Export command shape (token in `.env` as `FIGMA_PAT`, already git-ignored):

```
curl -H "X-Figma-Token: $FIGMA_PAT" \
  "https://api.figma.com/v1/images/OxxksZFS8hzKoFTeSRdFGs?ids=<NODE_ID>&format=svg"
```

Rate-limit note: the images endpoint is metered by render cost. Batch ids into one request and
avoid re-rendering the tall full-page frames.

**Bento illustrations: resolved via the Figma MCP, not the REST export script above.** The
REST render endpoint was still rate-limited when this ran, but the official `figma` MCP server
(`mcp__figma__get_screenshot`, OAuth-authenticated, no quota hit) renders any node directly. Each
of the seven bento cards (`40002427:16814`'s children) was screenshotted whole via
`get_screenshot(nodeId, fileKey: "OxxksZFS8hzKoFTeSRdFGs", contentsOnly: true)`, then cropped in
post to the region above the card's title background rectangle (`Rectangle 20` in the node
tree, which paints over the illustration to seat the title/body text) — so the crop line matches
what a viewer actually sees rather than an arbitrary trim. Source PNGs were cropped with Pillow
and re-encoded with `cwebp -q 84` per the repo's usual asset pipeline, landing in
`src/assets/figma/bento/`. Re-export by repeating the same `get_screenshot` call per card id (see
`feature-grid/bento-assets.ts` for the current node-id-to-file mapping) if the design changes.

**These are 1x assets, unlike the rest of this repo's pipeline (which deliberately targets 2x —
see "Prefer image fills over per-node renders" in AGENTS.md, and `manifest.json`'s `maxWidth`
values for the concrete precedent).** `get_screenshot`'s `maxDimension`
parameter only caps the longer edge _down_; passing a larger value than the node's own rendered
size (tried at 2000px against a 682px-wide card) did not upscale it — the response's `width`
stayed at the node's native size. This tool has no separate "render at Nx pixel density"
parameter the way the REST `GET /v1/images` endpoint's `scale` query param does. Getting 2x bento
illustrations therefore needs the REST render endpoint once its render-cost quota recovers
(batch all seven ids into one `GET /v1/images?ids=...&scale=2` call), not a re-run of this MCP
export.

The three card background photos are large blurred abstract images. Shipping three full-bleed
photographs at 1424×814 is a real weight cost on a landing page — worth checking whether a CSS
gradient plus noise reproduces them closely enough. Question 14.

---

## 8. What was extracted, and gaps

**Captured** (in this directory):

- `nodes.json` — complete desktop node tree (1.2 MB)
- `frame-desktop1440.png`, `frame-tablet1024.png`, `frame-small640.png`, `frame-mobile393.png`
  — full renders of all four breakpoints
- `sec-s0-hero.png` … `sec-s5-footer.png` — per-section desktop renders
- `slices/`, `tab/`, `sm/`, `mob/` — readable slices of each breakpoint
- `outline.txt` — annotated node tree with layout, fills, effects and text
- `copy.txt` — every string in document order with its type style
- `anim.json` — the Animations section structure
- `file-depth2.json` — all pages and top-level frames

**Gaps, stated plainly:**

1. **Raster assets: resolved.** Exported to `src/assets/figma/` via `bun run figma:export`. The
   bento illustrations (section 3, `40002427:16814`) are resolved too, via the Figma MCP rather
   than that script — see the note in section 7, right after the export command block. The
   remaining vector assets listed in section 7 still need an SVG render pass.
2. **Node trees for the 640 / 1024 / 393 frames were not fetched** (same rate limit).
   Responsive behaviour above is read from the renders: reliable for layout intent, not for
   exact padding values. Re-fetch before implementing those breakpoints precisely.
3. **Figma Variables are unavailable** — `/v1/variables/local` returns 403 `Invalid scope`.
   That endpoint needs an Enterprise plan and a `file_variables:read` scope. The colour and
   type tables above are derived from actual usage in the frame, which is authoritative for
   the build even if it is not the designer's token names.
4. **The `Color tokens - Semantics` page** (`40002164:36164`) was not read — rate-limited.
   Worth fetching later to get the designer's own token naming.
5. **The `Content editors` page variant was not extracted** — out of the requested scope, but
   it exists and is a real deliverable if the segmented control is meant to work.
