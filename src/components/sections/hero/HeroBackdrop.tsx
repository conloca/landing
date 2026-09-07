import backdropUrl from '@/assets/figma/hero-backdrop.webp'

/**
 * The photographic card behind the hero copy below `lg` — Figma
 * `Display text and segmented control` (node 40002441:869 at 393), an image
 * fill with a flat black layer at 20% over it so white type stays legible on
 * a photo whose luminance the design cannot control.
 *
 * It is a grid item rather than a wrapper element so the copy and the buttons
 * can stay separate grid children: the card has to span both of them on
 * mobile while they occupy different rows on desktop, and only a grid child
 * can be told to cover a range of rows. `-z-10` puts it behind its
 * siblings without taking them out of flow.
 *
 * Above `lg` the design has no card at all, so this renders nothing there.
 */
export function HeroBackdrop() {
  return (
    <div
      aria-hidden
      className="relative col-start-1 row-span-2 row-start-1 -z-10 overflow-hidden rounded-[20px] sm:rounded-3xl lg:hidden"
    >
      <img src={backdropUrl} alt="" className="size-full object-cover" />
      <span className="absolute inset-0 bg-black/20" />
    </div>
  )
}
