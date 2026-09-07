/**
 * Rate-limit-aware Figma REST API client.
 *
 * Reached from `scripts/figma-export.ts` (`bun run figma:export`). Exists
 * because every earlier extraction in this repo used bare `curl` with no
 * backoff, burned the quota on the image endpoint, and left the design assets
 * un-exported — which then got papered over with placeholder gradients.
 *
 * Figma's documented limits (https://developers.figma.com/docs/rest-api/rate-limits)
 * are per-minute, per-user, and split across three endpoint tiers. Tier 1 is
 * the expensive one and it is exactly what asset export needs:
 *
 *   Tier 1  GET file, GET file nodes, GET images   Dev/Full seat: 10-20 / min
 *   Tier 2  comments, variables, webhooks, ...     Dev/Full seat: 25-100 / min
 *   Tier 3  components, metadata, users, ...       Dev/Full seat: 50-150 / min
 *
 * The per-minute figure depends on the *plan* (Starter 10, Professional 15,
 * Org/Enterprise 20 for Tier 1), and the API only reveals the plan on a 429.
 * The defaults below therefore assume the lowest paid tier for every plan:
 * being slower than necessary is recoverable, being throttled for a day is
 * not. Callers who know their plan can raise the ceiling via `rates`.
 *
 * The one limit no amount of pacing survives: a View/Collab seat gets roughly
 * six Tier 1 calls *per month*. Figma signals it with
 * `X-Figma-Rate-Limit-Type: low`, and the client fails fast on that rather than
 * retrying into a multi-day `Retry-After`.
 *
 * Measured against this project's token on 2026-08-26, which is exactly that
 * case (`X-Figma-Plan-Tier: starter`, `X-Figma-Rate-Limit-Type: low`):
 *
 *   GET /v1/files/:key/images   200, no throttling, repeatedly
 *   GET /v1/files/:key/nodes    429, Retry-After ≈ 3 days
 *
 * Both are documented as Tier 1, so the image-fills endpoint is evidently
 * metered separately in practice — which is the whole reason the asset export
 * succeeds on a seat that cannot fetch a node tree at all. Treat that as an
 * observation about one token rather than a documented guarantee, but it is
 * why `figma-export.ts` is built on fills and not on node renders.
 */
import type { GetFileNodesResponse, GetImageFillsResponse, GetImagesResponse } from '@figma/rest-api-spec'
import { ConcurrencyGate, TokenBucket, backoffWithJitter, sleep } from './figma/limiter.ts'
import {
  FigmaAuthError,
  FigmaConfigError,
  FigmaError,
  FigmaRateLimitError,
  FigmaSeatQuotaError,
  type RateLimitContext,
} from './figma/errors.ts'

const API_ROOT = 'https://api.figma.com'

/** Endpoint cost tiers, named as Figma's documentation names them. */
export type EndpointTier = 'tier1' | 'tier2' | 'tier3'

/**
 * Sustained requests per minute per tier. Deliberately set to the *Starter*
 * Dev/Full-seat allowance, the lowest paid tier, since the plan is unknown
 * until something is rejected.
 */
const DEFAULT_RATES: Record<EndpointTier, number> = {
  tier1: 10,
  tier2: 25,
  tier3: 50,
}

/**
 * Tier 1 gets a burst of 1 — no bunching at all. The image renderer is the
 * endpoint this whole client exists for, and a burst there spends the minute's
 * entire budget in one go.
 */
const DEFAULT_BURSTS: Record<EndpointTier, number> = {
  tier1: 1,
  tier2: 3,
  tier3: 5,
}

export interface FigmaClientOptions {
  token: string
  /** Requests in flight at once, across all tiers. */
  concurrency?: number
  /** Retries per request after the first 429 or 5xx. */
  maxAttempts?: number
  /** Ceiling on a single backoff sleep, in milliseconds. */
  backoffCapMs?: number
  /**
   * Refuse a `Retry-After` longer than this and fail instead of sleeping. A
   * multi-hour wait is a quota problem to surface, not to sit through.
   */
  maxRetryAfterMs?: number
  rates?: Partial<Record<EndpointTier, number>>
  /** Progress reporting; defaults to stderr so stdout stays parseable. */
  log?: (message: string) => void
}

interface RequestOptions {
  tier: EndpointTier
  /** Human-readable label for logs and errors, never the raw URL with a token. */
  label: string
}

interface AttemptState {
  attempt: number
  waitedMs: number
}

export class FigmaClient {
  readonly #token: string
  readonly #buckets: Record<EndpointTier, TokenBucket>
  readonly #gate: ConcurrencyGate
  readonly #maxAttempts: number
  readonly #backoffCapMs: number
  readonly #maxRetryAfterMs: number
  readonly #log: (message: string) => void

