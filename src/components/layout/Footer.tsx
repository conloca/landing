import { CtaButton } from '@/components/CtaButton'
import { Logo } from '@/components/layout/Logo'
import { CTA_LINKS, NAV_LINKS } from '@/lib/nav'

const FOOTER_LINKS = [...NAV_LINKS, { label: 'Open source', href: '#' }]

/**
 * Figma S5 (`40002427:17255`) — there is no full footer in the design (no
 * legal links, copyright, or social), just this closing bar. Kept as-is
 * rather than inventing a legal footer, see docs/QUESTIONS-DESIGNER.md.
 */
export function Footer() {
  return (
    <footer className="px-2 pb-2">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-4 rounded-[24px] bg-stone-800 px-6 py-4 sm:flex-row sm:justify-between">
        <Logo light />
        <nav className="flex flex-wrap items-center justify-center gap-6" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="text-xs text-stone-50 hover:text-stone-300">
              {link.label}
            </a>
          ))}
          <CtaButton
            size="sm"
            variant="outline"
            className="border-white/20 bg-white text-stone-900"
            href={CTA_LINKS.getStarted}
          >
            Get started
          </CtaButton>
        </nav>
      </div>
    </footer>
  )
}
