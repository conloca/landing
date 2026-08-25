import { Calendar, Database, FileStack, GitBranch, History, Image, Send } from 'lucide-react'

/** Simplified stand-ins for the seven bespoke Figma illustrations (not exported — rate-limited). */
export function ScheduledPublishingIllustration() {
  return (
    <div className="flex h-full items-center justify-center gap-3 p-6">
      <span className="flex size-11 items-center justify-center rounded-xl bg-stone-800 text-stone-50">
        <Send className="size-5" />
      </span>
      <span className="flex size-11 items-center justify-center rounded-xl bg-white text-stone-700 shadow">
        <Calendar className="size-5" />
      </span>
    </div>
  )
}

export function MarkdownIllustration() {
  return (
    <div className="flex h-full items-center justify-center p-6 font-mono text-xs text-stone-500">
      # Getting started
    </div>
  )
}

export function MediaLibraryIllustration() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <Image className="size-8 text-stone-400" />
    </div>
  )
}

export function DataCollectionsIllustration() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <Database className="size-8 text-stone-400" />
    </div>
  )
}

export function FragmentsIllustration() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <FileStack className="size-8 text-stone-400" />
    </div>
  )
}

export function VersionHistoryIllustration() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <History className="size-8 text-stone-400" />
    </div>
  )
}

export function BranchIllustration() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <GitBranch className="size-8 text-lime-500" />
    </div>
  )
}
