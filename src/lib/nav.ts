/**
 * Shared primary nav links. `href="#"` entries have no destination yet (no
 * Docs/Blog page exists) — `#pricing` is the one real in-page anchor, see
 * the `id="pricing"` on the Pricing section.
 */
export const NAV_LINKS = [
  { label: 'How it works', href: '#' },
  { label: 'Docs', href: '#' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '#' },
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
  readDocs: null,
  choosePlan: null,
  // The one real destination: the pricing section's own anchor.
  comparePlans: '#pricing',
  // `satisfies`, not a type annotation: this still catches a mistyped key at
  // the call site, which `Record<string, …>` would silently accept.
} satisfies Record<string, string | null>
