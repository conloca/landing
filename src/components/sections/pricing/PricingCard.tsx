import { Check, Minus } from 'lucide-react'
import { CtaButton } from '@/components/CtaButton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  formatUsd,
  headlineAmount,
  HEADLINE_PERIOD_LABEL,
  type BillingPeriod,
  type PlanPricing,
} from '@/lib/pricing'

/**
 * A capability row. `included: false` is what a tier does *not* get — rendered with a
 * muted dash, never a tick, because a check mark beside "Access control" on the plan
 * that lacks it reads as the opposite of what it means.
 */
export interface PlanFeature {
  label: string
  included: boolean
}

export interface Plan {
  name: string
  pricing: PlanPricing
  pitch: string
  cta: string
  /** Paired with `cta` rather than shared across plans: the label already
   * varies per plan ("Choose simple" / "Choose pro" / "Choose business"), and a
   * plan that becomes "Contact sales" needs its own destination. */
  ctaHref: string | null
  features: PlanFeature[]
  highlighted?: boolean
}

/**
 * Both billing periods quote the same per-month unit. The annual headline is
 * the ten-month-year rate; do not add a yearly-total subtitle under it.
 */
function Price({ plan, billing }: { plan: Plan; billing: BillingPeriod }) {
  return (
    <p className="mt-6 flex items-baseline gap-2 text-[2rem] leading-[3rem] font-black text-stone-900">
      {formatUsd(headlineAmount(plan.pricing, billing))}
      <span className="text-base leading-6 font-normal text-stone-700">
        {HEADLINE_PERIOD_LABEL}
      </span>
    </p>
  )
}

function FeatureRow({ feature }: { feature: PlanFeature }) {
  const Icon = feature.included ? Check : Minus

  return (
    <li
      className={cn(
        'flex items-start gap-1.5 text-base leading-[1.7] font-medium italic',
        feature.included ? 'text-stone-700' : 'text-stone-400',
      )}
    >
      <Icon className="mt-1 size-4 shrink-0 text-stone-500" aria-hidden="true" />
      <span>
        <span className="sr-only">{feature.included ? 'Included: ' : 'Not included: '}</span>
        {feature.label}
      </span>
    </li>
  )
}

export function PricingCard({ plan, billing }: { plan: Plan; billing: BillingPeriod }) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col gap-3 rounded-none bg-gradient-to-b from-stone-100 from-[74%] to-white p-2 sm:rounded-t-[20px] sm:rounded-b-none',
        plan.highlighted && 'ring-2 ring-lime-400 sm:ring-0',
      )}
    >
      <div
        className={cn(
          'rounded-xl bg-white p-5 shadow-[0_6.5px_9.7px_rgba(16,24,40,0.03)] sm:rounded-[18px] sm:shadow-[0_9.7px_24px_rgba(0,0,0,0.06)]',
          plan.highlighted && 'sm:-translate-y-2 sm:ring-2 sm:ring-lime-400',
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl leading-[30px] font-medium text-stone-900 sm:text-2xl sm:leading-9">
            {plan.name}
          </h3>
          {plan.highlighted ? (
            <Badge className="bg-lime-400 text-stone-900">Best value</Badge>
          ) : null}
        </div>
        <Price plan={plan} billing={billing} />
        <p className="mt-1 text-base leading-6 text-stone-700">{plan.pitch}</p>
        <CtaButton
          size="lg"
          variant={plan.highlighted ? 'default' : 'outline'}
          className="mt-6 h-11 w-full rounded-xl text-sm leading-[14px] font-bold"
          href={plan.ctaHref}
        >
          {plan.cta}
        </CtaButton>
      </div>
      <ul className="flex flex-1 flex-col gap-4 p-3">
        {plan.features.map((feature) => (
          <FeatureRow key={feature.label} feature={feature} />
        ))}
      </ul>
    </div>
  )
}
