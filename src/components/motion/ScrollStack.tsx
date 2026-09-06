/**
 * One persistent full-screen frame whose content swaps between states as the
 * user scrolls (see the Figma `Scrolling` group note in DESIGN-SPEC.md's S1
 * section, and the designer's own correction that this must read as one
 * slide with changing content, not three separate slides handed off in
 * sequence).
 *
 * The frame pins at the top of the viewport for the whole section; each
 * state's content is absolutely stacked inside it and crossfades/zooms/slides
 * into place on arrival, rather than each state being its own full-height
 * block that scrolls up from below the fold to cover the last one — that
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
 *    is hidden outright (`invisible`), not just faded — its transform still
 *    resolves to a real value while unarrived, and it sits at a *higher*
 *    z-index than the active state (see `StackSlide`), so left unhidden it
 *    would visibly float on top, partially see-through, ahead of its turn.
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
  hasRevealStarted,
  interactiveIndexFor,
  revealOpaqueAt,
  revealWindow,
  slotThresholds,
} from '@/components/motion/scroll-stack-geometry'

/**
 * The slot height. It sizes the one pinned frame, and — multiplied by
 * `count` — the section's total scroll distance (see the file header, point
 * 2). It must stay viewport-relative for the same reason it always has: a
 * slot taller than the viewport can never be brought fully into view by
 * `sticky top-0`, and a slot shorter than it leaves the next state
 * permanently peeking out. `h-dvh` is neither, at every viewport size —
 * which is why the design frame's 846px slot measurement does not belong
 * here (see the file header).
 */
const SLOT_CLASS = 'h-dvh'
const SLOT_VH = 100

