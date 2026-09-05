import type { ReactNode } from 'react'
import { Reveal } from '@/components/motion/Reveal'

interface BentoCardProps {
  title: string
  body: string
  illustration: ReactNode
}

/**
 * One bento card, S3 (`40002427:16814`) — sand-tinted surface, radius 32.
 * Grid placement is by document order (`.bento-grid > :nth-child(N)` in
 * index.css), not a per-card prop — see FeatureGrid.tsx.
 *
 * The illustration sets its own height via `aspect-ratio`, matching each
 * card's actual exported crop — a wide 2-column card and a 2x2 card need
 * different ratios, and the illustration is the one thing that already
 * knows which it is. No `tall`/size prop here; see the sizing rationale in
 * `feature-grid/illustrations.tsx`.
 */
export function BentoCard({ title, body, illustration }: BentoCardProps) {
  return (
    <Reveal as="div" className="min-h-0">
      <div className="flex h-full flex-col overflow-hidden rounded-[32px] bg-sand-200">
        {illustration}
        {/* `mt-auto`: the card still stretches to its grid row's full height
            (`h-full` above), and nothing else absorbs the slack now that the
            illustration is a natural-height `<img>` rather than a `flex-1`
            filler — without it, a row taller than the image + text leaves
            visible empty space below the text instead of the text sitting
            flush at the card's bottom, as Figma's `Rectangle 20` does. */}
        <div className="mt-auto p-6 pt-0">
          <h4 className="text-xl font-bold text-stone-900">{title}</h4>
          <p className="mt-1 text-xl text-stone-500">{body}</p>
        </div>
      </div>
    </Reveal>
  )
}
