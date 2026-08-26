/**
 * Typed failures for the Figma client, each carrying the exit code the CLI
 * should terminate with.
 *
 * The distinction that matters most here is between a *transient* rate limit
 * (wait and it clears) and a *seat* rate limit (waiting is pointless — the
 * token's Figma seat only gets a handful of Tier 1 calls per month, so the fix
 * is a Dev/Full seat, not a longer retry). Collapsing those two into one
 * "rate limited" error is what makes a client retry uselessly for hours, so
 * they are separate classes with separate exit codes.
 */

export const ExitCode = {
  /** Unexpected failure with no more specific classification. */
  Failure: 1,
  /** Missing or malformed configuration, e.g. no FIGMA_PAT in the environment. */
  Config: 2,
  /** Token rejected, or no access to the requested file. */
  Auth: 3,
  /** Transient rate limit that outlived the client's retry budget. */
  RateLimited: 4,
  /** Seat-tier quota. Retrying cannot help; the plan or seat has to change. */
  SeatQuota: 5,
} as const

export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode]

export class FigmaError extends Error {
  readonly exitCode: ExitCodeValue
  /** Operator-facing next step; printed under the message by the CLI. */
  readonly remedy: string

  constructor(message: string, exitCode: ExitCodeValue, remedy: string) {
    super(message)
    this.name = new.target.name
    this.exitCode = exitCode
    this.remedy = remedy
  }
}

export class FigmaConfigError extends FigmaError {
  constructor(message: string, remedy: string) {
    super(message, ExitCode.Config, remedy)
  }
}

export class FigmaAuthError extends FigmaError {
  constructor(message: string, remedy: string) {
    super(message, ExitCode.Auth, remedy)
  }
}

export interface RateLimitContext {
  /** Endpoint tier that was throttled, for the operator's benefit. */
  tier: string
  attempts: number
  /** Total time spent sleeping across all retries. */
  waitedMs: number
  planTier: string | undefined
  retryAfterSeconds: number | undefined
}

export class FigmaRateLimitError extends FigmaError {
  readonly context: RateLimitContext

  /**
   * `reason` distinguishes the two ways the client gives up. Reporting a
   * one-attempt refusal as "persisted after 1 attempts (0s spent waiting)" —
   * which is what a single message for both produced — tells the operator
   * nothing about whether to wait a minute or an hour.
   */
  constructor(context: RateLimitContext, reason: 'budget-exhausted' | 'wait-too-long') {
    super(
      reason === 'budget-exhausted'
        ? `Figma rate limit on ${context.tier} endpoints persisted after ${context.attempts} attempts (${Math.round(context.waitedMs / 1000)}s spent waiting).`
        : `Figma asked for a ${formatDuration(context.retryAfterSeconds ?? 0)} wait on ${context.tier} endpoints, longer than this client will block for.`,
      ExitCode.RateLimited,
      reason === 'budget-exhausted'
        ? 'Wait for the window to reset and re-run; the export resumes from whatever is already on disk.'
        : `Re-run after roughly ${formatDuration(context.retryAfterSeconds ?? 0)}, or raise maxRetryAfterMs if blocking that long is acceptable.`,
    )
    this.context = context
  }
}

/**
 * Raised when the 429 identifies a low-tier seat. Figma gives View/Collab seats
 * roughly six Tier 1 calls *per month*, and reports `X-Figma-Rate-Limit-Type:
 * low` when that is the binding limit — at which point `Retry-After` can be
 * days and retrying is a waste of time.
 */
export class FigmaSeatQuotaError extends FigmaError {
  readonly context: RateLimitContext
  readonly upgradeLink: string | undefined

  constructor(context: RateLimitContext, upgradeLink: string | undefined) {
    const retryHint =
      context.retryAfterSeconds === undefined
        ? ''
        : ` Figma asked for a ${formatDuration(context.retryAfterSeconds)} wait.`
    super(
      `Figma reports a low-tier seat quota on ${context.tier} endpoints (plan: ${context.planTier ?? 'unknown'}).${retryHint}`,
      ExitCode.SeatQuota,
      upgradeLink === undefined
        ? 'This token belongs to a View/Collab seat, which is capped at a few file/image calls per month. A Dev or Full seat is required for repeated asset export.'
        : `This token belongs to a View/Collab seat, capped at a few file/image calls per month. A Dev or Full seat lifts it: ${upgradeLink}`,
    )
    this.context = context
    this.upgradeLink = upgradeLink
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  if (seconds < 86_400) return `${Math.round(seconds / 3600)}h`
  return `${Math.round(seconds / 86_400)}d`
}
