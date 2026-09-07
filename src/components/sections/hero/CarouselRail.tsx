import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FocusEvent,
} from 'react'
import { useHydrated } from '@/components/motion/Reveal'
import { cn } from '@/lib/utils'
import type { HeroCarouselSlides } from '@/lib/content/hero-copy'
import { useCarouselPlayback } from './use-carousel-playback'

/**
 * The vertical rail needs an explicit track length, and `h-full` cannot give
 * it one: the rail's flex-col parent has no height of its own to stretch
 * from, so a percentage-based fill silently collapses to zero. Carried as a
 * custom property rather than a fixed height so only the `lg` class consumes
 * it — below `lg` the tracks run horizontally and take their length from the
 * design's own widths instead.
 */
const RAIL_TRACK: CSSProperties = { '--rail-track': '28px' } as CSSProperties

const MESSAGE_CLASS =
  'max-w-[337px] text-center text-base leading-[1.7] font-bold text-stone-700 italic sm:max-w-[576px] lg:max-w-[432px] lg:text-left lg:leading-normal lg:not-italic'

const CAROUSEL_LABEL = 'How Conloca works'
const CHOOSE_LABEL = 'Choose a message'
const SHOW_LABEL = 'Show message '
const PLAY_LABEL = 'Play messages'
const PAUSE_LABEL = 'Pause messages'

let reducedMotionMql: MediaQueryList | undefined

function reducedMotionQuery(): MediaQueryList {
  reducedMotionMql ??= window.matchMedia('(prefers-reduced-motion: reduce)')
  return reducedMotionMql
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = reducedMotionQuery()
  media.addEventListener('change', onStoreChange)
  return () => media.removeEventListener('change', onStoreChange)
}

/** Server snapshot is `true` so prerender emits every slide. After hydration
 *  the client snapshot is the real preference, including on remount. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => reducedMotionQuery().matches,
    () => true,
  )
}

interface CarouselRailProps {
  slides: HeroCarouselSlides
}

/**
 * Three-slide hero carousel. The design turns the rail through 90 degrees
 * below `lg`: desktop runs it as a vertical gutter beside left-aligned copy,
 * mobile centres the copy and lays the bars out horizontally beneath it.
 * Same three tracks either way, so this is one component with the axis
 * flipped rather than two.
 *
 * Prerender and reduced-motion render every slide in the document, visible
 * — never `opacity: 0`. The hydrated, motion-ok path shows one slide at a
 * time and fills the active bar from the shared rAF clock.
 */
export function CarouselRail({ slides }: CarouselRailProps) {
  const hydrated = useHydrated()
  const reducedMotion = usePrefersReducedMotion()
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [pageVisible, setPageVisible] = useState(false)

  const startHover = useCallback(() => setHovered(true), [])
  const endHover = useCallback(() => setHovered(false), [])
  const startFocus = useCallback(() => setFocused(true), [])
  const handleBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const related = event.relatedTarget
    if (related instanceof Node && event.currentTarget.contains(related)) return
    setFocused(false)
  }, [])
  const togglePause = useCallback(() => setPaused((current) => !current), [])

  const showAllSlides = !hydrated || reducedMotion
  const running = hydrated && !paused && !hovered && !focused && !reducedMotion && pageVisible
  const { slide, progress, selectSlide } = useCarouselPlayback(slides.length, running)
  const message = slides[slide] ?? slides[0]
  const activeIndex = showAllSlides ? 0 : slide

  const handleSlideSelect = useCallback(
    (index: number) => {
      selectSlide(index)
      setPaused(true)
    },
    [selectSlide],
  )

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden)
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label={CAROUSEL_LABEL}
      data-running={running}
    >
      <div
        className="flex flex-col items-center gap-4 lg:flex-row lg:items-start"
        onMouseEnter={showAllSlides ? undefined : startHover}
        onMouseLeave={showAllSlides ? undefined : endHover}
        onFocusCapture={showAllSlides ? undefined : startFocus}
        onBlurCapture={showAllSlides ? undefined : handleBlur}
      >
        <div
          className="order-2 flex gap-1 lg:order-1 lg:flex-col"
          role="group"
          aria-label={CHOOSE_LABEL}
        >
          {slides.map((_, index) => {
            const fill = showAllSlides ? (index === 0 ? 100 : 0) : slide === index ? progress : 0
            return (
              <button
                key={index}
                type="button"
                disabled={showAllSlides}
                style={
                  {
                    ...RAIL_TRACK,
                    '--carousel-progress': `${fill}%`,
                  } as CSSProperties
                }
                className={cn(
                  'relative border-0 bg-transparent p-0',
                  'h-0.5 lg:h-[var(--rail-track)] lg:w-0.5',
                  'before:absolute before:-inset-2 before:content-[""]',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                  'disabled:pointer-events-none',
                  index === activeIndex ? 'w-[27px]' : 'w-[23px]',
                )}
                aria-label={SHOW_LABEL + (index + 1)}
                aria-pressed={index === activeIndex}
                onClick={() => handleSlideSelect(index)}
              >
                <span
                  aria-hidden="true"
                  className="block h-full w-full overflow-hidden rounded-full bg-stone-300 lg:bg-stone-200"
                >
                  <span className="block rounded-full bg-stone-500 max-lg:h-full max-lg:w-[var(--carousel-progress)] lg:h-[var(--carousel-progress)] lg:w-full lg:bg-stone-400" />
                </span>
              </button>
            )
          })}
        </div>
        {showAllSlides ? (
          <div className="order-1 flex flex-col items-center gap-3 lg:order-2 lg:items-start">
            {slides.map(([lead, rest], index) => (
              <p key={index} className={MESSAGE_CLASS}>
                {lead}
                {rest}
              </p>
            ))}
          </div>
        ) : (
          <p
            className={cn('order-1 lg:order-2', MESSAGE_CLASS)}
            aria-live={paused ? 'polite' : 'off'}
          >
            {message[0]}
            {message[1]}
          </p>
        )}
      </div>
      {showAllSlides ? null : (
        <button
          className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:right-0 focus-visible:bottom-full focus-visible:z-10 focus-visible:bg-stone-100 focus-visible:p-2 focus-visible:text-sm"
          type="button"
          onClick={togglePause}
        >
          {paused ? PLAY_LABEL : PAUSE_LABEL}
        </button>
      )}
    </div>
  )
}
