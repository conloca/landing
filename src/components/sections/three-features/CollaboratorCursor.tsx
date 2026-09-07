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

export function CollaboratorCursor({
  name,
  className,
}: {
  name: keyof typeof CURSOR_COLORS
  className?: string
}) {
  const { bg, fg } = CURSOR_COLORS[name]
  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      aria-hidden
    >
      <MousePointer2 className={cn('size-3.5 fill-current', fg)} />
      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium text-white capitalize', bg)}>
        {name}
      </span>
    </span>
  )
}
