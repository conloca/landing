import { describe, expect, test } from 'bun:test'
import {
  SCROLL_OFFSET,
  activeIndexFor,
  revealStart,
  scrollSpan,
  slotThresholds,
  type ScrollOffset,
} from '@/components/motion/scroll-stack-geometry'

const END_END: ScrollOffset = ['start start', 'end end']

/**
 * Progress at which slide `index` is actually covered, worked out from layout in
 * pixels rather than from the threshold formula: slide `index` is covered once
 * slot `index + 1` has scrolled to the top of the viewport, which takes
 * `(index + 1) * slotHeight` pixels, and the offset decides how many pixels one
 * unit of progress is worth.
 *
 * Going through `scrollSpan` is what makes this a real test. An earlier version
 * divided by `count * slotHeight` directly, so the slot height cancelled inside
 * the helper and it compared `i / count` against `i / count` — green for every
 * input, including the broken ones.
 */
function coveredAtProgress(
  index: number,
  count: number,
  slotHeight: number,
  viewportHeight: number,
  offset: ScrollOffset,
): number {
  const sectionHeight = count * slotHeight
  return ((index + 1) * slotHeight) / scrollSpan(offset, sectionHeight, viewportHeight)
}

describe('slotThresholds under SCROLL_OFFSET', () => {
  test('arrival matches the layout at every slot height, including ones unlike the viewport', () => {
    // The fixed-846px change broke the stack on a 1000px-tall window. These are
    // the cases that must hold: the slot height and the viewport height are
    // independent, and the thresholds must not care.
    const viewportHeight = 1000
    for (const slotHeight of [500, 700, 846, 1000, 1234]) {
      for (const count of [2, 3, 5]) {
        const thresholds = slotThresholds(count)
        for (let index = 0; index < count - 1; index += 1) {
          expect(thresholds[index + 1]).toBeCloseTo(
            coveredAtProgress(index, count, slotHeight, viewportHeight, SCROLL_OFFSET),
            12,
          )
        }
      }
    }
  })

  test('the same thresholds are wrong under the range this replaced', () => {
    // Guards the pairing rather than either half of it: reverting the offset to
    // `'end end'` while leaving the thresholds alone is the plausible future
    // edit, and it must not stay green. With a 846px slot on a 1000px window,
    // `'end end'` spans 1538px instead of 2538px, so slide 0 would be marked
    // covered well before its coverer arrives.
    const covered = coveredAtProgress(0, 3, 846, 1000, END_END)
    expect(covered).not.toBeCloseTo(slotThresholds(3)[1] as number, 6)
    expect(covered).toBeGreaterThan(slotThresholds(3)[1] as number)
  })

  test('the offset in force is the one the thresholds are correct for', () => {
    expect(SCROLL_OFFSET[1]).toBe('end start')
  })

  test('starts at zero and rises', () => {
    expect(slotThresholds(3)).toEqual([0, 1 / 3, 2 / 3])
    expect(slotThresholds(4)).toEqual([0, 0.25, 0.5, 0.75])
  })

  test('every threshold is reachable within the scroll range', () => {
    // Under `'end end'` the last slide's arrival fell outside the range entirely
    // for any slot shorter than the viewport, so clamping it to 1 marked the
    // slide before it inert while that slide was still the visible, pinned one.
    for (const count of [1, 2, 3, 7]) {
      for (const threshold of slotThresholds(count)) {
        expect(threshold).toBeGreaterThanOrEqual(0)
        expect(threshold).toBeLessThan(1)
      }
    }
  })

  test('a single slide, and a zero count, both yield one usable threshold', () => {
    expect(slotThresholds(1)).toEqual([0])
    expect(slotThresholds(0)).toEqual([0])
  })
})

describe('scrollSpan', () => {
  test('the chosen offset spans the section, independent of the viewport', () => {
    expect(scrollSpan(SCROLL_OFFSET, 2538, 1000)).toBe(2538)
    expect(scrollSpan(SCROLL_OFFSET, 2538, 700)).toBe(2538)
  })

  test('the replaced offset drags the viewport into the span', () => {
    expect(scrollSpan(END_END, 2538, 1000)).toBe(1538)
    expect(scrollSpan(END_END, 2538, 700)).toBe(1838)
  })
})

