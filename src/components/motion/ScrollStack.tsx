/**
 * One persistent full-screen frame whose content swaps between states as the
 * user scrolls (see the Figma `Scrolling` group note in DESIGN-SPEC.md's S1
 * section, and the designer's own correction that this must read as one
 * slide with changing content, not three separate slides handed off in
 * sequence).
 *
 * The frame pins at the top of the viewport for the whole section; each
 * state's content is absolutely stacked inside it and fades into place on
 * arrival, rather than each state being its own full-height block that
 * scrolls up from below the fold to cover the last one — that
 * off-screen-to-on-screen travel is exactly what read as "three different
 * slides" rather than one frame changing.
 *
 * The Figma render of this section is the effect *flattened* — three cards
 * laid out vertically, because a static frame cannot show one covering
 * another. Its 2538px height is three 846px slots unrolled, not a target for
 * the live section's height, and a visual diff against it compares an
 * animation with a picture of its parts. Chasing that number is what produced
 * the fixed-slot-height regression reverted in 7f5a052.
 *
 * Four things this file exists to get right, each a real bug if skipped:
 *
 * 1. Scroll progress is tracked once on the section as a whole via
 *    `ScrollStackRoot`, not per slide. A sticky element's own `offsetTop`
 *    advances 1:1 with `scrollY` while it is pinned — targeting `useScroll`
 *    at the sticky child itself froze `scrollYProgress` for exactly the
 *    phase it needs to animate.
 * 2. The section still needs `count` slot-heights of scroll distance for the
 *    threshold math in `scroll-stack-geometry.ts` to hold (see its own
 *    header) even though only one slot is ever visually rendered as the
 *    pinned frame. `ScrollStackRoot` gives the outer element that height
 *    directly instead of getting it "for free" from `count` stacked blocks.
 * 3. The sticky/absolute stacking only ever applies once hydrated (a real
 *    scroll listener is what decides which state is on top). Pre-hydration
 *    and under reduced motion, states render as plain stacked sections with
 *    no overlap — not just for the prerender-must-be-visible contract, but
 *    because overlapping states make every covered state's buttons
 *    keyboard-focusable while invisible (z-index hides content from sighted
 *    users, not from Tab order). `inert` removes the covered states from
 *    both once JS is driving the stack, and a state that has not arrived yet
 *    is hidden outright (`invisible`) as well as inert: `inert` alone hides
 *    it from the Tab order, not from sighted users, and it sits at a
 *    *higher* z-index than the active state (see `StackSlide`), so left
 *    unhidden it would visibly float on top, ahead of its turn.
 * 4. The scroll range and the arrival thresholds are chosen together so that
 *    the slot height cancels out of the arithmetic entirely. See
 *    `slotThresholds`.
 */
import {
  Children,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useHydrated } from '@/components/motion/Reveal'
import { cn } from '@/lib/utils'
import {
  SCROLL_OFFSET,
  activeIndexFor,
  revealStart,
  slotThresholds,
} from '@/components/motion/scroll-stack-geometry'

/**
 * The slot height. One constant, applied as an inline style (`height:
 * ${SLOT_VH}dvh`) everywhere a slot needs it — the pinned frame, each
 * unpinned slide, and (multiplied by `count`) the section's total scroll
 * distance (see the file header, point 2) — rather than as a Tailwind class
 * string. This used to be two hand-kept copies, a class string and a number,
 * with nothing but a comment enforcing they matched; nothing failed a test
 * the one time only one of them changed. An interpolated class like
 * `` `h-[${SLOT_VH}dvh]` `` would "fix" that by deriving the class from the
 * number, except Tailwind's static scanner can't see through the
 * interpolation and would silently ship no CSS for it at all — inline
 * styles have no such scanner to fool.
 *
 * Must stay viewport-relative for the same reason it always has: a slot
 * taller than the viewport can never be brought fully into view by `sticky
 * top-0`, and a slot shorter than it leaves the next state permanently
 * peeking out. `100dvh` is neither, at every viewport size — which is why
 * the design frame's 846px slot measurement does not belong here (see the
 * file header).
 */
const SLOT_VH = 100
const SLOT_STYLE = { height: `${SLOT_VH}dvh` }

