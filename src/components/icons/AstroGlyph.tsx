/** The Astro logo mark — used by the hero's "Built for astro" badge and the statement section's floating tile. */
export function AstroGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 1 4 21h4.5l1.2-3.6h4.6L15.5 21H20L12 1Zm-1 12.5 1-3 1 3h-2Z" />
    </svg>
  )
}
