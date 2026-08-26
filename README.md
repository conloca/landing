# Conloca — landing page

## What this is

This repository holds the marketing landing page for Conloca. Conloca itself is
a Git-native headless CMS for Astro sites: content lives as MDX and JSON files
directly in the customer's own repository, developers work with it in their IDE,
and non-technical editors get a visual editor — both write to the same files.
The product sells on Git history, reviewing edits through pull requests, and
content localization.

The landing page is fully static. There is no server at runtime: `bun run build`
produces a ready-to-serve set of files in `dist/`.

## Project status

Built and merged into `main`:

- every section of the page, built from the design extracted from Figma;
- animations, including the scroll effect where the three product-feature cards
  pin to the screen and stack over one another as you scroll — the single most
  prominent animation on the page;
- the Lottie banner showing the locale management panel, from the animation file
  the designer supplied.

Not finished:

- some design decisions were made by the team rather than the designer; those
  decisions, along with the questions still genuinely open, are collected in
  [`docs/QUESTIONS-DESIGNER.md`](docs/QUESTIONS-DESIGNER.md);
- mobile and tablet layouts have only been spot-checked, not verified section by
  section across every breakpoint.

## For designers

[`docs/QUESTIONS-DESIGNER.md`](docs/QUESTIONS-DESIGNER.md) collects every place
where the design file or the supplied assets did not give an unambiguous answer.
Some of these the team resolved on its own judgement and already implemented —
those are listed too, phrased as "we built it this way, is that what you meant?"
so you can confirm or correct them against a working page. The rest need your
input. Answer inline, one line under each question.

Source design in Figma:
https://www.figma.com/design/OxxksZFS8hzKoFTeSRdFGs/Conloca?node-id=40002391-9972

A live preview URL will be added here once the site is deployed.

## For developers

| Concern | Choice |
| --- | --- |
| Package manager | bun |
| Bundler | Vite via `rolldown-vite` (Rust bundler, Oxc-based) |
| Linter | `oxlint` (there is no ESLint) |
| UI framework | React |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Animation | `motion` + `@lottiefiles/dotlottie-react` |

Exact versions live in `package.json`. The table above deliberately omits them
so the two cannot drift apart.

```bash
bun install
bun run dev     # development server
bun run build   # build into dist/
bun run lint    # lint
```

The full technical guide — how static generation works, the animation rules, and
the rest — is in [`AGENTS.md`](AGENTS.md).

## Repository layout

- `src/components/sections/` — the page sections (Hero, ThreeFeatures,
  FeatureGrid, Pricing and others): what you actually see on the page.
- `src/components/ui/` — shadcn/ui primitives.
- `public/` — static assets, including the Lottie banner and its player.
- `docs/QUESTIONS-DESIGNER.md` — open questions for the designer, a living file.
- `docs/figma/` — the design spec extracted from Figma while building the page.
