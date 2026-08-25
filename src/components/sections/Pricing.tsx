import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Reveal } from '@/components/motion/Reveal'
import { PricingCard, type Plan } from '@/components/sections/pricing/PricingCard'

const BILLING_OPTIONS: [string, string] = ['Monthly', 'Annual']

const PLANS: Plan[] = [
  {
    name: 'Simple',
    price: '$8',
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
    price: '$15',
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
    price: '$200',
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

/** Figma S4 — pricing (`40002427:17148`). Annual pricing has no data in the source file. */
export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-[1440px] px-8 py-24 sm:py-[196px]">
      <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <h2 className="font-display max-w-xl text-5xl leading-[1] font-bold text-stone-900">
          Choose a plan that fits you the best
        </h2>
        <SegmentedControl options={BILLING_OPTIONS} activeIndex={0} />
      </Reveal>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        {PLANS.map((plan, index) => (
          <Reveal key={plan.name} delay={index * 0.1} className="flex flex-1">
            <PricingCard plan={plan} />
          </Reveal>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button variant="outline">Compare plans</Button>
      </div>
    </section>
  )
}
