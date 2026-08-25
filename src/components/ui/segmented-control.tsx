import { cn } from '@/lib/utils'

/** Shared by every "Developers / Content editors" instance (Hero, feature cards). */
export const AUDIENCE_OPTIONS: [string, string] = ['Developers', 'Content editors']

interface SegmentedControlProps {
  options: [string, string]
  activeIndex: 0 | 1
  /** `translucent` is the on-dark-photo variant used on the feature cards. */
  variant?: 'default' | 'translucent'
  className?: string
}

/**
 * Presentational only — the Figma file's second tab in every instance
 * ("Content editors", "Annual") has no page or pricing data behind it (see
 * docs/QUESTIONS-DESIGNER.md). Rendering it as an inert pill avoids a tab
 * control that does nothing when clicked.
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
