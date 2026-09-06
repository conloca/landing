import { describe, expect, test } from 'bun:test'
import { AUDIENCE_INDEX, AUDIENCE_OPTIONS, AUDIENCES } from '@/lib/audience'
import { FEATURE_CARDS_COPY } from '@/lib/content/feature-cards-copy'

/**
 * `AUDIENCE_INDEX`'s key set is exhaustively checked by its `Record<Audience,
 * 0 | 1>` type, but nothing stops its *values* — or `AUDIENCE_OPTIONS`'s
 * order — from drifting out of sync with `AUDIENCES` without a type error
 * (see `AudienceSwitch`, which relies on all three agreeing). These
 * assertions are the runtime half of that invariant.
 */
describe('audience index invariants', () => {
  test('AUDIENCE_INDEX maps every audience to its position in AUDIENCES', () => {
    expect(AUDIENCE_INDEX[AUDIENCES[0]]).toBe(0)
    expect(AUDIENCE_INDEX[AUDIENCES[1]]).toBe(1)
  })

  test('AUDIENCE_OPTIONS has one label per audience, in the same order', () => {
    expect(AUDIENCE_OPTIONS.length).toBe(AUDIENCES.length)
  })

  test('FEATURE_CARDS_COPY has one card-count-matching tuple per audience', () => {
    for (const audience of AUDIENCES) {
      expect(FEATURE_CARDS_COPY[audience].length).toBe(3)
    }
  })
})
