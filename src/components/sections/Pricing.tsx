import { useState } from 'react'
import { CtaButton } from '@/components/CtaButton'
import { SegmentedControl, type SegmentIndex } from '@/components/ui/segmented-control'
import { Reveal } from '@/components/motion/Reveal'
import { PricingCard } from '@/components/sections/pricing/PricingCard'
import { CTA_LINKS } from '@/lib/nav'
import type { BillingPeriod } from '@/lib/pricing'
import { PLANS } from '@/lib/content/pricing-plans'

const BILLING_OPTIONS: [string, string] = ['Monthly', 'Annual']
const BILLING_PERIODS: readonly [BillingPeriod, BillingPeriod] = ['monthly', 'annual']

/**
 * Figma S4 — pricing (`40002427:17148` on desktop, `40002448:4479` at 393).
 *
 * Accessed via: App.tsx in the page body.
 *
 * Assumptions: 393 is a stacked column (24/28.8 heading, 16px header pad,
 * 72px top pad, 8px card-stack pad, 16px card gap, 12px white-block radius).
 * From `sm` the previous pad and type return. Plan figures are Denny's, not
 * the design file; never render a "Billed annually" subtitle.
 *
 * The design carries monthly figures only; the annual pricing and the revised seat
 * allowances come from a later pricing proposal, so the rendered numbers deliberately
 * diverge from the node tree here.
 *
 * Each plan states only its monthly rate. The yearly price is not stored anywhere:
 * `@/lib/pricing` derives it from one shared rule — a year is charged as ten months —
 * so the two can never disagree. Change a price here; change the discount there.
 */
export function Pricing() {
  const [billingIndex, setBillingIndex] = useState<SegmentIndex>(0)
  const billing = BILLING_PERIODS[billingIndex]

  return (
    <section id="pricing" className="mx-auto max-w-[1440px] sm:px-8 sm:pt-[196px] sm:pb-[96px]">
      <Reveal className="flex flex-col items-start justify-between gap-8 px-4 pt-[72px] pb-6 sm:gap-6 sm:px-0 sm:pt-0 sm:pb-0 lg:flex-row lg:items-end">
        <h2 className="font-display max-w-[320px] text-2xl leading-[28.8px] font-bold text-stone-900 sm:max-w-[572px] sm:text-5xl sm:leading-[1]">
          Choose a plan that fits you the best
        </h2>
        <div className="flex w-full items-center justify-between gap-4 lg:w-auto">
          <CtaButton
            variant="outline"
            href={CTA_LINKS.comparePlans}
            className="h-[34px] rounded-lg px-2.5 text-sm leading-[14px] font-medium lg:hidden"
          >
            Compare plans
          </CtaButton>
          <SegmentedControl
            options={BILLING_OPTIONS}
            activeIndex={billingIndex}
            onChange={setBillingIndex}
            label="Billing period"
          />
        </div>
      </Reveal>

      <div className="flex flex-col gap-4 p-2 sm:mt-12 sm:gap-3 sm:p-0 lg:flex-row">
        {PLANS.map((plan, index) => (
          <Reveal key={plan.name} delay={index * 0.1} className="flex flex-1">
            <PricingCard plan={plan} billing={billing} />
          </Reveal>
        ))}
      </div>

      <div className="mt-8 hidden justify-center lg:flex">
        <CtaButton variant="outline" href={CTA_LINKS.comparePlans}>
          Compare plans
        </CtaButton>
      </div>
    </section>
  )
}
