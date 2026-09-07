import type { ReactNode } from 'react'
import { Reveal } from '@/components/motion/Reveal'
import { cn } from '@/lib/utils'

interface BentoCardProps {
  title: string
  body: string
  illustration: ReactNode
  tall?: boolean
}

/**
 * One bento card, S3 (`40002427:16814`) — sand-tinted surface, radius 32.
 * Grid placement is by document order (`.bento-grid > :nth-child(N)` in
 * index.css), not a per-card prop — see FeatureGrid.tsx.
 */
export function BentoCard({ title, body, illustration, tall }: BentoCardProps) {
  return (
    <Reveal as="div" className="min-h-0">
      <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-stone-50">
        <div className={cn('relative flex-1', tall ? 'min-h-56' : 'min-h-28')}>{illustration}</div>
        <div className="p-6 pt-0">
          <h4 className="text-xl leading-[30px] font-bold text-stone-900">{title}</h4>
          <p className="mt-2 max-w-[320px] text-xl leading-[30px] text-stone-700">{body}</p>
        </div>
      </div>
    </Reveal>
  )
}
