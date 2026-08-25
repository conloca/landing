// Equal fixed-height tracks (not h-full/percentages: the rail's flex-col
// parent has no height of its own to stretch from, so a percentage-based
// fill silently collapses to 0) — the active bar's fill is full height, the
// upcoming bars show empty track only.
const BAR_HEIGHT = 28
const BAR_HEIGHT_STYLE = { height: BAR_HEIGHT }
const BARS = [
  { id: 'active', filled: true },
  { id: 'upcoming-1', filled: false },
  { id: 'upcoming-2', filled: false },
]

/**
 * Three progress bars imply three rotating slides, but only one slide's copy
 * exists in the Figma file (see docs/QUESTIONS-DESIGNER.md). Rendered static
 * with the first bar filled, rather than fabricating rotation content.
 */
export function CarouselRail() {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-1" aria-hidden>
        {BARS.map((bar) => (
          <span
            key={bar.id}
            className="w-0.5 overflow-hidden rounded-full bg-stone-200"
            style={BAR_HEIGHT_STYLE}
          >
            {bar.filled ? <span className="block h-full w-full rounded-full bg-stone-400" /> : null}
          </span>
        ))}
      </div>
      <p className="max-w-[432px] text-base font-bold text-stone-700">
        {/* "MDS" is verbatim from the Figma copy — likely a typo for "MDX", see docs/QUESTIONS-DESIGNER.md */}
        Map your React components to typed schemas and MDS blocks in the IDE.
        Visual edits respect the structure you define and stay in Git.
      </p>
    </div>
  )
}
