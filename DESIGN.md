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
- The semantic scheme is stored in `oklch`, matching what the stylesheet already
  shipped. Converting it to sRGB would round the values and change rendering.

### What is emitted, and what is only recorded

The generator emits **only** the tokens this project actually declares: the sand
palette, the two font families, the light and dark semantic scheme, and the
radius base.

`color.lime`, `color.stone`, `color.cursor` and the `layout` group are recorded
in the token file as the design system's reference values but deliberately not
emitted. Lime and stone are exact matches for Tailwind's own scales — emitting
them would shadow Tailwind's defaults for no benefit.

### Known wart

Tailwind v4 scans project files for class-name candidates. Because the generated
stylesheet contains semantic custom-property names, Tailwind reads some of them
as utility candidates and emits one unused rule into the bundle
(`accent-color` keyed off the foreground token, roughly 50 bytes). No element
carries that class, so there is no visual effect. `@source not` does not exclude
it; ignoring the file in git does not either. Documented rather than papered
over.

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
| Feature card            | radius 28, padding 24                                                               |
| Button                  | radius 8, padding 10, gap 6                                                         |
| Badge / pill radius     | 12 px                                                                               |

Breakpoints follow the four frames drawn in Figma: below 640, 640–1023,
1024–1279, and 1280 and up.

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
