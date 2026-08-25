import { Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Stand-in for `conloca-logo` (Figma node 40002160:4377) — the real wordmark
 * mark was never exported (Figma image endpoint was rate-limited during
 * extraction). `data-placeholder` flags it for a follow-up asset swap.
 */
export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-lg font-semibold',
        light ? 'text-stone-50' : 'text-stone-900',
        className,
      )}
      data-placeholder="conloca-logo"
    >
      <Leaf className="size-6" strokeWidth={2.25} aria-hidden />
      Conloca
    </span>
  )
}
