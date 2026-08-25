/**
 * Static generation pass.
 *
 * Runs after both Vite builds: loads the SSR bundle, renders the app to a
 * complete HTML string, and splices it into the client build's index.html at
 * the `<!--app-html-->` marker. The result is a page whose content is present
 * before any JavaScript executes — which is the entire point of the SSG setup,
 * so the marker check below is a hard failure rather than a warning.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATE = resolve(ROOT, 'dist/index.html')
const SSR_ENTRY = resolve(ROOT, 'dist-ssr/entry-server.js')
const MARKER = '<!--app-html-->'

interface ServerEntry {
  render: () => Promise<{ html: string }>
}

async function main() {
  const template = await readFile(TEMPLATE, 'utf8')
  if (!template.includes(MARKER)) {
    throw new Error(
      `Prerender marker ${MARKER} missing from dist/index.html — the client build no longer matches index.html.`,
    )
  }

  const { render } = (await import(SSR_ENTRY)) as ServerEntry
  const { html } = await render()

  if (html.trim().length === 0) {
    throw new Error('Prerender produced empty markup.')
  }

  await writeFile(TEMPLATE, template.replace(MARKER, html), 'utf8')
  console.log(`prerender: injected ${html.length} bytes into dist/index.html`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
