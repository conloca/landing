import { CTA_LINKS } from '@/lib/nav'
import type { Audience } from '@/lib/audience'

/** Lead sentence + continuation. The continuation keeps its leading space
 *  so slides render as `lead + rest` without a joiner. */
export type HeroCarouselSlide = readonly [string, string]

export type HeroCarouselSlides = readonly [HeroCarouselSlide, HeroCarouselSlide, HeroCarouselSlide]

interface HeroCopy {
  headline: string
  carousel: HeroCarouselSlides
  secondaryCta: string
  /** Paired with `secondaryCta` for the same reason `FeatureCard` pairs its
   * own secondary CTA label with a per-card href: a button relabelled
   * "Watch demo" must not silently keep pointing wherever "Try Demo" did.
   * Both audiences point at `CTA_LINKS.tryDemo` today — deliberately, not by
   * omission — but a real content-editor-specific destination (e.g. a
   * different demo booking flow) has somewhere to go without restructuring
   * this type. */
  secondaryCtaHref: string | null
  /** Figma: the "BUILT FOR ASTRO" badge is drawn only in the Developers
   * composition (`Homepage - Developers`) — absent from the Content editors
   * one (`Homepage - Content editors`, node `40002207:13631`). */
  showAstroBadge: boolean
}

/**
 * Per-audience hero text. Headlines, CTAs, and the Astro badge follow the
 * two parallel Figma page frames (`Homepage - Developers` / `Homepage -
 * Content editors`, file `yOHv995S8IvhS5jEdQS4uV`). Carousel slides are
 * the three-message sequences from the working landing-saba homepage
 * content, keyed here as `developer` / `content-editor` (saba uses
 * `developers` / `editors`).
 *
 * `secondaryCta` is the one label that differs across the two frames: the
 * Developers composition says "Try Demo" (matching the header button),
 * while the Content editors frame's own hero button says "Watch demo" —
 * kept both exactly as each frame draws them rather than forcing them to
 * match.
 */
export const HERO_COPY: Record<Audience, HeroCopy> = {
  developer: {
    headline: 'Keep content in your repo. Give editors a visual editing interface',
    carousel: [
      [
        'Map your React components to typed schemas and MDX blocks in the IDE.',
        ' Visual edits respect the structure you define and stay in Git.',
      ],
      [
        'Editors can only use the fields and blocks you define.',
        ' Conloca validates each update before writing it back to the repository.',
      ],
      [
        'Route content changes through standard Git pull requests.',
        ' Review, approve, or revert them just as you would with code.',
      ],
    ],
    secondaryCta: 'Try Demo',
    secondaryCtaHref: CTA_LINKS.tryDemo,
    showAstroBadge: true,
  },
  'content-editor': {
    headline: 'Build and edit pages visually without touching the codebase',
    carousel: [
      [
        'Developers build and map reusable sections for you.',
        ' You use visual editor to build, edit and publish pages without depending on developer.',
      ],
      [
        'Handle multiple languages by changing only what differs.',
        ' Shared content stays automatically in sync for every locale.',
      ],
      [
        'Create reusable text fragments once and drop them into any page.',
        ' Update a shared block and it stays consistent everywhere.',
      ],
    ],
    secondaryCta: 'Watch demo',
    secondaryCtaHref: CTA_LINKS.tryDemo,
    showAstroBadge: false,
  },
}
