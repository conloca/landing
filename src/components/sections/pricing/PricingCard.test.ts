import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pricingCardSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'PricingCard.tsx'),
  'utf8',
)

describe('PricingCard billed-annually ban', () => {
  it('does not contain the forbidden billed-annually subtitle copy', () => {
    expect(pricingCardSource).not.toContain('Billed annually')
  })
})