interface StackState {
  progress: MotionValue<number>
  activeIndex: number
  /**
   * Carries the stack size too — `thresholds.length` is the count — so nothing
   * downstream has to be told the same number twice.
   */
  thresholds: number[]
  /** Whether the stack is actually pinning/animating right now — hydrated,
   * motion allowed. Shared from here because both `StackFrame` (does it
   * render one sticky frame or plain flow?) and `StackSlide` (does it
   * position absolutely or in flow?) need the same answer. */
  pinned: boolean
}

const ScrollStackContext = createContext<StackState | null>(null)

/**
 * `count` is derived from the children rather than accepted as a prop, and read
 * back by `StackSlide` through context. Both need it for the same arithmetic,
 * and taking it twice let the two disagree: adding a state while updating
 * only one call site silently broke the pinning maths with nothing visibly
 * wrong in the diff.
 *
 * `Children.toArray` rather than `Children.count` because `count` includes
 * `null` and `false` entries, so `{flag && <StackSlide/>}` keeps the count
 * high when the slide is not rendered. Neither descends into a fragment, so a
 * caller wrapping the slides in `<>…</>` still counts 1. The caller-supplied
 * `index` is the remaining seam; both are tracked in issue #51.
 *
 * Every child must be a `StackSlide`. The thresholds assume the section is
 * exactly `count` slots tall, so a heading or a spacer rendered as a direct
 * child here adds height that no slide accounts for and shifts every arrival.
 * Put such an element outside `ScrollStackRoot`.
 */
export function ScrollStackRoot({ children }: { children: ReactNode }) {
  const count = Children.toArray(children).length
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    // Spread because `useScroll` takes a mutable array; the constant is
    // `as const` so the test can assert on its contents.
    offset: [...SCROLL_OFFSET],
  })
  const [activeIndex, setActiveIndex] = useState(0)
  const thresholds = useMemo(() => slotThresholds(count), [count])

  const syncActiveIndex = (value: number) => {
    setActiveIndex(activeIndexFor(value, thresholds))
  }

  useMotionValueEvent(scrollYProgress, 'change', syncActiveIndex)

  const reducedMotion = useReducedMotion()
  // Scroll input is discrete, so a transform bound straight to
  // `scrollYProgress` reproduces the input's chunkiness exactly — measured
  // over a scripted sweep, the driven value changed on only 21 of 213
  // frames, every change an identical jump, while frame timing stayed
  // clean. A real mouse wheel is chunkier than that sweep, so the effect is
  // worse in practice. The spring below smooths that into continuous
  // motion, tuned quick rather than floaty.
  //
  // `inertSource` exists because hooks cannot be conditional: reduced motion
  // wants the raw, un-sprung value so nothing keeps animating once scroll
  // input stops, but that means the spring itself must still be called on
  // every render regardless — feeding it a value that never changes, rather
  // than skipping the call, is what keeps it from integrating a real rAF
  // loop on every scroll burst for users who explicitly asked for less
  // motion, to produce a value (`smoothProgress`) nobody then reads.
  const inertSource = useMotionValue(0)
  const smoothProgress = useSpring(reducedMotion ? inertSource : scrollYProgress, {
    stiffness: 260,
    damping: 38,
    restDelta: 0.00005,
  })
  const progress = reducedMotion ? scrollYProgress : smoothProgress

  // Two mount-time syncs against the already-measured scroll position, both for
  // loads that start inside or past this section — a deep link to `#pricing`,
  // a restored scroll position, a back-navigation. `syncActiveIndex`: see
  // `StackSlide` for why `activeIndex` matters here (the `inert` gate) —
  // without this it stays 0 until the first scroll tick. `jump`, not letting
  // the spring animate to the first measurement: without it, every such load
  // would visibly slide/fade the slides into place over a few hundred
  // milliseconds, as if the spring had to "catch up" to where the page
  // already is.
  useEffect(() => {
    const measured = scrollYProgress.get()
    syncActiveIndex(measured)
    smoothProgress.jump(measured)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time sync against the mounted measurement, not a reactive dependency
  }, [])

  const hydrated = useHydrated()
  const pinned = hydrated && !reducedMotion

  const state = useMemo(
    () => ({ progress, activeIndex, thresholds, pinned }),
    [progress, activeIndex, thresholds, pinned],
  )
  const sectionStyle = useMemo(
    () => (pinned ? { height: `${count * SLOT_VH}dvh` } : undefined),
    [pinned, count],
  )

  return (
    // `data-scroll-stack` is a stable hook for tooling, not styling:
    // scripts/scroll-perf-probe.mjs needs to find this section's scroll range,
    // and keying that off the `.sticky` utility class would silently retarget
    // the measurement at any other sticky element the page later grows.
    //
    // The explicit height only applies once pinned: unpinned, the states
    // render as plain flowed blocks (see `StackFrame`) whose combined height
    // already sums to the same `count * 100dvh`, so forcing it here too would
    // be redundant, and doing it unconditionally would strand that layout at
    // a fixed height before its content has a reason to be that tall.
    <div ref={sectionRef} data-scroll-stack style={sectionStyle}>
      <ScrollStackContext.Provider value={state}>
        <StackFrame pinned={pinned}>{children}</StackFrame>
      </ScrollStackContext.Provider>
    </div>
  )
}

