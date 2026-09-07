import { Button } from '@/components/ui/button'
import { Logo } from '@/components/layout/Logo'
import { NAV_LINKS } from '@/lib/nav'

const FOOTER_LINKS = [...NAV_LINKS, { label: 'Open source', href: '#' }]

/**
 * Figma S5 (`40002427:17255`) — there is no full footer in the design (no
 * legal links, copyright, or social), just this closing bar. Kept as-is
 * rather than inventing a legal footer, see docs/QUESTIONS-DESIGNER.md.
 */
export function Footer() {
  return (
    <footer className="px-2 pb-2">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-6 rounded-[24px] bg-stone-800 p-6 sm:flex-row sm:justify-between">
        <Logo light />
        <nav className="flex flex-wrap items-center justify-center gap-x-[31px] gap-y-4" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-base leading-tight text-stone-50 hover:text-stone-300"
            >
              {link.label}
            </a>
          ))}
          <Button size="sm" variant="outline" className="h-7 rounded-lg border-stone-200 bg-white px-2 text-xs text-stone-900">
            Get started
          </Button>
        </nav>
      </div>
    </footer>
  )
}
