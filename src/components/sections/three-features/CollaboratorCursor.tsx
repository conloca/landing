import { MousePointer2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Four identity colours from the Figma frame, one per named collaborator,
 * emitted from `color.cursor.*` in tokens/tokens.json. None of the four is a
 * Tailwind colour, hence the emitted `cursor-*` family. All four previously
 * rendered off-design: Niko, Mariam and Danny used nearest Tailwind v4
 * approximations (red-500 #fb2c36, violet-500 #8e51ff, amber-400 #ffb900 —
 * v4's palette, not v3's hexes) and Kyle a raw `#00BFFF` literal. Whether
 * Kyle's deepskyblue is deliberate is still question 14 in
 * docs/QUESTIONS-DESIGNER.md.
 */
const CURSOR_COLORS = {
  niko: { bg: 'bg-cursor-niko', fg: 'text-cursor-niko' },
  mariam: { bg: 'bg-cursor-mariam', fg: 'text-cursor-mariam' },
  danny: { bg: 'bg-cursor-danny', fg: 'text-cursor-danny' },
  kyle: { bg: 'bg-cursor-kyle', fg: 'text-cursor-kyle' },
} as const

/**
 * Two shapes in the Figma frame, not one. Mariam (page-builder canvas) and
 * Danny (PR diff) are GUI-surface mouse cursors: an arrow perched above-left,
 * its tip overlapping the name tag's top-left corner, tag rounded on both
 * ends. Niko sits inside the JSON text editor instead, where the source
 * frame draws a text-caret convention — no arrow at all, a flat-left/
 * rounded-right flag flush against a thin caret bar that runs on past the
 * flag's bottom edge, cropped by the editor's own overflow in the source
 * export. Reusing the pointer arrow for every collaborator was the
 * off-design bug; `variant` selects the shape the surface actually draws.
 */
export function CollaboratorCursor({
  name,
  variant = 'pointer',
  className,
}: {
  name: keyof typeof CURSOR_COLORS
  variant?: 'pointer' | 'flag'
  className?: string
}) {
  const { bg, fg } = CURSOR_COLORS[name]

  if (variant === 'flag') {
    return (
      <span className={cn('relative inline-flex flex-col items-start', className)} aria-hidden>
        <span
          className={cn(
            'rounded-r-full py-0.5 pr-2.5 pl-2 text-xs font-medium text-white whitespace-nowrap capitalize',
            bg,
          )}
        >
          {name}
        </span>
        <span className={cn('h-2 w-1', bg)} />
      </span>
    )
  }

  return (
    <span className={cn('relative inline-block', className)} aria-hidden>
      <MousePointer2 className={cn('size-4 fill-current stroke-white', fg)} strokeWidth={1.5} />
      <span
        className={cn(
          'absolute top-2.5 left-2.5 rounded-full px-2 py-0.5 text-xs font-medium text-white whitespace-nowrap capitalize',
          bg,
        )}
      >
        {name}
      </span>
    </span>
  )
}
