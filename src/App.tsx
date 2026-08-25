/**
 * Root component shared by both render passes.
 *
 * Anything rendered from here runs twice: once inside `prerender()` on the
 * build machine (no DOM, no window) and once during `hydrateRoot` in the
 * browser. Components that need browser APIs must defer them to an effect —
 * see LottieBanner for the pattern.
 */
import { Hero } from '@/components/sections/Hero'

export function App() {
  return (
    <main className="min-h-dvh">
      <Hero />
    </main>
  )
}
