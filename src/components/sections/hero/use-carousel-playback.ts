/**
 * @file  Elapsed-time clock for the hero carousel. Progress fill and slide
 *        index share one rAF timeline so the bar never finishes out of sync
 *        with the copy change.
 *
 * Accessed via: Hero → CarouselRail → this hook, after hydration, when the
 *               visitor does not prefer reduced motion and the page is visible.
 *
 * Assumptions: slideCount > 0 (slide index is modulo slideCount). `running`
 *              false freezes elapsed so pause / hover / blur resume the same
 *              fill. selectSlide resets elapsed to 0.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export const HERO_SLIDE_DURATION_MS = 8000

/** One elapsed-time step. Exported so the unit test can drive the same clock
 *  the hook uses, without a DOM renderer. */
export function nextCarouselPlayback(
  currentSlide: number,
  elapsedMs: number,
  deltaMs: number,
  slideCount: number,
): { slide: number; elapsedMs: number; progress: number } {
  const total = elapsedMs + Math.max(0, deltaMs)
  const advances = Math.floor(total / HERO_SLIDE_DURATION_MS)
  const nextElapsed = total % HERO_SLIDE_DURATION_MS
  return {
    slide: (currentSlide + advances) % slideCount,
    elapsedMs: nextElapsed,
    progress: (nextElapsed / HERO_SLIDE_DURATION_MS) * 100,
  }
}

/** One elapsed-time clock keeps the progress fill and slide changes synchronized. */
export function useCarouselPlayback(slideCount: number, running: boolean) {
  const [playback, setPlayback] = useState({ slide: 0, progress: 0 })
  const elapsed = useRef(0)
  const slideRef = useRef(0)

  const selectSlide = useCallback((slide: number) => {
    elapsed.current = 0
    slideRef.current = slide
    setPlayback({ slide, progress: 0 })
  }, [])

  useEffect(() => {
    if (!running) return
    let previousTime = performance.now()
    let animationFrame: number

    const tick = (time: number) => {
      const next = nextCarouselPlayback(
        slideRef.current,
        elapsed.current,
        time - previousTime,
        slideCount,
      )
      previousTime = time
      elapsed.current = next.elapsedMs
      slideRef.current = next.slide
      setPlayback({ slide: next.slide, progress: next.progress })
      animationFrame = requestAnimationFrame(tick)
    }

    animationFrame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrame)
  }, [running, slideCount])

  return { ...playback, selectSlide }
}