  constructor(options: FigmaClientOptions) {
    if (options.token.trim().length === 0) {
      throw new FigmaConfigError(
        'No Figma token supplied.',
        'Put FIGMA_PAT in .env (gitignored) and load it: set -a && . ./.env && set +a',
      )
    }
    this.#token = options.token
    this.#maxAttempts = options.maxAttempts ?? 6
    this.#backoffCapMs = options.backoffCapMs ?? 60_000
    this.#maxRetryAfterMs = options.maxRetryAfterMs ?? 15 * 60_000
    this.#log = options.log ?? ((message) => console.error(message))
    this.#gate = new ConcurrencyGate(options.concurrency ?? 2)
    this.#buckets = {
      tier1: makeBucket('tier1', options.rates?.tier1),
      tier2: makeBucket('tier2', options.rates?.tier2),
      tier3: makeBucket('tier3', options.rates?.tier3),
    }
  }

  /** Nodes for a set of ids. Tier 1. */
  async getFileNodes(fileKey: string, nodeIds: readonly string[]): Promise<GetFileNodesResponse> {
    const ids = encodeURIComponent(nodeIds.join(','))
    return this.#json<GetFileNodesResponse>(`/v1/files/${fileKey}/nodes?ids=${ids}`, {
      tier: 'tier1',
      label: `file nodes (${nodeIds.length} ids)`,
    })
  }

  /** Rendered images for a set of nodes. Tier 1, and the expensive one. */
  async getImages(
    fileKey: string,
    nodeIds: readonly string[],
    format: 'png' | 'svg' | 'jpg' | 'pdf' = 'png',
    scale = 2,
  ): Promise<GetImagesResponse> {
    const ids = encodeURIComponent(nodeIds.join(','))
    const query = `ids=${ids}&format=${format}&scale=${scale}`
    return this.#json<GetImagesResponse>(`/v1/images/${fileKey}?${query}`, {
      tier: 'tier1',
      label: `render ${nodeIds.length} node(s) as ${format}@${scale}x`,
    })
  }

  /**
   * Source URLs for every image *fill* in the file. One call for the whole
   * file, versus one render per node — so when it covers what's needed it is
   * dramatically cheaper against the Tier 1 budget.
   */
  async getImageFills(fileKey: string): Promise<GetImageFillsResponse> {
    return this.#json<GetImageFillsResponse>(`/v1/files/${fileKey}/images`, {
      tier: 'tier1',
      label: 'image fills',
    })
  }

  /**
   * Download a rendered asset. These are S3/CloudFront URLs rather than API
   * endpoints, so they carry no token and don't consume the API budget — but
   * they still go through the concurrency gate.
   */
  async download(url: string): Promise<Uint8Array> {
    return this.#gate.run(async () => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new FigmaError(
          `Asset download failed: HTTP ${response.status}`,
          1,
          'Rendered asset URLs expire roughly 30 days after creation; re-run the export to mint fresh ones.',
        )
      }
      return new Uint8Array(await response.arrayBuffer())
    })
  }

  async #json<T>(path: string, options: RequestOptions): Promise<T> {
    const response = await this.#request(path, options)
    return (await response.json()) as T
  }

  /** Paced, retried request. Every API call funnels through here. */
  async #request(path: string, options: RequestOptions): Promise<Response> {
    const state: AttemptState = { attempt: 0, waitedMs: 0 }

    for (;;) {
      await this.#buckets[options.tier].acquire()
      const response = await this.#gate.run(() =>
        fetch(`${API_ROOT}${path}`, { headers: { 'X-Figma-Token': this.#token } }),
      )

      if (response.ok) return response
      if (response.status === 429) {
        await this.#handleRateLimit(response, options, state)
        continue
      }
      if (response.status === 403 || response.status === 401) {
        throw await authFailure(response, options.label)
      }
      if (response.status >= 500 && state.attempt < this.#maxAttempts) {
        await this.#sleepForServerError(options, state)
        continue
      }
      throw new FigmaError(
        `Figma request for ${options.label} failed: HTTP ${response.status}.`,
        1,
        'Re-run; if it persists, check https://status.figma.com.',
      )
    }
  }

  async #handleRateLimit(
    response: Response,
    options: RequestOptions,
    state: AttemptState,
  ): Promise<void> {
    const retryAfterSeconds = parseRetryAfter(response.headers.get('Retry-After'))
    const limitType = response.headers.get('X-Figma-Rate-Limit-Type') ?? undefined
    const planTier = response.headers.get('X-Figma-Plan-Tier') ?? undefined
    const upgradeLink = response.headers.get('X-Figma-Upgrade-Link') ?? undefined

    const context: RateLimitContext = {
      tier: options.tier,
      attempts: state.attempt + 1,
      waitedMs: state.waitedMs,
      planTier,
      retryAfterSeconds,
    }

    // A low-tier seat is a monthly cap, not a per-minute one. No retry budget
    // can outlast it, so surface it immediately with the upgrade path.
    if (limitType === 'low') {
      throw new FigmaSeatQuotaError(context, upgradeLink)
    }

    state.attempt += 1
    if (state.attempt >= this.#maxAttempts) {
      throw new FigmaRateLimitError(context, 'budget-exhausted')
    }

    const waitMs =
      retryAfterSeconds === undefined
        ? backoffWithJitter(state.attempt, 1_000, this.#backoffCapMs)
        : retryAfterSeconds * 1_000

    if (waitMs > this.#maxRetryAfterMs) {
      throw new FigmaRateLimitError(context, 'wait-too-long')
    }

    this.#log(
      `figma: rate limited on ${options.label} (${options.tier}${planTier === undefined ? '' : `, plan ${planTier}`}); waiting ${Math.round(waitMs / 1000)}s [attempt ${state.attempt}/${this.#maxAttempts}]`,
    )
    await sleep(waitMs)
    state.waitedMs += waitMs
  }

  async #sleepForServerError(options: RequestOptions, state: AttemptState): Promise<void> {
    state.attempt += 1
    const waitMs = backoffWithJitter(state.attempt, 500, this.#backoffCapMs)
    this.#log(
      `figma: server error on ${options.label}; retrying in ${Math.round(waitMs / 1000)}s [attempt ${state.attempt}/${this.#maxAttempts}]`,
    )
    await sleep(waitMs)
    state.waitedMs += waitMs
  }
}

