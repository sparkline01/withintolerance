import { describe, expect, it } from 'vitest'
import { createErrorPool, type ErrorDefinition } from './cascade'
import { answerQuery, createCredibilityPool, type CredibilityQueryDefinition } from './credibility'
import { chaseDependency, createDependencyPool, type DependencyDefinition } from './dependencies'
import { adjustConfidence, advanceEscalation, createSignoffState, deriveReadiness } from './signoff'

describe('createSignoffState', () => {
  it('defaults confidence to the baseline and escalation to zero', () => {
    const state = createSignoffState()
    expect(state.confidence).toBeGreaterThan(0)
    expect(state.escalationRung).toBe(0)
  })
})

describe('adjustConfidence', () => {
  it('clamps to [0, 1]', () => {
    const state = createSignoffState(0.5)
    expect(adjustConfidence(state, 10).confidence).toBe(1)
    expect(adjustConfidence(state, -10).confidence).toBe(0)
  })

  it('does not mutate the state it was given', () => {
    const state = createSignoffState(0.5)
    adjustConfidence(state, 0.1)
    expect(state.confidence).toBe(0.5)
  })
})

describe('advanceEscalation', () => {
  it('advances one rung at a time, capped at 5', () => {
    let state = createSignoffState()
    for (let i = 0; i < 10; i++) state = advanceEscalation(state)
    expect(state.escalationRung).toBe(5)
  })

  it('drops confidence to the floor only once rung 5 ("formal contact") is reached', () => {
    let state = createSignoffState(0.9)
    for (let i = 0; i < 4; i++) {
      state = advanceEscalation(state)
      expect(state.confidence).toBe(0.9) // untouched through rungs 1-4
    }
    state = advanceEscalation(state) // rung 5
    expect(state.escalationRung).toBe(5)
    expect(state.confidence).toBe(0)
  })
})

describe('deriveReadiness', () => {
  const blockingError: ErrorDefinition = {
    id: 'e1',
    recordId: 'r1',
    tier: 1,
    severity: 'blocking',
    ruleCode: 'X',
    label: 'x',
  }
  const query: CredibilityQueryDefinition = {
    id: 'q1',
    turn: 'February',
    query: 'x',
    truth: 'x',
    options: [{ id: 'o1', label: 'x', durability: 'high' }],
  }
  const dependency: DependencyDefinition = {
    id: 'd1',
    label: 'x',
    owner: 'x',
    ownerName: 'x',
    initialReadiness: 0.5,
    slipsPerTurn: 0,
    chaseCost: {},
    escalateCost: {},
    workaroundAvailable: true,
    workaroundAccuracyPenalty: -1,
  }

  it('is 1 when every pool is empty — nothing authored yet should never block readiness', () => {
    const readiness = deriveReadiness({
      errors: createErrorPool([]),
      credibility: createCredibilityPool([]),
      dependencies: createDependencyPool([]),
    })
    expect(readiness).toBe(1)
  })

  it('is the average of the three components', () => {
    // errors: 1 open blocking error out of 1 defined -> component 0
    // credibility: 0 of 1 answered -> component 0
    // dependencies: average readiness 0.5 -> component 0.5
    // (0 + 0 + 0.5) / 3
    const readiness = deriveReadiness({
      errors: createErrorPool([blockingError]),
      credibility: createCredibilityPool([query]),
      dependencies: createDependencyPool([dependency]),
    })
    expect(readiness).toBeCloseTo(0.5 / 3)
  })

  it('improves as each component resolves independently', () => {
    const errors = createErrorPool([blockingError]) // still unresolved
    const credibility = answerQuery(createCredibilityPool([query]), 'q1', 'o1')
    const dependencies = chaseDependency(createDependencyPool([dependency]), 'd1') // 0.5 -> 0.7

    const readiness = deriveReadiness({ errors, credibility, dependencies })
    // errors: 0, credibility: 1, dependencies: 0.7 -> (0 + 1 + 0.7) / 3
    expect(readiness).toBeCloseTo(1.7 / 3)
  })

  it('reaches 1 once everything is resolved', () => {
    const definitions = [blockingError]
    let errorPool = createErrorPool(definitions)
    errorPool = { definitions, resolutions: { e1: 'source_fix' } }
    const credibility = answerQuery(createCredibilityPool([query]), 'q1', 'o1')
    const dependencies = createDependencyPool([{ ...dependency, initialReadiness: 1 }])

    const readiness = deriveReadiness({ errors: errorPool, credibility, dependencies })
    expect(readiness).toBe(1)
  })
})
