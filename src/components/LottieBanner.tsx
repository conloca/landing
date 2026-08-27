/**
 * Client-only wrapper around the dotLottie WebAssembly player.
 *
 * Four things this file exists to guarantee, each of which is a silent
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
 * 4. It does not download at all until it is nearly on screen. The banner sits
 *    well below the fold, so mounting the player on hydration made every
 *    visitor pay for the WASM module and the .lottie payload whether or not
 *    they ever scrolled to it. A second observer gates the mount itself, ahead
 *    of the playback observer in (3).
 */
import { DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react'
import type { DotLottie } from '@lottiefiles/dotlottie-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useHydrated } from '@/components/motion/Reveal'
import { publicUrl } from '@/lib/publicUrl'

// Served from public/, copied from node_modules at scaffold time. Keep in sync
// with the @lottiefiles/dotlottie-web version in package.json.
//
// Resolved via publicUrl(), not a bare `'/name'` literal: Vite only rewrites
// asset references it recognizes in HTML/CSS/JS import graphs for the
// configured `base`, not a plain absolute-root string like that — it would
// 404 once base is a GitHub Pages subpath. See src/lib/publicUrl.ts.
setWasmUrl(publicUrl('dotlottie-player.wasm'))

// Hoisted so the prop identity is stable across renders.
const RENDER_CONFIG = { autoResize: true } as const

// How far below the fold the player starts loading. Roughly one short-phone
// viewport of lead time — enough to be ready on arrival, not so much that a
// visitor who never scrolls pays for it anyway.
const ROOT_MARGIN = '600px'

export interface LottieBannerProps {
  /** A `public/` filename (e.g. `'banner-2.lottie'`), or a full URL — the
   * component resolves it through `publicUrl()` itself, so callers never
   * need to think about the deploy base path.
   *
   * Required rather than defaulted: with a default, a call site that omits it
   * silently inherits whichever animation the default happens to name, so
   * changing that default for one caller would swap the animation under every
   * other caller with nothing to flag it. Required makes that a type error. */
  src: string
  className?: string
  /** Accessible description; the canvas is otherwise opaque to screen readers. */
  label: string
}

export function LottieBanner({ src, className, label }: LottieBannerProps) {
  const hydrated = useHydrated()
  const containerRef = useRef<HTMLDivElement>(null)
  const [player, setPlayer] = useState<DotLottie | null>(null)
  // Resolved once here, not by the caller — see the `src` doc comment above.
  const resolvedSrc = publicUrl(src)
  const nearViewport = useNearViewportOnce(containerRef)

  useInViewPlayback(containerRef, player)

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
      {hydrated && nearViewport ? (
        <DotLottieReact
          src={resolvedSrc}
          dotLottieRefCallback={handleRef}
          // Playback is owned by the observer below, not by the player.
          autoplay={false}
          loop
          renderConfig={RENDER_CONFIG}
          className="h-full w-full"
        />
      ) : null}
    </div>
  )
}

/**
 * True once the container has come within `ROOT_MARGIN` of the viewport, and
 * true forever after — this gates the *mount*, so flipping back to false when
 * the banner scrolls away would tear down a loaded player and re-download it
 * on the way back. Playback pausing is the other observer's job.
 *
 * The margin buys a head start: the fetch and WASM instantiation begin while
 * the banner is still just below the fold, so it is ready rather than blank
 * by the time it is actually looked at.
 *
 * Falls open when `IntersectionObserver` is unavailable — a browser without it
 * should get the animation, not a permanently empty box.
 */
function useNearViewportOnce(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [near, setNear] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container || near) return
    if (typeof IntersectionObserver === 'undefined') {
      // Deferred, not called inline: a synchronous setState in an effect body
      // starts a cascading render (oxlint react/set-state-in-effect), the same
      // reason the load catch-up below uses a microtask.
      queueMicrotask(() => setNear(true))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true)
      },
      { rootMargin: ROOT_MARGIN },
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [containerRef, near])

  return near
}

/**
 * Plays only while the banner is on screen, and only if the user has not asked
 * for reduced motion — in which case a single frame is rendered and held.
 *
 * Gated on the player's `load` event, not merely on the ref being populated:
 * `dotLottieRefCallback` hands back the instance as soon as it is constructed,
 * while the WASM module and the .lottie payload are still in flight. Calling
 * play() in that window is silently dropped and the banner sits on frame 0.
 */
function useInViewPlayback(
  containerRef: React.RefObject<HTMLDivElement | null>,
  player: DotLottie | null,
) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!player) return

    const onLoad = () => setLoaded(true)
    player.addEventListener('load', onLoad)
    // The load event may already have fired between construction and this
    // listener attaching. Defer the catch-up update to a microtask so it is
    // not a synchronous setState-in-effect (oxlint react/no-set-state-in-effect).
    if (player.isLoaded) queueMicrotask(onLoad)

    return () => {
      player.removeEventListener('load', onLoad)
      setLoaded(false)
    }
  }, [player])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !player || !loaded) return

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (prefersReduced) {
      player.setFrame(0)
      return
    }

    // Same fallback as the mount gate above, and it has to be here too: that
    // gate deliberately falls open without IntersectionObserver, so this effect
    // *does* run in such a browser. Constructing one unguarded here would throw
    // from an effect with no boundary in this tree — turning "no lazy-mount"
    // into "no animation, plus an uncaught error". Without the API there is no
    // way to know when the banner is on screen, so just play.
    if (typeof IntersectionObserver === 'undefined') {
      player.play()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) player.play()
          else player.pause()
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [containerRef, player, loaded])
}
