import {
  FeatureCard,
  type FeatureCardProps,
} from '@/components/sections/three-features/FeatureCard'
import { JsonEditorMockup } from '@/components/sections/three-features/JsonEditorMockup'
import { LocalesVisual } from '@/components/sections/three-features/LocalesVisual'
import { DiffMockup } from '@/components/sections/three-features/DiffMockup'
import { ScrollStackRoot, StackSlide } from '@/components/motion/ScrollStack'
import { useAudience } from '@/lib/audience-context'
import { FEATURE_CARDS_COPY } from '@/lib/content/feature-cards-copy'
import { CTA_LINKS } from '@/lib/nav'

type FeatureCardShell = Omit<FeatureCardProps, 'title' | 'body' | 'audienceSwitchLabel'>

/**
 * Everything but `title`/`body` is shared across audiences — those two come
 * from `FEATURE_CARDS_COPY`, keyed by index to line up with this array. Note
 * #6 in `docs/figma/DESIGN-ANNOTATIONS.md` identifies these as the three
 * feature cards but doesn't say whether they vary by audience; unlike note
 * #8 (the bento grid, affirmatively "the same for developers and Content
 * editors"), there's no equivalent statement here — the actual evidence for
 * `title`/`body` differing is the two Figma page frames' own text, pulled
 * directly when `FEATURE_CARDS_COPY` was built.
 *
 * Typed and `satisfies`-checked as a 3-tuple matching `FEATURE_CARDS_COPY`'s
 * own tuple: a 4th entry here without a matching content entry would
 * otherwise compile clean and silently render a blank card at runtime
 * (`copy[3]` is `undefined`, spread as a no-op).
 */
const CARD_SHELLS = [
  {
    secondaryCta: 'Read docs',
    secondaryCtaHref: CTA_LINKS.readDocs,
    layout: 'visual-right' as const,
    background: 'bg-gradient-to-br from-stone-700 via-stone-800 to-emerald-900',
    visual: <JsonEditorMockup />,
  },
  {
    secondaryCta: 'Read docs',
    secondaryCtaHref: CTA_LINKS.readDocs,
    layout: 'visual-left' as const,
    background: 'bg-gradient-to-br from-sky-800 via-indigo-900 to-stone-800',
    visual: <LocalesVisual />,
  },
  {
    secondaryCta: 'Read docs',
    secondaryCtaHref: CTA_LINKS.readDocs,
    layout: 'stacked' as const,
    background: 'bg-gradient-to-br from-stone-800 via-slate-900 to-stone-900',
    visual: <DiffMockup />,
  },
] as const satisfies readonly [FeatureCardShell, FeatureCardShell, FeatureCardShell]

/** Figma S1 (`40002427:16418`) + the `Scrolling` motion note in `Conloca - Animations`. */
export function ThreeFeatures() {
  const { audience } = useAudience()
  const copy = FEATURE_CARDS_COPY[audience]

  return (
    <section className="mx-auto max-w-[1440px] px-2 pt-8 pb-2 sm:px-2">
      <ScrollStackRoot>
        {CARD_SHELLS.map((shell, index) => (
          // eslint-disable-next-line react/no-array-index-key -- `CARD_SHELLS` is a fixed-length, never-reordered constant; the index IS the slide's stable identity. Keying by the (audience-dependent) title instead would remount the slide on every audience switch and drop the scroll-stack's pinned/inert state.
          <StackSlide key={index} index={index}>
            <FeatureCard
              {...shell}
              {...copy[index]}
              audienceSwitchLabel={`Audience — card ${index + 1} of ${CARD_SHELLS.length}`}
            />
          </StackSlide>
        ))}
      </ScrollStackRoot>
    </section>
  )
}
