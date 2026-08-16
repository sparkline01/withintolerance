import { describe, expect, it } from 'vitest'
import { openErrorsByTier, totalOpenErrors } from './cascade'
import {
  createFinaleState,
  currentVignette,
  determineSignoffOutcome,
  expireClock,
  isQueueComplete,
  resolveCurrentVignette,
  type FinaleVignette,
} from './finale'

const definitions = [
  { id: 'e1', recordId: 'r1', tier: 1 as const, severity: 'blocking' as const, ruleCode: 'X1', label: 'x' },
  { id: 'e2', recordId: 'r1', tier: 2 as const, severity: 'blocking' as const, ruleCode: 'X2', label: 'x' },
  { id: 'e3', recordId: 'r2', tier: 1 as const, severity: 'blocking' as const, ruleCode: 'X3', label: 'x' },
]

const vignettes: FinaleVignette[] = [
  { id: 'v1', errorId: 'e1', studentRef: 'S1', course: 'Nursing', humanContext: 'x' },
  { id: 'v2', errorId: 'e2', studentRef: 'S1', course: 'Nursing', humanContext: 'x' },
  { id: 'v3', errorId: 'e3', studentRef: 'S2', course: 'Business', humanContext: 'x' },
]

describe('createFinaleState', () => {
  it('starts at the first vignette with a full clock and nothing resolved', () => {
    const state = createFinaleState(definitions, vignettes, 90)
    expect(currentVignette(state)?.id).toBe('v1')
    expect(state.clockSecondsRemaining).toBe(90)
    expect(state.resolvedOrder).toEqual([])
    expect(isQueueComplete(state)).toBe(false)
  })
})

describe('resolveCurrentVignette', () => {
  it('"leave in tolerance" costs no time and leaves the error unresolved', () => {
    const state = createFinaleState(definitions, vignettes, 90)
    const next = resolveCurrentVignette(state, 'unresolved')
    expect(next.clockSecondsRemaining).toBe(90)
    expect(totalOpenErrors(next.pool)).toBe(2) // e1 and e3 open; e2 still masked by unresolved e1
  })

  it('"override" costs 1 second and clears the error from the open count', () => {
    const state = createFinaleState(definitions, vignettes, 90)
    const next = resolveCurrentVignette(state, 'extract_fix')
    expect(next.clockSecondsRemaining).toBe(89)
    expect(totalOpenErrors(next.pool)).toBe(1) // only e3 remains; e2 stays masked, suppressed not fixed
  })

  it('"fix at source" costs 8 seconds and can raise the open count by unblocking a deeper tier', () => {
    const state = createFinaleState(definitions, vignettes, 90)
    const before = totalOpenErrors(state.pool)
    const next = resolveCurrentVignette(state, 'source_fix')
    expect(next.clockSecondsRemaining).toBe(82)
    expect(before).toBe(2) // e1, e3
    expect(totalOpenErrors(next.pool)).toBe(2) // e1 resolved, but e2 now reachable and open; e3 unchanged
    expect(openErrorsByTier(next.pool)[2]).toBe(1) // specifically e2, tier 2
  })

  it('advances to the next vignette after each resolution', () => {
    const state = createFinaleState(definitions, vignettes, 90)
    const next = resolveCurrentVignette(state, 'unresolved')
    expect(currentVignette(next)?.id).toBe('v2')
    expect(next.resolvedOrder).toEqual(['v1'])
  })

  it('does nothing if called with no vignette remaining', () => {
    let state = createFinaleState(definitions, vignettes, 90)
    for (let i = 0; i < 3; i++) state = resolveCurrentVignette(state, 'unresolved')
    const after = resolveCurrentVignette(state, 'unresolved')
    expect(after.resolvedOrder).toEqual(state.resolvedOrder)
  })

  it('reports the queue complete once every vignette has been resolved', () => {
    let state = createFinaleState(definitions, vignettes, 90)
    for (let i = 0; i < 3; i++) state = resolveCurrentVignette(state, 'unresolved')
    expect(isQueueComplete(state)).toBe(true)
  })
})

describe('clock running out mid-resolution', () => {
  it('auto-overrides everything unresolved once a resolution brings the clock to exactly zero', () => {
    const state = createFinaleState(definitions, vignettes, 8) // exactly one source_fix worth
    const next = resolveCurrentVignette(state, 'source_fix')
    expect(next.clockSecondsRemaining).toBe(0)
    expect(next.timeExpired).toBe(true)
    expect(isQueueComplete(next)).toBe(true)
    // v2 and v3 should have been auto-overridden (extract_fix), not left unresolved.
    expect(totalOpenErrors(next.pool)).toBe(0)
  })

  it('does not touch resolutions already made before the clock ran out', () => {
    const state = createFinaleState(definitions, vignettes, 8)
    const next = resolveCurrentVignette(state, 'source_fix')
    // e1 was genuinely source-fixed, not overridden — reachability of e2
    // still reflects that even though e2 itself got auto-overridden.
    expect(next.pool.resolutions['e1']).toBe('source_fix')
    expect(next.pool.resolutions['e2']).toBe('extract_fix')
    expect(next.pool.resolutions['e3']).toBe('extract_fix')
  })
})

describe('expireClock', () => {
  it('auto-overrides everything unresolved when the wall clock itself times out', () => {
    const state = createFinaleState(definitions, vignettes, 30)
    const next = expireClock(state)
    expect(next.timeExpired).toBe(true)
    expect(next.clockSecondsRemaining).toBe(0)
    expect(totalOpenErrors(next.pool)).toBe(0)
  })

  it('is a no-op if the clock has already expired', () => {
    const state = createFinaleState(definitions, vignettes, 30)
    const first = expireClock(state)
    const second = expireClock(first)
    expect(second).toEqual(first)
  })
})

describe('determineSignoffOutcome', () => {
  it('signs when readiness and confidence are both high', () => {
    expect(determineSignoffOutcome(0.9, 0.8)).toBe('signs')
  })

  it('signs conditionally on a partial picture', () => {
    expect(determineSignoffOutcome(0.5, 0.2)).toBe('signs_conditionally')
    expect(determineSignoffOutcome(0.2, 0.4)).toBe('signs_conditionally')
  })

  it('does not sign when both are low', () => {
    expect(determineSignoffOutcome(0.1, 0.1)).toBe('does_not_sign')
  })
})

describe('purity', () => {
  it('resolveCurrentVignette does not mutate the state it was given', () => {
    const state = createFinaleState(definitions, vignettes, 90)
    const before = JSON.stringify(state)
    resolveCurrentVignette(state, 'source_fix')
    expect(JSON.stringify(state)).toBe(before)
  })
})
