import type { SVGProps } from 'react'
import { ConlocaWordmark } from '@/components/icons/ConlocaWordmark'
import { cn } from '@/lib/utils'

/**
 * `conloca-logo` (Figma node 40002160:4377), ≈116.7×28 per docs/figma/DESIGN-SPEC.md's
 * 117×28 (rounded), recoloured via `currentColor` for the `light` variant. Forwards the
 * rest of `ConlocaWordmark`'s SVG props so a caller can pass `aria-hidden` per its own
 * doc comment.
 */
export function Logo({
  light = false,
  className,
  ...rest
}: { light?: boolean; className?: string } & Omit<SVGProps<SVGSVGElement>, 'className'>) {
  return (
    <ConlocaWordmark
      className={cn('h-7 w-auto', light ? 'text-stone-50' : 'text-stone-900', className)}
      {...rest}
    />
  )
}
