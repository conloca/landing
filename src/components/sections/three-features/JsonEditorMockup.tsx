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
 * `aria-hidden` because every string in here is set dressing, not page
 * content: the filename, the JSON body and the mock article ("Turn text to
 * video in minutes") describe a fictional document. Safe to hide wholesale
 * — nothing inside is focusable.
 *
 * `min-h-*` on this root is load-bearing: both panes are absolutely
 * positioned, and `h-full` does not resolve against the visual slot's
 * `min-height`, so without a definite height here the page-builder pane
 * (`bottom-0`) sits above the slot and is clipped by the card.
 */
export function JsonEditorMockup() {
  return (
    <div
      className="relative h-full min-h-[327px] w-full sm:min-h-[590px] lg:min-h-full"
      aria-hidden
    >
      <JsonPane />
      <PageBuilderPane />
    </div>
  )
}

function JsonPane() {
  return (
    <div className="absolute top-2 left-0 z-10 w-[78%] max-w-[418px] overflow-hidden rounded-[18px] bg-stone-200 p-1.5 shadow-xl lg:top-[10%]">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 rounded-md bg-white px-2 py-1">
          <span className="font-mono text-[11px] leading-none font-medium text-[#7CCF00]">
            {'{ }'}
          </span>
          <span className="truncate font-mono text-[11px] text-stone-900">
            hero-section.vx.json
          </span>
          <X className="size-2.5 shrink-0 text-stone-400" />
        </div>
        <MoreVertical className="size-4 shrink-0 text-stone-400" />
      </div>
      <pre className="overflow-hidden rounded-md bg-white px-2 py-2 font-mono text-[11px] leading-[1.7] text-stone-900">
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
          <CollaboratorCursor name="niko" className="absolute top-3 right-0" />
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
      <span className="w-4 shrink-0 text-right text-stone-400">{n}</span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}

function PageBuilderPane() {
  return (
    <div className="absolute right-0 bottom-0 z-20 w-[88%] max-w-[420px] overflow-hidden rounded-[18px] bg-white shadow-xl sm:w-[80%] sm:max-w-[536px] lg:top-[22%] lg:right-[-6%] lg:bottom-auto">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="h-2.5 w-16 shrink-0 rounded-full bg-[#F5F6EF] sm:w-20" />
        <div className="flex items-center rounded-[8px] bg-stone-100 p-0.5">
          <span className="rounded-md bg-white p-1 text-stone-900">
            <Monitor className="size-3" />
          </span>
          <span className="p-1 text-stone-400">
            <Tablet className="size-3" />
          </span>
          <span className="p-1 text-stone-400">
            <Smartphone className="size-3" />
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="p-1 text-stone-400">
            <Undo2 className="size-3" />
          </span>
          <span className="p-1 text-stone-400">
            <Redo2 className="size-3" />
          </span>
          <span className="rounded-md bg-stone-800 px-2 py-1 text-[10px] font-medium text-stone-50">
            Publish
          </span>
        </div>
      </div>
      <div className="relative mx-2 mb-2 overflow-hidden rounded-md border-[1.5px] border-[#9AE600]">
        <div className="flex min-h-[9rem] sm:min-h-[12rem]">
          <div className="min-w-0 flex-1 py-3 pr-4 pl-8">
            <p className="text-[10px] font-medium tracking-wide text-[#4F5833] uppercase">
              Open source
            </p>
            <h4 className="font-display mt-1 text-xl leading-none font-bold text-stone-900 sm:text-2xl">
              Turn text to video in minutes
            </h4>
            <p className="mt-1.5 text-[10px] leading-snug text-stone-700">
              Create studio-quality videos with AI avatars and voiceovers in 130+ languages.
            </p>
            <span className="mt-2 inline-block rounded bg-[#9AE600] px-2 py-1 text-[10px] font-medium text-stone-900">
              Create a free AI video
            </span>
          </div>
          <div className="hidden w-[38%] bg-[#F5F6EF] sm:block" />
        </div>
        <div className="absolute top-6 left-1 flex flex-col overflow-hidden rounded-md bg-white shadow">
          <span className="flex flex-col items-center px-1 py-1 text-stone-800">
            <ChevronUp className="size-3" />
            <ChevronDown className="size-3" />
          </span>
          <span className="px-1 py-1 text-stone-800">
            <Trash2 className="size-3" />
          </span>
          <span className="px-1 py-1 text-stone-800">
            <MoreVertical className="size-3" />
          </span>
        </div>
        <CollaboratorCursor name="mariam" className="absolute right-3 bottom-6" />
      </div>
    </div>
  )
}
