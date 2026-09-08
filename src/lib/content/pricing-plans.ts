import { CTA_LINKS } from '@/lib/nav'
import type { Plan, PlanFeature } from '@/components/sections/pricing/PricingCard'

const has = (label: string): PlanFeature => ({ label, included: true })

/**
 * Single source of truth for the three plans' real figures — seats, storage,
 * governance — shared by the homepage `#pricing` cards (`Pricing.tsx`) and the
 * `/pricing/` page's cards and comparison table (`PricingPage.tsx`). Change a
 * number once, here, and every surface that quotes it moves together. Monthly
 * subscription rates live in `@/lib/pricing`, not here — this only carries the
 * per-plan copy that rate can't express (seat/storage limits, governance).
 *
 * See `docs/QUESTIONS-DESIGNER.md` ("Pricing plans"): these are Denny's numbers,
 * not the design file's stale ones, and annual billing never gets a "Billed
 * annually" subtitle.
 *
 * Simple lists only the five included checks from Figma S4. Pro and Business
 * add residency, access control, and support. Capabilities Simple does not
 * offer are omitted rather than shown as dashes — the design never draws
 * those rows.
 */
export const PLANS: readonly [Plan, Plan, Plan] = [
  {
    name: 'Simple',
    pricing: { monthlyRate: 8 },
    pitch: 'For small teams getting their site off the ground',
    cta: 'Choose simple',
    ctaHref: CTA_LINKS.choosePlan,
    features: [
      has('3 seats included ($5 per additional seat)'),
      has('5 seats max'),
      has('1 repository'),
      has('1GB repository storage'),
      has('1GB media storage'),
    ],
  },
  {
    name: 'Pro',
    pricing: { monthlyRate: 15 },
    pitch: 'For growing teams shipping content more often',
    cta: 'Choose pro',
    ctaHref: CTA_LINKS.choosePlan,
    highlighted: true,
    features: [
      has('15 seats included ($9 per additional seat)'),
      has('25 seats max'),
      has('Unlimited repositories'),
      has('20GB repository storage'),
      has('100GB media storage'),
      has('Choose data residency (US/EU)'),
      has('Basic access control'),
      has('Priority support'),
    ],
  },
  {
    name: 'Business',
    pricing: { monthlyRate: 200 },
    pitch: 'For larger teams managing sites, brands & markets',
    cta: 'Choose business',
    ctaHref: CTA_LINKS.choosePlan,
    features: [
      has('30 seats included ($12 per additional seat)'),
      has('No seat limit'),
      has('Unlimited repositories'),
      has('30GB repository storage'),
      has('1TB media storage'),
      has('Choose data residency (US/EU)'),
      has('Advanced access control and Audit trail'),
      has('Priority support'),
    ],
  },
]

export interface ComparisonRow {
  group: string
  label: string
  /** One value per plan, in `PLANS` order. `'—'` means the plan doesn't include it. */
  values: readonly [string, string, string]
}

/**
 * The `/pricing/` page's detailed comparison table (Figma "Compare every
 * limit and capability"). Every value here is the same figure `PLANS`'
 * feature copy states in prose — e.g. Simple's "3 seats included ($5 per
 * additional seat)" becomes the "Seats included" and "Additional seat" rows
 * below — split into per-plan table cells instead of a sentence. Support and
 * audit-trail rows reflect the real, undifferentiated copy (both Pro and
 * Business get "Priority support"; only Business's feature list mentions an
 * audit trail), not the design file's version, which draws a support tier
 * split the current plans don't have.
 */
export const COMPARISON_ROWS: readonly ComparisonRow[] = [
  { group: 'Team', label: 'Seats included', values: ['3 seats', '15 seats', '30 seats'] },
  { group: 'Team', label: 'Additional seat', values: ['$5 / seat', '$9 / seat', '$12 / seat'] },
  { group: 'Team', label: 'Seat limit', values: ['5 seats', '25 seats', 'No limit'] },
  { group: 'Repositories', label: 'Repositories', values: ['1', 'Unlimited', 'Unlimited'] },
  { group: 'Storage', label: 'Repository storage', values: ['1GB', '20GB', '30GB'] },
  { group: 'Storage', label: 'Media storage', values: ['1GB', '100GB', '1TB'] },
  {
    group: 'Governance & support',
    label: 'Choose data residency (US/EU)',
    values: ['—', 'Included', 'Included'],
  },
  { group: 'Governance & support', label: 'Access control', values: ['—', 'Basic', 'Advanced'] },
  { group: 'Governance & support', label: 'Audit trail', values: ['—', '—', 'Included'] },
  { group: 'Governance & support', label: 'Support', values: ['—', 'Priority', 'Priority'] },
]
