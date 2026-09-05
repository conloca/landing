import type { ReactNode } from 'react'
import { CtaButton } from '@/components/CtaButton'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { AUDIENCE_OPTIONS } from '@/lib/audience'
import { CTA_LINKS } from '@/lib/nav'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  title: string
  body: string
  secondaryCta: string
  /** Paired with `secondaryCta` rather than fixed here: the label is per-card
   * data, so its destination has to be too, or a card relabelled "Watch demo"
   * would quietly keep pointing at the docs. */
  secondaryCtaHref: string | null
  visual: ReactNode
  /** Card 1/2 sit text-and-visual side by side; card 3 stacks visual over text. */
  layout: 'visual-right' | 'visual-left' | 'stacked'
  background: string
  /**
   * Mirrors `ScrollStack`'s `pinned` state (computed once in `ThreeFeatures`,
   * not re-derived here): the `lg`-and-up full-bleed surface — no radius, no
   * border, content capped instead of stretched — only applies once the card
   * is actually pinned. The reduced-motion/no-JS/prerender fallback keeps the
   * bordered, radius-28, padded presentation even at `lg` and up, so it never
   * renders as three stacked full-viewport panels with no visual boundary
   * between them.
   */
  fullBleed: boolean
}

export function FeatureCard({
  title,
  body,
  secondaryCta,
  secondaryCtaHref,
  visual,
  layout,
  background,
  fullBleed,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-stone-100 p-6 text-stone-50',
        fullBleed && 'lg:rounded-none lg:border-0',
        background,
      )}
    >
      <div className="absolute inset-0 bg-black/20" aria-hidden />
      {/*
       * The card surface/background above bleeds to the viewport edge once
       * pinned, from `lg` up (see `ThreeFeatures`/`ScrollStack`). This wrapper
       * keeps the actual content — text and mockups — at its pre-full-bleed
       * max width and centred, so typography doesn't stretch across a 1920px
       * screen; the surface bleeds, the content does not.
       *
       * 1344px is a deliberately round cap close to, not exactly equal to, the
       * old (pre-full-bleed) content width at viewport ≥1440px: 1440
       * (`ThreeFeatures`'s old section max-width) − 16 (its `px-2`) − 32
       * (`ScrollStack`'s pinned-slot `p-4`) − 48 (this card's own `p-6`,
       * still applied above, unaffected by full-bleed) − 2 (this card's own
       * 1px `border`, stripped by `lg:border-0` above) = 1342, not 1344 — the
       * 2px difference is invisible at this width and not worth chasing
       * exactly. Below viewport 1440px, still at `lg` and up, the gap between
       * old and new content width (all relative to the 1344 cap actually in
       * the code) widens: 1442−viewport in the 1392–1439px band, where the
       * old layout (`viewport − 98`) was still narrower than the still-capped
       * new one (1344); and a flat 50px in the 1024–1391px band, where the
       * new content width has stopped being capped and tracks `viewport − 48`
       * instead — 50px being exactly the `px-2`+`p-4`+`border` this diff
       * removes (`p-6` stays in both, so it cancels out of the difference).
       * If any of the numbers above change, revisit this one — there's no
       * shared constant linking them, since each is a one-off Tailwind
       * arbitrary-value class in a different component.
       */}
      <div
        className={cn(
          'relative flex h-full w-full flex-col',
          fullBleed && 'lg:mx-auto lg:max-w-[1344px]',
        )}
      >
        <SegmentedControl
          options={AUDIENCE_OPTIONS}
          activeIndex={0}
          variant="translucent"
          className="relative self-start"
        />
        <div
          className={cn(
            'relative mt-4 flex flex-1 flex-col gap-6 overflow-y-auto',
            layout === 'stacked'
              ? 'justify-between md:flex-col'
              : 'md:flex-row md:items-end md:gap-8',
            layout === 'visual-left' && 'md:flex-row-reverse',
          )}
        >
          <div
            className={cn(
              'flex flex-col gap-6',
              layout === 'stacked'
                ? 'md:flex-row md:items-end md:justify-between md:gap-8'
                : 'md:max-w-[440px]',
            )}
          >
            <div className={layout === 'stacked' ? 'md:max-w-md' : undefined}>
              <h3 className="font-display text-4xl leading-none font-bold">{title}</h3>
              <p className={cn('mt-4 text-base', layout === 'stacked' && 'mt-2')}>{body}</p>
            </div>
            <div className="flex shrink-0 gap-3">
              <CtaButton href={CTA_LINKS.getStarted}>Get started</CtaButton>
              <CtaButton
                variant="outline"
                className="border-white/40 bg-white/10 text-stone-50 hover:bg-white/20"
                href={secondaryCtaHref}
              >
                {secondaryCta}
              </CtaButton>
            </div>
          </div>
          <div
            className={cn(
              'relative min-h-56 overflow-hidden rounded-2xl',
              layout === 'stacked' ? 'h-72 shrink-0' : 'flex-1 md:self-stretch',
            )}
          >
            {visual}
          </div>
        </div>
      </div>
    </div>
  )
}