/**
 * The one pinned frame. Renders the SAME wrapper element in both states —
 * only its classes toggle — rather than swapping between bare `children` and
 * a wrapped `<div>`. An earlier version returned `children` directly while
 * unpinned and only introduced the wrapper once `pinned` flipped true; React
 * reconciles the Provider's child slot positionally, so that shape change
 * unmounted and remounted every `StackSlide` subtree on the hydration flip —
 * exactly the bug `StackSlide`'s own doc comment already warns about for a
 * live `LottieBanner` mid-load, restarting its observer and WASM player, and
 * dropping focus from any control a keyboard user reached before hydration
 * finished. Toggling only the wrapper's own class and inline height (no
 * `sticky`/no fixed height unpinned; `sticky top-0` plus `SLOT_STYLE`
 * pinned) keeps one stable node across the flip. `sticky` alone establishes
 * the containing block the
 * absolutely-positioned slides need — no separate `relative` is needed
 * alongside it, and adding one back would only invite a future `cn()`
 * merge to silently drop `sticky` instead (`tailwind-merge` resolves
 * conflicting `position` utilities by last occurrence).
 */
function StackFrame({ children, pinned }: { children: ReactNode; pinned: boolean }) {
  return (
    <div className={pinned ? 'sticky top-0' : ''} style={pinned ? SLOT_STYLE : undefined}>
      {children}
    </div>
  )
}

interface StackSlideProps {
  children: ReactNode
  index: number
}

/**
 * One state's content. Pinned, every slide occupies the exact same rect
 * (`absolute inset-0` inside `StackFrame`'s one sticky box) rather than each
 * having its own flowed slot to scroll up from below into — that shared rect
 * is what makes this read as one frame with changing content instead of a
 * new slide arriving from off-screen. Unpinned, each is its own flowed
 * `h-dvh` block, same shape the old per-slide sticky slots used before they
 * were sticky.
 */
