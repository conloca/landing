/**
 * Scroll-triggered entrance wrapper.
 *
 * Contract (paired with the `.js-ready [data-reveal="pending"]` rule in
 * index.css and the boot script in index.html):
 *   - no JS   -> `js-ready` never lands, content is visible, no animation
 *   - reduced -> hiding rule sits inside `prefers-reduced-motion: no-preference`,
 *                so content is visible, no animation
 *   - normal  -> hidden before first paint, then animated in on scroll
 *
 * Children are never conditionally rendered here: the markup must match
 * between the prerender pass and hydration or React will warn and re-mount.
 */
import { motion, useReducedMotion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ElementType, ReactNode } from 'react'
import { useSyncExternalStore } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'
type Tag = 'div' | 'section' | 'span' | 'li'

const OFFSETS: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 24 },
  down: { x: 0, y: -24 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
  none: { x: 0, y: 0 },
}

/**
 * Typed as ElementType because the four motion components have mutually
 * incompatible prop types (each is bound to its own HTMLElement), so no single
 * union survives JSX. The animation props are typed separately below, which is
 * where correctness actually matters.
 */
const MOTION: Record<Tag, ElementType> = {
  div: motion.div,
  section: motion.section,
  span: motion.span,
  li: motion.li,
}

export interface RevealProps {
  children: ReactNode
  /** Direction the element travels *from*. */
  direction?: Direction
  delay?: number
  duration?: number
  /** Fraction of the element that must be visible before it animates. */
  amount?: number
  className?: string
  as?: Tag
}

export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  amount = 0.3,
  className,
  as = 'div',
}: RevealProps) {
  const hydrated = useHydrated()
  const reducedMotion = useReducedMotion()

  // Server pass, first client render, and reduced motion all take this branch,
  // so hydration sees byte-identical markup.
  if (!hydrated || reducedMotion) {
    const Static = as
    return (
      <Static className={className} data-reveal="pending">
        {children}
      </Static>
    )
  }

  const offset = OFFSETS[direction]
  const Animated = MOTION[as]
  const animation: HTMLMotionProps<'div'> = {
    initial: { opacity: 0, x: offset.x, y: offset.y },
    whileInView: { opacity: 1, x: 0, y: 0 },
    viewport: { once: true, amount },
    transition: { duration, delay, ease: [0.22, 1, 0.36, 1] },
  }

  return (
    <Animated className={className} data-reveal="animating" {...animation}>
      {children}
    </Animated>
  )
}

/**
 * True only after hydration has committed; false during the prerender pass and
 * throughout hydration itself.
 *
 * `useSyncExternalStore` rather than a state-in-effect flip: React reads the
 * server snapshot while hydrating and the client snapshot afterwards, so the
 * switch costs no cascading render and cannot desync the two passes.
 */
const NO_OP_SUBSCRIBE = () => () => {}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    NO_OP_SUBSCRIBE,
    () => true,
    () => false,
  )
}
