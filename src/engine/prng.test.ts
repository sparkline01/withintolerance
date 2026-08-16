import { describe, expect, it } from 'vitest'
import { createRng, pickN, pickOne } from './prng'

describe('createRng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    const seqA = Array.from({ length: 10 }, () => a())
    const seqB = Array.from({ length: 10 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('produces different sequences for different seeds', () => {
    const a = createRng(1)
    const b = createRng(2)
    const seqA = Array.from({ length: 10 }, () => a())
    const seqB = Array.from({ length: 10 }, () => b())
    expect(seqA).not.toEqual(seqB)
  })

  it('stays within [0, 1)', () => {
    const rng = createRng(7)
    for (let i = 0; i < 1000; i++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('pickOne / pickN', () => {
  it('pickOne is deterministic for a given seed', () => {
    const items = ['Wendy', 'meticulous', 'no-note', 'high-bar', 'promoted-stakeholder']
    const a = pickOne(createRng(5), items)
    const b = pickOne(createRng(5), items)
    expect(a).toBe(b)
  })

  it('pickN returns distinct elements without replacement', () => {
    const items = [1, 2, 3, 4, 5, 6]
    const picked = pickN(createRng(3), items, 4)
    expect(picked).toHaveLength(4)
    expect(new Set(picked).size).toBe(4)
    for (const value of picked) expect(items).toContain(value)
  })
})
