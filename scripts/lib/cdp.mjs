/**
 * Minimal Chrome DevTools Protocol client shared by the probe scripts.
 *
 * Extracted because three probes had each grown their own copy and the copies
 * had already diverged — two of them dereferenced a missing page target and
 * died with `Cannot read properties of undefined` where the third printed a
 * usable message.
 *
 * Deliberately small: connect, correlate request/response ids, find a page
 * target, evaluate an expression. Anything more belongs in the caller.
 */
import { readFileSync } from 'node:fs'
import { WebSocket } from 'ws'

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Reads the browser WebSocket URL from a file rather than argv. */
export function readBrowserWsUrl(path) {
  return readFileSync(path, 'utf8').trim()
}

/**
 * Opens the socket and returns a `send(method, params, sessionId)` helper.
 *
 * One id counter and one pending map for the whole socket, keyed on the
 * response id alone. That is correct because CDP ids are unique per
 * connection, not per session — an earlier version kept a separate counter per
 * session and would have mis-routed responses the moment two sessions had
 * calls in flight at once.
 */
export async function connect(browserWsUrl) {
  const ws = await new Promise((resolve, reject) => {
    const socket = new WebSocket(browserWsUrl, { maxPayload: 512 * 1024 * 1024 })
    socket.on('open', () => resolve(socket))
    socket.on('error', reject)
  })

  let nextId = 1
  const pending = new Map()
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString())
    const waiter = msg.id && pending.get(msg.id)
    if (!waiter) return
    pending.delete(msg.id)
    if (msg.error) waiter.reject(new Error(JSON.stringify(msg.error)))
    else waiter.resolve(msg.result)
  })

  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = nextId++
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
    })

  return { ws, send, close: () => ws.close() }
}

/**
 * Attaches to the page target serving `pageUrl`, exiting with a message rather
 * than a TypeError when there is none.
 *
 * Matches on origin, not on a host substring: `localhost:41730` contains
 * `localhost:4173`, so substring matching could attach to an unrelated tab and
 * navigate it away, discarding whatever was there.
 */
export async function attachToPage(client, pageUrl) {
  const wanted = new URL(pageUrl).origin
  const { targetInfos } = await client.send('Target.getTargets')
  const pages = targetInfos.filter((t) => {
    if (t.type !== 'page') return false
    try {
      return new URL(t.url).origin === wanted
    } catch {
      return false
    }
  })

  if (pages.length === 0) {
    process.stderr.write(
      `no open page target on ${wanted}. Open one first, e.g.\n` +
        `  agent-browser open ${pageUrl}\n`,
    )
    process.exit(3)
  }
  if (pages.length > 1) {
    process.stderr.write(
      `${pages.length} page targets on ${wanted}; attaching to the first. ` +
        `Close the extras if this measures the wrong tab.\n`,
    )
  }

  const { sessionId } = await client.send('Target.attachToTarget', {
    targetId: pages[0].targetId,
    flatten: true,
  })
  return sessionId
}

/** Evaluates an expression in the page, surfacing thrown errors as rejections. */
export function makeEvaluate(client, sessionId) {
  return async (expression, { awaitPromise = false } = {}) => {
    const res = await client.send(
      'Runtime.evaluate',
      { expression, returnByValue: true, awaitPromise },
      sessionId,
    )
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description ?? 'evaluate failed')
    }
    return res.result.value
  }
}
