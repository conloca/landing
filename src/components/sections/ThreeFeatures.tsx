import { FeatureCard } from '@/components/sections/three-features/FeatureCard'
import { JsonEditorMockup } from '@/components/sections/three-features/JsonEditorMockup'
import { LocalesVisual } from '@/components/sections/three-features/LocalesVisual'
import { DiffMockup } from '@/components/sections/three-features/DiffMockup'
import { ScrollStackRoot, StackCard } from '@/components/motion/ScrollStack'
import { CTA_LINKS } from '@/lib/nav'

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

/** Figma S1 (`40002427:16418`) + the `Scrolling` motion note in `Conloca - Animations`. */
export function ThreeFeatures() {
  return (
    <section className="mx-auto max-w-[1440px] px-2 pt-8 pb-2 sm:px-2">
      <ScrollStackRoot>
        {CARDS.map((card, index) => (
          <StackCard key={card.title} index={index}>
            <FeatureCard {...card} />
          </StackCard>
        ))}
      </ScrollStackRoot>
    </section>
  )
}
