import type { ComponentProps, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

/**
 * A call-to-action that navigates only when it has somewhere to go.
 *
 * Destinations live in `CTA_LINKS` (src/lib/nav.ts) and are `null` until the
 * product has the page behind them. This exists so that being unwired is not
 * expressed as `href="#"`: an anchor to `'#'` scrolls to the top of the page
 * and pushes a history entry, which is a worse experience than the inert
 * buttons these replaced, and it reads to a screen reader as a link that goes
 * nowhere. With `href === null` this renders a plain `<button>` — visually
 * identical, does nothing, announces as a button. Fill the destination in and
 * it becomes a real link with no other change.
 */
export function CtaButton({
  href,
  children,
  ...buttonProps
}: { href: string | null; children: ReactNode } & Omit<
  ComponentProps<typeof Button>,
  'asChild' | 'children'
>) {
  if (href === null) return <Button {...buttonProps}>{children}</Button>

  return (
    <Button {...buttonProps} asChild>
      <a href={href}>{children}</a>
    </Button>
  )
}
