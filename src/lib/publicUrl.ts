/**
 * Resolves a `public/` filename against the configured deploy base path.
 *
 * `import.meta.env.BASE_URL` is `/` in local dev/preview and `/<repo>/` (with
 * a guaranteed trailing slash, normalized in vite.config.ts) once deployed to
 * a GitHub Pages subpath. Any code that reaches into `public/` — a `.lottie`
 * source, a WASM binary, a future icon or manifest reference — must go
 * through this instead of a bare `/name` literal, which works locally and
 * 404s once BASE_URL is no longer `/`.
 */
export function publicUrl(name: string): string {
  // Any URL scheme (http:, https:, blob:, data:, ...) or a protocol-relative
  // `//host/...` is already a full URL — pass it through unresolved. Matching
  // the RFC 3986 scheme grammar generically, rather than enumerating known
  // schemes, so callers can't hit `${BASE_URL}blob:...` on a scheme this
  // function doesn't happen to know about yet. Note `blob:` and `data:` have
  // no `//` after the colon (`blob:https://origin/uuid`, `data:image/png,…`),
  // so the scheme check and the protocol-relative check are separate
  // alternatives, not one requiring both.
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(name)) return name
  return `${import.meta.env.BASE_URL}${name.replace(/^\//, '')}`
}
