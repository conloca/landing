import { CtaButton } from '@/components/CtaButton'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { AUDIENCE_OPTIONS } from '@/lib/audience'
import { CTA_LINKS } from '@/lib/nav'
import { Reveal } from '@/components/motion/Reveal'
import { AstroBadge } from '@/components/sections/hero/AstroBadge'
import { CarouselRail } from '@/components/sections/hero/CarouselRail'
import { HeroVisual } from '@/components/sections/hero/HeroVisual'

/** Figma S0 — "Homepage - Developers" hero (node 40002427:16388). */
export function Hero() {
  return (
    <section className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-8 py-16 lg:grid-cols-[506px_1fr] lg:py-0">
      <Reveal direction="up" className="flex flex-col gap-8 py-8 lg:py-[60px]">
        <SegmentedControl options={AUDIENCE_OPTIONS} activeIndex={0} />

        <h1 className="font-display max-w-[432px] text-5xl leading-[1] font-bold text-stone-900">
          Keep content in your repo. Give editors a visual editing interface
        </h1>

        <AstroBadge />

        <div className="flex flex-col gap-6">
          <CarouselRail />
          <div className="flex gap-3">
            <CtaButton size="lg" href={CTA_LINKS.getStarted}>
              Get started
            </CtaButton>
            <CtaButton size="lg" variant="outline" href={CTA_LINKS.tryDemo}>
              Try Demo
            </CtaButton>
          </div>
        </div>
      </Reveal>

      <Reveal direction="left" delay={0.15} className="flex justify-end">
        <HeroVisual />
      </Reveal>
    </section>
  )
}
