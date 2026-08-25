import { Button } from '@/components/ui/button'
import { LottieBanner } from '@/components/LottieBanner'
import { Reveal } from '@/components/motion/Reveal'

/**
 * PLACEHOLDER SECTION — copy and layout are stand-ins until the Figma frame is
 * transcribed. Only the scaffolding contract it demonstrates is final:
 * everything readable is in the prerendered HTML, and motion is additive.
 */
export function Hero() {
  return (
    <section className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 py-24 text-center">
      <Reveal direction="up">
        <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
          Conloca
        </h1>
      </Reveal>

      <Reveal direction="up" delay={0.1}>
        <p className="max-w-xl text-lg text-muted-foreground text-pretty">
          Placeholder subline — replaced once the Figma design is transcribed.
        </p>
      </Reveal>

      <Reveal direction="up" delay={0.2}>
        <Button size="lg">Placeholder call to action</Button>
      </Reveal>

      <LottieBanner
        className="aspect-video w-full max-w-3xl"
        label="Conloca animated banner"
      />
    </section>
  )
}
