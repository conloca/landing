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
  /** Card 1/2 sit text-and-visual side by side; card 3 stacks visual over text. */
  layout: 'visual-right' | 'visual-left' | 'stacked'
  background: string
  /** Distinguishes this card's `AudienceSwitch` from the others' and the
   * hero's when a screen reader lists every radiogroup on the page. Keyed to
   * card position rather than the (audience-dependent) title, so the
   * accessible name stays stable across an audience toggle. */
  audienceSwitchLabel: string
}

export function FeatureCard({
  title,
  body,
  secondaryCta,
  secondaryCtaHref,
  visual,
  layout,
  background,
  audienceSwitchLabel,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-stone-100 p-6 text-stone-50',
        background,
      )}
    >
      <div className="absolute inset-0 bg-black/20" aria-hidden />
      <AudienceSwitch
        variant="translucent"
        className="relative self-start"
        label={audienceSwitchLabel}
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
  )
}
