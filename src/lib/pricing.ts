/**
 * Money model for the pricing section.
 *
 * Plans store two plain dollar amounts and both headline figures are derived from
 * them. The "per month, billed annually" number is the reason: written by hand it
 * can silently disagree with the annual total it claims to summarise, which is
 * precisely the error in the proposal these figures came from — Pro was given as
 * "$144 Year ($12.5 Month)", and $144 / 12 is $12.00. Deriving it turns that class
 * of mistake into an arithmetic impossibility rather than a copy-editing risk.
 *
 * Per-seat rates stay prose inside each plan's feature list; only the subscription
 * price itself is modelled here.
 */

export type BillingPeriod = 'monthly' | 'annual'

export interface PlanPricing {
  /** Charged every month on the monthly plan. */
  monthlyRate: number
  /** Charged once a year on the annual plan. */
  annualTotal: number
}

/**
 * A figure and the unit it is quoted in, travelling together. Returning a bare
 * number invites the label and the value to drift apart — showing a yearly total
 * beside "/ Month" is a one-line edit away when nothing couples them.
 */
export interface Headline {
  amount: number
  per: 'month' | 'year'
}

const MONTHS_PER_YEAR = 12

const WHOLE_DOLLARS = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const WITH_CENTS = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Cents appear only when non-zero: 7 becomes "$7", 12.5 becomes "$12.50", 2220 becomes "$2,220". */
export function formatUsd(amount: number): string {
  return Number.isInteger(amount) ? WHOLE_DOLLARS.format(amount) : WITH_CENTS.format(amount)
}

/** What an annual subscription works out to per month. */
export function monthlyEquivalent(pricing: PlanPricing): number {
  return pricing.annualTotal / MONTHS_PER_YEAR
}

/**
 * Both periods are quoted per month so the two states stay comparable at a glance;
 * the annual card discloses the yearly total beneath the headline.
 */
export function headline(pricing: PlanPricing, billing: BillingPeriod): Headline {
  const amount = billing === 'monthly' ? pricing.monthlyRate : monthlyEquivalent(pricing)
  return { amount, per: 'month' }
}
