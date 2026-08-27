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
 * Above this, an annual discount is likelier to be a mistyped total than a decision.
 * Set well clear of any plausible promotion — half off a year is aggressive but real,
 * so the threshold only catches figures that are wrong by an order of magnitude, such
 * as $220 typed where $2,200 was meant. Raise it if a genuine offer ever needs to.
 */
const MAX_PLAUSIBLE_ANNUAL_DISCOUNT_PERCENT = 75

/**
 * Rejects plan prices that cannot be true, at the point the figures first reach code
 * that reasons about them.
 *
 * Every derivation below routes through this, so a bad price throws while React is
 * rendering — and because the page is prerendered at build time, that throw fails
 * `bun run build` rather than reaching a visitor. There is no code path that renders
 * a plan without deriving something from its price, which is what makes this a gate
 * rather than a lint.
 *
 * Comparisons run in whole cents. A discount expressed in dollars can leave a
 * remainder that floating point represents approximately, and `2199.9999999999995 >
 * 2200` is exactly the kind of false alarm a guard must not raise.
 */
function assertSanePricing(pricing: PlanPricing): void {
  const { monthlyRate, annualTotal } = pricing

  if (!Number.isFinite(monthlyRate) || !Number.isFinite(annualTotal)) {
    throw new Error(
      `Invalid plan pricing: monthly rate ${String(monthlyRate)} and annual total ` +
        `${String(annualTotal)} must both be finite numbers. ` +
        `Plan prices are defined in src/components/sections/Pricing.tsx.`,
    )
  }

  if (monthlyRate <= 0 || annualTotal <= 0) {
    throw new Error(
      `Invalid plan pricing: the plan at ${formatUsd(monthlyRate)} per month with an ` +
        `annual total of ${formatUsd(annualTotal)} has a price at or below zero. ` +
        `Plan prices are defined in src/components/sections/Pricing.tsx.`,
    )
  }

  const fullYearCents = toCents(fullYearAtMonthlyRate(pricing))
  const annualCents = toCents(annualTotal)

  // Both derived figures are checked, not just the inputs they came from. A finite
  // rate can still overflow once multiplied out — `Number.MAX_VALUE` a month is a
  // finite number whose year is `Infinity` — and every comparison below silently
  // yields `false` or `NaN` against that, so an unchecked overflow would pass the
  // whole guard. At the other end, any amount under half a cent rounds to zero and
  // would render as free while `0 / 0` slips a `NaN` discount past the bound.
  // The per-month figure is derived here rather than through `monthlyEquivalent`,
  // which asserts and would recurse. An annual total can clear a cent on its own and
  // still divide into twelve sub-cent months, which is the "renders as free" case
  // reaching the headline instead of the yearly line.
  const monthlyEquivalentCents = Math.round(annualCents / MONTHS_PER_YEAR)

  if (
    !Number.isFinite(fullYearCents) ||
    !Number.isFinite(annualCents) ||
    fullYearCents < 1 ||
    annualCents < 1 ||
    monthlyEquivalentCents < 1
  ) {
    throw new Error(
      `Invalid plan pricing: the plan at ${formatUsd(monthlyRate)} per month with an ` +
        `annual total of ${formatUsd(annualTotal)} does not resolve to a chargeable ` +
        `amount — each price must be at least one cent and small enough that a year ` +
        `of it is still a finite number. ` +
        `Plan prices are defined in src/components/sections/Pricing.tsx.`,
    )
  }

  if (annualCents > fullYearCents) {
    throw new Error(
      `Invalid plan pricing: the plan at ${formatUsd(monthlyRate)} per month has an ` +
        `annual total of ${formatUsd(annualTotal)}, which is more than twelve monthly ` +
        `payments (${formatUsd(fullYearAtMonthlyRate(pricing))}). Paying yearly would ` +
        `cost more than paying monthly, so the card would show a negative saving. ` +
        `Plan prices are defined in src/components/sections/Pricing.tsx.`,
    )
  }

  const discountPercent = ((fullYearCents - annualCents) / fullYearCents) * PERCENT_SCALE
  if (discountPercent > MAX_PLAUSIBLE_ANNUAL_DISCOUNT_PERCENT) {
    throw new Error(
      `Implausible plan pricing: the plan at ${formatUsd(monthlyRate)} per month has an ` +
        `annual total of ${formatUsd(annualTotal)}, a ${discountPercent.toFixed(1)}% ` +
        `discount — past the ${String(MAX_PLAUSIBLE_ANNUAL_DISCOUNT_PERCENT)}% we treat ` +
        `as a likely typo. If the offer is real, raise ` +
        `MAX_PLAUSIBLE_ANNUAL_DISCOUNT_PERCENT in src/lib/pricing.ts. ` +
        `Plan prices are defined in src/components/sections/Pricing.tsx.`,
    )
  }
}

/**
 * What the annual plan works out to per month.
 *
 * Rounded to whole cents, because a headline carrying a fraction of a cent is not a
 * price. The yearly total is always printed alongside, so the rounded figure is a
 * summary of it rather than a second amount anyone is charged.
 */
export function monthlyEquivalent(pricing: PlanPricing): number {
  assertSanePricing(pricing)
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
  assertSanePricing(pricing)
  // No divide-by-zero branch: the assertion above rejects a monthly rate of zero, so
  // a full year of it cannot be zero either.
  const fullYear = fullYearAtMonthlyRate(pricing)
  const exact = ((fullYear - pricing.annualTotal) / fullYear) * PERCENT_SCALE
  // To one decimal, for the same reason money rounds to cents: a raw ratio prints
  // as 22.22222222222222, and rounding it at the call site is what this exists to avoid.
  return Math.round(exact * 10) / 10
}

/** Dollars saved over a year by paying up front. Same rationale as above. */
export function annualSaving(pricing: PlanPricing): number {
  assertSanePricing(pricing)
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
  assertSanePricing(pricing)
  return billing === 'monthly' ? pricing.monthlyRate : monthlyEquivalent(pricing)
}
