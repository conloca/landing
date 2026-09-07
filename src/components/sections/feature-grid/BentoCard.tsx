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
 * Radius and surface are written as explicit values, not theme tokens: this
 * theme's `rounded-3xl` resolves to 22px, close enough to the design's figure
 * to look right and wrong enough to drift silently.
 *
 * The two sources we have disagree — `docs/figma/DESIGN-SPEC.md` records
 * radius 32 on a sand tint (`#F5F6EF`), while a later pass measuring the node
 * tree read radius 24 on `#FAFAF9`. The measurement wins here because it came
 * from the tree rather than a summary of it, but the conflict is unresolved
 * and is in docs/QUESTIONS-DESIGNER.md.
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
    <Reveal as="div" delay={delay} className="min-h-0">
      <div className="bento-card flex h-full flex-col overflow-hidden rounded-[24px] bg-[#FAFAF9]">
        <div className="overflow-hidden">
          <div className="bento-card-visual">{illustration}</div>
        </div>
        {/* `mt-auto`: the card still stretches to its grid row's full height
            (`h-full` above), and nothing else absorbs the slack now that the
            illustration is a natural-height `<img>` rather than a `flex-1`
            filler — without it, a row taller than the image + text leaves
            visible empty space below the text instead of the text sitting
            flush at the card's bottom, as Figma's `Rectangle 20` does. */}
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
