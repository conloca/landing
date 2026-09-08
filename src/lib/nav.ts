import { publicUrl } from '@/lib/publicUrl'

/**
 * Shared primary nav links. Pricing is the homepage `#pricing` section —
 * `publicUrl('#pricing')` keeps that working from `/blog/` and
 * `/how-it-works/` as well as from `/`.
 */
export const HOME_HREF = publicUrl('')

export const NAV_LINKS = [
  { label: 'How it works', href: publicUrl('how-it-works/') },
  { label: 'Docs', href: publicUrl('docs/') },
  { label: 'Pricing', href: publicUrl('#pricing') },
  { label: 'Blog', href: publicUrl('blog/') },
]

/**
 * Where each call-to-action points. Every call-to-action on the page reads its
 * destination from here rather than carrying one inline, so wiring up the real
 * signup, demo-booking and docs URLs is a single edit in a single file.
 *
 * `null` means "no destination exists yet" — the product has no signup flow,
 * demo booking or docs site. It is deliberately not `'#'`: an anchor to `'#'`
 * scrolls the page to the top and pushes a history entry, so a placeholder
 * would be actively worse than the inert buttons these replaced. `CtaButton`
 * renders a real button for `null` and a link only for a real destination, so
 * filling one in here is all that is needed to make it navigate.
 */
export const CTA_LINKS = {
  getStarted: null,
  tryDemo: null,
  readDocs: publicUrl('docs/'),
  choosePlan: null,
  // The one real destination: the pricing section's own anchor.
  comparePlans: '#pricing',
  // `satisfies`, not a type annotation: this still catches a mistyped key at
  // the call site, which `Record<string, …>` would silently accept.
} satisfies Record<string, string | null>
