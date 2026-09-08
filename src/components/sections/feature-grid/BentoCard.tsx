import type { ReactNode } from 'react'
import { Reveal } from '@/components/motion/Reveal'

interface BentoCardProps {
  title: string
  body: string
  illustration: ReactNode
  /** Scroll-entrance stagger, seconds. Same unit `Reveal` uses. */
  delay?: number
}

/**
 * One bento card, S3 (`40002427:16814`).
 *
 * Radius is an explicit 24px, not `rounded-3xl` (that token is 22px here and
 * would drift silently).
 *
 * Surface is `bg-sand-200` (`#F5F6EF`), the Figma sand tint for this grid.
 * Some node-tree fills also record `#FAFAF9` (stone-50); sand is the palette
 * for this section — see layout question 9 in docs/QUESTIONS-DESIGNER.md.
 *
 * Grid placement is by document order (`.bento-grid > :nth-child(N)` in
 * index.css), not a per-card prop — see FeatureGrid.tsx.
 *
 * The illustration sets its own height via `aspect-ratio`, matching each
 * card's actual exported crop — a wide 2-column card and a 2x2 card need
 * different ratios, and the illustration is the one thing that already
 * knows which it is. No `tall`/size prop here; see the sizing rationale in
 * `feature-grid/illustrations.tsx`.
 *
 * Hover is visual-only: Figma's prototype has no ON_CLICK on these frames,
 * so this is a `div`, not a link. The illustration clip is the stand-in
 * for the 2–3s Lottie the designer specified (Figma sections
 * `40002554:37060` / `40002599:20717`); those files are not in the repo.
 */
export function BentoCard({ title, body, illustration, delay = 0 }: BentoCardProps) {
  return (
    <Reveal as="div" delay={delay} className="h-full min-h-0">
      <div className="bento-card flex h-full flex-col overflow-hidden rounded-[24px] bg-sand-200">
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="bento-card-visual">{illustration}</div>
        </div>
        {/* Illustration wrapper is flex-1 + overflow-hidden so a crop taller
            than the remaining cell clips the artwork instead of pushing the
            title off the bottom. Text stays flush at the card's bottom, as
            Figma's Rectangle 20 does. */}
        <div className="mt-auto p-6 pt-0">
          <h4 className="bento-card-title text-xl leading-[30px] font-bold text-stone-900">
            {title}
          </h4>
          <p className="mt-2 max-w-[320px] text-xl leading-[30px] text-stone-700">{body}</p>
        </div>
      </div>
    </Reveal>
  )
}
