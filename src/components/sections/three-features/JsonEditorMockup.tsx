import { CollaboratorCursor } from '@/components/sections/three-features/CollaboratorCursor'

const JSON_BODY = [
  ' 1 {',
  ' 2   "name": "hero",',
  ' 3   "label": "Hero",',
  ' 4   "fields": [',
  ' 5     {',
  ' 6       "name": "eyebrow",',
  ' 7       "type": "string",',
  ' 8       "label": "Open source"',
  ' 9     },',
  '10     {',
  '11       "name": "title",',
  '12       "type": "string",',
  '13       "label": "Turn text to video"',
  '14     },',
  '15     {',
  '16       "name": "description",',
  '17       "type": "text",',
  '18       "label": "Create studio-quality"',
  '19     },',
  '20     {',
  '21       "name": "cta",',
  '22       "type": "string"',
  '23     }',
  '24   ]',
  '25 }',
].join('\n')

/**
 * Card 1 visual: JSON schema editor + rendered visual-editor mockup, per Figma
 * `Lootie animation` group.
 *
 * `aria-hidden` because every string in here is set dressing, not page content:
 * the filename, the JSON body and the mock article ("Turn text to video in
 * minutes") describe a fictional document, and the `h4` in particular was being
 * announced to screen readers and offered to crawlers as a real product
 * heading. Safe to hide wholesale — nothing inside is focusable.
 *
 * `min-h-*` on this root is load-bearing: both panes are absolutely
 * positioned, and `h-full` does not resolve against the visual slot's
 * `min-height`, so without a definite height here the page-builder pane
 * (`bottom-0`) sits above the slot and is clipped by the card.
 */
export function JsonEditorMockup() {
  return (
    <div
      className="relative h-full min-h-[17.5rem] w-full sm:min-h-[28rem] lg:min-h-full"
      aria-hidden
    >
      <div className="absolute top-2 left-0 z-10 w-[78%] max-w-[418px] overflow-hidden rounded-xl bg-white p-3 shadow-xl lg:top-[10%]">
        <div className="mb-2 flex items-center gap-2 border-b border-stone-100 pb-2 text-xs text-stone-500">
          <span className="font-mono text-lime-500">{'{ }'}</span>
          <span className="font-mono">hero-section.vx.json</span>
        </div>
        <pre className="relative overflow-hidden font-mono text-[11px] leading-4 text-stone-600">
          {JSON_BODY}
          <CollaboratorCursor name="niko" className="absolute top-12 right-1" />
        </pre>
      </div>
      <div className="absolute right-0 bottom-0 z-20 w-[85%] max-w-[300px] rounded-3xl bg-white p-4 shadow-xl sm:w-[72%] sm:max-w-[380px] lg:top-[36%] lg:right-[-4%] lg:bottom-auto lg:max-w-[420px]">
        <p className="text-[10px] font-bold tracking-wide text-lime-600 uppercase">Open source</p>
        <h4 className="font-display mt-1 text-lg leading-tight font-bold text-stone-900">
          Turn text to video in minutes
        </h4>
        <p className="mt-1 text-xs text-stone-500">
          Create studio-quality videos with AI avatars and voiceovers in 130+ languages.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-stone-900">
            Create a free AI video
          </span>
          <CollaboratorCursor name="mariam" />
        </div>
      </div>
    </div>
  )
}
