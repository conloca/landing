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
 * Exists so a test can state the arrival of a card in pixels and convert, which
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
 * Progress at which each card arrives at the top of the viewport.
 *
 * Every slot is the same height (`ScrollStack` gives them all one class), so
 * card `i` arrives after `i` slot-heights out of the section's `count` of them:
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
 * Whether slide `index`'s own reveal window has opened yet.
 *
 * A slide's reveal runs from its predecessor's arrival to its own arrival —
 * `[thresholds[index - 1], thresholds[index]]` in `ScrollStack.tsx`'s
 * `MotionCard`. Predecessor `index - 1` arrives exactly when `activeIndexFor`
 * would return `index - 1`, which (by that function's own definition) is
 * exactly `activeIndex >= index - 1`. Expressing that equivalence here once,
 * rather than re-deriving it separately at each call site, is what keeps
 * `MotionCard`'s animation window and `StackSlide`'s visibility gate from
 * silently drifting apart if one is ever re-timed without the other — see
 * `scroll-stack-geometry.test.ts` for the regression this guards.
 *
 * The first slide has no predecessor and is never revealed in (it is already
 * the active slide the instant the section is reached), so it always reports
 * started.
 */
export function hasRevealStarted(activeIndex: number, index: number): boolean {
  return index <= 0 || activeIndex >= index - 1
}

/**
 * The progress window over which slide `index` reveals itself in: from its
 * predecessor's arrival to its own. This is the one place that window is
 * defined — `MotionCard` animates over it and `interactiveIndexFor` hands
 * interactivity over inside it, and both read it from here so the two cannot
 * be re-timed independently.
 *
 * The first slide has no predecessor and no window (`[0, 0]`, an empty
 * interval — `MotionCard` treats that as "never animate"). An index beyond the
 * thresholds yields an inverted interval (`end` falls back to 0) rather than
 * throwing; `MotionCard`'s `hasRange` rejects that the same way.
 */
export function revealWindow(
  thresholds: readonly number[],
  index: number,
): readonly [start: number, end: number] {
  if (index <= 0) return [0, 0]
  return [thresholds[index - 1] ?? 0, thresholds[index] ?? 0]
}

/**
 * Fraction of a slide's reveal window after which it is fully opaque. The
 * arriving slide fades 0.7 → 1 over this first part of its window and holds
 * at 1 for the rest (`MotionCard` in `ScrollStack.tsx`). Its zoom and rise
 * keep settling over the remainder, so at this point it is opaque and drawn
 * on top but a thin margin of the slide beneath is still exposed around its
 * edges — margin only, no control of the slide beneath lives there.
 */
export const REVEAL_OPAQUE_AT = 0.5

/** Progress at which slide `index` becomes fully opaque (see `REVEAL_OPAQUE_AT`). */
export function revealOpaqueAt(thresholds: readonly number[], index: number): number {
  const [start, end] = revealWindow(thresholds, index)
  return start + (end - start) * REVEAL_OPAQUE_AT
}

/**
 * The slide that is visually on top, and therefore the only one that may be
 * interactive.
 *
 * `activeIndexFor` flips at a slide's *arrival* (the end of its reveal window),
 * but the arriving slide is drawn above the active one (higher z-index) and is
 * fully opaque from `revealOpaqueAt` onwards. Gating `inert` on `activeIndex`
 * alone therefore left the arriving slide — the one the visitor is looking
 * at — dead to clicks and Tab for the second half of every transition, and a
 * visitor who stops scrolling there hits a dead button. This flips at the
 * opacity handover instead, so exactly one slide is interactive at every
 * scroll position and it is always the one on top. Before the handover the
 * arriving slide is still translucent, the slide beneath shows through, and
 * that one stays the interactive one.
 *
 * The first slide has no reveal window, so it is interactive from progress 0.
 */
export function interactiveIndexFor(progress: number, thresholds: readonly number[]): number {
  let index = 0
  for (let i = 1; i < thresholds.length; i += 1) {
    if (progress >= revealOpaqueAt(thresholds, i)) index = i
  }
  return index
}
