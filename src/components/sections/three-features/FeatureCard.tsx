import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AUDIENCE_OPTIONS, SegmentedControl } from '@/components/ui/segmented-control'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  title: string
  body: string
  secondaryCta: string
  visual: ReactNode
  /** Cards 1/2 sit text beside the visual; card 3 lays title, body and buttons in one bottom row. */
  layout: 'visual-right' | 'visual-left' | 'stacked'
  /** Blurred photographic backdrop exported from the Figma image fill. */
  backgroundUrl: string
}

/** Figma: title 48/48 Inter Display 700 #FAFAF9, body 16/27.2 Inter 400 #FFFFFF. */
function CardCopy({ title, body, className }: { title: string; body: string; className?: string }) {
  return (
    <div className={className}>
      <h3 className="font-display text-[2rem] leading-none font-bold text-stone-50 lg:text-5xl">
        {title}
      </h3>
      <p className="mt-6 text-base leading-[1.7] text-white">{body}</p>
    </div>
  )
}

function CardActions({ secondaryCta }: { secondaryCta: string }) {
  return (
    <div className="flex shrink-0 gap-3">
      <Button>Get started</Button>
      <Button variant="outline" className="border-stone-200 bg-white text-stone-900 hover:bg-stone-100">
        {secondaryCta}
      </Button>
    </div>
  )
}

/** Card 3: title and body sit side by side (gap 48) with the buttons trailing (gap 24). */
function StackedCopy({ title, body, secondaryCta }: Omit<FeatureCardProps, 'visual' | 'layout' | 'backgroundUrl'>) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-6 md:flex-1 md:flex-row md:items-end md:gap-12">
        <h3 className="font-display max-w-[520px] text-[2rem] leading-none font-bold text-stone-50 lg:text-5xl">
          {title}
        </h3>
        <p className="max-w-[520px] text-base leading-[1.7] text-white">{body}</p>
      </div>
      <CardActions secondaryCta={secondaryCta} />
    </div>
  )
}

export function FeatureCard({ title, body, secondaryCta, visual, layout, backgroundUrl }: FeatureCardProps) {
  const isStacked = layout === 'stacked'

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-stone-100 p-6 text-stone-50">
      <img
        src={backgroundUrl}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-black/20" aria-hidden />
      <SegmentedControl
        options={AUDIENCE_OPTIONS}
        activeIndex={0}
        variant="translucent"
        className="relative self-start"
      />
      <div
        className={cn(
          'relative mt-6 flex flex-1 flex-col gap-6 overflow-y-auto',
          isStacked ? 'justify-between' : 'md:flex-row md:items-end md:justify-between md:gap-8',
          layout === 'visual-left' && 'md:flex-row-reverse',
        )}
      >
        {isStacked ? null : (
          <div className="flex flex-col gap-6 md:max-w-[472px] md:shrink-0">
            <CardCopy title={title} body={body} />
            <CardActions secondaryCta={secondaryCta} />
          </div>
        )}
        <div
          className={cn(
            'relative min-h-56 overflow-hidden rounded-2xl',
            isStacked ? 'order-first flex-1' : 'flex-1 md:self-stretch',
          )}
        >
          {visual}
        </div>
        {isStacked ? <StackedCopy title={title} body={body} secondaryCta={secondaryCta} /> : null}
      </div>
    </div>
  )
}