export function StackSlide({ children, index }: StackSlideProps) {
  const stack = useContext(ScrollStackContext)
  const pinned = stack?.pinned ?? false
  const activeIndex = stack?.activeIndex ?? 0
  // Both directions are inert once pinned: an earlier state is covered (by
  // z-index, below) and a later one is either mid-arrival (visible and
  // animating, but not yet the active state — see `notYetArrived` below) or
  // has not arrived at all (hidden outright). None of the three should be in
  // the Tab order — only the active state's own controls should be reachable.
  // Driven by `activeIndex` (the raw, un-sprung position), not the smoothed
  // one `notYetArrived` below uses — `inert` gates keyboard reachability,
  // which should track the true scroll position rather than lag a spring's
  // settle behind it, same reasoning `ScrollStackRoot` already applies to
  // `activeIndex` itself.
  const isInert = pinned && index !== activeIndex
  // A state whose OWN reveal has not started yet still resolves a real
  // opacity value (it clamps to its pre-arrival number, 0 — see
  // `MotionSlide`), and it sits at a higher z-index than the active state
  // (later index, drawn on top once both are opaque). At exactly 0 that
  // clamp is harmless on its own, but `invisible` is still needed: `inert`
  // alone hides content from the Tab order, not from sighted users, and an
  // element at opacity 0 still intercepts pointer events and shows up in
  // devtools/accessibility trees as present, not gone.
  //
  // Gated on the SAME smoothed progress `MotionSlide`'s own opacity reads
  // from (via the shared `revealStart`, not `activeIndex`, which tracks raw,
  // un-sprung scroll). Those two used to disagree: on a fast reverse scroll,
  // raw progress can drop below this slide's reveal-start threshold while
  // the spring is still easing the opacity down from mid-fade, so
  // `invisible` would land while the slide was still visibly, say, 40%
  // opaque — a one-frame pop instead of a fade-out. Reading the smoothed
  // value here keeps the two in lockstep in both scroll directions.
  const thresholds = stack?.thresholds ?? []
  const fallbackProgress = useMotionValue(0)
  const smoothedProgress = stack?.progress ?? fallbackProgress
  const [hasReachedReveal, setHasReachedReveal] = useState(
    () => smoothedProgress.get() >= revealStart(thresholds, index),
  )
  useMotionValueEvent(smoothedProgress, 'change', (value) => {
    setHasReachedReveal(value >= revealStart(thresholds, index))
  })
  // `CARDS` in `ThreeFeatures.tsx` never changes at runtime, so this never
  // fires in practice today — but `revealStart(thresholds, index)` only gets
  // read above on a scroll ('change') event, not a React render. If `count`
  // or a slide's `index` ever did change with the scroll position held
  // still, `hasReachedReveal` would be left stale against the new
  // thresholds until the next scroll tick, which could show a slide already
  // past its (new) reveal point as still `invisible`. Resyncing whenever the
  // threshold this slide reads actually changes closes that gap without
  // waiting for a scroll event that may never come.
  useEffect(() => {
    setHasReachedReveal(smoothedProgress.get() >= revealStart(thresholds, index))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `smoothedProgress` is a MotionValue identity, not reactive state; the effect's own dependency is the computed threshold, expressed via its inputs
  }, [thresholds, index])
  const notYetArrived = pinned && !hasReachedReveal
  // Pinned needs the stacking order; unpinned needs the slot height that
  // `StackFrame` no longer supplies once there's no sticky frame flowing the
  // slides — the two are mutually exclusive, never both on the same style.
  const wrapperStyle = useMemo(() => (pinned ? { zIndex: index + 1 } : SLOT_STYLE), [pinned, index])
  const wrapperClass = cn(
    pinned ? 'absolute inset-0 flex items-center p-4' : 'flex w-full items-center p-4',
    notYetArrived && 'invisible',
    // `inert` stops the covering/arriving slide's OWN content from being
    // clicked or focused, but it does not make the element transparent to
    // hit-testing — an inert slide sitting at a higher z-index still
    // intercepts pointer events aimed at whatever is underneath it. Without
    // this, the active slide's CTA buttons are unreachable by mouse for the
    // entire crossfade, every time (not an edge case: every arrival is a
    // crossfade). Only the active slide keeps the default `auto`.
    isInert && 'pointer-events-none',
  )

  return (
    <div className={wrapperClass} style={wrapperStyle} inert={isInert}>
      <MotionSlide
        progress={stack?.progress ?? null}
        thresholds={stack?.thresholds ?? null}
        index={index}
        pinned={pinned}
      >
        {children}
      </MotionSlide>
    </div>
  )
}

