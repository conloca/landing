import type { CSSProperties } from 'react'

/**
 * The vertical rail needs an explicit track length, and `h-full` cannot give
 * it one: the rail's flex-col parent has no height of its own to stretch
 * from, so a percentage-based fill silently collapses to zero. Carried as a
 * custom property rather than a fixed height so only the `lg` class consumes
 * it — below `lg` the tracks run horizontally and take their length from the
 * design's own widths instead.
 */
const RAIL_TRACK: CSSProperties = { '--rail-track': '28px' } as CSSProperties

const BARS = [
  { id: 'active', filled: true, width: 'w-[27px]' },
  { id: 'upcoming-1', filled: false, width: 'w-[23px]' },
  { id: 'upcoming-2', filled: false, width: 'w-[23px]' },
]

/**
 * Three progress bars imply three rotating slides, but only one slide's copy
 * exists in the Figma file (see docs/QUESTIONS-DESIGNER.md). Rendered static
 * with the first bar filled, rather than fabricating rotation content.
 *
 * The design turns the rail through 90 degrees below `lg`: desktop runs it as
 * a vertical gutter beside left-aligned copy, mobile centres the copy and
 * lays the bars out horizontally beneath it. Same three tracks either way, so
 * this is one component with the axis flipped rather than two.
 */
export function CarouselRail() {
  return (
    <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start">
      <div className="order-2 flex gap-1 lg:order-1 lg:flex-col" aria-hidden>
        {BARS.map((bar) => (
          <span
            key={bar.id}
            style={RAIL_TRACK}
            className={`h-0.5 overflow-hidden rounded-full bg-stone-300 lg:h-[var(--rail-track)] lg:w-0.5 lg:bg-stone-200 ${bar.width}`}
          >
            {bar.filled ? (
              <span className="block h-full w-[15px] rounded-full bg-stone-500 lg:w-full lg:bg-stone-400" />
            ) : null}
          </span>
        ))}
      </div>
      <p className="order-1 max-w-[337px] text-center text-base leading-[1.7] font-bold text-stone-700 italic sm:max-w-[576px] lg:order-2 lg:max-w-[432px] lg:text-left lg:leading-normal lg:not-italic">
        {/* "MDS" is verbatim from the Figma copy — likely a typo for "MDX", see docs/QUESTIONS-DESIGNER.md */}
        Map your React components to typed schemas and MDS blocks in the IDE.
        Visual edits respect the structure you define and stay in Git.
      </p>
    </div>
  )
}
