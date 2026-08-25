import { MousePointer2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Four identity colours from the Figma frame, one per named collaborator.
 * `#00BFFF` (Kyle) is a raw CSS keyword colour, not a Tailwind token — see
 * docs/QUESTIONS-DESIGNER.md.
 */
const CURSOR_COLORS = {
  niko: { bg: 'bg-red-500', fg: 'text-red-500' },
  mariam: { bg: 'bg-violet-500', fg: 'text-violet-500' },
  danny: { bg: 'bg-amber-400', fg: 'text-amber-400' },
  kyle: { bg: 'bg-[#00BFFF]', fg: 'text-[#00BFFF]' },
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
