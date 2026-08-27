/**
 * Money model for the pricing section.
 *
 * Annual billing is a discount off the monthly rate. Both prices are stored as the
 * business quotes them and the discount is derived, rather than the reverse: a
 * percentage cannot express every price a business might want to charge. $2,200 a
 * year against $200 a month needs 8.333…%, and no rounded percentage lands on it —
 * storing the total keeps every price point reachable and keeps the figures in the
 * data identical to the ones in the proposal, where they can be checked by eye.
 *
 * The per-month-billed-annually figure is always derived from the annual total, so
 * neither can be edited without the other following. Where a total does not divide
 * by twelve the per-month figure is rounded to whole cents, so twelve of them need
 * not sum to exactly the yearly total — $2,200 a year shows as $183.33 a month.
 *
 * Per-seat rates stay prose inside each plan's feature list; only the subscription
 * price itself is modelled here.
 */

export type BillingPeriod = 'monthly' | 'annual'

export interface PlanPricing {
  /** Charged every month on the monthly plan, in dollars. */
  monthlyRate: number
  /** Charged once a year when paid up front, in dollars. Already discounted. */
  annualTotal: number
}

const MONTHS_PER_YEAR = 12
const CENTS_PER_DOLLAR = 100
const PERCENT_SCALE = 100

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

/** Rounds to whole cents, so a derived figure can never render a fraction of one. */
function toCents(dollars: number): number {
  return Math.round(dollars * CENTS_PER_DOLLAR)
}

/** What a year costs at the monthly rate, with no discount applied. */
function fullYearAtMonthlyRate(pricing: PlanPricing): number {
  return pricing.monthlyRate * MONTHS_PER_YEAR
}

/**
 * What the annual plan works out to per month.
 *
 * Rounded to whole cents, because a headline carrying a fraction of a cent is not a
 * price. The yearly total is always printed alongside, so the rounded figure is a
 * summary of it rather than a second amount anyone is charged.
 */
export function monthlyEquivalent(pricing: PlanPricing): number {
  return Math.round(toCents(pricing.annualTotal) / MONTHS_PER_YEAR) / CENTS_PER_DOLLAR
}

/**
 * The annual discount as a percentage — 20 means paying yearly costs 20% less than
 * twelve monthly payments.
 *
 * Nothing renders this yet; the design has no annual-saving treatment. It is exported
 * because the discount is the reason annual billing exists, and copy like "save 20%"
 * should read the figure from here rather than have someone recompute it in markup.
 */
export function annualDiscountPercent(pricing: PlanPricing): number {
  const fullYear = fullYearAtMonthlyRate(pricing)
  if (fullYear === 0) return 0
  const exact = ((fullYear - pricing.annualTotal) / fullYear) * PERCENT_SCALE
  // To one decimal, for the same reason money rounds to cents: a raw ratio prints
  // as 22.22222222222222, and rounding it at the call site is what this exists to avoid.
  return Math.round(exact * 10) / 10
}

/** Dollars saved over a year by paying up front. Same rationale as above. */
export function annualSaving(pricing: PlanPricing): number {
  return (toCents(fullYearAtMonthlyRate(pricing)) - toCents(pricing.annualTotal)) / CENTS_PER_DOLLAR
}

/**
 * The unit every headline is quoted in. Declared beside `headlineAmount` so the
 * figure and its label cannot be changed independently — quoting a yearly total
 * beside "/ Month" is otherwise a one-line edit away.
 */
export const HEADLINE_PERIOD_LABEL = '/ Month'

/**
 * The headline figure, always per month so the two billing states stay comparable
 * at a glance. The annual card discloses the yearly total beneath it, which is what
 * stops a discounted per-month figure reading as a monthly plan price.
 *
 * Both branches return a monthly amount; anything that changes that must change
 * `HEADLINE_PERIOD_LABEL` with it.
 */
export function headlineAmount(pricing: PlanPricing, billing: BillingPeriod): number {
  return billing === 'monthly' ? pricing.monthlyRate : monthlyEquivalent(pricing)
}
