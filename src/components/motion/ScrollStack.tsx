/**
 * Pinned/stacking scroll effect (see the Figma `Scrolling` group note in
 * DESIGN-SPEC.md's S1 section): each item sticks at the top of its own
 * slot while later items scroll up to cover it.
 *
 * The Figma render of this section is the effect *flattened* — three cards
 * laid out vertically, because a static frame cannot show one covering
 * another. Its 2538px height is three 846px slots unrolled, not a target for
 * the live section's height, and a visual diff against it compares an
 * animation with a picture of its parts. Chasing that number is what produced
 * the fixed-slot-height regression reverted in 7f5a052.
 *
 * Three things this file exists to get right, each a real bug if skipped:
 *
 * 1. Scroll progress is tracked once on the section as a whole via
 *    `ScrollStackRoot`, not per sticky child. A sticky element's own
 *    `offsetTop` advances 1:1 with `scrollY` while it is pinned — targeting
 *    `useScroll` at the sticky child itself froze `scrollYProgress` for
 *    exactly the phase it needs to animate (the cover transition).
 * 2. The sticky/z-index stacking only ever applies once hydrated (a real
 *    scroll listener is what decides which card is on top). Pre-hydration
 *    and under reduced motion, cards render as plain stacked sections with
 *    no overlap — not just for the prerender-must-be-visible contract, but
 *    because overlapping sticky cards make every covered card's buttons
 *    keyboard-focusable while invisible (z-index hides content from sighted
 *    users, not from Tab order). `inert` removes the covered cards from
 *    both once JS is driving the stack.
 * 3. The scroll range and the arrival thresholds are chosen together so that
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
import {
  SCROLL_OFFSET,
  activeIndexFor,
  slotThresholds,
} from '@/components/motion/scroll-stack-geometry'
import { cn } from '@/lib/utils'

/**
 * The slot height. Every card gets this one, which is what lets the thresholds
 * ignore it.
 *
 * It must stay viewport-relative. A slot taller than the viewport can never be
 * brought fully into view by `sticky top-0`. A slot shorter than the viewport
 * leaves the next card permanently peeking out below the pinned one. `h-dvh` is
 * neither, at every viewport size — which is why the design frame's 846px slot
 * measurement does not belong here, and a pixel diff that wants it is comparing
 * against a flattened still (see the file header).
 */
const SLOT_CLASS = 'h-dvh'

interface StackState {
  progress: MotionValue<number>
  activeIndex: number
  /**
   * Carries the stack size too — `thresholds.length` is the count — so nothing
   * downstream has to be told the same number twice.
   */
  thresholds: number[]
  /**
   * Whether cards are actually pinned right now (hydrated, motion allowed).
   * The single source of truth for every `lg`-and-up full-bleed class in this
   * file and in `FeatureCard` — see the `pinned` prop on `ScrollStackRoot`.
   */
  pinned: boolean
}

const ScrollStackContext = createContext<StackState | null>(null)

