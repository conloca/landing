import { Play } from 'lucide-react'

const STATS = [
  { label: 'Pages', value: '7 pages' },
  { label: 'Media', value: '1 asset' },
  { label: 'Fragments', value: '20 fragments' },
]

const ACTIVITY = [
  'Saba Test',
  'CorpOS Terms and Conditions',
  'QA Sweep Test',
  'Homepage',
]

/**
 * Approximation of the dashboard screenshot fill on `Video frame` — the real
 * screenshot was never exported (rate-limited), so this reconstructs its
 * structure in DOM rather than shipping a missing/broken image.
 */
export function HeroVisual() {
  return (
    <div className="relative aspect-[932/782] w-full max-w-[932px] overflow-hidden rounded-tl-[20px] rounded-bl-[20px] bg-stone-900 text-stone-50 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-xs text-stone-400">
        <span>staging-conloca / corpos-staging / main</span>
        <span>Unsaved changes</span>
      </div>
      <div className="px-5 py-4">
        <h3 className="text-lg font-semibold">Dashboard</h3>
        <p className="text-sm text-stone-400">Overview of your content and recent activity.</p>
      </div>
      <div className="grid grid-cols-3 gap-3 px-5">
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-lg bg-white/5 p-3">
            <p className="text-xs text-stone-400">{stat.label}</p>
            <p className="text-lg font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-2.5 px-5 text-sm">
        {ACTIVITY.map((item) => (
          <li key={item} className="flex items-center gap-2 text-stone-200">
            <span className="size-1.5 rounded-full bg-lime-400" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
      {/* Decorative — no video is wired up yet, so this isn't a focusable no-op button. */}
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm"
      >
        <Play className="size-6 translate-x-0.5 fill-stone-50 text-stone-50" />
      </span>
      <div
        className="absolute bottom-4 left-4 h-24 w-32 rounded-lg bg-gradient-to-br from-indigo-400 to-lime-400"
        data-placeholder="hero-visual-pip-photo"
      />
    </div>
  )
}
