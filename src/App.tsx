/**
 * Root component shared by both render passes.
 *
 * Anything rendered from here runs twice: once inside `prerender()` on the
 * build machine (no DOM, no window) and once during `hydrateRoot` in the
 * browser. Components that need browser APIs must defer them to an effect —
 * see LottieBanner for the pattern.
 */
import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/sections/Hero'
import { ThreeFeatures } from '@/components/sections/ThreeFeatures'
import { Statement } from '@/components/sections/Statement'
import { FeatureGrid } from '@/components/sections/FeatureGrid'
import { Pricing } from '@/components/sections/Pricing'
import { Footer } from '@/components/layout/Footer'
import { AudienceProvider } from '@/lib/audience-context'

export function App() {
  return (
    <AudienceProvider>
      <Header />
      <main className="min-h-dvh">
        <Hero />
        <ThreeFeatures />
        <Statement />
        <FeatureGrid />
        <Pricing />
      </main>
      <Footer />
    </AudienceProvider>
  )
}
