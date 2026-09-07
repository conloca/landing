/**
 * Pacing primitives for the Figma API client.
 *
 * Figma rate-limits per minute on a leaky bucket, so the useful shape here is a
 * token bucket that refills continuously rather than a fixed sleep between
 * calls: a burst of two or three requests after an idle period is legitimate
 * and shouldn't be slowed to the steady-state interval.
 *
 * These are deliberately dependency-free and un-clever. The client layer owns
 * every decision about *how many* tokens a tier gets; this file only enforces
 * whatever it is told.
 */

/** Milliseconds, so callers never have to guess the unit at a call site. */
export type Millis = number

export interface TokenBucketOptions {
  /** Sustained request rate. */
  requestsPerMinute: number
  /**
   * Maximum tokens held while idle. Keep this small — a large burst spends the
   * whole minute's budget instantly and guarantees a 429 on the next call.
   */
  burst: number
  /** Injectable for tests; defaults to wall-clock time. */
  now?: () => number
}

/**
 * Continuously-refilling token bucket. `acquire()` resolves once a token is
 * available, waiting the exact shortfall rather than polling.
 */
export class TokenBucket {
  readonly #refillPerMs: number
  readonly #burst: number
  readonly #now: () => number
  #tokens: number
  #lastRefill: number
  /** Serialises waiters so two concurrent callers can't claim the same token. */
  #tail: Promise<void> = Promise.resolve()

  constructor(options: TokenBucketOptions) {
    if (options.requestsPerMinute <= 0) {
      throw new RangeError('requestsPerMinute must be positive')
    }
    if (options.burst < 1) {
      throw new RangeError('burst must be at least 1')
    }
    this.#refillPerMs = options.requestsPerMinute / 60_000
    this.#burst = options.burst
    this.#now = options.now ?? Date.now
    this.#tokens = options.burst
    this.#lastRefill = this.#now()
  }

  /** Wait until a token is free, then consume it. */
  async acquire(): Promise<void> {
    const turn = this.#tail.then(() => this.#consume())
    // Swallow rejection on the chain itself so one failure can't poison the
    // queue for every later caller; the original promise still rejects.
    this.#tail = turn.then(
      () => undefined,
      () => undefined,
    )
    return turn
  }

  async #consume(): Promise<void> {
    this.#refill()
    if (this.#tokens < 1) {
      await sleep(this.#millisUntilNextToken())
      this.#refill()
    }
    this.#tokens -= 1
  }

  #refill(): void {
    const current = this.#now()
    const elapsed = current - this.#lastRefill
    if (elapsed <= 0) return
    this.#tokens = Math.min(this.#burst, this.#tokens + elapsed * this.#refillPerMs)
    this.#lastRefill = current
  }

  #millisUntilNextToken(): Millis {
    return Math.ceil((1 - this.#tokens) / this.#refillPerMs)
  }
}

/**
 * Caps how many requests are in flight at once. Rate limiting alone doesn't do
 * this: ten tokens released together still open ten sockets, and Figma's image
 * renderer is where that hurts.
 */
export class ConcurrencyGate {
  readonly #limit: number
  #active = 0
  readonly #queue: Array<() => void> = []

  constructor(limit: number) {
    if (limit < 1) throw new RangeError('limit must be at least 1')
    this.#limit = limit
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.#enter()
    try {
      return await task()
    } finally {
      this.#leave()
    }
  }

  async #enter(): Promise<void> {
    if (this.#active < this.#limit) {
      this.#active += 1
      return
    }
    await new Promise<void>((release) => this.#queue.push(release))
    this.#active += 1
  }

  #leave(): void {
    this.#active -= 1
    const next = this.#queue.shift()
    if (next) next()
  }
}

export function sleep(ms: Millis): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Exponential backoff with full jitter, used only when a 429 arrives without a
 * `Retry-After` header. Full jitter (rather than a fixed exponential) is what
 * stops several workers that were throttled together from retrying in lockstep.
 */
export function backoffWithJitter(attempt: number, baseMs: Millis, capMs: Millis): Millis {
  const exponential = Math.min(capMs, baseMs * 2 ** attempt)
  return Math.round(Math.random() * exponential)
}
