import { CtaButton } from "@/components/CtaButton";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { AUDIENCE_OPTIONS } from "@/lib/audience";
import { CTA_LINKS } from "@/lib/nav";
import { Reveal } from "@/components/motion/Reveal";
import { AstroBadge } from "@/components/sections/hero/AstroBadge";
import { CarouselRail } from "@/components/sections/hero/CarouselRail";
import { HeroBackdrop } from "@/components/sections/hero/HeroBackdrop";
import { HeroVisual } from "@/components/sections/hero/HeroVisual";

/**
 * Figma S0 hero. The design draws this **twice**, and they are different
 * compositions rather than one layout reflowing:
 *
 * - `>=1024` (node 40002426:4064) — two columns, dark type on the page
 *   background, product shot to the right bleeding past the container.
 * - `<1024` (nodes 40002441:868 at 393 and 40002427:20368 at 640) — a single
 *   rounded card with a photographic backdrop, white centred type on top of
 *   it, and the product shot overlapping the card's lower edge and hanging
 *   below it. No segmented control: the design drops it at these widths.
 *
 * Both are expressed here in one DOM so the headline exists exactly once.
 * That needs the pieces to reorder across the two layouts, which is why the
 * section is a grid with explicit row placement rather than nested flex: a
 * grid child can move between cells, a flex child cannot leave its parent.
 * Mobile stacks text, buttons, shot, carousel; desktop puts the carousel
 * above the buttons in the left column and spans the shot down the right.
 */
export function Hero() {
  return (
    // `items-stretch` below `lg` is load-bearing, not a default: the backdrop
    // is a zero-content grid item that has to grow to the height of the two
    // rows it spans, and `items-center` would size it to its own content and
    // leave the copy sitting on bare page background.
    // `overflow-x-clip`, not `-hidden`: the shot deliberately overhangs from
    // 1382px and this is what crops it at the 1440 box; `hidden` would make a
    // scroll container instead. Dropping it puts a horizontal scrollbar on
    // every viewport below ~1680 and exposes the shot's squared right corner.
    <section className="mx-auto grid max-w-[1440px] grid-cols-1 items-stretch overflow-x-clip px-1 lg:grid-cols-[506px_1fr] lg:items-center lg:gap-12 lg:px-8 lg:py-0 min-[1382px]:min-h-[878px]">
      <HeroBackdrop />

      <Reveal
        direction="up"
        className="col-start-1 row-start-1 flex flex-col items-center gap-8 px-6 pt-[18.7%] text-center sm:pt-[22.6%] lg:items-start lg:px-0 lg:pt-[60px] lg:text-left"
      >
        <SegmentedControl
          options={AUDIENCE_OPTIONS}
          activeIndex={0}
          className="order-1 hidden lg:flex"
        />

        {/* 32/32 at 393 and 52/52 at 640 are both drawn, so the step is the
            design's own, not an interpolation. */}
        <h1 className="font-display order-2 max-w-[337px] text-[32px] leading-[1] font-black text-stone-50 sm:max-w-[576px] sm:text-[52px] lg:max-w-[432px] lg:text-5xl lg:font-bold lg:text-stone-900">
          Keep content in your repo. Give editors a visual editing interface
        </h1>

        <div className="order-1 lg:order-3">
          <AstroBadge />
        </div>
      </Reveal>

      {/* Reserves the empty lower third of the Figma card, which is not
          padding — it is the space the product shot drops into. Expressed as
          a percentage because percentage padding resolves against the
          container's *width*, so this tracks the card as it widens instead of
          staying at its 393px value: the shot's height scales with width too,
          and a fixed reserve would strand it in the middle of a 1023px card.

          The two drawn frames do not share one ratio: at 393 the shot is an
          absolutely-positioned child that adds nothing to the card's height,
          while at 640 it sits in flow and the card grows around it. So the
          reserve is 51.7% of width there and 74.8% here — measured from each
          frame rather than interpolated between them. */}
      <div className="col-start-1 row-start-2 flex justify-center gap-3 px-6 pt-8 pb-[51.7%] sm:pb-[74.8%] lg:row-start-3 lg:justify-start lg:px-0 lg:pt-0 lg:pb-0">
        <CtaButton
          size="lg"
          href={CTA_LINKS.getStarted}
          className="h-[34px] px-4 text-sm lg:h-11 lg:px-6 lg:text-base"
        >
          Get started
        </CtaButton>
        <CtaButton
          size="lg"
          variant="outline"
          href={CTA_LINKS.tryDemo}
          className="h-[34px] px-4 text-sm lg:h-11 lg:px-6 lg:text-base"
        >
          Try Demo
        </CtaButton>
      </div>

      <Reveal
        direction="left"
        delay={0.15}
        className="col-start-1 row-start-3 -mt-[39%] flex justify-center sm:-mt-[56.1%] lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:mt-0 lg:justify-end"
      >
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
        {/* 339.8 of a 385 card at 393, 599.9 of 624 at 640 — the shot widens
            against the card as the card widens, so the two frames give 88% and
            96% rather than one constant. */}
        <div className="w-[88.26%] sm:w-[96%] lg:w-full lg:max-w-[800px] min-[1382px]:ml-auto min-[1382px]:-mr-[120px] min-[1382px]:w-[800px] min-[1382px]:@container">
          <HeroVisual />
        </div>
      </Reveal>

      <div className="col-start-1 row-start-4 px-6 pt-[18.4%] pb-18 lg:row-start-2 lg:px-0 lg:pt-0 lg:pb-0">
        <CarouselRail />
      </div>
    </section>
  );
}
