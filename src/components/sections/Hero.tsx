import { Button } from '@/components/ui/button'
import { AUDIENCE_OPTIONS, SegmentedControl } from '@/components/ui/segmented-control'
import { Reveal } from '@/components/motion/Reveal'
import { AstroBadge } from '@/components/sections/hero/AstroBadge'
import { CarouselRail } from '@/components/sections/hero/CarouselRail'
import { HeroVisual } from '@/components/sections/hero/HeroVisual'

/** Figma S0 — "Homepage - Developers" hero (node 40002427:16388). */
export function Hero() {
  return (
    // Figma's hero frame is 1440x960 including the 82px header, so the section
    // below it is 878 tall and the 838-tall product shot centres there with the
    // design's 20px above and below. That height is only correct once the shot
    // is pinned to its Figma width, hence the same 1382px gate used below.
    //
    // `overflow-x-clip`, not `-hidden`: the shot deliberately overhangs, and
    // `clip` crops it without creating a scroll container the way `hidden`
    // would. The crop is at this 1440 box, matching every other section's
    // width, so above 1440 the shot is cut at the box edge with page
    // background beside it rather than bleeding to the viewport. That follows
    // Figma, whose frame is 1440 — but Figma cannot say what should happen on
    // a 1920 display, so it is a question for the designer, not a settled
    // decision. See docs/QUESTIONS-DESIGNER.md.
    <section className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 overflow-x-clip px-8 py-16 lg:grid-cols-[506px_1fr] lg:py-0 min-[1382px]:min-h-[878px]">
      <Reveal direction="up" className="flex flex-col gap-8 py-8 lg:py-[60px]">
        <SegmentedControl options={AUDIENCE_OPTIONS} activeIndex={0} />

        <h1 className="font-display max-w-[432px] text-5xl leading-[1] font-bold text-stone-900">
          Keep content in your repo. Give editors a visual editing interface
        </h1>

        <AstroBadge />

        <div className="flex flex-col gap-6">
          <CarouselRail />
          <div className="flex gap-3">
            <Button size="lg">Get started</Button>
            <Button size="lg" variant="outline">
              Try Demo
            </Button>
          </div>
        </div>
      </Reveal>

      <Reveal direction="left" delay={0.15} className="flex justify-end">
        {/* Placement lives here, not in HeroVisual: only this file knows the
            grid. From 1382px the shot takes its exact Figma width and hangs
            120px past the column so the crop bites — the design's look. 1382,
            not `xl`: HeroVisual bleeds 131.5px left of its box once rotated,
            and below 1382 that reaches back over the text column
            (32·2 padding + 506 column + 48 gap + 680 margin box + 131.5).
            `@container` lets the child switch on its own width instead of
            re-deriving this arithmetic — but it is established only from 1382
            too. Container width alone is the wrong signal: in the one-column
            layout below `lg` the wrapper also reaches 800px (viewport 864 =
            800 + 32·2 padding), and the child would then apply the bleed
            geometry in a place that has neither the -120px margin nor
            anything cropping the square right corner, clipping the shot
            against the viewport edge instead. Establishing the container at
            the same breakpoint keeps the two gates from disagreeing. */}
        <div className="w-full max-w-[800px] min-[1382px]:ml-auto min-[1382px]:-mr-[120px] min-[1382px]:w-[800px] min-[1382px]:@container">
          <HeroVisual />
        </div>
      </Reveal>
    </section>
  )
}
