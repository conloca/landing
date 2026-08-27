/**
 * Pinned/stacking scroll effect (see the Figma `Scrolling` group note in
 * DESIGN-SPEC.md's S1 section): each item sticks at the top of its own
 * full-height slot while later items scroll up to cover it.
 *
 * Two things this file exists to get right, each a real bug if skipped:
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

interface StackState {
  progress: MotionValue<number>
  activeIndex: number
  count: number
}

const ScrollStackContext = createContext<StackState | null>(null)

/**
 * `count` is derived from the children rather than accepted as a prop, and
 * read back by `StackCard` through context. Both components need it for the
 * same segment math, and taking it twice let the two disagree: adding a card
 * while updating only one call site silently broke the pinning arithmetic
 * with nothing visibly wrong in the diff.
 */
export function ScrollStackRoot({ children }: { children: ReactNode }) {
  const count = Children.count(children)
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const [activeIndex, setActiveIndex] = useState(0)
  // Each card's slot is one viewport tall, so `count` stacked slots span
  // `count` viewport-heights of document height but only `count - 1` of real
  // scroll distance within an ['start start', 'end end'] range (the final
  // viewport-height never needs to scroll past). Card i becomes fully active
  // once the user has scrolled i viewport-heights into the section, i.e. at
  // progress i / (count - 1) — dividing by `count` instead marks each card
  // (and the one before it) inert a third too early, while its buttons are
  // still on screen and interactive-looking.
  const segments = Math.max(1, count - 1)

  const syncActiveIndex = (value: number) => {
    setActiveIndex(Math.min(count - 1, Math.floor(value * segments)))
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
    () => ({ progress, activeIndex, count }),
    [progress, activeIndex, count],
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
  const hydrated = useHydrated()
  const reducedMotion = useReducedMotion()
  const stack = useContext(ScrollStackContext)
  // `pinned` is the only thing that may differ between the prerender/first-paint
  // pass and later renders. The element tree below must stay the same shape
  // either way (same wrapper div, same MotionCard child) — swapping in a plain
  // div pre-hydration unmounts the whole card subtree on the hydrated flip,
  // including a live LottieBanner mid-load. `h-dvh` (not `min-h-dvh`) is kept
  // fixed in both states too: `MotionCard` below is `h-full`, so a non-fixed
  // ancestor height would let it collapse to its natural size pre-hydration
  // and then visibly grow once `sticky`+`h-dvh` land — same class of jump,
  // one level down. Only `sticky`/`top-0` (pinning) toggles.
  const pinned = hydrated && !reducedMotion && stack !== null
  // Only read when `pinned`, which already requires a context — the fallback
  // just keeps the segment math total for the unpinned/no-context render.
  const count = stack?.count ?? 1
  const wrapperClass = pinned ? 'sticky top-0 flex h-dvh items-center p-4' : 'flex h-dvh items-center p-4'
  const zIndexStyle = useMemo(() => (pinned ? { zIndex: index + 1 } : undefined), [pinned, index])
  const isInert = pinned && stack !== null && index < stack.activeIndex

  return (
    <div className={wrapperClass} style={zIndexStyle} inert={isInert}>
      <MotionCard progress={stack?.progress ?? null} index={index} count={count} pinned={pinned}>
        {children}
      </MotionCard>
    </div>
  )
}

function MotionCard({
  children,
  progress,
  index,
  count,
  pinned,
}: {
  children: ReactNode
  progress: MotionValue<number> | null
  index: number
  count: number
  pinned: boolean
}) {
  // Same `count - 1` real-scroll-segments basis as ScrollStackRoot above —
  // for the last card this range would naturally start at 1 and end above 1.
  // Two problems with that, not one:
  // 1. An `end` above 1, once bound to a real motion.div's `style`, reaches
  //    the native Web Animations API, which throws synchronously ("Offsets
  //    must be null or in the range [0,1]") — during React's commit, with no
  //    error boundary in this tree, unmounting the whole app to a blank page.
  // 2. Clamping the *range* into [0,1] alone isn't enough to fix the last
  //    card specifically: progress reaches 1 (and stays there) the moment
  //    its slot is fully framed and uncovered — not a rare edge, but every
  //    scroll-through of the section — so a bound transform would visibly
  //    shrink/dim it exactly when it should be at its most visible, and hold
  //    that state while the user keeps scrolling past into the next section.
  // Nothing ever covers the last card, so it isn't animated at all: `style`
  // stays `{}` for it regardless of `pinned`, same as the unhydrated path.
  const isLastCard = index === count - 1
  const segments = Math.max(1, count - 1)
  const end = Math.min((index + 1) / segments, 1)
  const start = Math.min(index / segments, end - 0.0001)
  const fallbackProgress = useMotionValue(0)
  const source = progress ?? fallbackProgress
  const scale = useTransform(source, [start, end], [1, 0.94])
  const opacity = useTransform(source, [start + (end - start) * 0.5, end], [1, 0.7])
  const style = useMemo(
    () => (pinned && !isLastCard ? { scale, opacity } : {}),
    [pinned, isLastCard, scale, opacity],
  )

  return (
    // `data-scroll-stack-card` carries the index so tooling can address a
    // specific card; scripts/scroll-perf-probe.mjs samples card 0's transform
    // per frame. Same reasoning as `data-scroll-stack` on the root: a probe that
    // navigates by element position instead silently measures the wrong node
    // when the markup shifts, and reports confident numbers about it.
    <motion.div
      className="h-full max-h-[46rem] w-full"
      style={style}
      data-scroll-stack-card={index}
    >
      {children}
    </motion.div>
  )
}
