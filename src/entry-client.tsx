import { StrictMode, useEffect } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { App } from '@/App'
import '@/index.css'

declare global {
  interface Window {
    __revealFailsafe?: number
  }
}

/**
 * The inline boot script in index.html arms a timer that strips `js-ready` if
 * the bundle never runs. Disarming it only from a mounted effect — rather than
 * before calling hydrateRoot — means a hydration crash leaves the timer armed,
 * so the prerendered content still reappears instead of staying hidden at
 * opacity 0 forever.
 */
function disarmRevealFailsafe() {
  if (window.__revealFailsafe !== undefined) {
    window.clearTimeout(window.__revealFailsafe)
    delete window.__revealFailsafe
  }
}

function HydrationSucceeded() {
  useEffect(disarmRevealFailsafe, [])
  return null
}

const container = document.getElementById('root')
if (container) {
  hydrateRoot(
    container,
    <StrictMode>
      <HydrationSucceeded />
      <App />
    </StrictMode>,
  )
}
