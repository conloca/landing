import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import heroBackdropUrl from '@/assets/figma/hero-backdrop.webp'
import { CtaButton } from '@/components/CtaButton'
import { SegmentedControl, type SegmentIndex } from '@/components/ui/segmented-control'
import { Badge } from '@/components/ui/badge'
import { PricingCard } from '@/components/sections/pricing/PricingCard'
import { COMPARISON_ROWS, PLANS, type ComparisonRow } from '@/lib/content/pricing-plans'
import { CTA_LINKS } from '@/lib/nav'
import { formatUsd, headlineAmount, HEADLINE_PERIOD_LABEL, type BillingPeriod } from '@/lib/pricing'
import { cn } from '@/lib/utils'

const BILLING_OPTIONS: [string, string] = ['Monthly', 'Annual']
const BILLING_PERIODS: readonly [BillingPeriod, BillingPeriod] = ['monthly', 'annual']

function groupRows(rows: readonly ComparisonRow[]): [string, ComparisonRow[]][] {
  const grouped = new Map<string, ComparisonRow[]>()
  for (const row of rows) {
    const bucket = grouped.get(row.group)
    if (bucket) {
      bucket.push(row)
    } else {
      grouped.set(row.group, [row])
    }
  }
  return [...grouped.entries()]
}

/**
 * Prerendered `/pricing/` page — the standalone pricing page from the design
 * file (`Conloca Pricing.png` / `Canal — Pricing.png`), distinct from the
 * homepage's embedded `#pricing` section (`Pricing.tsx`, Figma S4), which
 * never included the hero banner, the comparison table, or the closing CTA
 * band this page adds. Reuses `PricingCard` and the shared `PLANS`/
 * `COMPARISON_ROWS` data (`@/lib/content/pricing-plans`) so the real prices
 * and feature figures can only be changed in one place.
 *
 * Accessed via: App when `pageFromPath` resolves to `pricing`.
 *
 * The comparison table shows the plans' real seat, storage, and governance
 * figures, never the design file's stale ones (e.g. Figma's Pro column says
 * "10 seats included ($7 per additional seat)"; the real figure is 15 seats
 * at $9 per additional seat, same as the homepage cards).
 */
