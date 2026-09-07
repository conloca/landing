import { AstroGlyph } from '@/components/icons/AstroGlyph'

/**
 * Figma: 20x20 ellipse at `lime-600`, 34px layer blur — a glow, not a shape.
 *
 * The pill inverts between the two hero compositions. On the light desktop
 * background it is a pale lime tint carrying darker lime type. On the
 * photographic card below `lg` (node 40002441:875) the fill is the brand lime
 * `#9AE600` at 20%, which reads dark because what shows through it is the
 * photo, and the type is that same lime at full strength.
 *
 * The two sides do not share a swatch: the mobile values are the design's
 * literal `#9AE600`, while the desktop ones are Tailwind's `lime-*` scale and
 * predate this component's mobile treatment. Worth reconciling against the
 * token file, but not by guessing which of the two the designer meant.
 */
export function AstroBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-[#9AE600]/20 py-2 pr-3 pl-2 lg:bg-lime-50">
      <span className="relative flex size-5 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full bg-[#9AE600]/30 blur-[17px] lg:bg-lime-600"
          aria-hidden
        />
        <AstroGlyph className="relative size-4 text-[#9AE600] lg:text-lime-600" />
      </span>
      <span className="text-sm font-bold tracking-normal text-[#9AE600] uppercase lg:tracking-wide lg:text-lime-600">
        Built for astro
      </span>
    </div>
  )
}
