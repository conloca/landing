import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CtaButton } from '@/components/CtaButton'
import { Logo } from '@/components/layout/Logo'
import { CTA_LINKS, NAV_LINKS } from '@/lib/nav'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function Header() {
  return (
    // Three sizes, all drawn: 66 tall with 16px gutters at 393, 82 with 24 at
    // 640, 82 with 32 from 1024. Only the phone frame shortens the bar, so the
    // height steps at `sm` while the gutter keeps widening at `lg`. This is
    // not cosmetic — the header's height sets where every section below starts.
    <header className="mx-auto flex h-[66px] max-w-[1440px] items-center px-4 sm:h-[82px] sm:px-6 lg:px-8">
      <div className="flex w-full items-center justify-between">
        <Logo />
        {/* Figma's "Right group" is one auto-layout frame (gap 31) holding the
            nav links AND the button pair together, not two independently
            justified blocks — `justify-between` across three top-level
            children would space the nav away from the buttons it belongs
            beside instead of keeping them as one right-aligned unit. */}
        <div className="flex items-center gap-[31px]">
          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-base text-stone-900 transition-colors hover:text-stone-600"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <CtaButton variant="outline" className="hidden sm:inline-flex" href={CTA_LINKS.tryDemo}>
              Try Demo
            </CtaButton>
            <CtaButton href={CTA_LINKS.getStarted}>Get Started</CtaButton>
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  )
}

/**
 * Sheet contents are not designed in the Figma frame (open question) — this
 * repeats the desktop nav in a stacked layout as the most reasonable default.
 */
function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>
            <Logo />
          </SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <SheetClose asChild key={link.label}>
              <a
                href={link.href}
                className="rounded-md px-2 py-2.5 text-base text-stone-900 hover:bg-stone-100"
              >
                {link.label}
              </a>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
