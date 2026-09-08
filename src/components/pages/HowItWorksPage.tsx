/**
 * Prerendered `/how-it-works/` page.
 *
 * Accessed via: App when `pageFromPath` resolves to `how-it-works`.
 *
 * Assumptions: the homepage Figma file has no How-it-works canvas — only the
 * nav label. Copy is the three developer feature cards (the product's
 * actual "how it works" story). Background rasters are the existing S1
 * feature-section fills, the only related PNGs in-repo.
 */

import featureBgA from '@/assets/figma/feature-section-bg-a.webp'
import featureBgB from '@/assets/figma/feature-section-bg-b.webp'
import { CtaButton } from '@/components/CtaButton'
import { FEATURE_CARDS_COPY } from '@/lib/content/feature-cards-copy'
import { CTA_LINKS } from '@/lib/nav'

const STEPS = FEATURE_CARDS_COPY.developer
const BACKGROUNDS = [featureBgA, featureBgB, featureBgA] as const

export function HowItWorksPage() {
  return (
    <main id="main-content" className="min-h-dvh">
      <section className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 pb-4 pt-24 sm:px-6 sm:pt-14 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-wide text-stone-500">Product</p>
        <h1 className="font-display max-w-[20ch] text-[32px] leading-[38px] font-bold text-stone-900 sm:text-[40px] sm:leading-[1.2] lg:text-5xl lg:leading-none">
          How it works
        </h1>
        <p className="max-w-[36rem] text-base leading-[1.7] text-stone-500 italic">
          Conloca keeps content in Git. Developers define the structure in the IDE.
          Editors work visually. Every change is a reviewable commit.
        </p>
      </section>

      <ol className="mx-auto flex max-w-[1440px] flex-col gap-2 px-1 pb-8 sm:px-2">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] lg:rounded-[28px]"
          >
            <img
              alt=""
              src={BACKGROUNDS[index]}
              className="absolute inset-0 size-full object-cover"
            />
            <div className="relative flex min-h-[20rem] flex-col justify-end gap-6 bg-black/20 p-6 text-stone-50 sm:min-h-[24rem] sm:p-8 lg:p-10">
              <span className="font-mono text-xs uppercase tracking-wide text-stone-50/80">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className="font-display max-w-[20ch] text-2xl leading-tight font-bold sm:text-4xl sm:leading-none">
                {step.title}
              </h2>
              <p className="max-w-[36rem] text-base leading-[1.7] text-white">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mx-auto flex max-w-[1440px] flex-wrap gap-3 px-4 pb-16 sm:px-6 lg:px-8">
        <CtaButton href={CTA_LINKS.getStarted}>Get started</CtaButton>
        <CtaButton variant="outline" href={CTA_LINKS.readDocs}>
          Read docs
        </CtaButton>
      </div>
    </main>
  )
}