function MotionSlide({
  children,
  progress,
  thresholds,
  index,
  pinned,
}: {
  children: ReactNode
  progress: MotionValue<number> | null
  thresholds: number[] | null
  index: number
  pinned: boolean
}) {
  // The reveal runs from this state's own predecessor's arrival to this
  // state's own arrival, so it tracks the transition that brings *this*
  // state in rather than a parallel guess at when that transition happens.
  //
  // The first state has no predecessor, so it is never animated — it is
  // already the active state the instant the section is reached, with
  // nothing arriving to reveal in from. That matters twice over:
  // 1. A range starting below 0 (or otherwise not a real interval), once
  //    bound to a real motion.div's `style`, reaches the native Web
  //    Animations API, which throws synchronously ("Offsets must be null or
  //    in the range [0,1]") — during React's commit, with no error boundary
  //    in this tree, unmounting the whole app to a blank page.
  // 2. Even a clamped range would be wrong for the first state anyway: there
  //    is no scroll position at which it is arriving rather than already
  //    being the visible, active one — animating it regardless would reveal
  //    it in from nothing right as the section first comes into view.
  // Nothing ever reveals the first state in, so `style` stays `{}` for it
  // regardless of `pinned`, same as the unhydrated path. `start` comes from
  // the same `revealStart` helper `StackSlide`'s `invisible` gate reads, so
  // the two can't silently re-diverge the way two hand-kept copies of this
  // threshold already have once.
  const start = revealStart(thresholds ?? [], index)
  const end = index > 0 ? (thresholds?.[index] ?? 0) : 0
  // `slotThresholds` is strictly increasing within [0, 1) by construction, so
  // every state that has a predecessor has a real interval. This asserts that
  // rather than repairing it: a state whose range is not an interval simply
  // does not animate. Gating on `index > 0` is the single test for "is this
  // the first state", which is why no stack size is passed down here — being
  // told the count as well as the thresholds is the same duplicated-source-
  // of-truth seam `ScrollStackRoot` above exists to avoid.
  const hasRange = index > 0 && start >= 0 && end > start && end <= 1
  const fallbackProgress = useMotionValue(0)
  const source = progress ?? fallbackProgress
  // Placeholder reveal — the designer has not sent the real timeline for
  // this yet (tracked in ticket #110, not yet in docs/QUESTIONS-DESIGNER.md
  // — that file's current questions are about the Lottie banner and layout,
  // not this reveal; don't follow this comment expecting to find it there).
  // Plain opacity only: an earlier version
  // also scaled (0.94→1) and rose (y: 24→0) on arrival, which combined with
  // each state's own full-bleed background reads as a new slide sliding in
  // rather than one frame's content changing — exactly the effect the
  // designer's "one slide, not three" correction was about. A fade is the
  // one motion that cannot be mistaken for that.
  //
  // The mapping is `[start, end] -> [0, 1]` — the FULL reveal window, not a
  // half-window clamped to a `0.7` floor. A half-window bottomed at 0.7 was a
  // real, shipped bug: `useTransform` clamps below-range input to the first
  // output value, so the first state (`index === 0`, `hasRange` false) isn't
  // the only one affected — the *next* state's pre-window progress also
  // clamps to 0.7, and because it sits at a higher z-index than the active
  // state (see `StackSlide`), it rendered as a permanent 70%-opacity ghost
  // over the active state from the moment the section is reached, not just
  // during its own transition. Ending the fade at `end` (not the window's
  // midpoint) also keeps it synchronized with `isInert`: the state finishes
  // becoming fully opaque exactly when `activeIndex` flips to it, instead of
  // finishing early and sitting fully visible-but-inert (buttons dead) for
  // the second half of its own arrival window.
  const opacity = useTransform(source, hasRange ? [start, end] : [0, 1], [0, 1])
  const animated = pinned && hasRange
  const style = useMemo(() => (animated ? { opacity } : {}), [animated, opacity])

  return (
    // `data-scroll-stack-slide` carries the index so tooling can address a
    // specific slide; scripts/scroll-perf-probe.mjs samples slide 1's
    // opacity per frame (slide 0 never animates, see above). Same
    // reasoning as `data-scroll-stack` on the root: a probe that navigates by
    // element position instead silently measures the wrong node when the
    // markup shifts, and reports confident numbers about it.
    //
    // No `max-h` cap: the Figma reference (`40002427:16418`) fills its whole
    // 1440x846 slot per state (inset only by `StackSlide`'s own `p-4`
    // breathing room, same on every edge) — a capped, centred panel read as a
    // small floating card in an otherwise-empty full-height section, which
    // is part of what made this look like slides rather than one full-screen
    // frame.
    <motion.div className="h-full w-full" style={style} data-scroll-stack-slide={index}>
      {children}
    </motion.div>
  )
}
