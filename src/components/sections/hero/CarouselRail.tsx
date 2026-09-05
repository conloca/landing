import type { AnimationEvent, CSSProperties, KeyboardEvent } from 'react'
import { useCallback, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { useHydrated } from '@/components/motion/Reveal'
import { nextSlideIndex, shouldAdvance } from '@/components/sections/hero/carousel-rotation'

/**
 * The vertical rail needs an explicit track length, and `h-full` cannot give
 * it one: the rail's flex-col parent has no height of its own to stretch
 * from, so a percentage-based fill silently collapses to zero. Carried as a
 * custom property rather than a fixed height so only the `lg` class consumes
 * it — below `lg` the tracks run horizontally and take their length from the
 * design's own widths instead.
 */
const RAIL_TRACK: CSSProperties = { '--rail-track': '28px' } as CSSProperties

/** Per-position track widths below `lg`, from the Figma static frame. Fixed
 * to bar position, not to which slide is active — the design only shows one
 * static frame, so there is no evidence the widths should follow rotation. */
const TRACK_WIDTH_CLASSES = ['w-[27px]', 'w-[23px]', 'w-[23px]'] as const
const LAST_TRACK_WIDTH_CLASS = TRACK_WIDTH_CLASSES[TRACK_WIDTH_CLASSES.length - 1]

function trackWidthFor(index: number): string {
  return TRACK_WIDTH_CLASSES[index] ?? LAST_TRACK_WIDTH_CLASS
}

interface CarouselRailProps {
  slides: readonly string[]
}

/**
 * Auto-advances through `slides` every 5 seconds. The active bar's progress
 * rail fills over the same 5 seconds via a CSS animation
 * (`carousel-fill-x`/`-y` in `src/index.css`); advancing to the next slide is
 * triggered by that animation's `animationend` event, not a JS timer, so
 * pausing the animation (`animation-play-state: paused`, gated on
 * `data-paused` — see `manuallyPaused` below) pauses the advance for free.
 *
 * Pausing is a single sticky tap/click/Enter/Space toggle on the progress
 * bars, and nothing else — no separate hover- or focus-triggered pause.
 * That is a correction, not the original design: an earlier revision also
 * paused on CSS `:hover`/`:focus-within`, on the reasoning that a keyboard
 * or mouse user reaching the carousel should pause it immediately, without
 * needing to act. In practice that meant two independent, uncoordinated
 * pause sources — the toggle and the pseudo-class — and every attempt to
 * announce an accurate combined state, or to make the toggle reliably
 * *resume* while the mouse was still hovering or focus was still present,
 * produced a new bug (see git history on this file for the specifics).
 * Reviewed repeatedly and reverted: the toggle alone already satisfies WCAG
 * 2.2.2 (`tabIndex` gives a keyboard-only visitor somewhere to Tab to, and
 * Enter/Space pauses/resumes it there), so the extra pause source was
 * solving a problem accessibility didn't have and creating ones that
 * mattered more. One pause source means `manuallyPaused` is always the
 * complete, exactly-accurate truth of whether the carousel is paused.
 *
 * The toggle's interactive attributes (`role="button"`, `tabIndex`,
 * `aria-pressed`, the click/keydown handlers) live on the progress-bars
 * container below, not on this component's outer wrapping element — a
 * toggle button needs a widget role for its state to be exposed at all
 * (WCAG 4.1.2 Name/Role/Value; the outer element also wraps the slide text,
 * which a button's accessible-content flattening would swallow). The bars
 * are otherwise purely decorative, so exposing them as the control and
 * driving their accessible name entirely from `aria-label` costs nothing —
 * their own child markup never needs independent text.
 *
 * `aria-live` only announces while rotation is off: a live region that
 * fires every 5 seconds forever would interrupt a screen-reader user
 * reading anywhere on the page, not just while they're looking at the hero,
 * which is worse than saying nothing. The static branch's `aria-live` is
 * for a real mutation this component has, independent of rotation: the
 * audience switch elsewhere on the page swaps `slides`' content, and a
 * reduced-motion screen-reader user should hear the new copy.
 *
 * The prerendered/pre-hydration markup renders all three slides stacked as
 * plain paragraphs — never the single-active grid below — for two reasons
 * at once: an `opacity: 0` reaching the server output would violate this
 * repo's load-bearing "the prerendered page must be fully readable with JS
 * disabled" rule (see AGENTS.md), and `docs/QUESTIONS-DESIGNER.md`'s open
 * decision that *all* landing copy is visible without JavaScript would
 * otherwise be broken for slides 2 and 3 specifically. Anyone whose bundle
 * never runs, and every reduced-motion visitor permanently (`isRotating` is
 * always false for them), sees the full static list instead of losing two
 * thirds of the copy. Rotation only switches to the all-slides grid — see
 * the comment on that branch — once `isRotating` turns true post-hydration,
 * which is a normal client re-render, not a hydration mismatch (the server
 * and first client passes both take the stacked-list branch, so their
 * markup is byte-identical).
 *
 * Only the first slide's text was ever supplied by the design — see the
 * `carousel` field comment in `src/lib/content/hero-copy.ts`.
 *
 * The design turns the rail through 90 degrees below `lg`: desktop runs it as
 * a vertical gutter beside left-aligned copy, mobile centres the copy and
 * lays the bars out horizontally beneath it. Same three tracks either way, so
 * this is one component with the axis flipped rather than two.
 */
export function CarouselRail({ slides }: CarouselRailProps) {
  const hydrated = useHydrated()
  const reducedMotion = useReducedMotion()
  // Server pass, first client render, and reduced motion all render the
  // static stacked-list markup below, so hydration sees byte-identical
  // markup and reduced-motion users get no auto-rotation at all.
  const isRotating = hydrated && !reducedMotion && slides.length > 1
  const { activeIndex, advance } = useSlideIndex(slides.length)
  const [manuallyPaused, setManuallyPaused] = useState(false)
  const toggleManualPause = useCallback(() => setManuallyPaused((paused) => !paused), [])
  // Gates only the *content* of the `role="status"` span below, not whether
  // it mounts: the span itself has to exist before `isRotating` turns true,
  // because a live region's content has to change after it's already in the
  // DOM for most screen readers to announce it — mounting it non-empty
  // announces nothing on the first real toggle. Mounting it empty and
  // filling it in only once the user has actually toggled also avoids an
  // unprompted "Rotating" the instant hydration finishes, tied to no user
  // action. State, not a ref: reading a ref during render doesn't work in
  // React (the render wouldn't know to re-run), so the toggle handlers below
  // need a real state update here to make this text appear at all.
  const [hasToggled, setHasToggled] = useState(false)
  const handleToggleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      // Space's default action is scrolling the page — suppressed for every
      // repeat of the key, not just the first: bailing out on `event.repeat`
      // *before* this would leave a held Space scrolling the page out from
      // under a focused, activated control every time the OS repeats it.
      event.preventDefault()
      if (event.repeat) return // holding the key would otherwise flip the toggle on every OS key-repeat
      setHasToggled(true)
      toggleManualPause()
    },
    [toggleManualPause],
  )
  // No `event.detail` guard here: some assistive technology (VoiceOver's
  // VO+Space, Switch Control, Voice Control) activates a focused element by
  // dispatching a `click` with `detail: 0` *instead of* a real Enter/Space
  // keydown — `handleToggleKeyDown` above never runs for that activation at
  // all. An earlier revision guarded `detail === 0` here to avoid a
  // double-toggle from AT that sends both events; that traded a rare
  // cosmetic double-toggle for silently breaking the pause control for
  // exactly the users WCAG 2.2.2 exists for. A `<div>` never synthesizes a
  // click from a real keydown on its own, so this handler firing after
  // `handleToggleKeyDown` already ran is not a pointer-click concern either.
  const handleRootClick = useCallback(() => {
    setHasToggled(true)
    toggleManualPause()
  }, [toggleManualPause])
  // Derived, not stored: whatever `activeIndex` drifted to before
  // `isRotating` last flipped false is never shown — bars and text both
  // fall back to slide 1 the same render `isRotating` does, with no effect
  // needed to reconcile them back to 0. (`isRotating` currently only ever
  // goes true once, right after hydration, and stays there — `motion/react`
  // reads `prefers-reduced-motion` once and doesn't subscribe to further
  // changes — but this guards the derivation regardless, not that specific
  // transition.) The modulo also covers a future audience with fewer slides
  // than `activeIndex` reached under a previous, longer one.
  const shownIndex = isRotating ? activeIndex % slides.length : 0
  const isPaused = isRotating && manuallyPaused

  return (
    <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start">
      <div
        // The bars themselves are `h-0.5` below `lg` and `lg:w-0.5` above —
        // a couple of pixels along their short axis, not a reasonable touch
        // or mouse target on their own. `py-3 -my-3` (and the `lg:` mirror
        // on the other axis) pads the hit area without changing this
        // element's contribution to the surrounding flex layout: the
        // negative margin cancels the padding's effect on flow, so nothing
        // else on the page shifts.
        className={`group order-2 flex gap-1 py-3 -my-3 lg:order-1 lg:flex-col lg:py-0 lg:my-0 lg:px-3 lg:-mx-3${isRotating ? ' cursor-pointer' : ''}`}
        role={isRotating ? 'button' : undefined}
        tabIndex={isRotating ? 0 : undefined}
        aria-hidden={isRotating ? undefined : true}
        aria-pressed={isRotating ? isPaused : undefined}
        onClick={isRotating ? handleRootClick : undefined}
        onKeyDown={isRotating ? handleToggleKeyDown : undefined}
        data-paused={isPaused ? 'true' : undefined}
        aria-label={
          isRotating
            ? isPaused
              ? 'Auto-rotating carousel, paused. Tap or press Enter to resume.'
              : 'Auto-rotating carousel. Tap or press Enter to pause.'
            : undefined
        }
      >
        {slides.map((_, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- bars are positional, not content-keyed: there are always exactly `slides.length` of them, they never reorder, and the index IS each bar's stable identity (its track width and place in the rail come from position, not from the slide text). Keying by `slide` instead would let a duplicate slide string collide and would remount every bar — discarding the active fill's elapsed animation — on every copy edit or audience switch.
          <ProgressBar key={index}
            trackWidthClass={trackWidthFor(index)}
            isActive={index === shownIndex}
            isRotating={isRotating}
            onFillComplete={advance}
          />
        ))}
      </div>
      <div
        aria-live={isRotating ? 'off' : 'polite'}
        className="order-1 max-w-[337px] text-center text-base leading-[1.7] font-bold text-stone-700 italic sm:max-w-[576px] lg:order-2 lg:max-w-[432px] lg:text-left lg:leading-normal lg:not-italic"
      >
        {isRotating ? (
          // All slides render at once, stacked in one grid cell with only the
          // active one visible, rather than swapping a single mounted `<p>`:
          // the three slides are different lengths (they wrap to a different
          // line count depending on audience and breakpoint), and mounting
          // one at a time sizes this container to whichever slide happens to
          // be showing, so every rotation would shift the hero's height by
          // however many lines the slide length changed by. Grid auto-sizes
          // the shared cell to its tallest participant, and a participant has
          // to stay in the grid (not be removed from the DOM) to count
          // toward that — hence keeping all three mounted and hiding the
          // inactive ones with opacity/aria instead of conditionally
          // rendering just one.
          //
          // Switching into THIS branch from the static stacked-list branch
          // below is its own, separate height change, and a real one — not
          // the same kind of shift as `Reveal`'s post-hydration settle
          // elsewhere in this repo (that one only ever toggles opacity, so
          // it never resizes anything). Here, every JS-enabled,
          // non-reduced-motion visitor goes from three stacked paragraphs to
          // one grid cell sized to the tallest of them the moment
          // `isRotating` turns true, which is a real one-time layout shift
          // on the hero, roughly the height of two paragraphs of copy on a
          // narrow viewport. Accepted deliberately: the static branch has to
          // show every slide for the no-JS/reduced-motion case (see the
          // component doc comment), the rotating branch has to show only one
          // for the animated carousel to mean anything, and those two
          // requirements cannot converge on the same height. Not eliminated
          // by this diff — flagged here so it stays a conscious choice
          // rather than something discovered later by a Cumulative Layout
          // Shift regression.
          <div className="grid">
            {slides.map((slide, index) => (
              // `opacity-0` (not `invisible`) is what makes the 300ms
              // crossfade below possible — `visibility` isn't something a
              // plain CSS transition can animate smoothly. Known, accepted
              // cost: an inactive slide stays in the browser's find-in-page
              // and text-selection trees even though it's visually gone, so
              // Ctrl/Cmd+F can match hidden copy and dragging a selection
              // from the visible slide can extend into it. `aria-hidden`
              // still keeps it out of the accessibility tree, which is the
              // more consequential half of "hidden."
              // oxlint-disable-next-line react/no-array-index-key -- same positional identity as the bars above; see that comment.
              <p key={index}
                aria-hidden={index !== shownIndex}
                className={`col-start-1 row-start-1 transition-opacity duration-300 ease-out ${index === shownIndex ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
              >
                {slide}
              </p>
            ))}
          </div>
        ) : (
          // Static fallback (pre-hydration or reduced motion): every slide,
          // stacked and fully visible — see the component doc comment for
          // why this can't be just the first slide.
          <div className="flex flex-col gap-2">
            {slides.map((slide, index) => (
              // oxlint-disable-next-line react/no-array-index-key -- same positional identity as the bars above; see that comment.
              <p key={index}>{slide}</p>
            ))}
          </div>
        )}
      </div>
      {isRotating && (
        <span role="status" className="sr-only">
          {hasToggled ? (isPaused ? 'Paused' : 'Rotating') : null}
        </span>
      )}
    </div>
  )
}

/**
 * Tracks which slide the rotation has advanced to. Advancing is driven
 * entirely by the caller invoking the returned `advance` (from the active
 * bar's `animationend`), not by a timer here — see the component doc
 * comment for why. Falling back to slide 1 while rotation is off is the
 * caller's job (`shownIndex` in `CarouselRail`), not this hook's — this
 * hook only ever tracks "where rotation last got to".
 */
function useSlideIndex(slideCount: number) {
  const [activeIndex, setActiveIndex] = useState(0)

  const advance = useCallback(() => {
    setActiveIndex((current) => nextSlideIndex(current, slideCount))
  }, [slideCount])

  return { activeIndex, advance }
}

interface ProgressBarProps {
  trackWidthClass: string
  isActive: boolean
  isRotating: boolean
  onFillComplete: () => void
}

/** One bar of the rail. Only the active bar ever renders a fill — passed and
 * upcoming bars stay empty. The static (non-rotating) fill is a partial
 * width/height, matching the Figma static frame's "first bar partly filled";
 * the animated fill grows to the full track over the 5-second cycle. */
function ProgressBar({ trackWidthClass, isActive, isRotating, onFillComplete }: ProgressBarProps) {
  const handleAnimationEnd = useCallback(
    (event: AnimationEvent<HTMLSpanElement>) => {
      if (!shouldAdvance(event.animationName, event.elapsedTime)) return
      onFillComplete()
    },
    [onFillComplete],
  )

  return (
    <span
      style={RAIL_TRACK}
      className={`h-0.5 overflow-hidden rounded-full bg-stone-300 lg:h-[var(--rail-track)] lg:w-0.5 lg:bg-stone-200 ${trackWidthClass}`}
    >
      {isActive ? (
        isRotating ? (
          <span
            onAnimationEnd={handleAnimationEnd}
            className="animate-carousel-fill-x block h-full w-full origin-left rounded-full bg-stone-500 group-data-[paused=true]:[animation-play-state:paused] lg:animate-carousel-fill-y lg:origin-top lg:bg-stone-400"
          />
        ) : (
          <span className="block h-full w-[15px] rounded-full bg-stone-500 lg:w-full lg:bg-stone-400" />
        )
      ) : null}
    </span>
  )
}
