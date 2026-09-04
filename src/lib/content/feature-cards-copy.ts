import type { Audience } from '@/lib/audience'

interface FeatureCardCopy {
  title: string
  body: string
}

/**
 * Per-audience title/body for the three `ThreeFeatures` cards, sourced
 * verbatim from the two parallel Figma page frames the same way
 * `hero-copy.ts` is — see `docs/figma/DESIGN-ANNOTATIONS.md`. Everything
 * else about a card (layout, background, visual, secondary CTA) is shared
 * across audiences; only these two strings differ per the Figma source, so
 * that's all this models.
 */
type FeatureCardsCopy = [FeatureCardCopy, FeatureCardCopy, FeatureCardCopy]

export const FEATURE_CARDS_COPY: Record<Audience, FeatureCardsCopy> = {
  developer: [
    {
      title: 'One source of truth, two ways to work',
      body: 'Developers work in the IDE. Editors work visually. Every change goes back to the same MDX files in Git.',
    },
    {
      title: 'Localization without manual syncing',
      body: 'Update the source structure once. Each locale follows the same versioned structure. When content changes, Conloca flags the locales that need updating.',
    },
    {
      title: 'Review, merge, and revert content in Git',
      body: 'Every edit is written to a file with a readable diff and full history, ready for your existing pull-request workflow. Review changes, merge or roll back anything, any time.',
    },
  ],
  'content-editor': [
    {
      title: 'Build and edit pages visually',
      body: 'Add blocks, move sections, and update content in the visual editor. Conloca handles the files and repository updates.',
    },
    {
      title: 'Keep every language in sync',
      body: 'Edit only what differs between locales. Shared content stays aligned, and Conloca shows you what still needs updating.',
    },
    {
      title: 'See every change. Restore any version.',
      body: 'Nothing is ever permanently overwritten. Every version of a page is preserved, so you can check what changed and when, then return to an earlier version whenever you need to.',
    },
  ],
}
