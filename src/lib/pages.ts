/**
 * Pathname → which prerendered HTML entry to render.
 *
 * Accessed via: `scripts/prerender.ts` (server, with an explicit url) and
 * `App` (client, from `window.location.pathname`). Both must resolve the
 * same way so hydration matches the static markup.
 *
 * Assumptions: Vite `base` always has a trailing slash (see vite.config.ts).
 * GitHub Pages deploys under that base, so `/landing/blog/` and `/blog/`
 * have to identify the same page.
 */

export type AppPage =
  | 'home'
  | 'how-it-works'
  | 'blog'
  | 'blog-one-change'
  | 'blog-edit-what-you-see'
  | 'docs'

export function pageFromPath(pathname: string): AppPage {
  const normalized = stripBase(pathname).replace(/\/+$/, '') || '/'
  if (normalized === '/blog/one-change-shouldnt-get-lost') return 'blog-one-change'
  if (normalized === '/blog/edit-what-you-see') return 'blog-edit-what-you-see'
  if (normalized === '/blog') return 'blog'
  if (normalized === '/how-it-works') return 'how-it-works'
  if (normalized === '/docs') return 'docs'
  return 'home'
}

function stripBase(pathname: string): string {
  const base = import.meta.env.BASE_URL
  if (base === '/') return pathname
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base
  if (pathname === prefix || pathname === `${prefix}/`) return '/'
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length)
  return pathname
}
