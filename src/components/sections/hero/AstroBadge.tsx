import { AstroGlyph } from '@/components/icons/AstroGlyph'

/**
 * Figma: 20x20 ellipse at lime-600, 34px layer blur — a glow, not a shape.
 *
 * The pill inverts between the two hero compositions. On the light desktop
 * background (DESIGN-SPEC S0) it is a pale lime tint (`lime-50`) with darker
 * lime type and glow (`lime-600`). On the photographic card below `lg` (node
 * 40002441:875) the fill is the brand lime at 20%, which reads dark because
 * what shows through it is the photo, and the type is that same lime at full
 * strength (`lime-400`).
 *
 * Both sides are Tailwind v4's own lime scale: the design's lime ramp IS v4's
 * lime, exactly (v4's oklch lime-400 renders #9ae600 — the v3 hex #a3e635 is
 * not what this project ships). The mobile classes below previously spelled
 * the same colours as raw literals.
 */
export function AstroBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-lime-400/20 py-2 pr-3 pl-2 lg:bg-lime-50">
      <span className="relative flex size-5 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full bg-lime-400/30 blur-[17px] lg:bg-lime-600"
          aria-hidden
        />
        <AstroGlyph className="relative size-4 text-lime-400 lg:text-lime-600" />
      </span>
      <span className="text-sm font-bold tracking-normal text-lime-400 uppercase lg:tracking-wide lg:text-lime-600">
        Built for astro
      </span>
    </div>
  )
}
