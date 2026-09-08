import { FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import { Reveal } from '@/components/motion/Reveal'
import { AstroGlyph } from '@/components/icons/AstroGlyph'

/** Figma S2 — statement (`40002448:3942` 393, `40002432:27418` 640, `40002427:16760` 1440).
 *  393-s2 / 640-s2 / 1024-s2 crops are the chip+headline AABB (220 / 280 / 284px),
 *  not the padded frames. 393 hugs with 32px type and py-78 (78+64+78=220).
 */
export function Statement() {
  return (
    <section className="relative mx-auto max-w-[1440px] px-5 py-[78px] sm:px-8 sm:py-[84px] lg:py-[70px] xl:py-[196px]">
      <div className="relative mx-auto max-w-3xl text-center">
        <FloatingChip
          className="top-[-38px] left-[-15px] sm:top-[-78px] sm:left-[-19px] lg:top-[-3rem] lg:left-[2%]"
          rotate="-rotate-[7.8deg] sm:-rotate-6"
          delay={0}
        >
          <span className="size-[7px] shrink-0 rounded-full bg-[#9AE600] sm:size-[11px]" />
          changes published
        </FloatingChip>
        <FloatingChip
          className="top-[-43px] right-[66px] sm:top-[-66px] sm:right-[78px] lg:top-[-4.5rem] lg:right-[10%]"
          rotate="-rotate-[9.7deg] sm:rotate-12"
          delay={0.1}
          tile="bg-[#F03C2E]"
        >
          <GitTileGlyph />
        </FloatingChip>
        <FloatingChip
          className="bottom-[-49px] left-[63px] sm:bottom-[-77px] sm:left-[79px] lg:bottom-[-4rem] lg:left-[18%]"
          rotate="rotate-[7.2deg] sm:-rotate-6"
          delay={0.2}
          tile="bg-[#BC52EE]"
        >
          <AstroGlyph className="relative z-[1] size-8 sm:size-14" />
        </FloatingChip>
        <FloatingChip
          className="right-[-6px] bottom-[-40px] sm:right-[-8px] sm:bottom-[-54px] lg:right-[-2%] lg:bottom-[-1rem]"
          rotate="rotate-[3.8deg] sm:-rotate-3"
          delay={0.3}
        >
          <FileText className="size-[10px] shrink-0 text-stone-400 sm:size-[17px]" />
          homepage-eng.vx.json
        </FloatingChip>

        <h2 className="font-display text-[32px] leading-[32px] font-black text-stone-900 sm:text-[56px] sm:leading-[56px] lg:text-7xl lg:leading-none">
          <Reveal as="span" className="inline-block whitespace-nowrap">
            Everything you need
          </Reveal>
          <br />
          <Reveal
            as="span"
            className="inline-block whitespace-nowrap text-[#BBF451] lg:text-[#9AE600]"
            delay={0.08}
          >
            nothing you don&apos;t
          </Reveal>
        </h2>
      </div>
    </section>
  )
}

// Rotation sits on the inner node so Reveal's translate does not replace it.

function FloatingChip({
  children,
  className,
  rotate,
  delay,
  tile,
}: {
  children: ReactNode
  className: string
  rotate: string
  delay: number
  tile?: string
}) {
  return (
    <Reveal
      direction="up"
      delay={delay}
      className={`absolute flex items-center gap-1.5 ${className}`}
    >
      {tile ? (
        <span
          className={`relative flex size-[57px] items-center justify-center rounded-2xl text-white shadow-[0_6px_6px_rgb(16_24_40_/_0.03),0_12px_16px_rgb(16_24_40_/_0.08)] before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-[radial-gradient(circle_at_100%_100%,rgba(0,0,0,0.30),transparent)] sm:size-[92px] ${rotate} ${tile}`}
        >
          {children}
        </span>
      ) : (
        <span
          className={`flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-[7px] text-[10px] font-medium text-stone-900 shadow-[0_4px_6px_rgb(16_24_40_/_0.03),0_12px_16px_rgb(16_24_40_/_0.08),0_12px_64px_rgb(0_0_0_/_0.05)] sm:p-2.5 sm:text-sm ${rotate}`}
        >
          {children}
        </span>
      )}
    </Reveal>
  )
}

function GitTileGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="relative z-[1] size-9 fill-current sm:size-[58px]">
      <path d="M22.5 11.2 12.8 1.5a1.7 1.7 0 0 0-2.4 0L8.2 3.7l2.8 2.8a2 2 0 0 1 2.5 2l2.7 2.7a2 2 0 1 1-1.2 1.2l-2.5-2.5v6.6a2 2 0 1 1-1.7 0V9a2 2 0 0 1-1-2.6L7.3 4.2l-5.8 5.8a1.7 1.7 0 0 0 0 2.4l9.7 9.7a1.7 1.7 0 0 0 2.4 0l9-9a1.7 1.7 0 0 0-.1-2.3Z" />
    </svg>
  )
}
