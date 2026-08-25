import { FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import { Reveal } from '@/components/motion/Reveal'
import { AstroGlyph } from '@/components/icons/AstroGlyph'

/** Figma S2 — statement (`40002427:16760`, node 1440x667). */
export function Statement() {
  return (
    <section className="relative mx-auto max-w-[1440px] px-8 py-32 sm:py-[196px]">
      <div className="relative mx-auto max-w-3xl text-center">
        <FloatingChip className="top-[-2.5rem] left-[6%] -rotate-6" delay={0}>
          <span className="size-2 rounded-full bg-lime-400" />
          changes published
        </FloatingChip>
        <FloatingChip className="top-[-3.5rem] right-[8%] rotate-3" delay={0.1} tile="bg-red-500">
          <GitTileGlyph />
        </FloatingChip>
        <FloatingChip className="bottom-[-2rem] left-[16%] rotate-6" delay={0.2} tile="bg-violet-500">
          <AstroGlyph className="size-5" />
        </FloatingChip>
        <FloatingChip className="right-[4%] bottom-[-3rem] -rotate-3" delay={0.3}>
          <FileText className="size-3.5" />
          homepage-eng.vx.json
        </FloatingChip>

        <Reveal>
          <h2 className="font-display text-4xl leading-[1] font-black text-stone-900 sm:text-6xl lg:text-7xl">
            Everything you need
            <br />
            <span className="text-lime-400">nothing you don&apos;t</span>
          </h2>
        </Reveal>
      </div>
    </section>
  )
}

function FloatingChip({
  children,
  className,
  delay,
  tile,
}: {
  children: ReactNode
  className: string
  delay: number
  tile?: string
}) {
  return (
    <Reveal
      direction="none"
      delay={delay}
      className={`absolute hidden items-center gap-1.5 sm:flex ${className}`}
    >
      {tile ? (
        <span className={`flex size-11 items-center justify-center rounded-xl text-white shadow-lg ${tile}`}>
          {children}
        </span>
      ) : (
        <span className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-stone-900 shadow-lg">
          {children}
        </span>
      )}
    </Reveal>
  )
}

function GitTileGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current">
      <path d="M22.5 11.2 12.8 1.5a1.7 1.7 0 0 0-2.4 0L8.2 3.7l2.8 2.8a2 2 0 0 1 2.5 2l2.7 2.7a2 2 0 1 1-1.2 1.2l-2.5-2.5v6.6a2 2 0 1 1-1.7 0V9a2 2 0 0 1-1-2.6L7.3 4.2l-5.8 5.8a1.7 1.7 0 0 0 0 2.4l9.7 9.7a1.7 1.7 0 0 0 2.4 0l9-9a1.7 1.7 0 0 0-.1-2.3Z" />
    </svg>
  )
}