/**
 * Turns a 401/403 into an actionable message.
 *
 * Figma returns 403 both for "this token cannot see this file" and for "this
 * token lacks the OAuth scope this endpoint needs" — and the latter names the
 * missing scope in the body, e.g. `/v1/files/:key/variables/local` replying
 * `Invalid scope(s): …requires the file_variables:read scope`. Those need
 * completely different fixes, so the body is worth reading before giving up.
 */
async function authFailure(response: Response, label: string): Promise<FigmaAuthError> {
  const body = await response.text().catch(() => '')
  const scope = /requires the ([a-z_]+:[a-z_]+) scope/i.exec(body)?.[1]
  if (scope !== undefined) {
    return new FigmaAuthError(
      `Figma rejected ${label}: the token is missing the ${scope} scope.`,
      `Regenerate FIGMA_PAT at figma.com/settings with the ${scope} scope enabled. Personal access token scopes are fixed at creation and cannot be widened afterwards.`,
    )
  }
  if (/invalid scope/i.test(body)) {
    return new FigmaAuthError(
      `Figma rejected ${label}: the token's scopes do not cover this endpoint. ${body.slice(0, 200)}`,
      'Regenerate FIGMA_PAT with the scope named above.',
    )
  }
  return new FigmaAuthError(
    `Figma rejected the request for ${label}: HTTP ${response.status}.`,
    'Check FIGMA_PAT is valid and that the token owner has access to this file.',
  )
}

function makeBucket(tier: EndpointTier, override: number | undefined): TokenBucket {
  return new TokenBucket({
    requestsPerMinute: override ?? DEFAULT_RATES[tier],
    burst: DEFAULT_BURSTS[tier],
  })
}

/**
 * `Retry-After` is specified as either a delay in seconds or an HTTP date.
 * Figma documents the integer form, but parsing both costs one branch and
 * avoids a silent `NaN` sleep if that ever changes.
 */
export function parseRetryAfter(header: string | null): number | undefined {
  if (header === null || header.trim().length === 0) return undefined

  // Anything numeric is handled here and never falls through to the date
  // branch: `Date.parse` accepts bare numbers like "-5" as a year, which
  // turned a malformed negative delay into a real timestamp.
  const seconds = Number(header)
  if (!Number.isNaN(seconds)) {
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined
  }

  const timestamp = Date.parse(header)
  if (Number.isNaN(timestamp)) return undefined
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000))
}

/** Reads the token from the environment, with a pointer to the fix if absent. */
export function tokenFromEnv(): string {
  const token = process.env['FIGMA_PAT'] ?? process.env['FIGMA_API_KEY'] ?? ''
  if (token.trim().length === 0) {
    throw new FigmaConfigError(
      'FIGMA_PAT is not set.',
      'Add it to .env (gitignored) and load it before running: set -a && . ./.env && set +a',
    )
  }
  return token
}
