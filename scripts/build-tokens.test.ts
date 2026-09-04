/**
 * Tests the token generator's emission contract: which colour families become
 * `@theme` custom properties, and that every documented failure mode of
 * `themeColorFamily` actually throws. The real `tokens/tokens.json` is the
 * fixture — a synthetic tree would stop testing the file that ships.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, themeColorFamily, type TokenNode } from './build-tokens'

const tree = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../tokens/tokens.json'), 'utf8'),
) as TokenNode

describe('themeColorFamily', () => {
  test('emits exactly the four cursor identities CollaboratorCursor consumes', () => {
    // The component hardcodes these member keys as class strings, so a token
    // rename must fail here rather than silently unstyle a collaborator.
    const lines = themeColorFamily(tree, 'color.cursor', 'cursor')
    expect(lines).toEqual([
      '  --color-cursor-niko: #f24835;',
      '  --color-cursor-mariam: #a259fe;',
      '  --color-cursor-danny: #fbbf24;',
      '  --color-cursor-kyle: #00bfff;',
    ])
  })

  test('emits the sand family with its full key set', () => {
    const lines = themeColorFamily(tree, 'color.sand', 'sand')
    expect(lines.map((line) => line.replace(/:.*;/, ''))).toEqual([
      '  --color-sand-50',
      '  --color-sand-100',
      '  --color-sand-200',
      '  --color-sand-300',
      '  --color-sand-400',
      '  --color-sand-500',
      '  --color-sand-600',
      '  --color-sand-700',
      '  --color-sand-800',
      '  --color-sand-900',
      '  --color-sand-950',
    ])
    expect(lines).toContain('  --color-sand-200: #f5f6ef;')
  })

  test('refuses a family named after a Tailwind default palette', () => {
    // The exact hazard the not-emitted status of color.lime exists to avoid.
    expect(() => themeColorFamily(tree, 'color.lime', 'lime')).toThrow(
      /Tailwind default palette family/,
    )
  })

  test('throws on a key that is not a CSS identifier', () => {
    // Keys are interpolated into custom-property names; anything with
    // punctuation could inject a declaration into the generated stylesheet.
    const hostile: TokenNode = {
      color: { cursor: { 'x; color: red; --pwned': { $value: '#000000' } } },
    }
    expect(() => themeColorFamily(hostile, 'color.cursor', 'cursor')).toThrow(
      /valid CSS custom-property name/,
    )
    expect(() => themeColorFamily(tree, 'color.cursor', 'cur sor')).toThrow(
      /valid CSS custom-property name/,
    )
  })

  test('throws on a missing group', () => {
    expect(() => themeColorFamily(tree, 'color.nope', 'nope')).toThrow(/missing/)
  })

  test('throws on a non-leaf member', () => {
    // color.cursor.danny is a leaf; color itself has group members.
    expect(() => themeColorFamily(tree, 'color', 'all')).toThrow(/must be flat/)
  })

  test('throws on an empty family', () => {
    const empty: TokenNode = { color: { empty: { $description: 'n/a' } } }
    expect(() => themeColorFamily(empty, 'color.empty', 'empty')).toThrow(/has no tokens/)
  })
})

describe('render', () => {
  const css = render(tree)

  test('emits sand and cursor theme variables', () => {
    expect(css).toContain('--color-sand-50:')
    expect(css).toContain('--color-cursor-danny:')
  })

  test('never emits the reference-only families', () => {
    expect(css).not.toContain('--color-lime-')
    expect(css).not.toContain('--color-stone-')
    expect(css).not.toContain('--color-diff-')
    expect(css).not.toContain('--color-shadow-')
  })

  test('emits both scheme modes with concrete values', () => {
    expect(css).toContain(':root {')
    expect(css).toContain('  --foreground: #1c1917;')
    expect(css).toContain('.dark {')
    expect(css).toContain('  --foreground: #fafaf9;')
  })
})
