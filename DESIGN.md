# Design system

The values a designer or developer needs to reason about the page, and how they
reach the browser. The authoritative machine-readable copy is
[`tokens/tokens.json`](tokens/tokens.json); this document explains it.

Everything here was read off the Figma frame during the build — the full
extraction, including per-section layout, lives in
[`docs/figma/DESIGN-SPEC.md`](docs/figma/DESIGN-SPEC.md).

## The token pipeline

```
tokens/tokens.json  ──`bun run tokens`──▶  src/tokens.generated.css  ──▶  Tailwind
   (source of truth)                          (build artifact)
```

- **Change a colour, font or the radius**: edit `tokens/tokens.json`, then run
  `bun run tokens`. Both `bun run dev` and `bun run build` run it first, so a
  normal workflow never needs the command on its own.
- **`src/tokens.generated.css` is not committed.** It is a build artifact and is
  listed in `.gitignore`. Editing it directly is pointless — the next build
  overwrites it.
- The generator is [`scripts/build-tokens.ts`](scripts/build-tokens.ts). It uses
  [Style Dictionary](https://styledictionary.com) to parse and validate the
  token file, then serialises the CSS itself so the output keeps the exact block
  structure Tailwind expects.

### Why this format

`tokens/tokens.json` follows the [W3C Design Tokens Community Group
format](https://www.designtokens.org/tr/drafts/format/), which reached its first
stable version (2025.10) in October 2025. Figma, Style Dictionary, Terrazzo,
Tokens Studio, Penpot and Sketch all read it, so tokens can move between the
design file and the codebase instead of being retyped.

Two details of that spec are easy to get wrong:

- A colour `$value` is an **object**, not a hex string:
  `{ "colorSpace": "srgb", "components": [0.96, 0.96, 0.94], "hex": "#f5f6ef" }`.
  Hex strings were valid in earlier drafts and are not valid now. The `hex`
  field is an optional fallback, not the value.
- The semantic scheme is stored in `srgb` with the hex the colour carries in the
  Figma frame, so every role token is traceable to a fill that exists in the
  design. It previously held `oklch` values inherited from the shadcn starter,
  which were pure-neutral greys unrelated to this palette. Two entries are the
  exception and stay `oklch`: the dark scheme's `border` and `input` are
  translucent white, and the generator only honours `alpha` on `oklch` — its
  `srgb` branch returns a plain hex and would drop the transparency silently.

### What is emitted, and what is only recorded

The generator emits **only** the tokens this project actually declares: the sand
palette, the two font families, the light and dark semantic scheme, and the
radius base.

`color.lime`, `color.stone`, `color.cursor` and the `layout` group are recorded
in the token file as the design system's reference values but deliberately not
emitted. Lime and stone are exact matches for Tailwind's own scales — emitting
them would shadow Tailwind's defaults for no benefit.

### Known wart

Tailwind v4 scans project files for class-name candidates. The entry stylesheet
it is compiling is exempt, but a stylesheet reached through `@import` is not, so
Tailwind reads some of the generated semantic custom-property names as utility
candidates and emits one unused rule into the bundle (`accent-color` keyed off
the foreground token, roughly 50 bytes). No element carries that class, so there
is no visual effect.

Three things were tried and none suppressed it: `@source not` pointed at the
file, `@source not` as a glob, and moving the file out of `src/`. Adding it to
`.gitignore` did not suppress it either — it is ignored because it is a build
artifact, not as a workaround. Documented rather than papered over; the cost is
50 bytes of dead CSS.

## Colour

### Sand — the custom family

The warm off-white cast on bento cards and mockups. Not a Tailwind scale, which
is exactly why it has to exist as a token.

| Token            | Hex       |                                        |
| ---------------- | --------- | -------------------------------------- |
| `color.sand.50`  | `#f8f8f5` |                                        |
| `color.sand.100` | `#f6f7f1` |                                        |
| `color.sand.200` | `#f5f6ef` | the dominant one, 50 uses in the frame |
| `color.sand.300` | `#f5f4ee` |                                        |
| `color.sand.400` | `#eaecdb` |                                        |
| `color.sand.500` | `#d6dbbd` |                                        |
| `color.sand.600` | `#d5dabc` | 27 uses                                |
| `color.sand.700` | `#9fab70` |                                        |
| `color.sand.800` | `#4f5833` |                                        |
| `color.sand.900` | `#40472d` |                                        |
| `color.sand.950` | `#1c2013` |                                        |

### Lime — the brand accent

Matches Tailwind `lime` exactly. Reference only; use the Tailwind utilities.

| Hex       | Tailwind   | Used for                                                                       |
| --------- | ---------- | ------------------------------------------------------------------------------ |
| `#9AE600` | `lime-400` | the accent proper: the Pro card border and badge, the in-mockup call to action |
| `#7CCF00` | `lime-500` | JSON glyph, inline emphasis                                                    |
| `#BBF451` | `lime-300` | mockup strokes                                                                 |
| `#ECFCCA` | `lime-100` | tint fills                                                                     |
| `#F7FEE7` | `lime-50`  | Astro badge background                                                         |
| `#5EA500` | `lime-600` | Astro badge text and glow                                                      |
| `#497D00` | `lime-700` | dark lime text                                                                 |

### Neutrals

Matches Tailwind `stone` exactly. Reference only.

| Hex       | Tailwind    | Used for                              |
| --------- | ----------- | ------------------------------------- |
| `#FFFFFF` | `white`     | card surfaces, light text             |
| `#FAFAF9` | `stone-50`  | text and icons on dark                |
| `#F5F5F4` | `stone-100` | segmented-control track, card borders |
| `#E7E5E4` | `stone-200` | button borders, carousel track        |
| `#A8A29E` | `stone-400` | line numbers, disabled icons          |
| `#78716C` | `stone-500` | muted text, inactive tab labels       |
| `#44403C` | `stone-700` | hero carousel body copy               |
| `#292524` | `stone-800` | primary button fill, footer bar       |
| `#1C1917` | `stone-900` | primary text, logo, icons             |

### Collaborator colours

Identity colours for the named cursors inside the product mockups: Niko
`#F24835`, Mariam `#A259FE`, Danny `#FBBF24`, Kyle `#00BFFF`. Kyle's is a raw
CSS keyword rather than a scale value — flagged for the designer in
[`docs/QUESTIONS-DESIGNER.md`](docs/QUESTIONS-DESIGNER.md).

### Semantic scheme

`--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border` and
the rest are the shadcn/ui role tokens, defined for both light and dark under
`scheme.light` and `scheme.dark`. Components should reference these roles rather
than a raw palette value, so a theme change lands in one place.

Every role resolves to a colour counted in the Figma frame:

| Role                                                     | Light     | Dark                  | Where it comes from                  |
| -------------------------------------------------------- | --------- | --------------------- | ------------------------------------ |
| `background` / `card` / `popover`                        | `#ffffff` | `#1c1917` / `#292524` | page and card surfaces               |
| `foreground`, and `*-foreground` on a light surface      | `#1c1917` | `#fafaf9`             | primary text, and text on dark       |
| `primary-foreground` (it inverts — it sits on `primary`) | `#fafaf9` | `#1c1917`             | the label on the dark button         |
| `primary`                                                | `#292524` | `#fafaf9`             | the `Get Started` button fill        |
| `secondary` / `muted` / `accent`                         | `#f5f5f4` | `#44403c`             | segmented-control track              |
| `muted-foreground`                                       | `#78716c` | `#a8a29e`             | muted text, inactive tab labels      |
| `border` / `input`                                       | `#e7e5e4` | white at 10% / 15%    | button borders, carousel track       |
| `destructive`                                            | `#fe3434` | `#fe3434`             | removed-line text in the diff mockup |
| `ring`                                                   | `#9ae600` | `#9ae600`             | the lime brand accent                |

Three of these are judgement calls rather than readings, because the design does
not specify them, and all three are queued for the designer:

- **The focus `ring`**, given the brand lime for want of any drawn focus state.
- **`destructive`.** `#fe3434` is the only red in the file, and it is content
  inside a product screenshot — the removed-line colour of a diff — not a UI
  role the page itself uses. It is also thin for text: on white it measures
  about 3.65:1, under the 4.5:1 WCAG AA needs for normal text. Only `button`
  and `badge` reference it, both solely through their `destructive` variant and
  an `aria-invalid` state; the page uses neither, and the form components that
  would otherwise reach it through validation — `input`, `textarea`, `select`,
  `form`, `alert` — are not in `src/components/ui` at all. So this is a latent
  trap rather than a live defect. **Adding any form to this page makes it
  live**, and it wants a real error colour from the designer rather than one
  invented here.
- **The whole dark scheme**, mirrored from the dark product mockup in the hero
  because no dark theme was designed. `.dark` is never applied, so none of it
  ships; it exists so the shadcn primitives' `dark:` variants resolve. Its
  `border`/`input` deliberately stay translucent white rather than a stone
  step: a solid value equal to `muted` would erase the border on any muted
  surface, and translucency composites correctly over all of them.

**Known gap: the role values are literals, not aliases.** Most of the hexes
above also exist in the `color.stone` / `color.lime` palette, and DTCG can
express the relationship — `"$value": "{color.stone.800}"`. The generator
rejects aliases rather than resolving them, so the roles repeat the literal
instead. The cost is real: nudge the brand lime in the palette and `ring`
silently keeps the old value, because the link lives only in this table.
The fix is to teach the generator to resolve `{…}` references and then rewrite
the roles as aliases — which also needs two new palette entries first, since
`#ffffff` and the `destructive` red belong to no scale yet.

`chart-1`–`chart-5` and the `sidebar-*` family came from the shadcn starter.
This is a marketing page with neither charts nor a sidebar. `src/components/ui`
holds only `badge`, `button`, `segmented-control` and `sheet` — shadcn's
`chart.tsx` and `sidebar.tsx`, which are what would consume those variables,
were never added — and a search for `bg-sidebar*` / `chart-[1-5]` utilities
across `src/` returns nothing. Leaving them in meant anyone inspecting the
running site saw a dozen variables with nothing to do with Conloca, so they are
gone.

## Typography

One family does almost everything. Inter v4 exposes its Display cut through the
`opsz` axis, so "Inter Display" in the design file is the same font at a high
optical size — the `.font-display` utility in `src/index.css`, not a second
family. Roboto Mono covers code.

Both are freely licensable (Inter under the SIL Open Font License, Roboto Mono
under Apache 2.0), so there is no licensing question to resolve.

| Role                | Family        | Weight | Size / line-height |
| ------------------- | ------------- | ------ | ------------------ |
| Statement headline  | Inter Display | 900    | 72 / 72            |
| H1, H2              | Inter Display | 700    | 48 / 48            |
| Price               | Inter         | 900    | 32 / 48            |
| Plan name           | Inter         | 500    | 24 / 36            |
| Bento card title    | Inter         | 700    | 20 / 30            |
| Bento card body     | Inter         | 400    | 20 / 30            |
| Body, feature list  | Inter         | 500    | 16 / 27.2          |
| Card body copy      | Inter         | 400    | 16 / 27.2          |
| Nav link            | Inter         | 400    | 16 / 19.36         |
| Button label        | Inter         | 500    | 14 / 14            |
| Eyebrow (uppercase) | Inter         | 700    | 12 / 20.4          |
| Code, filename      | Roboto Mono   | 400    | 16 / 21.1          |

Line-heights are pixel values, not ratios: headings sit at 1.0, body at 1.7.
Letter-spacing is `0` everywhere except collaborator name chips (`0.14`).

## Geometry

|                         | Value                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| Content max width       | 1376 px (1440 frame minus 32 px page padding each side)                             |
| Page horizontal padding | 32 px                                                                               |
| Radius base             | `0.625rem` — the shadcn scale derives `sm`/`md`/`lg`/`xl`/`2xl`/`3xl`/`4xl` from it |
| Bento card radius       | 32 px                                                                               |
| Feature card            | radius 28 — except the pinned S1 slide (see below); padding 24                      |
| Button                  | radius 8, padding 10, gap 6                                                         |
| Badge / pill radius     | 12 px                                                                               |

Breakpoints follow the four frames drawn in Figma: below 640, 640–1023,
1024–1279, and 1280 and up.

**S1 (the three pinned feature cards) is a deliberate exception at 1024px and
up, once pinned**: per designer request, the card surface fills the viewport
edge to edge — no radius, no border — rather than the 1424×814/radius-28
dimensions above. Its content still has a max width, just a different one
(1344px). The reduced-motion/no-JS/prerender fallback keeps the dimensions
above unchanged even at 1024px and up. See the note at the top of the S1
section in `docs/figma/DESIGN-SPEC.md`.

## Motion

The animation rules are load-bearing for accessibility and for search crawlers,
so they live with the engineering guide rather than here — see the **Animation
rules** section of [`AGENTS.md`](AGENTS.md). In short: the prerendered HTML must
contain every piece of content, visible; entrance animations are gated on
JavaScript having run; and `prefers-reduced-motion` disables them entirely.

The most prominent effect on the page is the pinned card stack in the
three-features section, driven by scroll position
(`src/components/motion/ScrollStack.tsx`), matching the `Scrolling` group the
designer left in the Figma file.

## Checking a change against the design

A pixel-comparison tool, `scripts/visual-diff.ts`, takes a Figma reference and a
screenshot of the built page and writes a highlighted diff image. It arrives in
a separate change; check `package.json` for the script alias once that has
merged.

Reference renders of all four breakpoints were captured during the build. Read
the diff image rather than the mismatch percentage: several decorative images
were never exported from Figma, so those regions differ by design and dominate
the number.
