import { publicUrl } from '@/lib/publicUrl'

/**
 * Shared primary nav links. Docs now has its own `/docs/` page. Pricing also
 * links to its own standalone `/pricing/` page rather than the homepage
 * section. `CTA_LINKS.comparePlans` points at that standalone page's
 * detailed comparison table, not the homepage's embedded pricing section.
 */
export const HOME_HREF = publicUrl('')

export const NAV_LINKS = [
  { label: 'How it works', href: publicUrl('how-it-works/') },
  { label: 'Docs', href: publicUrl('docs/') },
  { label: 'Pricing', href: publicUrl('pricing/') },
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
  // The standalone /pricing/ page's detailed comparison table.
  comparePlans: publicUrl('pricing/#comparison'),
  // `satisfies`, not a type annotation: this still catches a mistyped key at
  // the call site, which `Record<string, …>` would silently accept.
} satisfies Record<string, string | null>
