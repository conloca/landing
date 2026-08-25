import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface Plan {
  name: string
  price: string
  pitch: string
  cta: string
  features: string[]
  highlighted?: boolean
}

export function PricingCard({ plan }: { plan: Plan }) {
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
        <p className="mt-6 text-3xl font-black text-stone-900">
          {plan.price} <span className="text-base font-normal text-stone-500">/ Month</span>
        </p>
        <p className="mt-2 text-sm text-stone-500">{plan.pitch}</p>
        <Button
          size="lg"
          variant={plan.highlighted ? 'default' : 'outline'}
          className="mt-6 w-full"
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
