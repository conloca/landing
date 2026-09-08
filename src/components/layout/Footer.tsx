import { CtaButton } from '@/components/CtaButton'
import { Logo } from '@/components/layout/Logo'
import { CTA_LINKS, HOME_HREF, NAV_LINKS } from '@/lib/nav'

/**
 * Figma S5 — `40002427:17255` on desktop, `40002448:4650` at 393. There is
 * no full footer in the design (no legal links, copyright, or social), just
 * this closing bar. Kept as-is rather than inventing a legal footer, see
 * docs/QUESTIONS-DESIGNER.md.
 *
 * Accessed via: App.tsx after the page body.
 *
 * Assumptions: 393 is a left-aligned vertical stack (4px outer pad, 20px
 * radius, 14px/16.94 links). From `sm` the outer pad is 8px and the radius
 * 24px; from `lg` the bar is a single row. Open source is in the 393 node
 * tree but overflows the 337px link row and is absent from the 393-s5 crop,
 * so the four NAV_LINKS are the ones we render.
 */
export function Footer() {
  return (
    <footer className="px-1 pb-1 sm:px-2 sm:pb-2">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-8 rounded-[20px] bg-stone-800 p-6 sm:rounded-[24px] lg:flex-row lg:items-center lg:justify-between">
        <a href={HOME_HREF} className="inline-flex text-stone-50" aria-label="Conloca home">
          <Logo light aria-hidden />
        </a>
        <div className="flex w-full flex-col items-start gap-[31px] sm:flex-row sm:items-center sm:justify-between lg:w-auto">
          <nav
            className="flex flex-wrap items-center gap-x-6 gap-y-6 text-sm leading-[16.94px] text-stone-50 sm:gap-x-[31px] sm:text-base sm:leading-[19.36px]"
            aria-label="Footer"
          >
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="hover:text-stone-300">
                {link.label}
              </a>
            ))}
          </nav>
          <CtaButton
            size="sm"
            variant="outline"
            className="h-7 rounded-lg border-stone-200 bg-white px-2 text-xs leading-3 font-medium text-stone-900"
            href={CTA_LINKS.getStarted}
          >
            Get started
          </CtaButton>
        </div>
      </div>
    </footer>
  )
}