interface StackState {
  progress: MotionValue<number>
  activeIndex: number
  /** The slide that is visually on top right now — the only one not `inert`.
   * Distinct from `activeIndex`: an arriving slide covers the active one
   * (fully opaque, higher z-index) before it *becomes* the active one. See
   * `interactiveIndexFor`. */
  interactiveIndex: number
  /**
   * Carries the stack size too — `thresholds.length` is the count — so nothing
   * downstream has to be told the same number twice.
   */
  thresholds: number[]
  /** Whether the stack is actually pinning/animating right now — hydrated,
   * motion allowed. Shared from here because both `StackFrame` (does it
   * render one sticky frame or plain flow?) and `StackSlide` (does it
   * position absolutely or in flow?) need the same answer. Also the single
   * source of truth for every `lg`-and-up full-bleed class in this file and
   * in `FeatureCard` — see the `pinned` prop on `ScrollStackRoot`. */
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
 *
 * `pinned`: an optional override for whether slides render pinned at all. Left
 * unset, this component decides for itself from `useHydrated`/
 * `useReducedMotion`, same as always. A caller that also needs the *same*
 * pinned/not-pinned boolean for its own markup *outside* this tree — where
 * `ScrollStackRoot`'s own context can't reach, since context only flows to
 * descendants — passes it in instead, so there is exactly one computation of
 * it rather than two independently-derived booleans that are only equal by
 * assumption. `ThreeFeatures` does this for its full-bleed section styling.
 */
export function ScrollStackRoot({
  children,
  pinned: pinnedOverride,
}: {
  children: ReactNode
  pinned?: boolean
}) {
  const count = Children.toArray(children).length
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    // Spread because `useScroll` takes a mutable array; the constant is
    // `as const` so the test can assert on its contents.
    offset: [...SCROLL_OFFSET],
  })
  const [activeIndex, setActiveIndex] = useState(0)
  const [interactiveIndex, setInteractiveIndex] = useState(0)
  const thresholds = useMemo(() => slotThresholds(count), [count])

  const syncActiveIndex = (value: number) => {
    setActiveIndex(activeIndexFor(value, thresholds))
    setInteractiveIndex(interactiveIndexFor(value, thresholds))
  }

  useMotionValueEvent(scrollYProgress, 'change', syncActiveIndex)

  const reducedMotion = useReducedMotion()
  // See the file header point 1, and the original design note this file
  // inherits: the spring is tuned quick rather than floaty, and reduced
  // motion gets the raw, un-sprung value so nothing keeps animating once
  // scroll input stops.
  const inertSource = useMotionValue(0)
  const smoothProgress = useSpring(reducedMotion ? inertSource : scrollYProgress, {
    stiffness: 260,
    damping: 38,
    restDelta: 0.00005,
  })
  const progress = reducedMotion ? scrollYProgress : smoothProgress

  // Two mount-time syncs against the already-measured scroll position, both for
  // loads that start inside or past this section — a deep link to `#pricing`,
  // a restored scroll position, a back-navigation. See `StackSlide` for why
  // `activeIndex` matters here (the `inert` gate), and the header comment
  // above `smoothProgress` for why `jump` rather than letting the spring
  // animate to the first measurement.
  useEffect(() => {
    const measured = scrollYProgress.get()
    syncActiveIndex(measured)
    smoothProgress.jump(measured)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time sync against the mounted measurement, not a reactive dependency
  }, [])

  const hydrated = useHydrated()
  // See the `pinned` prop doc above: an explicit override wins when given,
  // otherwise this is exactly the formula this component always used.
  const pinned = pinnedOverride ?? (hydrated && !reducedMotion)

  const state = useMemo(
    () => ({ progress, activeIndex, interactiveIndex, thresholds, pinned }),
    [progress, activeIndex, interactiveIndex, thresholds, pinned],
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
 * The one pinned frame. Unpinned (pre-hydration, reduced motion), the wrapper
 * has no positioning of its own and `children` (each a `StackSlide`) render
 * as plain flowed blocks, exactly as a reader without JS or who asked for
 * less motion should see them: stacked, fully visible, nothing overlapping.
 *
 * Always renders the same `<div>` — never conditionally returns `children`
 * bare — because `pinned` starts `false` pre-hydration and flips `true`
 * after. Swapping the wrapper's presence in and out at that flip changes
 * this element's type at its position in the tree, which unmounts and
 * remounts every `StackSlide` beneath it (and everything they hold, a live
 * `LottieBanner` mid-load included) right after hydration — a real, shipped
 * regression this fixed. Toggling only the class string keeps the tree shape
 * identical across both states, so nothing below ever remounts on the flip.
 * `relative` is intentionally omitted from the pinned classes: a `sticky` box
 * already establishes the containing block `StackSlide`'s `absolute inset-0`
 * needs, so adding it would only be a redundant, same-property override.
 */
function StackFrame({ children, pinned }: { children: ReactNode; pinned: boolean }) {
  return <div className={cn(pinned && `sticky top-0 ${SLOT_CLASS}`)}>{children}</div>
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
  const interactiveIndex = stack?.interactiveIndex ?? 0
  // Exactly one state is interactive once pinned: the one visually on top.
  // Every other state is inert — an earlier one is covered (by z-index,
  // below), a later one is either still translucent mid-arrival or has not
  // arrived at all (hidden outright) — so only the controls the visitor can
  // actually see are in the Tab order or receive clicks.
  //
  // Gated on `interactiveIndex`, not `activeIndex`: an arriving state is drawn
  // above the active one and is fully opaque from half-way through its reveal
  // window (see `MotionCard`), a whole half-window before `activeIndex`
  // reaches it. Gating on `activeIndex` left that arriving state — the one
  // the visitor is looking at — `inert`, so a visitor who stopped scrolling
  // mid-transition (a normal resting position) got a dead CTA. The window and
  // its opacity handover point come from `scroll-stack-geometry.ts`
  // (`revealWindow` / `revealOpaqueAt`), the same functions `MotionCard`
  // animates from, so this gate and that animation cannot be re-timed apart.
  //
  // Before the handover the arriving state is still translucent and drawn on
  // top while `inert` — the state beneath shows through and stays the
  // interactive one, so a click in that band reaches the state the visitor
  // can still partly see, not a dead surface. Where that handover should sit
  // is part of the placeholder reveal timing `MotionCard` notes is still
  // pending from the designer.
  const isInert = pinned && index !== interactiveIndex
  // A state whose OWN reveal has not started yet still resolves a real
  // transform value (its scale/opacity/y clamp to their pre-arrival numbers,
  // not zero — see `MotionCard`), and it sits at a higher z-index than the
  // active state (later index, drawn on top once both are opaque). Left
  // unhidden it would float above the active state, partially see-through,
  // before its turn.
  //
  // `hasRevealStarted` (not a bare `index > activeIndex` comparison) because
  // a state's own reveal window is `[thresholds[index-1], thresholds[index]]`
  // (see `MotionCard`) — it starts animating the instant its *predecessor*
  // becomes active, i.e. the instant `activeIndex` reaches `index - 1`, one
  // threshold *before* `activeIndex` reaches `index` itself. Gating this on
  // `index > activeIndex` was a real, shipped bug: it kept the state hidden
  // for the animation's entire duration and only revealed it already fully
  // settled — the zoom/slide/fade never had a visible frame to play in.
  // `hasRevealStarted` is shared with `MotionCard`'s own window math (via
  // `scroll-stack-geometry.ts`) specifically so the two can't drift apart
  // again the way this bug let them.
  const notYetArrived = pinned && !hasRevealStarted(activeIndex, index)
  const zIndexStyle = useMemo(() => (pinned ? { zIndex: index + 1 } : undefined), [pinned, index])
  // `lg:p-0` rides along with the pinned/absolute presentation rather than
  // applying unconditionally: full-bleed is a property of the *pinned*
  // presentation (see `ThreeFeatures`), not of the breakpoint alone. Gating
  // it on breakpoint only would strip the 16px inset from the
  // reduced-motion/no-JS/prerender fallback too — those cohorts render the
  // plain-stacked layout, where three consecutive full-viewport, edge-to-edge
  // slides with no gap or radius read as broken, not as "one full-screen
  // frame". Below `lg` the slide keeps its inset either way, matching the
  // pre-full-bleed layout exactly.
  const wrapperClass = cn(
    pinned
      ? 'absolute inset-0 flex items-center p-4 lg:p-0'
      : `flex ${SLOT_CLASS} w-full items-center p-4`,
    notYetArrived && 'invisible',
  )

  return (
    <div className={wrapperClass} style={zIndexStyle} inert={isInert}>
      <MotionCard
        progress={stack?.progress ?? null}
        thresholds={stack?.thresholds ?? null}
        index={index}
        pinned={pinned}
      >
        {children}
      </MotionCard>
    </div>
  )
}

function MotionCard({
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
  // regardless of `pinned`, same as the unhydrated path.
  // `revealWindow` is the single definition of this state's window, shared
  // with `StackSlide`'s interactivity gate (`interactiveIndexFor`); the two
  // must agree on where the window is or the gate lands on a translucent or
  // a not-yet-drawn state.
  const [start, end] = revealWindow(thresholds ?? [], index)
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
  const range = hasRange ? [start, end] : [0, 1]
  // Placeholder reveal — designer has not sent the real timeline for this yet
  // (see docs/QUESTIONS-DESIGNER.md). Zoom (scale) + a short rise (y) +
  // fade (opacity), all driven off the same arrival window so they read as
  // one motion rather than three independent ones.
  const scale = useTransform(source, range, [0.94, 1])
  const y = useTransform(source, range, [24, 0])
  // Mirrors the old covering-state fade, time-reversed: opacity used to hold
  // at 1 for the transition's first half and drop to 0.7 over the second, so
  // the arriving state now rises 0.7 → 1 over the first half and holds at 1
  // for the second — fully opaque well before it becomes the active state.
  // `revealOpaqueAt` is also where `StackSlide` hands interactivity over: the
  // moment this state is opaque and on top is the moment it takes clicks and
  // focus. Scale and y keep settling to the end of the window, so a thin
  // margin of the state beneath still shows around the edges until then.
  const opacity = useTransform(
    source,
    hasRange ? [start, revealOpaqueAt(thresholds ?? [], index)] : [0, 1],
    [0.7, 1],
  )
  const animated = pinned && hasRange
  const style = useMemo(
    () => (animated ? { scale, y, opacity } : {}),
    [animated, scale, y, opacity],
  )

  return (
    // `data-scroll-stack-card` carries the index so tooling can address a
    // specific slide; scripts/scroll-perf-probe.mjs samples slide 1's
    // transform per frame (slide 0 never animates, see above). Same
    // reasoning as `data-scroll-stack` on the root: a probe that navigates by
    // element position instead silently measures the wrong node when the
    // markup shifts, and reports confident numbers about it.
    <motion.div
      // `lg:max-h-none` only when `pinned` — the reduced-motion/no-JS/prerender
      // fallback keeps the 736px cap so its stacked cards stay readable as
      // cards, not full-viewport panels with no visual boundary between them.
      className={cn('h-full max-h-[46rem] w-full', pinned && 'lg:max-h-none')}
      style={style}
      data-scroll-stack-card={index}
    >
      {children}
    </motion.div>
  )
}
