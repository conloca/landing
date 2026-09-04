import { FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import { Reveal } from '@/components/motion/Reveal'
import { AstroGlyph } from '@/components/icons/AstroGlyph'

/** Figma S2 — statement (`40002427:16760`, node 1440x667). */
export function Statement() {
  return (
    <section className="relative mx-auto max-w-[1440px] px-8 py-32 sm:py-[196px]">
      <div className="relative mx-auto max-w-3xl text-center">
        <FloatingChip className="top-[-3rem] left-[2%] -rotate-6" delay={0}>
          <span className="size-[11px] shrink-0 rounded-full bg-[#9AE600]" />
          changes published
        </FloatingChip>
        <FloatingChip className="top-[-4.5rem] right-[10%] rotate-12" delay={0.1} tile="bg-[#F03C2E]">
          <GitTileGlyph />
        </FloatingChip>
        <FloatingChip className="bottom-[-4rem] left-[18%] -rotate-6" delay={0.2} tile="bg-[#BC52EE]">
          <AstroGlyph className="size-14" />
        </FloatingChip>
        <FloatingChip className="right-[-2%] bottom-[-1rem] -rotate-3" delay={0.3}>
          <FileText className="size-[17px] shrink-0 text-stone-400" />
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
        <span
          className={`flex size-[92px] items-center justify-center rounded-2xl text-white shadow-[0_6px_16px_rgba(0,0,0,0.16)] ${tile}`}
        >
          {children}
        </span>
      ) : (
        <span className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-2.5 py-[18px] text-sm font-medium text-stone-900 shadow-[0_6px_16px_rgba(0,0,0,0.10)]">
          {children}
        </span>
      )}
    </Reveal>
  )
}

function GitTileGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-[58px] fill-current">
      <path d="M22.5 11.2 12.8 1.5a1.7 1.7 0 0 0-2.4 0L8.2 3.7l2.8 2.8a2 2 0 0 1 2.5 2l2.7 2.7a2 2 0 1 1-1.2 1.2l-2.5-2.5v6.6a2 2 0 1 1-1.7 0V9a2 2 0 0 1-1-2.6L7.3 4.2l-5.8 5.8a1.7 1.7 0 0 0 0 2.4l9.7 9.7a1.7 1.7 0 0 0 2.4 0l9-9a1.7 1.7 0 0 0-.1-2.3Z" />
    </svg>
  )
}
