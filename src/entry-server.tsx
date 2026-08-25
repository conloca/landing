import { prerender } from 'react-dom/static'
import { App } from '@/App'

/**
 * Static render pass used by scripts/prerender.ts.
 *
 * Uses React 19's `prerender()` rather than `renderToString` so Suspense
 * boundaries resolve fully before the HTML is captured — a streaming-aware
 * render that still yields one complete, non-streamed document.
 */
export async function render(): Promise<{ html: string }> {
  const { prelude } = await prerender(<App />, {
    onError(error) {
      throw error
    },
  })

  const html = await new Response(prelude).text()
  return { html }
}
