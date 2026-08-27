# Colour tokens, as the designer defines them

Extracted from the Figma file's own **Colors** page, frame `Color tokens - Semantics`
(`40002164:36164`). That frame is a generated variables document, self-dated
`Generated: 08/07/2026` and titled *"Variables Documentation - Semantics (Updated)"*,
so it is the designer's authoritative naming rather than our reconstruction.

This matters because the designer reviewed the running site and reported that the
CSS custom properties did not match their Figma variables. The table below is what
they actually use.

The table below is generated, not transcribed. Reproduce or verify it with:

```bash
bun run scripts/figma-color-tokens.ts          # print the table
bun run scripts/figma-color-tokens.ts --check  # fail if this doc has drifted
```

## The naming scheme

Tokens are a three-or-four level dotted path, `color.<group>.<role>.<state>`, and
every leaf resolves to a **Tailwind `stone` step** (or plain white). The designer
is not using a bespoke palette — they are using Tailwind's stone scale, named
Tailwind's way.

Group counts as the document declares them: `bg` 10, `fg` 5, `stroke` 5.

## Semantic tokens

| Designer token | Alias | Value |
| --- | --- | --- |
| `color.bg.surface.initial` | `white` | `#FFFFFF` |
| `color.bg.surface.hovered` | `stone/100` | `#F5F5F4` |
| `color.bg.surface.pressed` | `stone/200` | `#E7E5E4` |
| `color.bg.elevated.initial` | `stone/100` | `#F5F5F4` |
| `color.bg.elevated.hovered` | `stone/200` | `#E7E5E4` |
| `color.bg.elevated.pressed` | `stone/200` | `#E7E5E4` |
| `color.bg.accent.initial` | `stone/800` | `#292524` |
| `color.bg.accent.hovered` | `stone/700` | `#44403C` |
| `color.bg.accent.pressed` | `stone/950` | `#0C0A09` |
| `color.bg.accent.disabled` | `stone/500` | `#78716C` |
| `color.fg.strong.default` | `stone/900` | `#1C1917` |
| `color.fg.strong.inverted` | `stone/50` | `#FAFAF9` |
| `color.fg.soft.default` | `stone/700` | `#44403C` |
| `color.fg.softer.default` | `stone/500` | `#78716C` |
| `color.fg.disabled.default` | `stone/400` | `#A8A29E` |
| `color.stroke.softer` | `stone/50` | `#FAFAF9` |
| `color.stroke.soft` | `stone/100` | `#F5F5F4` |
| `color.stroke.strong` | `stone/200` | `#E7E5E4` |
| `color.stroke.stronger` | `stone/400` | `#A8A29E` |
| `color.stroke.accent` | `stone/800` | `#292524` |

## How our roles line up

There are two different answers here, and conflating them is a trap.

**On `main` today, our values do not match the design at all.** `src/index.css`
still carries the stock shadcn palette — zero-chroma neutrals, untouched since the
component library was installed. This is what the designer saw when they inspected
the running site and reported a mismatch.

| Role | On `main` now | Resolves to | Designer's value | Matches |
| --- | --- | --- | --- | --- |
| `background` | `oklch(1 0 0)` | `#FFFFFF` | `#FFFFFF` (`color.bg.surface.initial`) | yes |
| `foreground` | `oklch(0.145 0 0)` | `#0A0A0A` | `#1C1917` (`color.fg.strong.default`) | no |
| `primary` | `oklch(0.205 0 0)` | `#171717` | `#292524` (`color.bg.accent.initial`) | no |
| `muted-foreground` | `oklch(0.556 0 0)` | `#737373` | `#78716C` (`color.fg.softer.default`) | no |
| `border` / `input` | `oklch(0.922 0 0)` | `#E5E5E5` | `#E7E5E4` (`color.stroke.strong`) | no |
| `ring` | `oklch(0.708 0 0)` | `#A1A1A1` | — no focus token in the design | n/a |

**The correction is written but not merged.** A separate change derives these
roles from fills counted in the design's node tree, and those derived values *do*
match the designer's column above exactly. Until it lands, this document describes
the target, not the state of `main`.

So the fix is not a rename. The values on `main` genuinely have to change; the
names are a second, smaller question on top.

Two of ours have **no counterpart** in the designer's semantic set, so they remain
our own decisions and are open questions for them:

- **`ring`** — we used the brand lime `#9AE600`. The semantic document contains no
  focus-state token at all.
- **destructive / error** — likewise absent, and the design offers no candidate.
  Counting solid fills across the breakpoint trees turns up three reds, none of
  them a user-interface role:

  | Red | Uses | Where |
  | --- | --- | --- |
  | `#FE3434` | 12 | `Button text` inside the "Illustration 3" mockup |
  | `#F24835` | 6 | inside the "Illustration 1" mockup |
  | `#F03C2E` | 3 | the Git logo — an external brand colour |

  `#FE3434` is the closest thing to an error red, but it is mockup content rather
  than a role, and it measures 3.65:1 on white — below the WCAG AA minimum of
  4.5:1 for normal text, so it should not be adopted as-is.

Also absent from the semantic document: the sandy `#F5F6EF` family (36 uses in the
design) and the lime accent `#9AE600`. They are used on the page but are not part
of the documented token system — worth asking whether that is deliberate.

## What is missing, and why

The Colors page's second frame, `Color tokens - Primitives` (`40002164:40672`), is
the **stock Tailwind palette** rendered as swatches — every standard ramp, ~224
entries, none project-specific. It is reconstructible from Tailwind itself, so it
is deliberately not stored here.

The Figma **Variables REST API** (`/v1/files/:key/variables/local`) remains
inaccessible: it requires the `file_variables:read` scope, which this account
cannot grant. The table above is read from the generated documentation frame
instead, which carries the same information.
