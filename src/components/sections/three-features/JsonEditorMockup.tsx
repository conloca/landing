import type { ReactNode } from 'react'
import {
  ChevronUp,
  ChevronDown,
  Monitor,
  MoreVertical,
  Redo2,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { CollaboratorCursor } from '@/components/sections/three-features/CollaboratorCursor'

const KEY = 'text-[#1485BA]'
const STR = 'text-[#7CCF00]'

/**
 * Card 1 visual: JSON schema editor + visual page-builder, per Figma
 * `Lootie animation` group. HTML stand-in — Banner 1 Lottie was never
 * delivered. The page-builder is the Figma chrome (toolbar, lime-bordered
 * preview, floating block handle), not a stripped article card.
 *
 * Accessed via: ThreeFeatures card 1 `visual` slot.
 *
 * Assumptions: the two panes are composed at the desktop illustration
 * size (1095×831) and `scale-*`'d per breakpoint (0.48 / 0.721 / 0.847)
 * so radii, type, and overlap stay in the same proportion as the Figma
 * frames. At 393 the slot is 279px with a 21px top offset: Figma's
 * 393-s1 first-card crop is 574px, copy through the CTAs is ~250px,
 * `gap-6` is 24px, and card padding is 40px. `origin-top-left` keeps the
 * scaled box anchored to the visual slot; the card's `overflow-hidden`
 * clips the overflow, matching the Figma Section clip (the visual
 * container itself does not clip).
 *
 * `aria-hidden` because every string in here is set dressing, not page
 * content: the filename, the JSON body and the mock article ("Turn text to
 * video in minutes") describe a fictional document. Safe to hide wholesale
 * — nothing inside is focusable.
 *
 * `min-h-*` on this root is load-bearing: both panes are absolutely
 * positioned, and `h-full` does not resolve against the visual slot's
 * `min-height`, so without a definite height here the illustration
 * collapses and the card clips an empty slot.
 */
export function JsonEditorMockup() {
  return (
    <div
      className="relative h-full min-h-[279px] w-full sm:min-h-[590px] lg:min-h-full"
      aria-hidden
    >
      <div className="absolute top-[21px] left-0 origin-top-left scale-[0.48] sm:top-[22%] sm:scale-[0.721] lg:top-[-1%] lg:left-[-3%] lg:scale-[0.847]">
        <div className="relative h-[831px] w-[1095px]">
          <JsonPane />
          <PageBuilderPane />
        </div>
      </div>
    </div>
  )
}

function JsonPane() {
  return (
    <div className="absolute top-0 left-0 z-10 h-[542px] w-[418px] overflow-hidden rounded-[24px] bg-stone-200 p-2 shadow-xl">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 rounded-md bg-white px-2.5 py-1.5">
          <span className="font-mono text-base leading-none font-medium text-[#7CCF00]">
            {'{ }'}
          </span>
          <span className="truncate font-mono text-base text-stone-900">hero-section.vx.json</span>
          <X className="size-3.5 shrink-0 text-stone-400" />
        </div>
        <MoreVertical className="size-5 shrink-0 text-stone-400" />
      </div>
      <pre className="overflow-hidden rounded-md bg-white px-3 py-3 font-mono text-base leading-[1.5] text-stone-900">
        <JsonLine n={1}>{'{'}</JsonLine>
        <JsonLine n={2}>
          {'  '}
          <span className={KEY}>&quot;name&quot;</span>
          {': '}
          <span className={STR}>&quot;hero&quot;</span>,
        </JsonLine>
        <JsonLine n={3}>
          {'  '}
          <span className={KEY}>&quot;label&quot;</span>
          {': '}
          <span className={STR}>&quot;Hero&quot;</span>,
        </JsonLine>
        <JsonLine n={4}>
          {'  '}
          <span className={KEY}>&quot;fields&quot;</span>
          {': ['}
        </JsonLine>
        <JsonLine n={5}>{'    {'}</JsonLine>
        <div className="relative">
          <JsonLine n={6}>
            {'      '}
            <span className={KEY}>&quot;name&quot;</span>
            {': '}
            <span className={STR}>&quot;eyebrow&quot;</span>,
          </JsonLine>
          <JsonLine n={7}>
            {'      '}
            <span className={KEY}>&quot;type&quot;</span>
            {': '}
            <span className={STR}>&quot;string&quot;</span>,
          </JsonLine>
          <JsonLine n={8}>
            {'      '}
            <span className={KEY}>&quot;label&quot;</span>
            {': '}
            <span className={STR}>&quot;Open source&quot;</span>
          </JsonLine>
          <CollaboratorCursor name="niko" className="absolute top-7 left-[55%]" />
        </div>
        <JsonLine n={9}>{'    },'}</JsonLine>
        <JsonLine n={10}>{'    {'}</JsonLine>
        <JsonLine n={11}>
          {'      '}
          <span className={KEY}>&quot;name&quot;</span>
          {': '}
          <span className={STR}>&quot;title&quot;</span>,
        </JsonLine>
        <JsonLine n={12}>
          {'      '}
          <span className={KEY}>&quot;type&quot;</span>
          {': '}
          <span className={STR}>&quot;string&quot;</span>,
        </JsonLine>
        <JsonLine n={13}>
          {'      '}
          <span className={KEY}>&quot;label&quot;</span>
          {': '}
          <span className={STR}>&quot;Turn text to video&quot;</span>
        </JsonLine>
        <JsonLine n={14}>{'    },'}</JsonLine>
        <JsonLine n={15}>{'    {'}</JsonLine>
        <JsonLine n={16}>
          {'      '}
          <span className={KEY}>&quot;name&quot;</span>
          {': '}
          <span className={STR}>&quot;description&quot;</span>,
        </JsonLine>
        <JsonLine n={17}>
          {'      '}
          <span className={KEY}>&quot;type&quot;</span>
          {': '}
          <span className={STR}>&quot;text&quot;</span>,
        </JsonLine>
        <JsonLine n={18}>
          {'      '}
          <span className={KEY}>&quot;label&quot;</span>
          {': '}
          <span className={STR}>&quot;Create studio-quality&quot;</span>
        </JsonLine>
        <JsonLine n={19}>{'    },'}</JsonLine>
        <JsonLine n={20}>{'    {'}</JsonLine>
        <JsonLine n={21}>
          {'      '}
          <span className={KEY}>&quot;name&quot;</span>
          {': '}
          <span className={STR}>&quot;cta&quot;</span>,
        </JsonLine>
      </pre>
    </div>
  )
}

function JsonLine({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-5 shrink-0 text-right text-stone-400">{n}</span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}

function PageBuilderPane() {
  return (
    <div className="absolute top-[134px] left-[352px] z-20 h-[697px] w-[743px] overflow-hidden rounded-[24px] bg-white shadow-xl">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="h-3 w-24 shrink-0 rounded-full bg-[#F5F6EF]" />
        <div className="flex items-center rounded-[10px] bg-stone-100 p-0.5">
          <span className="rounded-md bg-white p-1.5 text-stone-900">
            <Monitor className="size-4" />
          </span>
          <span className="p-1.5 text-stone-400">
            <Tablet className="size-4" />
          </span>
          <span className="p-1.5 text-stone-400">
            <Smartphone className="size-4" />
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="p-1.5 text-stone-400">
            <Undo2 className="size-4" />
          </span>
          <span className="p-1.5 text-stone-400">
            <Redo2 className="size-4" />
          </span>
          <span className="rounded-md bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-50">
            Publish
          </span>
        </div>
      </div>
      <div className="relative mx-3 mb-3 overflow-hidden rounded-md border-[2px] border-[#9AE600]">
        <div className="flex min-h-[280px]">
          <div className="relative min-w-0 flex-1 py-5 pr-4 pl-12">
            <p className="text-xs font-bold tracking-wide text-[#4F5833] uppercase">Open source</p>
            <h4 className="font-display mt-2 text-[38px] leading-none font-black text-stone-900">
              Turn text to video in minutes
            </h4>
            <p className="mt-3 text-xs leading-relaxed text-stone-700">
              Create studio-quality videos with AI avatars and voiceovers in 130+ languages.
            </p>
            <span className="mt-4 inline-block rounded bg-[#9AE600] px-3 py-1.5 text-xs font-medium text-stone-900">
              Create a free AI video
            </span>
            <CollaboratorCursor name="mariam" className="absolute right-2 bottom-4" />
          </div>
          <div className="w-1/2 bg-[#F5F6EF]" />
        </div>
        <div className="absolute top-8 left-1.5 flex flex-col overflow-hidden rounded-md bg-white shadow">
          <span className="flex flex-col items-center px-1.5 py-1.5 text-stone-800">
            <ChevronUp className="size-4" />
            <ChevronDown className="size-4" />
          </span>
          <span className="px-1.5 py-1.5 text-stone-800">
            <Trash2 className="size-4" />
          </span>
          <span className="px-1.5 py-1.5 text-stone-800">
            <MoreVertical className="size-4" />
          </span>
        </div>
      </div>
    </div>
  )
}
