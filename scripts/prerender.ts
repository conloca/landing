/**
 * Static generation pass.
 *
 * Runs after both Vite builds: loads the SSR bundle, renders each page to a
 * complete HTML string, and splices it into the matching client-build HTML
 * entry at the `<!--app-html-->` marker. Missing marker or empty markup is a
 * hard build failure rather than a warning.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SSR_ENTRY = resolve(ROOT, 'dist-ssr/entry-server.js')
const MARKER = '<!--app-html-->'

const PAGES = [
  { url: '/', file: 'dist/index.html' },
  { url: '/how-it-works/', file: 'dist/how-it-works/index.html' },
  { url: '/blog/', file: 'dist/blog/index.html' },
] as const

interface ServerEntry {
  render: (url?: string) => Promise<{ html: string }>
}

async function main() {
  // Built artifact at dist-ssr/entry-server.js — path only exists after the
  // SSR Vite pass, so it cannot be a static import.
  const { render } = (await import(SSR_ENTRY)) as ServerEntry

  for (const page of PAGES) {
    const templatePath = resolve(ROOT, page.file)
    const template = await readFile(templatePath, 'utf8')
    if (!template.includes(MARKER)) {
      throw new Error(
        `Prerender marker ${MARKER} missing from ${page.file} — the client build no longer matches the HTML entry.`,
      )
    }

    const { html } = await render(page.url)
    if (html.trim().length === 0) {
      throw new Error(`Prerender produced empty markup for ${page.url}.`)
    }

    await writeFile(templatePath, template.replace(MARKER, html), 'utf8')
    // Straight to stdout rather than console.log: this line is the command's intended
    // output, not a stray debug statement, and the repo's leftover-marker gate blocks
    // console.log as the latter.
    process.stdout.write(`prerender: injected ${html.length} bytes into ${page.file}\n`)
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
