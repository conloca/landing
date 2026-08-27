import { useCallback } from 'react'
import { cn } from '@/lib/utils'

/** Shared by every "Developers / Content editors" instance (Hero, feature cards). */
export const AUDIENCE_OPTIONS: [string, string] = ['Developers', 'Content editors']

export type SegmentIndex = 0 | 1

type Variant = 'default' | 'translucent'

interface SegmentedControlBase {
  options: [string, string]
  activeIndex: SegmentIndex
  /** `translucent` is the on-dark-photo variant used on the feature cards. */
  variant?: Variant
  className?: string
}

/**
 * The two modes are exclusive so the compiler enforces what the docstring promises:
 * a radiogroup without an accessible name is an accessibility defect, so `label`
 * is required exactly when `onChange` makes the control interactive.
 */
type SegmentedControlProps =
  | (SegmentedControlBase & { onChange: (index: SegmentIndex) => void; label: string })
  | (SegmentedControlBase & { onChange?: never; label?: string })

const TRACK: Record<Variant, string> = {
  default: 'bg-stone-100',
  translucent: 'bg-stone-50/10',
}

const SELECTED: Record<Variant, string> = {
  default: 'bg-white text-stone-900 shadow-sm',
  translucent: 'bg-white text-stone-900',
}

const IDLE: Record<Variant, string> = {
  default: 'text-stone-500',
  translucent: 'text-stone-50',
}

const ARROW_KEYS = new Set(['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'])

function segmentClass(variant: Variant, selected: boolean) {
  return cn(
    'rounded-xl px-4 py-2 text-base font-medium transition-colors',
    selected ? SELECTED[variant] : IDLE[variant],
  )
}

function trackClass(variant: Variant, className?: string) {
  return cn('inline-flex items-center gap-0.5 rounded-[14px] p-0.5', TRACK[variant], className)
}

/**
 * Moves focus to the sibling radio so arrow-key navigation lands where selection did.
 * Scoped by role rather than by tag and parentage, so wrapping the segments (a sliding
 * indicator, say) or adding another button to the track cannot silently misdirect focus.
 */
function focusSibling(from: HTMLElement, index: SegmentIndex) {
  const group = from.closest('[role="radiogroup"]')
  const radios = group?.querySelectorAll<HTMLElement>('[role="radio"]')
  radios?.[index]?.focus()
}

interface SegmentProps {
  index: SegmentIndex
  label: string
  selected: boolean
  variant: Variant
  onSelect: (index: SegmentIndex) => void
}

function Segment({ index, label, selected, variant, onSelect }: SegmentProps) {
  const handleClick = useCallback(() => onSelect(index), [index, onSelect])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!ARROW_KEYS.has(event.key)) return
      event.preventDefault()
      const next: SegmentIndex = index === 0 ? 1 : 0
      onSelect(next)
      focusSibling(event.currentTarget, next)
    },
    [index, onSelect],
  )

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        segmentClass(variant, selected),
        'focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:outline-none',
      )}
    >
      {label}
    </button>
  )
}

/**
 * Two-option switch. With `onChange` it is a real radiogroup — clickable,
 * arrow-key navigable, and exposing `aria-checked` — so a keyboard and assistive
 * technology reach the same states a mouse does.
 *
 * Without one it stays a static pill, which is why the Hero and feature-card
 * "Developers / Content editors" instances pass no handler: the design's second
 * audience is a separate page variant that has not been built, so a button there
 * would do nothing when clicked. A static pill is the honest rendering until it
 * exists. See docs/QUESTIONS-DESIGNER.md.
 */
export function SegmentedControl({
  options,
  activeIndex,
  onChange,
  variant = 'default',
  className,
  label,
}: SegmentedControlProps) {
  if (!onChange) {
    return (
      <div className={trackClass(variant, className)} role="group" aria-label={label}>
        {options.map((option, index) => (
          <span
            key={option}
            aria-current={index === activeIndex ? 'true' : undefined}
            className={segmentClass(variant, index === activeIndex)}
          >
            {option}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className={trackClass(variant, className)} role="radiogroup" aria-label={label}>
      {options.map((option, index) => (
        <Segment
          key={option}
          index={index as SegmentIndex}
          label={option}
          selected={index === activeIndex}
          variant={variant}
          onSelect={onChange}
        />
      ))}
    </div>
  )
}
