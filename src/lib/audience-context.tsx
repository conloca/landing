import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { AUDIENCES, type Audience } from '@/lib/audience'

interface AudienceState {
  audience: Audience
  setAudience: (audience: Audience) => void
}

const AudienceContext = createContext<AudienceState | null>(null)

/**
 * One shared audience selection for the whole page, so every
 * `AudienceSwitch` instance (hero, feature cards) reads and writes the same
 * state instead of drifting independently. `useState` rather than a URL
 * param or persisted preference — the toggle is a same-session reading
 * mode, not a piece of navigable or durable state.
 *
 * State is the semantic `Audience`, not a `SegmentedControl` index — mapping
 * one to the other is `AudienceSwitch`'s job alone, so this module has no
 * reason to import anything from the components layer.
 */
export function AudienceProvider({ children }: { children: ReactNode }) {
  const [audience, setAudience] = useState<Audience>(AUDIENCES[0])
  const value = useMemo(() => ({ audience, setAudience }), [audience])
  return <AudienceContext.Provider value={value}>{children}</AudienceContext.Provider>
}

/** Throws outside `AudienceProvider` rather than defaulting silently — a
 * section that renders audience-conditioned copy without the provider is a
 * wiring bug, not a valid state to render through. */
export function useAudience(): AudienceState {
  const state = useContext(AudienceContext)
  if (!state) throw new Error('useAudience must be used within an AudienceProvider')
  return state
}
