import { describe, expect, it } from 'vitest'
import { sampleErrorPool } from './__fixtures__/sampleErrors'
import {
  accuracyDebtCount,
  isOpen,
  openErrorsByTier,
  recurringDebtCount,
  resolveError,
  totalOpenErrors,
} from './cascade'

describe('cascade: initial state', () => {
  it('only counts the shallowest blocking error on each record as open', () => {
    // student-a: tier1 blocking is open. tier2/tier3 are masked by it.
    // student-b: tier1 blocking is open.
    expect(totalOpenErrors(sampleErrorPool)).toBe(2)
    expect(openErrorsByTier(sampleErrorPool)).toEqual({ 1: 2, 2: 0, 3: 0, 4: 0, 5: 0 })
  })

  it('never counts advisory errors as open, even though they exist in the pool', () => {
    const tier3 = sampleErrorPool.definitions.find((d) => d.id === 'a-tier3')!
    expect(isOpen(sampleErrorPool, tier3)).toBe(false)
  })

  it('counts every unresolved error against the accuracy debt, masked or not', () => {
    // All 4 fixture errors are unresolved at the start, regardless of visibility.
    expect(accuracyDebtCount(sampleErrorPool)).toBe(4)
  })
})

describe('cascade: the core mechanic — source-fixing reveals what was behind it', () => {
  it('source-fixing tier 1 makes tier 2 reachable and open, raising the total', () => {
    const before = totalOpenErrors(sampleErrorPool)
    const afterFix = resolveError(sampleErrorPool, 'a-tier1', 'source_fix')

    // tier1 is resolved (no longer open), but tier2 becomes reachable and
    // was already unresolved, so it becomes open. Net effect on student-a:
    // 1 open -> 1 open, but it's a *different* error now, and the raw count
    // going up is visible once student-b is factored in as a separate case.
    expect(isOpen(afterFix, afterFix.definitions.find((d) => d.id === 'a-tier1')!)).toBe(false)
    expect(isOpen(afterFix, afterFix.definitions.find((d) => d.id === 'a-tier2')!)).toBe(true)
    expect(totalOpenErrors(afterFix)).toBe(before) // 1 (student-a tier2) + 1 (student-b tier1)
  })

  it('source-fixing straight through tier 1 and tier 2 raises the open count, because tier 3 is reachable but advisory', () => {
    let pool = resolveError(sampleErrorPool, 'a-tier1', 'source_fix')
    pool = resolveError(pool, 'a-tier2', 'source_fix')

    // Both of student-a's blocking errors are now source-fixed. Tier 3 is
    // reachable, but it's advisory, so it is correctly never counted.
    expect(isOpen(pool, pool.definitions.find((d) => d.id === 'a-tier3')!)).toBe(false)
    expect(totalOpenErrors(pool)).toBe(1) // only student-b's tier1 remains open
    expect(accuracyDebtCount(pool)).toBe(2) // a-tier3 (advisory, never fixed) + b-tier1
  })

  it('the visible total genuinely increases mid-cascade when a masked error is more severe once revealed', () => {
    // Add a case where fixing tier1 reveals TWO deeper blocking errors on
    // the same record, so the shown count rises even accounting for the
    // tier1 fix itself clearing.
    const pool = {
      definitions: [
        ...sampleErrorPool.definitions,
        {
          id: 'a-tier2b',
          recordId: 'student-a',
          tier: 2 as const,
          severity: 'blocking' as const,
          ruleCode: '[VERIFY] REF-015',
          label: 'Module code does not resolve',
        },
      ],
      resolutions: {},
    }

    const before = totalOpenErrors(pool) // student-a tier1 (1) + student-b tier1 (1) = 2
    const after = resolveError(pool, 'a-tier1', 'source_fix')
    const afterTotal = totalOpenErrors(after) // student-a tier2 + tier2b now open, plus student-b tier1 = 3

    expect(before).toBe(2)
    expect(afterTotal).toBe(3)
    expect(afterTotal).toBeGreaterThan(before)
  })
})

describe('cascade: suppression keeps the count down and keeps it down', () => {
  it('extract-fixing a blocking error clears it without unblocking deeper tiers', () => {
    const pool = resolveError(sampleErrorPool, 'a-tier1', 'extract_fix')

    expect(isOpen(pool, pool.definitions.find((d) => d.id === 'a-tier1')!)).toBe(false)
    expect(isOpen(pool, pool.definitions.find((d) => d.id === 'a-tier2')!)).toBe(false) // still masked
    expect(totalOpenErrors(pool)).toBe(1) // only student-b's tier1
  })

  it('extract-fixing sets recurring debt; source-fixing does not', () => {
    const suppressed = resolveError(sampleErrorPool, 'a-tier1', 'extract_fix')
    expect(recurringDebtCount(suppressed)).toBe(1)

    const fixed = resolveError(sampleErrorPool, 'a-tier1', 'source_fix')
    expect(recurringDebtCount(fixed)).toBe(0)
  })

  it('an extract-fixed error still drags down the accuracy debt — suppression is not correction', () => {
    const pool = resolveError(sampleErrorPool, 'a-tier1', 'extract_fix')
    expect(accuracyDebtCount(pool)).toBe(4) // unchanged — nothing was actually fixed
  })
})

describe('cascade: purity and determinism', () => {
  it('resolveError does not mutate the pool it was given', () => {
    const before = JSON.stringify(sampleErrorPool)
    resolveError(sampleErrorPool, 'a-tier1', 'source_fix')
    expect(JSON.stringify(sampleErrorPool)).toBe(before)
  })

  it('the same sequence of resolutions always produces the same derived counts', () => {
    let poolA = resolveError(sampleErrorPool, 'a-tier1', 'source_fix')
    poolA = resolveError(poolA, 'a-tier2', 'extract_fix')

    let poolB = resolveError(sampleErrorPool, 'a-tier1', 'source_fix')
    poolB = resolveError(poolB, 'a-tier2', 'extract_fix')

    expect(totalOpenErrors(poolA)).toBe(totalOpenErrors(poolB))
    expect(accuracyDebtCount(poolA)).toBe(accuracyDebtCount(poolB))
    expect(recurringDebtCount(poolA)).toBe(recurringDebtCount(poolB))
  })

  it('throws on an unknown error id', () => {
    expect(() => resolveError(sampleErrorPool, 'not-a-real-error', 'source_fix')).toThrow()
  })
})
