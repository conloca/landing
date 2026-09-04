import { describe, expect, test } from 'bun:test'
import {
  SCROLL_OFFSET,
  activeIndexFor,
  hasRevealStarted,
  scrollSpan,
  slotThresholds,
  type ScrollOffset,
} from '@/components/motion/scroll-stack-geometry'

const END_END: ScrollOffset = ['start start', 'end end']

/**
 * Progress at which card `index` is actually covered, worked out from layout in
 * pixels rather than from the threshold formula: card `index` is covered once
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
    // `'end end'` spans 1538px instead of 2538px, so card 0 would be marked
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
    // Under `'end end'` the last card's arrival fell outside the range entirely
    // for any slot shorter than the viewport, so clamping it to 1 marked the
    // card before it inert while that card was still the visible, pinned one.
    for (const count of [1, 2, 3, 7]) {
      for (const threshold of slotThresholds(count)) {
        expect(threshold).toBeGreaterThanOrEqual(0)
        expect(threshold).toBeLessThan(1)
      }
    }
  })

  test('a single card, and a zero count, both yield one usable threshold', () => {
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

  test('never reports a card that has not arrived', () => {
    // What `inert` is gated on: reporting an index too early takes the buttons
    // of the card the visitor is reading out of the Tab order while they are
    // still on screen. Measured at 154px of scrolling on a 1000px-tall window
    // before this change.
    for (let progress = 0; progress <= 1; progress += 0.001) {
      const index = activeIndexFor(progress, thresholds)
      expect(progress).toBeGreaterThanOrEqual(thresholds[index] as number)
    }
  })

  test('a single card is always index 0', () => {
    expect(activeIndexFor(0.9, slotThresholds(1))).toBe(0)
  })
})

describe('hasRevealStarted', () => {
  // Regression for a real, shipped bug: `StackSlide` used to hide a slide
  // until `activeIndex === index` (the moment its reveal *finishes*, not
  // starts), so the zoom/slide/fade animation played entirely while
  // `visibility: hidden`. The invariant this guards — proved directly from
  // `activeIndexFor`'s own definition ("largest `i` with `progress >=
  // thresholds[i]`") rather than re-implemented — is that a slide's reveal
  // window opens exactly when its predecessor arrives, i.e. `activeIndex`
  // reaches `index - 1`.
  test('is exactly equivalent to "progress has reached this slide\'s reveal start"', () => {
    const thresholds = slotThresholds(4)
    for (let progress = 0; progress <= 1; progress += 0.001) {
      const activeIndex = activeIndexFor(progress, thresholds)
      for (let index = 1; index < thresholds.length; index += 1) {
        const revealStartsAt = thresholds[index - 1] as number
        expect(hasRevealStarted(activeIndex, index)).toBe(progress >= revealStartsAt)
      }
    }
  })

  // The bug this guards against, stated directly: the pre-fix predicate
  // (`index > activeIndex`, i.e. `!hasRevealStarted` without the `+ 1`) kept
  // a slide hidden for every progress value in its own reveal window.
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
      if (buggyNotYetArrived(activeIndex) && hasRevealStarted(activeIndex, index)) sawTheBug = true
    }
    expect(sawTheBug).toBe(true)
  })

  test('the first slide has no reveal window and is always already started', () => {
    for (const activeIndex of [0, 1, 2, 99]) {
      expect(hasRevealStarted(activeIndex, 0)).toBe(true)
    }
  })

  test('reverse scroll re-hides a slide once its predecessor is no longer active', () => {
    // activeIndex falling back below `index - 1` (scrolling back up) must
    // flip this back to false — the gate is a pure function of the current
    // position, not a one-way latch.
    expect(hasRevealStarted(2, 3)).toBe(true)
    expect(hasRevealStarted(1, 3)).toBe(false)
  })
})
