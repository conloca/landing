import { useCallback } from 'react'
import { SegmentedControl, type SegmentIndex } from '@/components/ui/segmented-control'
import { AUDIENCES, AUDIENCE_INDEX, AUDIENCE_OPTIONS } from '@/lib/audience'
import { useAudience } from '@/lib/audience-context'

interface AudienceSwitchProps {
  variant?: 'default' | 'translucent'
  className?: string
  /** Distinguishes the accessible name when several instances render at
   * once (one per feature card, plus the hero's) — a screen reader's
   * elements list otherwise shows several indistinguishable "Audience"
   * radiogroups. Defaults to the plain name for the single-instance case. */
  label?: string
}

/**
 * The one place that maps the shared `Audience` state to a `SegmentedControl`
 * index and back. Every "Developers / Content editors" instance on the page
 * (hero, each feature card) renders this instead of wiring `SegmentedControl`
 * directly, so that mapping — and the `onChange`/`label` boilerplate around
 * it — exists exactly once rather than once per call site.
 */
export function AudienceSwitch({
  variant = 'default',
  className,
  label = 'Audience',
}: AudienceSwitchProps) {
  const { audience, setAudience } = useAudience()
  const index = AUDIENCE_INDEX[audience]
  const handleChange = useCallback(
    (next: SegmentIndex) => setAudience(AUDIENCES[next]),
    [setAudience],
  )

  return (
    <SegmentedControl
      options={AUDIENCE_OPTIONS}
      activeIndex={index}
      onChange={handleChange}
      label={label}
      variant={variant}
      {...(className ? { className } : {})}
    />
  )
}
