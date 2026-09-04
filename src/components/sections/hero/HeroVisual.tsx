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
    // `group` + the clip-path below turn this box into the crop mask Figma's
    // still frame can't express: the shot is meant to sink into this backdrop
    // and get cut off by its right edge, not float in front of it. Only the
    // right edge of the mask may clip — top, bottom and left are all pushed a
    // full box-width further out. Left, because the shot's rest position
    // already bleeds ~131.5px past the container's left edge by design (see
    // DashboardShot). Top and bottom too, even though the shot sits inside
    // those edges at rest with ~28px to spare either way: `scale-110` on
    // hover grows the rotated shot's half-extent from 390.8px to 429.9px,
    // pushing its corners ~11px past the container's top and bottom at the
    // peak of the zoom — on top of the box-shadow, which the old `inset(0 …
    // 0)` was already hard-cutting even at rest. Neither has a card edge to
    // justify a cut, unlike the right edge, which is the one deliberate crop
    // and must stay flush at 0 (it's what makes the hover zoom bite harder
    // into the shot, as intended).
    // Gated to `@min-[800px]`, the same container-query width the bleed
    // geometry itself keys off (established by the parent from 1382px, see
    // Hero.tsx): below that the shot is `size-full` with no bleed, and
    // clipping there would cut its box-shadow for no reason. No radius
    // utilities here — this div paints nothing of its own, so border-radius
    // is a no-op; rounding lives on the elements that actually paint (the
    // backdrop `<img>`, the shot).
    <div className="group relative aspect-[3398/2337] w-full lg:aspect-[800/838] @min-[800px]:[clip-path:inset(-100%_0_-100%_-100%)]">
      {/* Below `lg` the shot is not sitting on the blurred colour field — that
          field is the hero card's own backdrop there (see HeroBackdrop), and
          drawing it twice would double the vignette behind the panel. */}
      <img
        src={backdropUrl}
        alt=""
        aria-hidden
        className="absolute inset-0 hidden size-full rounded-[28px] object-cover lg:block @min-[800px]:rounded-r-none"
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
  // Scales on hover of the whole `group` (HeroVisual), not just this div —
  // the clickable target is the entire visual per the design review, and only
  // the window grows: the clip mask above stays put, so the crop bites harder
  // the bigger this gets. No href yet — the demo video isn't recorded.
  //
  // Gated to `(hover: hover)`: on a touch device `:hover` applies on tap and
  // has nothing to clear it without a real link to navigate away to, so an
  // ungated version sticks the shot scaled up until the user taps elsewhere.
  return (
    <div className="absolute top-0 left-0 size-full rounded-[20px] shadow-[0_4px_6px_rgba(16,24,40,0.03),0_12px_16px_rgba(16,24,40,0.08),0_4px_64px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out [@media(hover:hover)]:group-hover:scale-110 lg:top-[4.773%] lg:left-[4%] lg:h-[90.453%] lg:w-[92%] lg:-rotate-[1.5deg] @min-[800px]:-left-[15.221%] @min-[800px]:w-[114%] @min-[800px]:rounded-r-none">
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
