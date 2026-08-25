import { AstroGlyph } from '@/components/icons/AstroGlyph'

/** Figma: 20x20 ellipse at `lime-600`, 34px layer blur — a glow, not a shape. */
export function AstroBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-lime-50 py-2 pr-3 pl-2">
      <span className="relative flex size-5 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full bg-lime-600 blur-[17px]"
          aria-hidden
        />
        <AstroGlyph className="relative size-4 text-lime-600" />
      </span>
      <span className="text-sm font-bold tracking-wide text-lime-600 uppercase">
        Built for astro
      </span>
    </div>
  )
}