/**
 * `count` is derived from the children rather than accepted as a prop, and read
 * back by `StackCard` through context. Both components need it for the same
 * arithmetic, and taking it twice let the two disagree: adding a card while
 * updating only one call site silently broke the pinning maths with nothing
 * visibly wrong in the diff.
 *
 * `Children.toArray` rather than `Children.count` because `count` includes
 * `null` and `false` entries, so `{flag && <StackCard/>}` keeps the count high
 * when the card is not rendered. Neither descends into a fragment, so a caller
 * wrapping the cards in `<>…</>` still counts 1. The caller-supplied `index` is
 * the remaining seam; both are tracked in issue #51.
 *
 * Every child must be a `StackCard`. The thresholds assume the section is
 * exactly `count` slots tall, so a heading or a spacer rendered as a direct
 * child here adds height that no card accounts for and shifts every arrival.
 * Put such an element outside `ScrollStackRoot`.
 *
 * `pinned`: an optional override for whether cards render pinned at all. Left
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
  // The offset comes from the same module as the thresholds because it is only
  // correct alongside them; see `scroll-stack-geometry.ts`.
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
  // `useMotionValueEvent`'s 'change' callback only fires on *subsequent*
  // updates, not for whatever `scrollYProgress` already measures at mount —
  // so a deep link into `#pricing`, a restored mid-page scroll position, or
  // any load that starts already inside/past this section leaves
  // `activeIndex` at its initial 0 until the user's first scroll tick. Until
  // then the covered cards' `inert` gate (which exists specifically to keep
  // their buttons out of the Tab order while hidden — see the file header)
  // stays open. Sync once against the real measured value after mount.
  // Scroll input is discrete, so a transform bound straight to `scrollYProgress`
  // reproduces the input's chunkiness exactly: measured over a scripted sweep,
  // the card's scale changed on only 21 of 213 frames, every change an identical
  // 0.003 jump, while frame timing stayed clean (no long tasks, nothing over
  // 50ms). Even frames, stepped motion — a discontinuity in the value, not a
  // shortage of frames, and no amount of making rendering cheaper addresses it.
  // A real mouse wheel is far chunkier than this sweep, so the effect is worse
  // in practice than in the measurement.
  //
  // The spring interpolates between those discrete updates, emitting a value
  // every frame regardless of when scroll events arrive. Tuned to be quick
  // rather than floaty: over-damping here trades visible stepping for visible
  // lag behind the scroll, which reads as broken in a different way.
  // Reduced motion gets the raw value. A spring keeps emitting after scroll
  // input stops — inertia is precisely what the preference asks us not to do —
  // and while today's reduced-motion path unpins the cards and never reads
  // `progress`, that is a property of the current markup rather than a contract.
  //
  // The spring is fed an inert source rather than skipped, because hooks cannot
  // be conditional. Selecting away from its output would leave it attached and
  // still integrating a rAF loop on every scroll burst — burning main-thread
  // work, for the users who asked for less of it, to produce a value nobody
  // reads. A source that never changes means it never animates at all.
  const reducedMotion = useReducedMotion()
  const hydrated = useHydrated()
  // See the `pinned` prop doc above: an explicit override wins when given,
  // otherwise this is exactly `StackCard`'s own pre-refactor formula.
  const pinned = pinnedOverride ?? (hydrated && !reducedMotion)
  const inertSource = useMotionValue(0)
  const smoothProgress = useSpring(reducedMotion ? inertSource : scrollYProgress, {
    stiffness: 260,
    damping: 38,
    restDelta: 0.00005,
  })
  const progress = reducedMotion ? scrollYProgress : smoothProgress

  // Two mount-time syncs against the already-measured scroll position, both for
  // loads that start inside or past this section — a deep link to `#pricing`,
  // a restored scroll position, a back-navigation.
  //
  // `activeIndex`: `useMotionValueEvent`'s 'change' callback only fires on
  // *subsequent* updates, so without this the covered cards' `inert` gate (which
  // keeps their buttons out of the Tab order while hidden — see the file header)
  // stays open until the user's first scroll tick.
  //
  // `smoothProgress`: the spring would otherwise treat that first measurement as
  // a change to animate towards, so the cards would visibly slide into place
  // over a few hundred milliseconds on every such load. `jump` sets the value
  // without animating.
  useEffect(() => {
    const measured = scrollYProgress.get()
    syncActiveIndex(measured)
    smoothProgress.jump(measured)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time sync against the mounted measurement, not a reactive dependency
  }, [])

  // Deliberately two different progress values. The visual transform follows the
  // smoothed one; `activeIndex` above is driven by the raw one, because it gates
  // `inert` — the covered cards' keyboard focusability — and that should track
  // the true scroll position rather than lag a spring's settle behind it.
  const state = useMemo(
    () => ({ progress, activeIndex, thresholds, pinned }),
    [progress, activeIndex, thresholds, pinned],
  )

  return (
    // `data-scroll-stack` is a stable hook for tooling, not styling:
    // scripts/scroll-perf-probe.mjs needs to find this section's scroll range,
    // and keying that off the `.sticky` utility class would silently retarget
    // the measurement at any other sticky element the page later grows.
    <div ref={sectionRef} data-scroll-stack>
      <ScrollStackContext.Provider value={state}>{children}</ScrollStackContext.Provider>
    </div>
  )
}

interface StackCardProps {
  children: ReactNode
  index: number
}

export function StackCard({ children, index }: StackCardProps) {
  const stack = useContext(ScrollStackContext)
  // `pinned` is the only thing that may differ between the prerender/first-paint
  // pass and later renders. The element tree below must stay the same shape
  // either way (same wrapper div, same MotionCard child) — swapping in a plain
  // div pre-hydration unmounts the whole card subtree on the hydrated flip,
  // including a live LottieBanner mid-load. The slot height stays a resolved
  // `h-…` (never a `min-h-…`) in both states too: `MotionCard` below is
  // `h-full`, so a non-fixed ancestor height would let it collapse to its
  // natural size pre-hydration and then visibly grow once `sticky` and the slot
  // height land — same class of jump, one level down. `sticky`/`top-0` is no
  // longer the only thing that toggles on this flip: the `lg:p-0` full-bleed
  // classes below, and `MotionCard`'s `lg:max-h-none`, `FeatureCard`'s
  // `lg:rounded-none`/`lg:border-0`/`lg:max-w-[1344px]`, and the section's own
  // `lg:max-w-none` in `ThreeFeatures` all flip with it too — a deliberately
  // accepted, larger reflow at hydration for `lg`-and-up motion-allowed users
  // (see `ThreeFeatures`'s doc comment). The tree-shape invariant above still
  // holds regardless: only class strings change, never which elements exist.
  //
  // Read from context rather than recomputed from `useHydrated`/
  // `useReducedMotion` directly: `ScrollStackRoot` is the single source of
  // truth for this value now (see its `pinned` prop doc), so every consumer
  // — this card, `MotionCard` below, and `FeatureCard` outside this file —
  // agrees by construction instead of by three independently-derived
  // booleans that happen to use the same formula.
  const pinned = stack?.pinned ?? false
  // `lg:p-0` rides along with `sticky top-0` rather than applying unconditionally:
  // full-bleed is a property of the *pinned* presentation (see `ThreeFeatures`),
  // not of the breakpoint alone. Gating it on breakpoint only would strip the
  // 16px inset from the reduced-motion/no-JS/prerender fallback too — those
  // cohorts render the plain-stacked layout the comment above describes, where
  // three consecutive full-viewport, edge-to-edge cards with no gap or radius
  // read as broken, not as "one full-screen frame". Below `lg` the card keeps
  // its inset either way, matching the pre-full-bleed layout exactly.
  const wrapperClass = cn(`flex ${SLOT_CLASS} items-center p-4`, pinned && 'sticky top-0 lg:p-0')
  const zIndexStyle = useMemo(() => (pinned ? { zIndex: index + 1 } : undefined), [pinned, index])
  const isInert = stack !== null && stack.pinned && index < stack.activeIndex

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
  // The shrink runs from this card's arrival to its successor's, so it tracks
  // the transition it depicts rather than a parallel guess at when that
  // transition happens.
  //
  // The last card has no successor, so `end` falls back to 0 and `hasRange`
  // below is false: it is never animated. That is deliberate and it matters
  // twice over.
  // 1. A range ending above 1, once bound to a real motion.div's `style`,
  //    reaches the native Web Animations API, which throws synchronously
  //    ("Offsets must be null or in the range [0,1]") — during React's commit,
  //    with no error boundary in this tree, unmounting the whole app to a blank
  //    page.
  // 2. Clamping such a range into [0,1] would not fix the last card anyway:
  //    progress keeps climbing past its arrival while the card is still the
  //    visible, pinned one, so a bound transform would shrink and dim it
  //    exactly when it should be at its most visible, and hold that state while
  //    the user scrolls on.
  // Nothing ever covers the last card, so `style` stays `{}` for it regardless
  // of `pinned`, same as the unhydrated path.
  const start = thresholds?.[index] ?? 0
  const end = thresholds?.[index + 1] ?? 0
  // `slotThresholds` is strictly increasing within [0, 1) by construction, so
  // every card that has a successor has a real interval. This asserts that
  // rather than repairing it: a card whose range is not an interval simply does
  // not animate. It is also the single test for "is this the last card", which
  // is why no stack size is passed down here — being told the count as well as
  // the thresholds is the same duplicated-source-of-truth seam `ScrollStackRoot`
  // above exists to avoid.
  const hasRange = start >= 0 && end > start && end <= 1
  const fallbackProgress = useMotionValue(0)
  const source = progress ?? fallbackProgress
  const scale = useTransform(source, hasRange ? [start, end] : [0, 1], [1, 0.94])
  const opacity = useTransform(
    source,
    hasRange ? [start + (end - start) * 0.5, end] : [0, 1],
    [1, 0.7],
  )
  const animated = pinned && hasRange
  const style = useMemo(() => (animated ? { scale, opacity } : {}), [animated, scale, opacity])

  return (
    // `data-scroll-stack-card` carries the index so tooling can address a
    // specific card; scripts/scroll-perf-probe.mjs samples card 0's transform
    // per frame. Same reasoning as `data-scroll-stack` on the root: a probe that
    // navigates by element position instead silently measures the wrong node
    // when the markup shifts, and reports confident numbers about it.
    <motion.div
      // `lg:max-h-none` only when `pinned`, for the same reason `StackCard`'s
      // `lg:p-0` does — the reduced-motion/no-JS/prerender fallback keeps the
      // 736px cap so its stacked cards stay readable as cards, not full-viewport
      // panels with no visual boundary between them.
      className={cn('h-full max-h-[46rem] w-full', pinned && 'lg:max-h-none')}
      style={style}
      data-scroll-stack-card={index}
    >
      {children}
    </motion.div>
  )
}