export function PricingPage() {
  const [billingIndex, setBillingIndex] = useState<SegmentIndex>(0)
  const billing = BILLING_PERIODS[billingIndex]

  return (
    <main id="main-content" className="min-h-dvh">
      <section className="mx-auto max-w-[1440px] px-1 pt-2 sm:px-2">
        <div className="relative overflow-hidden rounded-[20px] sm:rounded-3xl">
          <img alt="" src={heroBackdropUrl} className="absolute inset-0 size-full object-cover" />
          <span className="absolute inset-0 bg-black/20" />
          <div className="relative flex flex-col gap-8 p-6 text-stone-50 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:p-16">
            <div className="flex max-w-[36rem] flex-col gap-4">
              <p className="font-mono text-xs uppercase tracking-wide text-stone-50/80">
                Pricing / Plans
              </p>
              <h1 className="font-display text-[32px] leading-[38px] font-bold sm:text-5xl sm:leading-[1]">
                Choose a plan that fits you the best
              </h1>
              <p className="text-base leading-[1.7] text-stone-50/90">
                Start lean, then scale content operations without changing the way your team works.
                Every plan keeps Git at the center.
              </p>
            </div>
            <SegmentedControl
              options={BILLING_OPTIONS}
              activeIndex={billingIndex}
              onChange={setBillingIndex}
              variant="translucent"
              label="Billing period"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pt-16 pb-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
          <h2 className="font-display max-w-[28ch] text-3xl leading-tight font-bold text-stone-900 sm:text-4xl">
            Three plans. One Git-native workflow.
          </h2>
          <p className="max-w-[32ch] text-base leading-[1.7] text-stone-500 lg:text-right">
            Prices shown are per month. Upgrade as your team, repositories, and governance needs
            grow.
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 p-2 sm:gap-3 lg:flex-row">
        {PLANS.map((plan) => (
          <div key={plan.name} className="flex flex-1">
            <PricingCard plan={plan} billing={billing} />
          </div>
        ))}
      </div>

      <section id="comparison" className="mx-auto max-w-[1440px] px-1 pt-16 pb-16 sm:px-2">
        <div className="rounded-[20px] bg-stone-50 p-6 sm:rounded-3xl sm:p-8 lg:p-10">
          <div className="flex flex-col items-start justify-between gap-4 pb-8 lg:flex-row lg:items-end">
            <div className="flex flex-col gap-3">
              <p className="font-mono text-xs uppercase tracking-wide text-stone-500">
                Detailed comparison
              </p>
              <h2 className="font-display max-w-[28ch] text-3xl leading-tight font-bold text-stone-900 sm:text-4xl">
                Compare every limit and capability
              </h2>
            </div>
            <p className="max-w-[32ch] text-base leading-[1.7] text-stone-500 lg:text-right">
              The same content model at every tier, with more capacity and governance as your
              operation grows.
            </p>
          </div>

          <div className="mb-3 flex items-center justify-end gap-1.5 lg:hidden">
            <p className="font-mono text-xs uppercase tracking-wide text-stone-500">
              Scroll to compare plans
            </p>
            <ArrowRight className="size-3.5 text-stone-500" aria-hidden="true" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
              <caption className="sr-only">
                Plan comparison across every limit and capability
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="w-1/4 pb-6 align-bottom text-sm font-normal text-stone-500"
                  >
                    What your team gets
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan.name}
                      scope="col"
                      className={cn(
                        'w-1/4 rounded-t-2xl px-4 pt-4 pb-6 align-bottom font-normal',
                        plan.highlighted && 'bg-lime-50',
                      )}
                    >
                      <span className="flex items-center gap-2 text-base font-medium text-stone-900">
                        {plan.name}
                        {plan.highlighted ? (
                          <Badge className="bg-lime-400 text-stone-900">Best value</Badge>
                        ) : null}
                      </span>
                      <span className="mt-2 flex items-baseline gap-1 text-2xl font-black text-stone-900">
                        {formatUsd(headlineAmount(plan.pricing, billing))}
                        <span className="text-sm leading-6 font-normal text-stone-700">
                          {HEADLINE_PERIOD_LABEL}
                        </span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              {groupRows(COMPARISON_ROWS).map(([group, rows]) => (
                <tbody key={group}>
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={4}
                      className="border-t border-stone-200 pt-6 pb-2 font-mono text-xs font-normal tracking-wide text-stone-400 uppercase"
                    >
                      {group}
                    </th>
                  </tr>
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row" className="py-3 pr-4 text-sm font-normal text-stone-700">
                        {row.label}
                      </th>
                      {row.values.map((value, index) => {
                        const plan = PLANS[index]
                        return (
                          <td
                            key={plan.name}
                            className={cn(
                              'px-4 py-3 text-sm text-stone-700',
                              plan.highlighted && 'bg-lime-50',
                            )}
                          >
                            {value}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              ))}
              <tfoot>
                <tr>
                  <td />
                  {PLANS.map((plan) => (
                    <td
                      key={plan.name}
                      className={cn('rounded-b-2xl', plan.highlighted && 'bg-lime-50')}
                    />
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-1 pb-16 sm:px-2">
        <div className="grid overflow-hidden rounded-[20px] sm:rounded-3xl lg:grid-cols-2">
          <div className="relative flex flex-col justify-end gap-3 p-8 sm:p-10 lg:p-14">
            <img
              alt=""
              src={heroBackdropUrl}
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
            />
            <p className="relative font-mono text-xs uppercase tracking-wide text-stone-600">
              Ready when you are
            </p>
            <h2 className="font-display relative max-w-[16ch] text-3xl leading-tight font-bold text-stone-900 sm:text-4xl lg:text-5xl">
              Start with the plan that fits today.
            </h2>
          </div>
          <div className="flex flex-col justify-center gap-6 bg-stone-800 p-8 sm:p-10 lg:p-14">
            <p className="max-w-[32ch] text-base leading-[1.7] text-stone-300">
              Build your first Git-native content workflow, then scale without migrating your
              content model.
            </p>
            <CtaButton
              size="lg"
              className="w-fit rounded-xl bg-white text-stone-900 hover:bg-stone-100"
              href={CTA_LINKS.getStarted}
            >
              Get started
              <ArrowRight aria-hidden="true" />
            </CtaButton>
          </div>
        </div>
      </section>
    </main>
  )
}
