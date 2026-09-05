/**
 * The scroll geometry behind `ScrollStack`, kept apart from the component so it
 * can be tested as arithmetic rather than through a rendered page. The rule
 * these functions encode used to live in a comment, and a comment did not stop
 * a pixel-convergence pass from breaking it (reverted in 7f5a052).
 *
 * The whole design rests on one pairing: the scroll range and the arrival
 * thresholds are chosen together so that the slot height cancels out. Because
 * they are only correct together, they live in one module and are exported as
 * one unit — editing either alone is the failure this file exists to prevent,
 * and `scroll-stack-geometry.test.ts` fails if they drift.
 */

/**
 * The scroll range `ScrollStack` hands to `useScroll`.
 *
 * `'end start'` — the section's bottom reaching the viewport's *top* — so the
 * range spans the section's own full height. `'end end'` spans
 * `section - viewport` instead, which puts the viewport in the denominator and
 * makes the thresholds depend on the slot happening to be exactly one viewport
 * tall. That is the coupling the fixed-846px change tripped over.
 */
export const SCROLL_OFFSET = ['start start', 'end start'] as const

export type ScrollOffset = typeof SCROLL_OFFSET | readonly ['start start', 'end end']

/**
 * How many pixels of scrolling the progress value 0 → 1 covers.
 *
 * Exists so a test can state the arrival of a slide in pixels and convert, which
 * is what makes the offset choice observable: swap the offset and this span
 * changes, and the thresholds below stop matching the layout.
 */
export function scrollSpan(
  offset: ScrollOffset,
  sectionHeight: number,
  viewportHeight: number,
): number {
  return offset[1] === 'end start' ? sectionHeight : sectionHeight - viewportHeight
}

/**
 * Progress at which each slide arrives at the top of the viewport.
 *
 * Every slot is the same height (`ScrollStack` gives them all one class), so
 * slide `i` arrives after `i` slot-heights out of the section's `count` of them:
 * `i / count`. The slot height cancels, which is the point — correct at 700px
 * slots, at 846px slots, and at any other uniform height, so nothing has to ask
 * a future editor to keep the height and the arithmetic in step.
 *
 * Only true under `SCROLL_OFFSET`. See the module header.
 */
export function slotThresholds(count: number): number[] {
  const slots = Math.max(1, count)
  return Array.from({ length: slots }, (_unused, index) => index / slots)
}

/** Largest `i` whose arrival threshold the scroll has already passed. */
export function activeIndexFor(progress: number, thresholds: readonly number[]): number {
  let index = 0
  for (let i = 1; i < thresholds.length; i += 1) {
    if (progress >= (thresholds[i] ?? Infinity)) index = i
  }
  return index
}

/**
 * Where slide `index`'s own reveal window begins — the single number both
 * `ScrollStack.tsx`'s `MotionSlide` (the opacity fade, `[revealStart(...),
 * thresholds[index]]`) and its `StackSlide` (the `invisible` gate, `progress
 * >= revealStart(...)`) key off, so the two can't drift apart the way two
 * independently hand-kept copies of the same threshold silently did before
 * this function existed — see `scroll-stack-geometry.test.ts` for the
 * regression this guards.
 *
 * A slide's reveal runs from its predecessor's arrival to its own arrival:
 * `thresholds[index - 1]`. The first slide has no predecessor and is never
 * revealed in (it is already the active slide the instant the section is
 * reached), so its reveal is defined to have already started — `0`, the
 * smallest value `progress` can ever be, so `progress >= revealStart(_, 0)`
 * is always true without index 0 needing its own special case at each call
 * site.
 */
export function revealStart(thresholds: readonly number[], index: number): number {
  return index <= 0 ? 0 : (thresholds[index - 1] ?? 0)
}
