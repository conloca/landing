import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SegmentedControl, type SegmentIndex } from '@/components/ui/segmented-control'
import { Reveal } from '@/components/motion/Reveal'
import {
  PricingCard,
  type Plan,
  type PlanFeature,
} from '@/components/sections/pricing/PricingCard'
import type { BillingPeriod } from '@/lib/pricing'

const BILLING_OPTIONS: [string, string] = ['Monthly', 'Annual']
const BILLING_PERIODS: readonly [BillingPeriod, BillingPeriod] = ['monthly', 'annual']

const has = (label: string): PlanFeature => ({ label, included: true })
const lacks = (label: string): PlanFeature => ({ label, included: false })

/**
 * Every plan lists the same eight capabilities in the same order, so a visitor can
 * read down a column and compare like with like. A tier that lacks something still
 * shows the row, marked as excluded — omitting it reads as an oversight, not a limit.
 */
const PLANS: Plan[] = [
  {
    name: 'Simple',
    pricing: { monthlyRate: 8, annualTotal: 84 },
    pitch: 'For small teams getting their site off the ground',
    cta: 'Choose simple',
    features: [
      has('3 seats included ($5 per additional seat)'),
      has('5 seats max'),
      has('1 repository'),
      has('1GB repository storage'),
      has('1GB media storage'),
      lacks('Data residency choice'),
      lacks('Access control'),
      has('Community support'),
    ],
  },
  {
    name: 'Pro',
    /**
     * The source proposal gives Pro as "$144 Year ($12.5 Month)". Those two figures
     * disagree: $144 / 12 is $12.00, and $12.50 a month would make the year $150.
     * The annual total is treated as authoritative and the monthly equivalent derived
     * from it, so the card shows $12. If $12.50 is the intended headline instead,
     * `annualTotal` becomes 150 and nothing else changes. Open question on the PR.
     */
    pricing: { monthlyRate: 15, annualTotal: 144 },
    pitch: 'For growing teams shipping content more often',
    cta: 'Choose pro',
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
    pricing: { monthlyRate: 200, annualTotal: 2220 },
    pitch: 'For larger teams managing sites, brands & markets',
    cta: 'Choose business',
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

/**
 * Figma S4 — pricing (`40002427:17148`).
 *
 * The design carries monthly figures only; the annual prices and the revised seat
 * allowances come from a later pricing proposal, so the rendered numbers deliberately
 * diverge from the node tree here. See `@/lib/pricing` for how each figure is derived.
 */
export function Pricing() {
  const [billingIndex, setBillingIndex] = useState<SegmentIndex>(0)
  const billing = BILLING_PERIODS[billingIndex]

  return (
    <section id="pricing" className="mx-auto max-w-[1440px] px-8 py-24 sm:py-[196px]">
      <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <h2 className="font-display max-w-xl text-5xl leading-[1] font-bold text-stone-900">
          Choose a plan that fits you the best
        </h2>
        <SegmentedControl
          options={BILLING_OPTIONS}
          activeIndex={billingIndex}
          onChange={setBillingIndex}
          label="Billing period"
        />
      </Reveal>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        {PLANS.map((plan, index) => (
          <Reveal key={plan.name} delay={index * 0.1} className="flex flex-1">
            <PricingCard plan={plan} billing={billing} />
          </Reveal>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button variant="outline">Compare plans</Button>
      </div>
    </section>
  )
}
