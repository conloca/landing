import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AUDIENCE_OPTIONS, SegmentedControl } from '@/components/ui/segmented-control'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  title: string
  body: string
  secondaryCta: string
  visual: ReactNode
  /** Card 1/2 sit text-and-visual side by side; card 3 stacks visual over text. */
  layout: 'visual-right' | 'visual-left' | 'stacked'
  background: string
}

export function FeatureCard({
  title,
  body,
  secondaryCta,
  visual,
  layout,
  background,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-stone-100 p-6 text-stone-50',
        background,
      )}
    >
      <div className="absolute inset-0 bg-black/20" aria-hidden />
      <SegmentedControl
        options={AUDIENCE_OPTIONS}
        activeIndex={0}
        variant="translucent"
        className="relative self-start"
      />
      <div
        className={cn(
          'relative mt-4 flex flex-1 flex-col gap-6 overflow-y-auto',
          layout === 'stacked' ? 'justify-between md:flex-col' : 'md:flex-row md:items-end md:gap-8',
          layout === 'visual-left' && 'md:flex-row-reverse',
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-6',
            layout === 'stacked' ? 'md:flex-row md:items-end md:justify-between md:gap-8' : 'md:max-w-[440px]',
          )}
        >
          <div className={layout === 'stacked' ? 'md:max-w-md' : undefined}>
            <h3 className="font-display text-4xl leading-none font-bold">{title}</h3>
            <p className={cn('mt-4 text-base', layout === 'stacked' && 'mt-2')}>{body}</p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Button>Get started</Button>
            <Button variant="outline" className="border-white/40 bg-white/10 text-stone-50 hover:bg-white/20">
              {secondaryCta}
            </Button>
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
