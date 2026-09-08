import { useReducedMotion } from 'motion/react'
import { useSyncExternalStore } from 'react'
import {
  FeatureCard,
  type FeatureCardProps,
} from '@/components/sections/three-features/FeatureCard'
import { JsonEditorMockup } from '@/components/sections/three-features/JsonEditorMockup'
import { LocalesVisual } from '@/components/sections/three-features/LocalesVisual'
import { DiffMockup } from '@/components/sections/three-features/DiffMockup'
import { ScrollStackRoot, StackSlide } from '@/components/motion/ScrollStack'
import { useHydrated } from '@/components/motion/Reveal'
import { useAudience } from '@/lib/audience-context'
import { FEATURE_CARDS_COPY } from '@/lib/content/feature-cards-copy'
import { CTA_LINKS } from '@/lib/nav'
import { cn } from '@/lib/utils'
import featureBgA from '@/assets/figma/feature-section-bg-a.webp'
import featureBgB from '@/assets/figma/feature-section-bg-b.webp'

/** Tailwind `lg` — pin/full-bleed only from here up, so 393/640 unroll as stacked cards. */
const LG_MQ = '(min-width: 1024px)'

function subscribeLg(onStoreChange: () => void) {
  const mql = window.matchMedia(LG_MQ)
  mql.addEventListener('change', onStoreChange)
  return () => mql.removeEventListener('change', onStoreChange)
}

function useLg(): boolean {
  return useSyncExternalStore(
    subscribeLg,
    () => window.matchMedia(LG_MQ).matches,
    () => false,
  )
}

type FeatureCardShell = Omit<
  FeatureCardProps,
  'title' | 'body' | 'audienceSwitchLabel' | 'fullBleed'
>

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
    background: featureBgA,
    visual: <JsonEditorMockup />,
  },
  {
    secondaryCta: 'Read docs',
    secondaryCtaHref: CTA_LINKS.readDocs,
    layout: 'visual-left' as const,
    background: featureBgB,
    visual: <LocalesVisual />,
  },
  {
    secondaryCta: 'Read docs',
    secondaryCtaHref: CTA_LINKS.readDocs,
    layout: 'stacked' as const,
    background: featureBgA,
    visual: <DiffMockup />,
  },
] as const satisfies readonly [FeatureCardShell, FeatureCardShell, FeatureCardShell]

/**
 * Figma S1 (`40002427:16418`) + the `Scrolling` motion note in `Conloca - Animations`.
 *
 * The `max-w-[1440px]` cap is dropped from `lg` up once pinned: the designer
 * wants the stuck slide edge to edge, not capped at the frame's 1440px.
 * `ScrollStack` (pinned-slot `p-4` / `max-h-[46rem]`) and `FeatureCard`
 * (radius/border) drop those constraints to match. Unpinned, Frame 609
 * padding is 4 (393) / 8 (640) / 72 top and 8 otherwise (1024+).
 */
export function ThreeFeatures() {
  const { audience } = useAudience()
  const copy = FEATURE_CARDS_COPY[audience]
  // Computed once, here, and threaded everywhere it's needed — into this
  // section's own classes, into `FeatureCard` as a prop, and into
  // `ScrollStackRoot` as its `pinned` override — rather than recomputed
  // independently in each place. `ScrollStackRoot`'s own context then carries
  // this exact value to `StackSlide`/`MotionCard` too, so there is exactly one
  // source of truth for "is this pinned" across every file that needs it,
  // instead of several same-formula booleans that were only equal by
  // assumption. Full-bleed is a property of the pinned presentation, not of
  // the breakpoint alone: this keeps the reduced-motion/no-JS/prerender
  // fallback on its padded, capped, bordered layout even at `lg` and up, so
  // three stacked full-viewport cards with no gap or radius never render for
  // that cohort. Pinning itself is also gated on `lg`: below that the Figma
  // 640/393 frames are stacked cards (heading, body, buttons, visual), not a
  // sticky `h-dvh` slide.
  const hydrated = useHydrated()
  const reducedMotion = useReducedMotion()
  const isLg = useLg()
  const pinned = Boolean(hydrated && !reducedMotion && isLg)

  return (
    <section
      className={cn(
        'mx-auto max-w-[1440px] p-1 sm:p-2 lg:px-2 lg:pt-18 lg:pb-2',
        pinned && 'lg:max-w-none lg:px-0',
      )}
    >
      <ScrollStackRoot pinned={pinned}>
        {CARD_SHELLS.map((shell, index) => (
          // eslint-disable-next-line react/no-array-index-key -- `CARD_SHELLS` is a fixed-length, never-reordered constant; the index IS the slide's stable identity. Keying by the (audience-dependent) title instead would remount the slide on every audience switch and drop the scroll-stack's pinned/inert state.
          <StackSlide key={index} index={index}>
            <FeatureCard
              {...shell}
              {...copy[index]}
              audienceSwitchLabel={`Audience — card ${index + 1} of ${CARD_SHELLS.length}`}
              fullBleed={pinned}
            />
          </StackSlide>
        ))}
      </ScrollStackRoot>
    </section>
  )
}
