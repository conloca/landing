import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'
import {
  FILL_ANIMATION_NAMES,
  MIN_FILL_ELAPSED_SECONDS,
  nextSlideIndex,
  shouldAdvance,
} from '@/components/sections/hero/carousel-rotation'

/**
 * `nextSlideIndex` and `shouldAdvance` are the entire behavioral contract of
 * the carousel's rotation: every slide advance (triggered by the active
 * bar's `animationend`, not a timer — see `CarouselRail.tsx`) checks
 * `shouldAdvance` before taking the `nextSlideIndex` step. There's no
 * component-rendering harness in this repo (no `bun test` DOM setup), so
 * these pure functions are exported specifically to make that contract
 * testable without one.
 */
describe('nextSlideIndex', () => {
  test('advances by one within bounds', () => {
    expect(nextSlideIndex(0, 3)).toBe(1)
    expect(nextSlideIndex(1, 3)).toBe(2)
  })

  test('wraps from the last slide back to the first', () => {
    expect(nextSlideIndex(2, 3)).toBe(0)
  })

  test('wraps immediately for a single slide', () => {
    expect(nextSlideIndex(0, 1)).toBe(0)
  })
})

describe('shouldAdvance', () => {
  test('rejects an elapsed time below the floor', () => {
    expect(shouldAdvance('carousel-fill-x', 0.01, 1)).toBe(false)
    expect(shouldAdvance('carousel-fill-x', 0.99, 1)).toBe(false)
  })

  test('accepts an elapsed time at or above the floor', () => {
    expect(shouldAdvance('carousel-fill-x', 1, 1)).toBe(true)
    expect(shouldAdvance('carousel-fill-y', 5, 1)).toBe(true)
  })

  test('defaults to the component floor when none is passed', () => {
    expect(shouldAdvance('carousel-fill-x', 0.99)).toBe(false)
    expect(shouldAdvance('carousel-fill-x', 1)).toBe(true)
  })

  test('rejects any animation that is not one of the fill animations', () => {
    expect(shouldAdvance('some-other-animation', 5, 1)).toBe(false)
  })
})

/**
 * `--carousel-cycle-ms` (`src/index.css`) and `MIN_FILL_ELAPSED_SECONDS`
 * (this module) are two independent numbers that must stay in one
 * relationship — the cycle can never be tuned below the floor, or every
 * `animationend` gets swallowed and rotation silently stalls forever (see
 * the comment on `MIN_FILL_ELAPSED_SECONDS`). A CSS variable and a TS
 * constant can't share one source, so this test is the enforcement: it
 * fails `bun run test` the moment someone edits `--carousel-cycle-ms` below
 * the floor, rather than leaving it as a comment someone has to remember to
 * re-read. (This repo's committed gate is `bun run lint && bun run
 * typecheck`, not `bun run test` — this catches the mistake for whoever
 * runs the test suite, not automatically for everyone.)
 */
test('the CSS cycle duration never drops below the rotation floor', () => {
  const css = readFileSync(new URL('../../../index.css', import.meta.url), 'utf8')
  const match = /--carousel-cycle-ms:\s*(\d+)ms/.exec(css)
  if (!match) throw new Error('--carousel-cycle-ms not found in src/index.css')

  const cycleMs = Number(match[1])
  expect(cycleMs).toBeGreaterThanOrEqual(MIN_FILL_ELAPSED_SECONDS * 1000)
})

/**
 * `CarouselRail.tsx` drives the fill purely through Tailwind utility class
 * names (`animate-carousel-fill-x`/`-y`), which only mean anything because
 * `src/index.css` defines a `--animate-carousel-fill-*` theme key whose
 * *value* references a matching `@keyframes` block and the shared
 * `--carousel-cycle-ms` variable. Nothing type-checks this string coupling:
 * rename or typo any one of the four names, or swap the variable reference
 * for a literal duration, and the class silently stops matching any rule —
 * `animationend` never fires, and rotation sits on slide 1 forever with no
 * error anywhere. Checking that each piece merely *exists* somewhere in the
 * file (an earlier version of this test did exactly that) would still pass
 * with a one-character typo in the value that breaks the wiring; matching
 * the whole declaration as one string is what actually catches it.
 */
test('the animation class names stay wired to their CSS definitions', () => {
  const component = readFileSync(
    new URL('./CarouselRail.tsx', import.meta.url),
    'utf8',
  )
  const css = readFileSync(new URL('../../../index.css', import.meta.url), 'utf8')

  for (const axis of ['x', 'y'] as const) {
    const className = `animate-carousel-fill-${axis}`
    expect(component).toContain(className)
    expect(css).toMatch(
      new RegExp(
        `--${className}:\\s*carousel-fill-${axis}\\s+var\\(--carousel-cycle-ms\\)`,
      ),
    )
    expect(css).toContain(`@keyframes carousel-fill-${axis}`)
  }

  for (const animationName of FILL_ANIMATION_NAMES) {
    expect(component).toContain(animationName)
  }
})

/**
 * `data-paused` only pauses the fill because the fill span also carries
 * `group-data-[paused=true]:[animation-play-state:paused]` — the same
 * silent-string-drift risk as the animation names above, just for the
 * manual-pause wiring instead of the rotation wiring: rename the attribute,
 * change its value, or drop the utility class, and the pause toggle stops
 * pausing anything with no error anywhere.
 */
test('the manual-pause attribute stays wired to its CSS definition', () => {
  const component = readFileSync(
    new URL('./CarouselRail.tsx', import.meta.url),
    'utf8',
  )

  expect(component).toContain('data-paused=')
  expect(component).toContain('group-data-[paused=true]:[animation-play-state:paused]')
})
