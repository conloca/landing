/**
 * Regenerates the colour-token table in `docs/figma/COLOR-TOKENS.md` from the
 * raw node tree in `docs/figma/nodes-colors.json`.
 *
 * That tree is a snapshot of the Figma file's own "Color tokens - Semantics"
 * frame — a generated variables document the designer maintains. The Variables
 * REST API is unavailable on this account (it needs the `file_variables:read`
 * scope, which cannot be granted here), so this frame is the only machine-
 * readable source for the designer's token names.
 *
 * Transcribing it by hand had already produced one wrong claim in the prose, so
 * the table is derived mechanically instead.
 *
 *   bun run scripts/figma-color-tokens.ts          # print the table
 *   bun run scripts/figma-color-tokens.ts --check  # fail if the doc is stale
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface FigmaNode {
  id: string
  name?: string
  type?: string
  characters?: string
  children?: FigmaNode[]
}

const ROOT = resolve(import.meta.dirname, '..')
const TREE = resolve(ROOT, 'docs/figma/nodes-colors.json')
const DOC = resolve(ROOT, 'docs/figma/COLOR-TOKENS.md')

/** A row of the designer's table: token path, the alias it points at, its value. */
export interface ColorToken {
  token: string
  alias: string
  value: string
}

function findByName(node: FigmaNode, name: string): FigmaNode | undefined {
  if (node.name === name && node.type === 'FRAME') return node
  for (const child of node.children ?? []) {
    const hit = findByName(child, name)
    if (hit) return hit
  }
  return undefined
}

/** Text content of a subtree, in document order. */
function textsOf(node: FigmaNode): string[] {
  const out: string[] = []
  const walk = (n: FigmaNode): void => {
    if (n.type === 'TEXT' && n.characters?.trim()) out.push(n.characters.trim())
    for (const c of n.children ?? []) walk(c)
  }
  walk(node)
  return out
}

/**
 * Rows read as: token path, an arrow glyph, the alias, a bullet, the hex, a
 * description placeholder. Group headers ("color / bg / surface") carry a
 * single text and are skipped.
 */
function parseRow(texts: string[]): ColorToken | undefined {
  const token = texts[0]
  // Group headers read "color / bg / surface" and carry no token path.
  if (!token?.startsWith('color.')) return undefined
  const hex = texts.find((t) => /^#[0-9A-Fa-f]{6}$/.test(t))
  const alias = texts.find(
    (t) => t !== token && t !== hex && /^[a-z]+(\/\d+)?$/.test(t),
  )
  // A row that names a token but whose value or alias won't parse means the
  // frame's structure has changed. Failing loudly beats dropping it silently —
  // a missing row would otherwise look like the designer deleted a token.
  if (!hex || !alias) {
    throw new Error(
      `cannot parse token row ${token}: alias=${alias ?? 'none'} hex=${hex ?? 'none'} ` +
        `from ${JSON.stringify(texts)}`,
    )
  }
  return { token, alias, value: hex.toUpperCase() }
}

export function extractTokens(): ColorToken[] {
  const tree = JSON.parse(readFileSync(TREE, 'utf8')) as FigmaNode
  const table = findByName(tree, 'Table')
  if (!table) throw new Error('no "Table" frame in docs/figma/nodes-colors.json')

  const tokens: ColorToken[] = []
  for (const row of table.children ?? []) {
    if (row.name?.toLowerCase() === 'table header') continue
    const parsed = parseRow(textsOf(row))
    if (parsed) tokens.push(parsed)
  }
  return tokens
}

function renderTable(tokens: ColorToken[]): string {
  const lines = ['| Designer token | Alias | Value |', '| --- | --- | --- |']
  for (const t of tokens) {
    lines.push(`| \`${t.token}\` | \`${t.alias}\` | \`${t.value}\` |`)
  }
  return lines.join('\n')
}

const tokens = extractTokens()
const table = renderTable(tokens)

if (process.argv.includes('--check')) {
  // Compare the doc's table rows to the generated ones line for line. A
  // substring search is not enough: 14 of the 20 values are duplicates of
  // another row, so a swapped value would still be "found" somewhere in the
  // document, and an alias-only drift would never be seen at all.
  const doc = readFileSync(DOC, 'utf8')
  const docRows = new Map<string, string>()
  for (const line of doc.split('\n')) {
    const m = /^\|\s*`(color\.[^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|$/.exec(
      line.trim(),
    )
    if (m) docRows.set(m[1] as string, `${m[2]}|${m[3]}`)
  }

  const problems: string[] = []
  for (const t of tokens) {
    const want = `${t.alias}|${t.value}`
    const got = docRows.get(t.token)
    if (got === undefined) problems.push(`missing row: ${t.token}`)
    else if (got !== want) {
      problems.push(`drift: ${t.token} — doc has ${got.replace('|', ' / ')}, tree has ${t.alias} / ${t.value}`)
    }
  }
  for (const name of docRows.keys()) {
    if (!tokens.some((t) => t.token === name)) {
      problems.push(`stale row not in the tree: ${name}`)
    }
  }

  if (problems.length > 0) {
    for (const p of problems) process.stderr.write(`${p}\n`)
    process.stderr.write('\nCOLOR-TOKENS.md is out of step with nodes-colors.json.\n')
    process.exit(1)
  }
  process.stdout.write(
    `COLOR-TOKENS.md matches all ${tokens.length} tokens (name, alias and value).\n`,
  )
} else {
  process.stdout.write(`${table}\n`)
}
