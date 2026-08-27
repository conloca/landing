import { GitMerge } from 'lucide-react'
import { CollaboratorCursor } from '@/components/sections/three-features/CollaboratorCursor'

/**
 * Card 3 visual: pull-request diff card, per Figma `homepage.vx.json` mockup.
 *
 * `aria-hidden` because it is set dressing, not page content: the filename,
 * the diff lines, the fictional author and "Merge pull request" all describe an
 * imaginary review that a screen reader was reading out as part of the real
 * page, and that crawlers could index as product copy. Nothing inside is
 * focusable — the merge control is a `span`, not a button — so hiding the whole
 * subtree removes no interaction.
 */
export function DiffMockup() {
  return (
    <div className="mx-auto w-full max-w-[520px] rounded-xl bg-white shadow-xl" aria-hidden>
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 text-sm">
        <span className="font-mono text-stone-700">homepage.vx.json</span>
        <span className="flex gap-1.5 text-xs font-medium">
          <span className="rounded bg-lime-100 px-1.5 py-0.5 text-lime-700">+1</span>
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-600">-1</span>
        </span>
      </div>
      <div className="px-4 py-2 font-mono text-xs text-stone-400">@@ -39,10 +39 @@</div>
      <div className="font-mono text-xs leading-6">
        <div className="flex gap-3 px-4 text-stone-400">
          <span>31</span>
          <span>31</span>
          <span className="text-stone-600">&quot;button&quot;: {'{'}</span>
        </div>
        <div className="relative flex gap-3 bg-red-50 px-4 text-red-600">
          <span className="text-red-300">33</span>
          <span>-</span>
          <span>&quot;label&quot;: &quot;Get started&quot;</span>
          <CollaboratorCursor name="danny" className="absolute top-0.5 right-4" />
        </div>
        <div className="flex gap-3 bg-lime-50 px-4 text-lime-700">
          <span className="text-lime-300">34</span>
          <span>+</span>
          <span>&quot;label&quot;: &quot;Create account&quot;</span>
        </div>
        <div className="flex gap-3 px-4 text-stone-400">
          <span>35</span>
          <span>35</span>
          <span className="text-stone-600">{'}'}</span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-stone-100 px-4 py-3">
        <div className="text-xs text-stone-500">
          <span className="font-medium text-stone-700">Chris</span> · 4h ago
          <p>Translated CTA text</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-50">
          <GitMerge className="size-3.5" /> Merge pull request
        </span>
      </div>
    </div>
  )
}
