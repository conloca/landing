import { CTA_LINKS } from '@/lib/nav'
import type { Audience } from '@/lib/audience'

interface HeroCopy {
  headline: string
  carousel: string
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
 * Per-audience hero text, sourced verbatim from the two parallel Figma page
 * frames (`Homepage - Developers` / `Homepage - Content editors`, file
 * `yOHv995S8IvhS5jEdQS4uV`) — see `docs/figma/DESIGN-ANNOTATIONS.md` note #1
 * and #4 for how this task was scoped.
 *
 * The developer headline/carousel text below is the sentence already live in
 * this codebase (`Hero.tsx`/`CarouselRail.tsx` before this file existed) —
 * kept as-is rather than re-pulled from Figma, since it already works and
 * this task only needed to ADD the content-editor half, not re-verify the
 * developer half. `secondaryCta` is the one exception: the live site already
 * says "Try Demo" (matching the header's own button), while the Content
 * editors frame's own hero button says "Watch demo" — kept both exactly as
 * each frame draws them rather than forcing them to match.
 */
export const HERO_COPY: Record<Audience, HeroCopy> = {
  developer: {
    headline: 'Keep content in your repo. Give editors a visual editing interface',
    // "MDS" is verbatim from the Figma copy — likely a typo for "MDX"
    carousel:
      'Map your React components to typed schemas and MDS blocks in the IDE. Visual edits respect the structure you define and stay in Git.',
    secondaryCta: 'Try Demo',
    secondaryCtaHref: CTA_LINKS.tryDemo,
    showAstroBadge: true,
  },
  'content-editor': {
    headline: 'Build and edit pages visually without touching the codebase',
    carousel:
      'Developers build and map reusable sections for you. You use visual editor to build, edit and publish pages without depending on developer.',
    secondaryCta: 'Watch demo',
    secondaryCtaHref: CTA_LINKS.tryDemo,
    showAstroBadge: false,
  },
}
