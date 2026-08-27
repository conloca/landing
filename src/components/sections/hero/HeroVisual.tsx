import { Play } from 'lucide-react'

import backdropUrl from '@/assets/figma/hero-backdrop.webp'
import dashboardUrl from '@/assets/figma/hero-dashboard.webp'

/**
 * Figma `Visual content` (node 40002427:16412) — the hero's product shot.
 *
 * In the design this is NOT a composed UI: `Video frame` (40002427:16414) is a
 * single image fill of a dashboard screenshot with only a play button drawn on
 * top, sitting on `Video container` (40002427:16413) whose own image fill is
 * the blurred colour field. An earlier revision reconstructed the screenshot's
 * contents as DOM because the asset had not been exported yet; it could never
 * match, because there is nothing to match structurally — it is a photo.
 *
 * This component owns only its internal geometry. Where it sits and how wide
 * it is are the parent's business, because only the parent knows the grid.
 *
 * One part of that geometry escapes this box and the parent must know it: at
 * full size the shot bleeds 121.8px past the container's left edge (131.5px
 * once rotated). The parent's grid has to leave room for that, or the shot
 * reaches back over the text column.
 */
export function HeroVisual() {
  return (
    <div className="relative aspect-[3398/2337] w-full rounded-[20px] lg:aspect-[800/838] lg:rounded-[28px]">
      {/* Below `lg` the shot is not sitting on the blurred colour field — that
          field is the hero card's own backdrop there (see HeroBackdrop), and
          drawing it twice would double the vignette behind the panel. */}
      <img
        src={backdropUrl}
        alt=""
        aria-hidden
        className="absolute inset-0 hidden size-full rounded-[28px] object-cover lg:block"
      />
      <DashboardShot />
    </div>
  )
}

/**
 * `Video frame`, rotated -1.5deg inside the 800x838 container.
 *
 * Figma reports 931.53x781.61 at (-131.53, 28.19), but for a rotated node
 * `absoluteBoundingBox` is the axis-aligned box *around* the rotation, not the
 * frame's own rect. Solving that back out (W·cos+H·sin, W·sin+H·cos at 1.5deg)
 * gives a true 912x758 sharing the same centre, i.e. -121.765, 40 — which is
 * what CSS needs, since `rotate` also turns an unrotated box about its centre.
 * Using the reported figures directly renders the shot ~12px too tall.
 *
 * That geometry only reads correctly at the container's full 800px, where the
 * square right corner is hidden by the crop. So it keys off a container query,
 * not a viewport breakpoint: the real invariant is "when I am at my Figma
 * width, render Figma geometry", and expressing it that way keeps this file
 * from having to know the parent's columns, gaps and padding. Below 800px the
 * shot sits fully inside the container with every corner rounded, because
 * nothing is cropping it there.
 */
function DashboardShot() {
  return (
    <div className="absolute top-0 left-0 size-full rounded-[20px] shadow-[0_4px_6px_rgba(16,24,40,0.03),0_12px_16px_rgba(16,24,40,0.08),0_4px_64px_rgba(0,0,0,0.15)] lg:top-[4.773%] lg:left-[4%] lg:h-[90.453%] lg:w-[92%] lg:-rotate-[1.5deg] @min-[800px]:-left-[15.221%] @min-[800px]:w-[114%] @min-[800px]:rounded-r-none">
      <img
        src={dashboardUrl}
        alt="Conloca dashboard showing recent content activity for a staging site"
        fetchPriority="high"
        // Figma's fill is `scaleMode: FILL`, whose crop is nominally centred,
        // but the image is only ~3% wider than the box at either composition,
        // so the two differ by a handful of pixels. Measured against the
        // reference render the left anchor is the closer match at both sizes
        // (mean error 15.45 against 15.87 over the panel), so it stays shared
        // rather than being overridden per breakpoint.
        className="size-full rounded-[20px] object-cover object-left @min-[800px]:rounded-r-none"
      />
      <PlayBadge />
    </div>
  )
}

/**
 * `Play button` — 57.45px, centred on the shot, black at 20%. Decorative: no
 * video is wired up, so this is not a focusable control that does nothing.
 */
function PlayBadge() {
  return (
    <span
      aria-hidden
      className="absolute top-1/2 left-1/2 flex size-[57px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm"
    >
      <Play className="size-6 translate-x-0.5 fill-white text-white" />
    </span>
  )
}
