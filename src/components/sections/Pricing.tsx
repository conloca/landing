import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SegmentedControl, type SegmentIndex } from '@/components/ui/segmented-control'
import { Reveal } from '@/components/motion/Reveal'
import {
  PricingCard,
  type BillingPeriod,
  type Plan,
} from '@/components/sections/pricing/PricingCard'

const BILLING_OPTIONS: [string, string] = ['Monthly', 'Annual']
const BILLING_PERIODS: readonly [BillingPeriod, BillingPeriod] = ['monthly', 'annual']

const PLANS: Plan[] = [
  {
    name: 'Simple',
    price: { monthly: '$8', annual: null },
    pitch: 'For small teams getting their site off the ground',
    cta: 'Choose simple',
    features: [
      '3 seats included ($5 per additional seat)',
      '5 seats max',
      '1 repository',
      '1GB repository storage',
      '1GB media storage',
    ],
  },
  {
    name: 'Pro',
    price: { monthly: '$15', annual: null },
    pitch: 'For growing teams shipping content more often',
    cta: 'Choose pro',
    highlighted: true,
    features: [
      '10 seats included ($7 per additional seat)',
      '20 seats max',
      'Unlimited repositories',
      '20GB repository storage',
      '100GB media storage',
      'Choose data residency (US/EU)',
      'Basic access control',
      'Support',
    ],
  },
  {
    name: 'Business',
    price: { monthly: '$200', annual: null },
    pitch: 'For larger teams managing sites, brands & markets',
    cta: 'Choose business',
    features: [
      '30 seats included ($10 per additional seat)',
      'No seat limit',
      'Unlimited repositories',
      '30GB repository storage',
      '1TB media storage',
      'Choose data residency (US/EU)',
      'Advanced access control and Audit trail',
      'Priority support',
    ],
  },
]

/**
 * Figma S4 — pricing (`40002427:17148`).
 *
 * The design has no annual figures anywhere in its node tree — only `$8`/`$15`/`$200`,
 * all labelled "/ Month" — so `annual` is `null` on every plan and no number is invented.
 *
 * Selecting Annual therefore reaches a state with nothing purchasable. That is
 * deliberate: an inert pill was reported as broken, and a visitor is better served by
 * a control that answers ("not announced yet") than by one that ignores the click. It
 * also keeps the gap visible to whoever reviews the page instead of burying it.
 *
 * When figures arrive, how much else changes depends on their shape: a per-year total
 * only needs `annual` filled in, whereas the common "per month, billed annually" form
 * also needs the suffix in `PricingCard` and the surrounding copy.
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
