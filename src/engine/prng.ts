/**
 * Seeded PRNG (mulberry32). The whole engine must be a pure function of
 * (seed, orderedDecisionList) — spec §2, "Determinism is a hard requirement" —
 * so no `Math.random()` is allowed anywhere in engine code. This is the only
 * source of randomness, and it is fully reproducible from its seed.
 */
export type Rng = () => number

export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Integer in [0, length). */
export function pickIndex(rng: Rng, length: number): number {
  return Math.floor(rng() * length)
}

/** One element from a non-empty array. */
export function pickOne<T>(rng: Rng, items: readonly T[]): T {
  return items[pickIndex(rng, items.length)]
}

/** n distinct elements from an array, order preserved from a shuffled copy. */
export function pickN<T>(rng: Rng, items: readonly T[], n: number): T[] {
  const pool = items.slice()
  const result: T[] = []
  const count = Math.min(n, pool.length)
  for (let i = 0; i < count; i++) {
    const idx = pickIndex(rng, pool.length)
    result.push(pool[idx])
    pool.splice(idx, 1)
  }
  return result
}
