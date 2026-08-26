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
import { DotLottieReact, setWasmUrl } from "@lottiefiles/dotlottie-react";
import type { DotLottie } from "@lottiefiles/dotlottie-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHydrated } from "@/components/motion/Reveal";
import { publicUrl } from "@/lib/publicUrl";

// Served from public/, copied from node_modules at scaffold time. Keep in sync
// with the @lottiefiles/dotlottie-web version in package.json.
//
// Resolved via publicUrl(), not a bare `'/name'` literal: Vite only rewrites
// asset references it recognizes in HTML/CSS/JS import graphs for the
// configured `base`, not a plain absolute-root string like that — it would
// 404 once base is a GitHub Pages subpath. See src/lib/publicUrl.ts.
setWasmUrl(publicUrl("dotlottie-player.wasm"));

/**
 * Render configs are cached per pixel ratio so the prop keeps a stable identity
 * across renders — the player treats a new `renderConfig` object as a reason to
 * reconfigure itself.
 *
 * `quality` is deliberately absent. Setting it to 50 — the obvious next lever —
 * measured roughly twice as slow as leaving it alone (mean frame 27.94ms vs
 * 16.67ms, 33 long tasks vs 1, script 3887ms vs 1906ms), so it is not a knob to
 * reach for here without re-measuring first.
 */
const RENDER_CONFIGS = new Map<
  number,
  { autoResize: true; devicePixelRatio: number }
>();

function renderConfigFor(devicePixelRatio: number) {
  const cached = RENDER_CONFIGS.get(devicePixelRatio);
  if (cached) return cached;
  const created = { autoResize: true, devicePixelRatio } as const;
  RENDER_CONFIGS.set(devicePixelRatio, created);
  return created;
}

// How far below the fold the player starts loading. Roughly one short-phone
// viewport of lead time — enough to be ready on arrival, not so much that a
// visitor who never scrolls pays for it anyway.
const ROOT_MARGIN = "600px";

export interface LottieBannerProps {
  /** A `public/` filename (e.g. `'banner-2.lottie'`), or a full URL — the
   * component resolves it through `publicUrl()` itself, so callers never
   * need to think about the deploy base path.
   *
   * Required rather than defaulted: with a default, a call site that omits it
   * silently inherits whichever animation the default happens to name, so
   * changing that default for one caller would swap the animation under every
   * other caller with nothing to flag it. Required makes that a type error. */
  src: string;
  className?: string;
  /** Accessible description; the canvas is otherwise opaque to screen readers. */
  label: string;
  /**
   * Rasterisation density, defaulting to 1 rather than the player's own default
   * of `window.devicePixelRatio`. That default is a performance trap for a large
   * decorative animation: on a Retina display it rasterises at twice the linear
   * resolution, and the banner this component was built for is a 176-layer
   * composition in a ~1160x1822 CSS px box, so it lands at roughly 8.8
   * megapixels per frame at 60fps — on the main thread, while the pinned
   * ScrollStack is scaling the very card it sits in.
   *
   * Measured on a scripted scroll through that section at density 2: uncapped
   * spent 5966ms of a 7773ms task budget in script, produced 78 long tasks
   * totalling 7474ms and stalled one frame for 985ms; capped, the same sweep
   * had 1-19 long tasks and no stall beyond 184ms. Capping quarters the pixel
   * count, and a diff of the two captures at density 2 differs by 0.114% —
   * anti-aliasing on glyph and flag edges, nothing structural.
   *
   * Raise it for a banner that is small, sharp and load-bearing rather than
   * large, clipped and decorative. Values are not read from `window` here
   * because this module is pulled into the SSR bundle.
   */
  devicePixelRatio?: number;
  /**
   * `'once'` (default): play once when scrolled into view, then hold on the
   * final frame — for a clip whose last frame doesn't match its first (see
   * `docs/QUESTIONS-DESIGNER.md`). `'loop'`: loop for as long as it's in
   * view, pausing off-screen, resuming where it left off — for a clip
   * authored to repeat cleanly. The default fits `banner-2.lottie`, the
   * component's only caller today; a future cleanly-looping clip should
   * pass `mode="loop"` rather than get this component's one-shot default.
   */
  mode?: "once" | "loop";
}

export function LottieBanner({
  src,
  className,
  label,
  devicePixelRatio = 1,
  mode = "once",
}: LottieBannerProps) {
  const hydrated = useHydrated();
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<DotLottie | null>(null);
  // Resolved once here, not by the caller — see the `src` doc comment above.
  const resolvedSrc = publicUrl(src);
  const nearViewport = useNearViewportOnce(containerRef);

  useInViewPlayback(containerRef, player, mode);

  const handleRef = useCallback((instance: DotLottie | null) => {
    setPlayer(instance);
  }, []);

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
          // When to start and pause playback is owned by the observer
          // below, not by the player.
          autoplay={false}
          loop={mode === "loop"}
          renderConfig={renderConfigFor(devicePixelRatio)}
          className="h-full w-full"
        />
      ) : null}
    </div>
  );
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
function useNearViewportOnce(
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || near) return;
    if (typeof IntersectionObserver === "undefined") {
      // Deferred, not called inline: a synchronous setState in an effect body
      // starts a cascading render (oxlint react/set-state-in-effect), the same
      // reason the load catch-up below uses a microtask.
      queueMicrotask(() => setNear(true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: ROOT_MARGIN },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, near]);

  return near;
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
  mode: "once" | "loop",
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
  const [loadGeneration, setLoadGeneration] = useState(0);

  useEffect(() => {
    if (!player) return;

    const onLoad = () => setLoadGeneration((n) => n + 1);
    player.addEventListener("load", onLoad);
    // The load event may already have fired between construction and this
    // listener attaching. Defer the catch-up update to a microtask so it is
    // not a synchronous setState-in-effect (oxlint react/no-set-state-in-effect).
    if (player.isLoaded) queueMicrotask(onLoad);

    return () => {
      player.removeEventListener("load", onLoad);
    };
  }, [player]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !player || loadGeneration === 0) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      // Hold the settled end state (the clip's authored resting point), not
      // frame 0 — reduced-motion users should see the same outcome as
      // everyone else, just without the motion getting them there. A
      // looping clip has no single "settled" frame, so it holds frame 0.
      player.setFrame(mode === "once" ? player.totalFrames - 1 : 0);
      return;
    }

    let completed = false;
    const onComplete = () => {
      completed = true;
    };
    if (mode === "once") player.addEventListener("complete", onComplete);

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
    const THRESHOLD = 0.15;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (completed) continue;
          if (entry.intersectionRatio >= THRESHOLD) player.play();
          else player.pause();
        }
      },
      { threshold: THRESHOLD },
    );

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (mode === "once") player.removeEventListener("complete", onComplete);
    };
  }, [containerRef, player, loadGeneration, mode]);
}
