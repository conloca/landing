/**
 * The pure rotation logic behind `CarouselRail`, kept apart from the
 * component so it can be tested as arithmetic rather than through a
 * component-rendering harness this repo doesn't have — same rationale as
 * `src/components/motion/scroll-stack-geometry.ts`.
 */

/**
 * A real 5-second fill reports `elapsedTime` close to 5. A user "disable
 * animations" stylesheet/extension (a common `* { animation-duration: 0.01s
 * !important }` snippet) can't remove the animation — `!important` beats the
 * Tailwind utility — so `animationend` keeps firing, just almost instantly.
 * Without this floor that turns into a hot render loop: every fire calls
 * `advance`, which re-mounts a fresh fill span, which fires again. One
 * second is comfortably below any real cycle and comfortably above what a
 * near-zero override produces.
 *
 * The floor is a lower bound on `--carousel-cycle-ms` (`src/index.css`): a
 * cycle tuned below `MIN_FILL_ELAPSED_SECONDS * 1000` would have every
 * `animationend` swallowed by `shouldAdvance` below, permanently stalling
 * rotation on whichever slide is active with no error. The two constants
 * can't share a source across a CSS variable and a TS module, so this note
 * and the mirroring one in `src/index.css` are how that constraint stays
 * visible from either side — `carousel-rotation.test.ts` enforces it.
 *
 * Known accepted gap: this only degrades gracefully (to a static slide 1)
 * for visitors the app can *detect* as reduced-motion, via
 * `prefers-reduced-motion`. A "disable animations" browser extension without
 * that OS-level preference set is invisible to `useReducedMotion()`, so
 * `isRotating` stays true and the fill genuinely stalls on slide 1 forever
 * for that visitor — losing slides 2 and 3, unlike the reduced-motion case,
 * which gets the full static list instead (see the `isRotating` branch in
 * `CarouselRail.tsx`). There is no reliable way to distinguish "the browser
 * is being told not to animate" from "the OS asked for reduced motion" from
 * inside `animationend` alone; narrow enough to accept rather than add a
 * second, less certain detection path for.
 */
export const MIN_FILL_ELAPSED_SECONDS = 1

/**
 * The two CSS animation names the fill span switches between at `lg` (see
 * `src/index.css`). `shouldAdvance` below uses this list to recognize an
 * `animationend` as one of the carousel's own fills rather than some other
 * animation added to the same span later; `carousel-rotation.test.ts`
 * separately asserts these names still appear in `CarouselRail.tsx`'s class
 * strings and in `src/index.css`'s `@keyframes` blocks, which is the actual
 * drift guard for that string coupling (this constant doesn't reach the
 * component's own class strings — those stay literal Tailwind utilities, so
 * the scanner has real source to check).
 */
export const FILL_ANIMATION_NAMES = ['carousel-fill-x', 'carousel-fill-y'] as const

/**
 * The wrap-around step for slide rotation, advancing to the next slide (or
 * back to the first, from the last).
 */
export function nextSlideIndex(current: number, slideCount: number): number {
  return (current + 1) % slideCount
}

/**
 * Whether a fill's `animationend` should count as a real cycle completion:
 * it fired from one of this component's own fill animations (not some
 * unrelated animation added to the same span later), and it ran long enough
 * to not be a near-instant one produced by a "disable animations" override
 * (see `MIN_FILL_ELAPSED_SECONDS` above).
 */
export function shouldAdvance(
  animationName: string,
  elapsedTime: number,
  floorSeconds: number = MIN_FILL_ELAPSED_SECONDS,
): boolean {
  return (FILL_ANIMATION_NAMES as readonly string[]).includes(animationName) && elapsedTime >= floorSeconds
}
