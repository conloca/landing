import { LottieBanner } from '@/components/LottieBanner'

/**
 * Card 2 visual: the supplied `banner-2.lottie` (849x1334) inside a 687x721
 * container. Per DESIGN-SPEC.md section 6 the animation overflows its box on
 * every side and is clipped — scaling it to *fit* would shrink the Locales
 * panel to illegibility, so it renders at natural aspect ratio, oversized,
 * anchored slightly upward so the panel lands in the visible window.
 */
export function LocalesVisual() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-x-[-18%] top-[-16%] aspect-[849/1334]">
        <LottieBanner className="h-full w-full" label="Locales panel showing sync status across five languages" />
      </div>
    </div>
  )
}
