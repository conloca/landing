/**
 * Client-only wrapper around the dotLottie WebAssembly player.
 *
 * Three things this file exists to guarantee, each of which is a silent
 * production failure if you skip it:
 *
 * 1. It never renders during the prerender pass. `DotLottieReact` reaches for
 *    canvas/WASM on mount, so the server pass must emit only the static poster
 *    frame — hence the `useHydrated` gate rather than a bare dynamic import.
 * 2. The WASM binary is served from our own origin. dotlottie-web defaults to
 *    fetching it from jsdelivr with an unpkg fallback; a CSP, an offline user,
 *    or a CDN outage silently kills the animation with only a console error.
 *    `setWasmUrl` is called at module scope so it lands before any player boots.
 * 3. It does not play off-screen or against the user's motion preference.
 *    IntersectionObserver drives playback, and reduced motion pins it to a
 *    single rendered frame instead of autoplaying.
 */
import { DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react'
import type { DotLottie } from '@lottiefiles/dotlottie-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useHydrated } from '@/components/motion/Reveal'

// Served from public/, copied from node_modules at scaffold time. Keep in sync
// with the @lottiefiles/dotlottie-web version in package.json.
setWasmUrl('/dotlottie-player.wasm')

// Hoisted so the prop identity is stable across renders.
const RENDER_CONFIG = { autoResize: true } as const

export interface LottieBannerProps {
  src?: string
  className?: string
  /** Accessible description; the canvas is otherwise opaque to screen readers. */
  label: string
  /**
   * `'once'` (default): play once when scrolled into view, then hold on the
   * final frame — for a clip whose last frame doesn't match its first (see
   * `docs/QUESTIONS-DESIGNER.md`). `'loop'`: loop for as long as it's in
   * view, pausing off-screen, resuming where it left off — for a clip
   * authored to repeat cleanly. The default fits `banner-2.lottie`, the
   * component's only caller today; a future cleanly-looping clip should
   * pass `mode="loop"` rather than get this component's one-shot default.
   */
  mode?: 'once' | 'loop'
}

export function LottieBanner({
  src = '/banner-2.lottie',
  className,
  label,
  mode = 'once',
}: LottieBannerProps) {
  const hydrated = useHydrated()
  const containerRef = useRef<HTMLDivElement>(null)
  const [player, setPlayer] = useState<DotLottie | null>(null)

  useInViewPlayback(containerRef, player, mode)

  const handleRef = useCallback((instance: DotLottie | null) => {
    setPlayer(instance)
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      role="img"
      aria-label={label}
      data-lottie-banner
    >
      {hydrated ? (
        <DotLottieReact
          src={src}
          dotLottieRefCallback={handleRef}
          // When to start and pause playback is owned by the observer
          // below, not by the player.
          autoplay={false}
          loop={mode === 'loop'}
          renderConfig={RENDER_CONFIG}
          className="h-full w-full"
        />
      ) : null}
    </div>
  )
}

/**
 * Plays only while the banner is on screen, and only if the user has not asked
 * for reduced motion — in which case a single frame is rendered and held.
 * Pauses on scrolling away and resumes on returning, same as before this
 * hook grew one-shot support, so a clip never keeps animating off-screen.
 *
 * `mode: 'once'` additionally latches on the player's own `complete` event,
 * not on `play()` having merely been called: pause-on-exit means a clip
 * that's still mid-playback when scrolled away must `play()` again on
 * return, so "was `play()` called" can't double as "has it truly finished".
 * Latching on `complete` gets both — resume after an interrupted mid-clip
 * pause, and never restarting once the clip has actually played through.
 * The latch is a plain effect-local variable, reset for free every time
 * this effect re-runs — see the `loadGeneration` comment below for why a
 * `src` change needs that re-run to actually happen.
 *
 * Gated on the player's `load` event, not merely on the ref being populated:
 * `dotLottieRefCallback` hands back the instance as soon as it is constructed,
 * while the WASM module and the .lottie payload are still in flight. Calling
 * play() in that window is silently dropped and the banner sits on frame 0.
 */
function useInViewPlayback(
  containerRef: React.RefObject<HTMLDivElement | null>,
  player: DotLottie | null,
  mode: 'once' | 'loop',
) {
  // A counter, not a boolean: `dotlottie-react` reuses the same player
  // instance across a `src` change (it calls player.load() internally
  // rather than remounting), so a plain "is it loaded" flag would stay
  // `true` across a reload and the playback effect below would never
  // re-run — leaving a completed one-shot clip's "already played" state
  // (and a reduced-motion caller's held frame) stuck from the *previous*
  // clip forever. `load` fires again on every reload regardless, so
  // counting it gives the effect a fresh dependency value each time and
  // forces a clean re-run: new observer, new completion latch, reduced
  // motion re-applied to the new clip's own final frame.
  const [loadGeneration, setLoadGeneration] = useState(0)

  useEffect(() => {
    if (!player) return

    const onLoad = () => setLoadGeneration((n) => n + 1)
    player.addEventListener('load', onLoad)
    // The load event may already have fired between construction and this
    // listener attaching. Defer the catch-up update to a microtask so it is
    // not a synchronous setState-in-effect (oxlint react/no-set-state-in-effect).
    if (player.isLoaded) queueMicrotask(onLoad)

    return () => {
      player.removeEventListener('load', onLoad)
    }
  }, [player])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !player || loadGeneration === 0) return

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (prefersReduced) {
      // Hold the settled end state (the clip's authored resting point), not
      // frame 0 — reduced-motion users should see the same outcome as
      // everyone else, just without the motion getting them there. A
      // looping clip has no single "settled" frame, so it holds frame 0.
      player.setFrame(mode === 'once' ? player.totalFrames - 1 : 0)
      return
    }

    let completed = false
    const onComplete = () => {
      completed = true
    }
    if (mode === 'once') player.addEventListener('complete', onComplete)

    // 0.15, not something higher: `container` is this component's own root,
    // sized to fill its caller's positioning box — which callers are free
    // to render oversized and cropped by an ancestor's `overflow: hidden`
    // (LocalesVisual does exactly this, see docs/QUESTIONS-DESIGNER.md).
    // IntersectionObserver ratios are computed against the target's own
    // *unclipped* box, so on a heavily-cropped caller the achievable ratio
    // can be capped well below 1 — a threshold picked without knowing that
    // ceiling can end up unreachable on some viewports, leaving playback
    // permanently stuck. 0.15 is comfortably inside every caller's ceiling
    // today; raising it needs checking the actual crop ratio first, not
    // just picking a number that "feels" more like real visibility.
    //
    // Checked against `intersectionRatio`, not `isIntersecting`: the latter
    // is just "ratio > 0" regardless of `threshold`, so a low-single-digit
    // sliver already counts as `isIntersecting: true`.
    const THRESHOLD = 0.15
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (completed) continue
          if (entry.intersectionRatio >= THRESHOLD) player.play()
          else player.pause()
        }
      },
      { threshold: THRESHOLD },
    )

    observer.observe(container)
    return () => {
      observer.disconnect()
      if (mode === 'once') player.removeEventListener('complete', onComplete)
    }
  }, [containerRef, player, loadGeneration, mode])
}
