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
    <header className="mx-auto flex h-[82px] max-w-[1440px] items-center px-8">
      <div className="flex w-full items-center justify-between">
        <Logo />
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
