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
        'flex flex-1 flex-col gap-3 rounded-t-3xl bg-gradient-to-b from-stone-100 to-white p-2',
        plan.highlighted && '-translate-y-2 ring-2 ring-lime-400',
      )}
    >
      <div className="rounded-[18px] bg-white p-5 shadow-[0_9.7px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl leading-9 font-medium text-stone-900">{plan.name}</h3>
          {plan.highlighted ? <Badge className="bg-lime-400 text-stone-900">Best value</Badge> : null}
        </div>
        <p className="mt-6 flex items-baseline gap-2 text-[2rem] leading-[3rem] font-black text-stone-900">
          {plan.price}
          <span className="text-base leading-6 font-normal text-stone-700">/ Month</span>
        </p>
        <p className="mt-1 text-base leading-6 text-stone-700">{plan.pitch}</p>
        <Button
          size="lg"
          variant={plan.highlighted ? 'default' : 'outline'}
          className="mt-6 h-11 w-full rounded-xl font-bold"
        >
          {plan.cta}
        </Button>
      </div>
      <ul className="flex flex-1 flex-col gap-4 p-3">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-1.5 text-base leading-[1.7] font-medium text-stone-500"
          >
            <Check className="mt-1 size-4 shrink-0 text-stone-500" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
