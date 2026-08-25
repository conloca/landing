import { CollaboratorCursor } from '@/components/sections/three-features/CollaboratorCursor'

const JSON_LINES = [
  '{',
  '  "name": "hero",',
  '  "label": "Hero",',
  '  "fields": [',
  '    { "name": "eyebrow", "type": "string" },',
  '    { "name": "title", "type": "string" },',
  '    { "name": "description", "type": "text" },',
]

/** Card 1 visual: JSON schema editor + rendered visual-editor mockup, per Figma `Lootie animation` group. */
export function JsonEditorMockup() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute top-4 left-0 w-[70%] max-w-[340px] rounded-xl bg-white p-3 shadow-xl">
        <div className="mb-2 flex items-center justify-between border-b border-stone-100 pb-2 text-xs text-stone-500">
          <span className="font-mono">hero-section.vx.json</span>
          <CollaboratorCursor name="niko" />
        </div>
        <pre className="overflow-hidden font-mono text-[11px] leading-4 text-stone-600">
          {JSON_LINES.map((line, i) => (
            <div key={line}>
              <span className="mr-2 text-stone-300">{i + 1}</span>
              {line}
            </div>
          ))}
        </pre>
      </div>
      <div className="absolute right-0 bottom-4 w-[64%] max-w-[300px] rounded-xl border-2 border-lime-400 bg-white p-4 shadow-xl">
        <p className="text-[10px] font-bold tracking-wide text-lime-600 uppercase">Open source</p>
        <h4 className="font-display mt-1 text-lg leading-tight font-bold text-stone-900">
          Turn text to video in minutes
        </h4>
        <p className="mt-1 text-xs text-stone-500">
          Create studio-quality videos with AI avatars and voiceovers in 130+ languages.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-semibold text-stone-900">
            Create a free AI video
          </span>
          <CollaboratorCursor name="mariam" />
        </div>
      </div>
    </div>
  )
}
