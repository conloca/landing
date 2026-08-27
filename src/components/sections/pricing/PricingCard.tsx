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
 * Both periods are quoted per month, so the annual card must say what it actually
 * charges. Without this line a visitor reads "$7 / Month" and expects a $7 debit.
 */
function BillingNote({ plan, billing }: { plan: Plan; billing: BillingPeriod }) {
  if (billing === 'monthly') {
    return <p className="mt-1 text-sm text-stone-500">Billed monthly</p>
  }

  return (
    <p className="mt-1 text-sm text-stone-500">
      Billed annually — {formatUsd(plan.pricing.annualTotal)} per year
    </p>
  )
}

function Price({ plan, billing }: { plan: Plan; billing: BillingPeriod }) {
  return (
    <>
      <p className="mt-6 text-3xl font-black text-stone-900">
        {formatUsd(headlineAmount(plan.pricing, billing))}{' '}
        <span className="text-base font-normal text-stone-500">{HEADLINE_PERIOD_LABEL}</span>
      </p>
      <BillingNote plan={plan} billing={billing} />
    </>
  )
}

function FeatureRow({ feature }: { feature: PlanFeature }) {
  const Icon = feature.included ? Check : Minus

  return (
    <li
      className={cn(
        'flex items-start gap-2 text-base font-medium',
        feature.included ? 'text-stone-700' : 'text-stone-400',
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-stone-500" aria-hidden="true" />
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
        'flex flex-1 flex-col rounded-3xl',
        plan.highlighted && '-translate-y-2 ring-2 ring-lime-400',
      )}
    >
      <div className="rounded-3xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-medium text-stone-900">{plan.name}</h3>
          {plan.highlighted ? (
            <Badge className="bg-lime-400 text-stone-900">Best value</Badge>
          ) : null}
        </div>
        <Price plan={plan} billing={billing} />
        <p className="mt-2 text-sm text-stone-500">{plan.pitch}</p>
        <CtaButton
          size="lg"
          variant={plan.highlighted ? 'default' : 'outline'}
          className="mt-6 w-full"
          href={plan.ctaHref}
        >
          {plan.cta}
        </CtaButton>
      </div>
      <ul className="flex-1 space-y-3 rounded-b-3xl bg-sand-200 p-6 pt-4">
        {plan.features.map((feature) => (
          <FeatureRow key={feature.label} feature={feature} />
        ))}
      </ul>
    </div>
  )
}
