/**
 * Root component shared by both render passes.
 *
 * Anything rendered from here runs twice: once inside `prerender()` on the
 * build machine (no DOM, no window) and once during `hydrateRoot` in the
 * browser. Components that need browser APIs must defer them to an effect —
 * see LottieBanner for the pattern.
 *
 * `url` is the pathname the static renderer is emitting. The client omits it
 * and reads `window.location.pathname` so hydration matches the HTML entry
 * (`/`, `/how-it-works/`, `/blog/`).
 */
import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/sections/Hero'
import { ThreeFeatures } from '@/components/sections/ThreeFeatures'
import { Statement } from '@/components/sections/Statement'
import { FeatureGrid } from '@/components/sections/FeatureGrid'
import { Pricing } from '@/components/sections/Pricing'
import { Footer } from '@/components/layout/Footer'
import { BlogPage } from '@/components/pages/BlogPage'
import { HowItWorksPage } from '@/components/pages/HowItWorksPage'
import { AudienceProvider } from '@/lib/audience-context'
import { pageFromPath } from '@/lib/pages'

export function App({ url }: { url?: string } = {}) {
  const page = pageFromPath(
    url ?? (typeof window === 'undefined' ? '/' : window.location.pathname),
  )

  return (
    <AudienceProvider>
      <Header />
      {page === 'blog' ? (
        <BlogPage />
      ) : page === 'how-it-works' ? (
        <HowItWorksPage />
      ) : (
        <main className="min-h-dvh">
          <Hero />
          <ThreeFeatures />
          <Statement />
          <FeatureGrid />
          <Pricing />
        </main>
      )}
      <Footer />
    </AudienceProvider>
  )
}