describe('activeIndexFor', () => {
  const thresholds = slotThresholds(3)

  test('changes exactly at each threshold', () => {
    expect(activeIndexFor(0, thresholds)).toBe(0)
    expect(activeIndexFor(1 / 3 - 1e-9, thresholds)).toBe(0)
    expect(activeIndexFor(1 / 3, thresholds)).toBe(1)
    expect(activeIndexFor(2 / 3 - 1e-9, thresholds)).toBe(1)
    expect(activeIndexFor(2 / 3, thresholds)).toBe(2)
    expect(activeIndexFor(1, thresholds)).toBe(2)
  })

  test('never reports a slide that has not arrived', () => {
    // What `inert` is gated on: reporting an index too early takes the buttons
    // of the slide the visitor is reading out of the Tab order while they are
    // still on screen. Measured at 154px of scrolling on a 1000px-tall window
    // before this change.
    for (let progress = 0; progress <= 1; progress += 0.001) {
      const index = activeIndexFor(progress, thresholds)
      expect(progress).toBeGreaterThanOrEqual(thresholds[index] as number)
    }
  })

  test('a single slide is always index 0', () => {
    expect(activeIndexFor(0.9, slotThresholds(1))).toBe(0)
  })
})

describe('revealStart', () => {
  // Regression for a real, shipped bug: `StackSlide` used to hide a slide
  // until `activeIndex === index` (the moment its reveal *finishes*, not
  // starts), so the zoom/slide/fade animation played entirely while
  // `visibility: hidden`. The invariant this guards is that a slide's reveal
  // window opens exactly when its predecessor arrives, i.e. at
  // `thresholds[index - 1]` — proved here against `activeIndexFor`'s own
  // definition ("largest `i` with `progress >= thresholds[i]`") rather than
  // re-implemented.
  test('a slide has reached its reveal exactly when activeIndexFor says its predecessor arrived', () => {
    // Cross-checked against `activeIndexFor` — the function `StackSlide`'s
    // old, buggy `activeIndex`-based gate actually called — rather than
    // against `thresholds[index - 1]` directly, which is `revealStart`'s own
    // formula and would make this test pass for any implementation that
    // happens to return that value, regression or not.
    const thresholds = slotThresholds(4)
    for (let progress = 0; progress <= 1; progress += 0.001) {
      const activeIndex = activeIndexFor(progress, thresholds)
      for (let index = 1; index < thresholds.length; index += 1) {
        expect(progress >= revealStart(thresholds, index)).toBe(activeIndex >= index - 1)
      }
    }
  })

  // The bug this guards against, stated directly: the pre-fix predicate
  // (`index > activeIndex`) kept a slide hidden for every progress value in
  // its own reveal window, because it compared against the slide's own
  // arrival rather than its predecessor's.
  test('the pre-fix predicate would have failed across the whole reveal window', () => {
    const thresholds = slotThresholds(3)
    const index = 1
    const buggyNotYetArrived = (activeIndex: number) => index > activeIndex
    let sawTheBug = false
    for (
      let progress = thresholds[0] as number;
      progress < (thresholds[1] as number);
      progress += 0.001
    ) {
      const activeIndex = activeIndexFor(progress, thresholds)
      if (buggyNotYetArrived(activeIndex) && progress >= revealStart(thresholds, index)) {
        sawTheBug = true
      }
    }
    expect(sawTheBug).toBe(true)
  })

  test('the first slide has no reveal window and is always already started', () => {
    const thresholds = slotThresholds(4)
    expect(revealStart(thresholds, 0)).toBe(0)
    // 0 is the smallest value progress can ever be, so this holds trivially
    // at every scroll position without index 0 needing a special case.
    expect(0 >= revealStart(thresholds, 0)).toBe(true)
  })

  test("reverse scroll re-hides a slide once progress drops back below its predecessor's arrival", () => {
    // A pure function of position, not a one-way latch: `progress >=
    // revealStart(...)` must flip back to false when progress falls back
    // below the threshold, exactly as it flips true crossing it forward.
    const thresholds = slotThresholds(4)
    const index = 3
    expect(thresholds[index - 1] as number).toBeGreaterThan(0)
    expect((thresholds[index - 1] as number) >= revealStart(thresholds, index)).toBe(true)
    expect(0 >= revealStart(thresholds, index)).toBe(false)
  })
})
