/**
 * Money model for the pricing section.
 *
 * Annual billing is one rule, shared by every plan: a year is charged as ten months,
 * so two months come free. Only the monthly rate is stored per plan; the yearly total
 * and the per-month-billed-annually figure are both derived from it. Storing a second
 * price per plan would let the two drift apart, which is what the "$144 a year at $15
 * a month" slip in the original proposal was — ten months of $15 is $150.
 *
 * An earlier revision stored both prices and derived the discount, on the evidence
 * that no uniform rate existed: $2,200 against $200 a month needs 8.333…%, which no
 * rounded percentage reaches. That evidence has since been replaced — the rule is
 * exact and expressed in months, not in a rounded percentage, so nothing is lost.
 *
 * Per-seat rates stay prose inside each plan's feature list; only the subscription
 * price itself is modelled here.
 */

export type BillingPeriod = 'monthly' | 'annual'

export interface PlanPricing {
  /** Charged every month on the monthly plan, in dollars. The annual price derives from it. */
  monthlyRate: number
}

const MONTHS_PER_YEAR = 12
const CENTS_PER_DOLLAR = 100
const PERCENT_SCALE = 100

/**
 * Months actually charged when a year is paid up front. The whole annual discount is
 * this one number: everything else about yearly billing is arithmetic on it.
 */
export const MONTHS_CHARGED_PER_YEAR = 10

/** The customer-facing way to say the same thing: "two months free". */
export const MONTHS_FREE_PER_YEAR = MONTHS_PER_YEAR - MONTHS_CHARGED_PER_YEAR

/**
 * A typo here would misprice every plan at once and in silence — 20 months charged
 * would make paying yearly cost more than paying monthly, with no row looking wrong.
 * The per-plan figures need no such check: each annual total is derived, so it cannot
 * disagree with its monthly rate by construction.
 */
if (MONTHS_CHARGED_PER_YEAR <= 0 || MONTHS_CHARGED_PER_YEAR >= MONTHS_PER_YEAR) {
  throw new Error(
    `Annual billing must charge between 1 and ${MONTHS_PER_YEAR - 1} months, ` +
      `got ${MONTHS_CHARGED_PER_YEAR}. Paying yearly has to cost less than paying monthly.`,
  )
}

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

/** Cents appear only when non-zero: 80 becomes "$80", 12.5 becomes "$12.50", 2000 becomes "$2,000". */
export function formatUsd(amount: number): string {
  return Number.isInteger(amount) ? WHOLE_DOLLARS.format(amount) : WITH_CENTS.format(amount)
}

/** What a year costs at the monthly rate, with no discount applied. */
function fullYearAtMonthlyRate(pricing: PlanPricing): number {
  return pricing.monthlyRate * MONTHS_PER_YEAR
}

/** Rounds to whole cents, so a derived figure can never render a fraction of one. */
function toCents(dollars: number): number {
  return Math.round(dollars * CENTS_PER_DOLLAR)
}

/**
 * Rejects a monthly rate that cannot produce a chargeable set of figures.
 *
 * Every derivation routes through this, so a bad price throws while React renders —
 * and because the page is prerendered at build time, that throw fails `bun run build`
 * rather than reaching a visitor. Nothing renders a plan without deriving something
 * from its rate, which is what makes this a gate rather than a lint.
 *
 * Only `monthlyRate` is hand-authored, so only it can carry a typo; the yearly total
 * is derived and cannot disagree with it. What still needs checking is what the
 * arithmetic *produces*, not just what it consumes:
 *
 *   - A finite rate can overflow once multiplied out. `Number.MAX_VALUE` a month is
 *     a finite number whose year is `Infinity`, and every comparison against
 *     `Infinity` or `NaN` yields `false` — so a guard that checked only the input
 *     would pass exactly the case it exists to catch.
 *   - Any amount under half a cent rounds to zero. A rate can clear a cent on its own
 *     and still divide into twelve sub-cent months, so the yearly line reads "$0.00"
 *     and the plan renders as free.
 *
 * Figures are derived inline rather than through the exported helpers, which assert
 * and would recurse.
 */
function assertSanePricing(pricing: PlanPricing): void {
  const { monthlyRate } = pricing

  if (!Number.isFinite(monthlyRate) || monthlyRate <= 0) {
    throw new Error(
      `Invalid plan pricing: a monthly rate of ${String(monthlyRate)} is not a ` +
        `positive, finite number. Plan prices are defined in ` +
        `src/components/sections/Pricing.tsx.`,
    )
  }

  const monthlyCents = toCents(monthlyRate)
  const annualCents = toCents(monthlyRate * MONTHS_CHARGED_PER_YEAR)
  const fullYearCents = toCents(monthlyRate * MONTHS_PER_YEAR)
  const perMonthCents = Math.ceil(annualCents / MONTHS_PER_YEAR)

  if (
    !Number.isFinite(annualCents) ||
    !Number.isFinite(fullYearCents) ||
    monthlyCents < 1 ||
    annualCents < 1 ||
    perMonthCents < 1
  ) {
    throw new Error(
      `Invalid plan pricing: a monthly rate of ${formatUsd(monthlyRate)} does not ` +
        `resolve to chargeable figures — every amount shown must be at least one cent, ` +
        `and a year of it must still be a finite number. Plan prices are defined in ` +
        `src/components/sections/Pricing.tsx.`,
    )
  }
}

/**
 * Charged once a year when paid up front — ten months of the monthly rate.
 *
 * No "costs more than paying monthly" check exists here, and none can: ten is less
 * than twelve by construction, so that comparison could never fail. The equivalent
 * guard lives on the rule constant itself, where a typo would actually be possible.
 */
export function annualTotal(pricing: PlanPricing): number {
  assertSanePricing(pricing)
  return pricing.monthlyRate * MONTHS_CHARGED_PER_YEAR
}

/**
 * What the annual plan works out to per month.
 *
 * Rounded *up* to the cent, never to nearest: twelve of these must not add up to less
 * than the year actually costs, or the headline advertises a price nobody is charged.
 * $80 a year shows as $6.67 a month — twelve of which is $80.04, four cents dearer
 * than the truth, where rounding to nearest could have shown $6.66 and understated it.
 * The yearly total is always printed alongside, so the rounded figure reads as a
 * summary of it rather than a second amount anyone pays.
 */
export function monthlyEquivalent(pricing: PlanPricing): number {
  const cents = (annualTotal(pricing) * CENTS_PER_DOLLAR) / MONTHS_PER_YEAR
  return Math.ceil(cents) / CENTS_PER_DOLLAR
}

/** Dollars saved over a year by paying up front — exactly two months of the rate. */
export function annualSaving(pricing: PlanPricing): number {
  return fullYearAtMonthlyRate(pricing) - annualTotal(pricing)
}

/**
 * The annual discount as a percentage — 16.7 means paying yearly costs 16.7% less
 * than twelve monthly payments. It takes no plan, because the rule is shared: every
 * plan gets the same two months free.
 *
 * Nothing renders this yet; the design has no annual-saving treatment. It is exported
 * because copy like "save 17%" should read the figure from here rather than have
 * someone recompute a rounded ratio in markup.
 */
export function annualDiscountPercent(): number {
  const exact = (MONTHS_FREE_PER_YEAR / MONTHS_PER_YEAR) * PERCENT_SCALE
  // To one decimal, for the same reason money rounds to cents: the raw ratio prints
  // as 16.666666666666664, and rounding it at the call site is what this exists to avoid.
  return Math.round(exact * 10) / 10
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
