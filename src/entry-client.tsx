import { StrictMode } from 'react'
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
 * the bundle never runs. Reaching this line proves it did, so disarm it.
 */
function disarmRevealFailsafe() {
  if (window.__revealFailsafe !== undefined) {
    window.clearTimeout(window.__revealFailsafe)
    delete window.__revealFailsafe
  }
}

const container = document.getElementById('root')
if (container) {
  disarmRevealFailsafe()
  hydrateRoot(
    container,
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
