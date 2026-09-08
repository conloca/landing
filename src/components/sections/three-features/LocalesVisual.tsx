import { LottieBanner } from '@/components/LottieBanner'

/**
 * Card 2 visual: the supplied `banner-2.lottie` (849x1334) inside a 687x721
 * container. Per DESIGN-SPEC.md section 6 the animation overflows its box on
 * every side and is clipped — scaling it to *fit* would shrink the Locales
 * panel to illegibility, so it renders at natural aspect ratio, oversized,
 * anchored slightly upward so the panel lands in the visible window.
 *
 * `min-h-*` is load-bearing: the Lottie is absolutely positioned, and
 * `h-full` does not resolve against the visual slot's `min-height`, so
 * without a definite height here the overflow-hidden root collapses and
 * the clip is empty.
 */
export function LocalesVisual() {
  return (
    <div className="relative h-full min-h-[327px] w-full overflow-hidden sm:min-h-[590px] lg:min-h-full">
      {/* The old symmetric `inset-x-[-18%]` cropped the *center* 73.5% of the
       * 849px-wide composition — which cuts off the right portion of the
       * Locales rows (their status text) and excludes Kyle's cursor badge
       * entirely: measured directly against the unclipped `.lottie` render,
       * the panel spans roughly x 54–94% and Kyle sits at x 91–98% of the
       * frame's own width, both past that old 86.75% right edge. Shifting to
       * an asymmetric `left`/`right` (instead of `inset-x`, which can only
       * be symmetric) re-centers the crop on that panel+badge region instead
       * of the frame's geometric center. Top offsets are still per-breakpoint
       * because the crop *height* is a fixed `min-h` at base/`sm` but tracks
       * the row's own height at `lg`, so the same vertical fraction needs a
       * different `top` at each to keep the panel vertically centered. */}
      <div className="absolute top-[-69%] left-[-100%] right-0 aspect-[849/1334] sm:top-[-60%] lg:top-[-15%]">
        <LottieBanner
          src="banner-2.lottie"
          className="h-full w-full"
          label="Locales panel showing sync status across five languages"
        />
      </div>
    </div>
  )
}
