import { useReducedMotion } from 'motion/react'
import { FeatureCard } from '@/components/sections/three-features/FeatureCard'
import { JsonEditorMockup } from '@/components/sections/three-features/JsonEditorMockup'
import { LocalesVisual } from '@/components/sections/three-features/LocalesVisual'
import { DiffMockup } from '@/components/sections/three-features/DiffMockup'
import { ScrollStackRoot, StackCard } from '@/components/motion/ScrollStack'
import { useHydrated } from '@/components/motion/Reveal'
import { CTA_LINKS } from '@/lib/nav'
import { cn } from '@/lib/utils'

const CARDS = [
  {
    title: 'One source of truth, two ways to work',
    body: 'Developers work in the IDE. Editors work visually. Every change goes back to the same MDX files in Git.',
    secondaryCta: 'Read docs',
    secondaryCtaHref: CTA_LINKS.readDocs,
    layout: 'visual-right' as const,
    background: 'bg-gradient-to-br from-stone-700 via-stone-800 to-emerald-900',
    visual: <JsonEditorMockup />,
  },
  {
    title: 'Localization without manual syncing',
    body: 'Update the source structure once. Each locale follows the same versioned structure. When content changes, Conloca flags the locales that need updating.',
    secondaryCta: 'Read docs',
    secondaryCtaHref: CTA_LINKS.readDocs,
    layout: 'visual-left' as const,
    background: 'bg-gradient-to-br from-sky-800 via-indigo-900 to-stone-800',
    visual: <LocalesVisual />,
  },
  {
    title: 'Review, merge, and revert content in Git',
    body: 'Every edit is written to a file with a readable diff and full history, ready for your existing pull-request workflow. Review changes, merge or roll back anything, any time.',
    secondaryCta: 'Read docs',
    secondaryCtaHref: CTA_LINKS.readDocs,
    layout: 'stacked' as const,
    background: 'bg-gradient-to-br from-stone-800 via-slate-900 to-stone-900',
    visual: <DiffMockup />,
  },
]

/**
 * Figma S1 (`40002427:16418`) + the `Scrolling` motion note in `Conloca - Animations`.
 *
 * The `max-w-[1440px]`/`px-2` cap is dropped from `lg` up: the designer wants the
 * pinned slide edge to edge across the full viewport width and height while it's
 * stuck in place, not capped at the Figma frame's own 1440px/846px dimensions.
 * `ScrollStack` (its `p-4` wrapper inset and `MotionCard`'s `max-h-[46rem]`) and
 * `FeatureCard` (rounded corners/border) drop their own `lg`-and-up constraints
 * to match — see those files. Below `lg` the section keeps its padded, capped
 * layout, unchanged.
 */
export function ThreeFeatures() {
  // Computed once, here, and threaded everywhere it's needed — into this
  // section's own classes, into `FeatureCard` as a prop, and into
  // `ScrollStackRoot` as its `pinned` override — rather than recomputed
  // independently in each place. `ScrollStackRoot`'s own context then carries
  // this exact value to `StackCard`/`MotionCard` too, so there is exactly one
  // source of truth for "is this pinned" across every file that needs it,
  // instead of several same-formula booleans that were only equal by
  // assumption. Full-bleed is a property of the pinned presentation, not of
  // the breakpoint alone: this keeps the reduced-motion/no-JS/prerender
  // fallback on its padded, capped, bordered layout even at `lg` and up, so
  // three stacked full-viewport cards with no gap or radius never render for
  // that cohort.
  const hydrated = useHydrated()
  const reducedMotion = useReducedMotion()
  const pinned = hydrated && !reducedMotion
  return (
    <section
      className={cn('mx-auto max-w-[1440px] px-2 pt-8 pb-2', pinned && 'lg:max-w-none lg:px-0')}
    >
      <ScrollStackRoot pinned={pinned}>
        {CARDS.map((card, index) => (
          <StackCard key={card.title} index={index}>
            <FeatureCard {...card} fullBleed={pinned} />
          </StackCard>
        ))}
      </ScrollStackRoot>
    </section>
  )
}
