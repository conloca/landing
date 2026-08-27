import { cn } from '@/lib/utils'

interface SegmentedControlProps {
  options: [string, string]
  activeIndex: 0 | 1
  /** `translucent` is the on-dark-photo variant used on the feature cards. */
  variant?: 'default' | 'translucent'
  className?: string
}

/**
 * Presentational only — every instance in the Figma file has a second tab with
 * no page or data behind it (see docs/QUESTIONS-DESIGNER.md), so this renders
 * inert pills rather than a tab control that does nothing when clicked.
 * Callers supply their own labels; this component knows nothing about them.
 */
export function SegmentedControl({
  options,
  activeIndex,
  variant = 'default',
  className,
}: SegmentedControlProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-[14px] p-0.5',
        variant === 'default' ? 'bg-stone-100' : 'bg-stone-50/10',
        className,
      )}
      role="group"
    >
      {options.map((label, index) => (
        <span
          key={label}
          aria-current={index === activeIndex ? 'true' : undefined}
          className={cn(
            'rounded-xl px-4 py-2 text-base font-medium',
            index === activeIndex
              ? variant === 'default'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'bg-white text-stone-900'
              : variant === 'default'
                ? 'text-stone-500'
                : 'text-stone-50',
          )}
        >
          {label}
        </span>
      ))}
    </div>
  )
}
