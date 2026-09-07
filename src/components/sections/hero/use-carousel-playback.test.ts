import { describe, expect, it } from 'bun:test'
import {
  HERO_SLIDE_DURATION_MS,
  nextCarouselPlayback,
} from '@/components/sections/hero/use-carousel-playback'

function step(current: { slide: number; elapsedMs: number }, milliseconds: number, slideCount = 3) {
  return nextCarouselPlayback(current.slide, current.elapsedMs, milliseconds, slideCount)
}

describe('hero carousel playback', () => {
  it('fills for eight seconds before advancing and restarting the next marker', () => {
    let current = { slide: 0, elapsedMs: 0, progress: 0 }
    current = step(current, HERO_SLIDE_DURATION_MS / 2)
    expect(current.slide).toBe(0)
    expect(current.progress).toBe(50)
    current = step(current, HERO_SLIDE_DURATION_MS / 2 - 1)
    expect(current.slide).toBe(0)
    expect(current.progress).toBeCloseTo(99.9875)
    current = step(current, 1)
    expect(current.slide).toBe(1)
    expect(current.progress).toBe(0)
    current = step(current, HERO_SLIDE_DURATION_MS * 2)
    expect(current.slide).toBe(0)
    expect(current.progress).toBe(0)
  })

  it('freezes elapsed progress while paused and resumes the remaining duration', () => {
    let current = step({ slide: 0, elapsedMs: 0 }, 2000)
    expect(current.progress).toBe(25)
    // Paused clock: elapsed is held, so a long wall-clock gap is a 0ms step.
    current = step(current, 0)
    expect(current.slide).toBe(0)
    expect(current.progress).toBe(25)
    current = step(current, 5999)
    expect(current.slide).toBe(0)
    current = step(current, 1)
    expect(current.slide).toBe(1)
    expect(current.progress).toBe(0)
  })

  it('starts a selected slide with a fresh interval', () => {
    const current = step({ slide: 2, elapsedMs: 0 }, 4000)
    expect(current.slide).toBe(2)
    expect(current.progress).toBe(50)
  })
})
