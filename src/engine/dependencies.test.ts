import { describe, expect, it } from 'vitest'
import { sampleDependencyPool } from './__fixtures__/sampleDependencies'
import {
  averageReadiness,
  chaseDependency,
  createDependencyPool,
  degradeDependencies,
  displayState,
  escalateDependency,
  getReadiness,
  pendingWorkaroundPenalty,
} from './dependencies'

describe('initial state', () => {
  it('starts each dependency at its authored initial readiness', () => {
    expect(getReadiness(sampleDependencyPool, 'dep-a')).toBe(0.5)
    expect(getReadiness(sampleDependencyPool, 'dep-b')).toBe(1)
  })

  it('labels an untouched partially-ready dependency as partial, and a fully-ready one as ready', () => {
    expect(displayState(sampleDependencyPool, 'dep-a')).toBe('partial')
    expect(displayState(sampleDependencyPool, 'dep-b')).toBe('ready')
  })
})

describe('chase and escalate', () => {
  it('chasing bumps readiness and moves the display state to chased', () => {
    const pool = chaseDependency(sampleDependencyPool, 'dep-a')
    expect(getReadiness(pool, 'dep-a')).toBeCloseTo(0.7)
    expect(displayState(pool, 'dep-a')).toBe('chased')
  })

  it('escalating bumps readiness by more than chasing', () => {
    const chased = chaseDependency(sampleDependencyPool, 'dep-a')
    const escalated = escalateDependency(sampleDependencyPool, 'dep-a')
    expect(getReadiness(escalated, 'dep-a')).toBeGreaterThan(getReadiness(chased, 'dep-a'))
  })

  it('readiness never exceeds 1 however many times it is chased', () => {
    let pool = sampleDependencyPool
    for (let i = 0; i < 10; i++) pool = chaseDependency(pool, 'dep-a')
    expect(getReadiness(pool, 'dep-a')).toBe(1)
  })

  it('chasing repeatedly without real progress reads as "no reply"', () => {
    // Start from a low-readiness dependency so repeated chases still leave
    // it under the no-reply ceiling.
    const stuck = createDependencyPool([
      {
        id: 'stuck',
        label: 'Stuck dependency',
        owner: 'x',
        ownerName: 'x',
        initialReadiness: 0,
        slipsPerTurn: 0.5, // degrades faster than a single chase recovers
        chaseCost: {},
        escalateCost: {},
        workaroundAvailable: true,
        workaroundAccuracyPenalty: -1,
      },
    ])
    let pool = degradeDependencies(chaseDependency(stuck, 'stuck'))
    pool = degradeDependencies(chaseDependency(pool, 'stuck'))
    expect(displayState(pool, 'stuck')).toBe('no_reply')
  })

  it('throws on an unknown dependency id', () => {
    expect(() => chaseDependency(sampleDependencyPool, 'not-real')).toThrow()
  })
})

describe('passive degradation', () => {
  it('reduces readiness for anything not yet fully ready', () => {
    const pool = degradeDependencies(sampleDependencyPool)
    expect(getReadiness(pool, 'dep-a')).toBeCloseTo(0.4)
  })

  it('never degrades a dependency that has already reached readiness 1', () => {
    const pool = degradeDependencies(sampleDependencyPool)
    expect(getReadiness(pool, 'dep-b')).toBe(1)
  })

  it('does not go below zero', () => {
    let pool = sampleDependencyPool
    for (let i = 0; i < 20; i++) pool = degradeDependencies(pool)
    expect(getReadiness(pool, 'dep-a')).toBe(0)
  })
})

describe('workaround penalty', () => {
  it('is zero when every dependency with a workaround has reached readiness 1', () => {
    const allReady = createDependencyPool([
      {
        id: 'x',
        label: 'X',
        owner: 'x',
        ownerName: 'x',
        initialReadiness: 1,
        slipsPerTurn: 0,
        chaseCost: {},
        escalateCost: {},
        workaroundAvailable: true,
        workaroundAccuracyPenalty: -5,
      },
    ])
    expect(pendingWorkaroundPenalty(allReady)).toBe(0)
  })

  it('sums the penalty for every unready dependency with a workaround available', () => {
    // dep-a: not ready (0.5), workaround available, penalty -3.
    // dep-b: ready (1), no penalty regardless.
    expect(pendingWorkaroundPenalty(sampleDependencyPool)).toBe(-3)
  })

  it('applies no penalty for a dependency with no workaround available, ready or not', () => {
    const noWorkaround = createDependencyPool([
      {
        id: 'y',
        label: 'Y',
        owner: 'y',
        ownerName: 'y',
        initialReadiness: 0,
        slipsPerTurn: 0,
        chaseCost: {},
        escalateCost: {},
        workaroundAvailable: false,
        workaroundAccuracyPenalty: -10,
      },
    ])
    expect(pendingWorkaroundPenalty(noWorkaround)).toBe(0)
  })
})

describe('averageReadiness', () => {
  it('averages across all dependencies', () => {
    expect(averageReadiness(sampleDependencyPool)).toBeCloseTo(0.75)
  })

  it('is 1 for an empty pool, so it never drags readiness down for content not yet authored', () => {
    expect(averageReadiness(createDependencyPool([]))).toBe(1)
  })
})

describe('purity', () => {
  it('none of chase/escalate/degrade mutate the pool they were given', () => {
    const before = JSON.stringify(sampleDependencyPool)
    chaseDependency(sampleDependencyPool, 'dep-a')
    escalateDependency(sampleDependencyPool, 'dep-a')
    degradeDependencies(sampleDependencyPool)
    expect(JSON.stringify(sampleDependencyPool)).toBe(before)
  })
})
