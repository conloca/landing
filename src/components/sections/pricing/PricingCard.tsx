import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type BillingPeriod = 'monthly' | 'annual'

export interface Plan {
  name: string
  /**
   * Monthly is always known; annual is `null` until the design supplies figures.
   * Narrower than `Record<BillingPeriod, string | null>` on purpose — that shape
   * would let a monthly-less plan through and the null branch below would then
   * claim the wrong period was unannounced.
   */
  price: { monthly: string; annual: string | null }
  pitch: string
  cta: string
  features: string[]
  highlighted?: boolean
}

const PERIOD_SUFFIX: Record<BillingPeriod, string> = {
  monthly: '/ Month',
  annual: '/ Year',
}

/**
 * Renders the figure for the selected period, or says so plainly when the design
 * never supplied one. Inventing a price here would be worse than showing the gap.
 */
function Price({ plan, billing }: { plan: Plan; billing: BillingPeriod }) {
  const amount = plan.price[billing]

  if (amount === null) {
    return (
      <p className="mt-6 text-base font-medium text-stone-500">
        Annual pricing not announced yet
      </p>
    )
  }

  return (
    <p className="mt-6 text-3xl font-black text-stone-900">
      {amount} <span className="text-base font-normal text-stone-500">{PERIOD_SUFFIX[billing]}</span>
    </p>
  )
}

export function PricingCard({ plan, billing }: { plan: Plan; billing: BillingPeriod }) {
  /** No figure means nothing to buy yet — the call to action must not invite the click. */
  const unpriced = plan.price[billing] === null

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
          {plan.highlighted ? <Badge className="bg-lime-400 text-stone-900">Best value</Badge> : null}
        </div>
        <Price plan={plan} billing={billing} />
        <p className="mt-2 text-sm text-stone-500">{plan.pitch}</p>
        <Button
          size="lg"
          variant={plan.highlighted ? 'default' : 'outline'}
          className="mt-6 w-full"
          disabled={unpriced}
        >
          {plan.cta}
        </Button>
      </div>
      <ul className="flex-1 space-y-3 rounded-b-3xl bg-sand-200 p-6 pt-4">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-base font-medium text-stone-700">
            <Check className="mt-0.5 size-4 shrink-0 text-stone-500" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
