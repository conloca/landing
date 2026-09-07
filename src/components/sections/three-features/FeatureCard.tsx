import type { ReactNode } from 'react'
import { AudienceSwitch } from '@/components/AudienceSwitch'
import { CtaButton } from '@/components/CtaButton'
import { CTA_LINKS } from '@/lib/nav'
import { cn } from '@/lib/utils'

export interface FeatureCardProps {
  title: string
  body: string
  secondaryCta: string
  /** Paired with `secondaryCta` rather than fixed here: the label is per-card
   * data, so its destination has to be too, or a card relabelled "Watch demo"
   * would quietly keep pointing at the docs. */
  secondaryCtaHref: string | null
  visual: ReactNode
  /** Cards 1/2 sit text beside the visual; card 3 lays title, body and buttons in one bottom row. */
  layout: 'visual-right' | 'visual-left' | 'stacked'
  background: string
  /** Distinguishes this card's `AudienceSwitch` from the others' and the
   * hero's when a screen reader lists every radiogroup on the page. Keyed to
   * card position rather than the (audience-dependent) title, so the
   * accessible name stays stable across an audience toggle. */
  audienceSwitchLabel: string
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

/** Figma S1 card headline per breakpoint frame: 32/38.4 (393), 40/48 (640),
 * 48/48 (1024 and 1440); body 16/27.2 throughout. */
function CardCopy({ title, body, className }: { title: string; body: string; className?: string }) {
  return (
    <div className={className}>
      <h3 className="font-display text-[2rem] leading-[1.2] font-bold text-stone-50 sm:text-[2.5rem] sm:leading-[1.2] lg:text-5xl lg:leading-none">
        {title}
      </h3>
      <p className="mt-6 text-base leading-[1.7] text-white">{body}</p>
    </div>
  )
}

function CardActions({
  secondaryCta,
  secondaryCtaHref,
}: {
  secondaryCta: string
  secondaryCtaHref: string | null
}) {
  return (
    <div className="flex shrink-0 gap-3">
      <CtaButton href={CTA_LINKS.getStarted}>Get started</CtaButton>
      <CtaButton
        variant="outline"
        className="border-stone-200 bg-white text-stone-900 hover:bg-stone-100"
        href={secondaryCtaHref}
      >
        {secondaryCta}
      </CtaButton>
    </div>
  )
}

/** Card 3: title and body sit side by side (gap 48) with the buttons trailing (gap 24). */
function StackedCopy({
  title,
  body,
  secondaryCta,
  secondaryCtaHref,
}: Pick<FeatureCardProps, 'title' | 'body' | 'secondaryCta' | 'secondaryCtaHref'>) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-6 md:flex-1 md:flex-row md:items-end md:gap-12">
        <h3 className="font-display max-w-[520px] text-[2rem] leading-[1.2] font-bold text-stone-50 sm:text-[2.5rem] sm:leading-[1.2] lg:text-5xl lg:leading-none">
          {title}
        </h3>
        <p className="max-w-[520px] text-base leading-[1.7] text-white">{body}</p>
      </div>
      <CardActions secondaryCta={secondaryCta} secondaryCtaHref={secondaryCtaHref} />
    </div>
  )
}

export function FeatureCard({
  title,
  body,
  secondaryCta,
  visual,
  layout,
  background,
  secondaryCtaHref,
  fullBleed,
  audienceSwitchLabel,
}: FeatureCardProps) {
  const isStacked = layout === 'stacked'

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
        <AudienceSwitch
          variant="translucent"
          className="relative self-start"
          label={audienceSwitchLabel}
        />
        <div
          className={cn(
            'relative mt-6 flex flex-1 flex-col gap-6 overflow-y-auto',
            isStacked
              ? 'order-last justify-between md:order-none'
              : 'md:flex-row md:items-end md:justify-between md:gap-8',
            layout === 'visual-left' && 'md:flex-row-reverse',
          )}
        >
          {isStacked ? null : (
            <div className="flex flex-col gap-6 md:max-w-[472px] md:shrink-0">
              <CardCopy title={title} body={body} />
              <CardActions secondaryCta={secondaryCta} secondaryCtaHref={secondaryCtaHref} />
            </div>
          )}
          <div
            className={cn(
              'relative min-h-56 overflow-hidden rounded-2xl',
              isStacked ? 'flex-1' : 'flex-1 md:self-stretch',
            )}
          >
            {visual}
          </div>
        </div>
        {isStacked ? (
          <StackedCopy
            title={title}
            body={body}
            secondaryCta={secondaryCta}
            secondaryCtaHref={secondaryCtaHref}
          />
        ) : null}
      </div>
    </div>
  )
}
