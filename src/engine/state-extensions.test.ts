import { describe, expect, it } from 'vitest'
import { sampleDependencyPool } from './__fixtures__/sampleDependencies'
import { answerQuery, createCredibilityPool, type CredibilityQueryDefinition } from './credibility'
import { getReadiness } from './dependencies'
import type { HandoverVariant } from './handover'
import { createSignoffState } from './signoff'
import {
  AUDIT_ACTIVE_FLAG,
  answerCredibilityQuery,
  applyDecision,
  applyFlavorEvent,
  createInitialState,
} from './state'
import type { DecisionCard, FlavorEvent } from './types'

const confidenceCard: DecisionCard = {
  id: 'confidence-card',
  turn: 'February',
  trigger: 'scheduled',
  prompt: 'x',
  context: 'x',
  options: [
    {
      id: 'reassure',
      label: 'x',
      currency: 'accuracy',
      teaser: 'x',
      shown: [],
      hidden: [],
      confidenceDelta: 0.2,
    },
  ],
}

const dependencyCard: DecisionCard = {
  id: 'dependency-card',
  turn: 'October',
  trigger: 'scheduled',
  prompt: 'x',
  context: 'x',
  options: [
    {
      id: 'fix-it-properly',
      label: 'x',
      currency: 'capacity',
      teaser: 'x',
      sourceFix: true,
      shown: [],
      hidden: [],
      dependencyAction: { dependencyId: 'dep-a', action: 'complete' },
    },
  ],
}

describe('confidenceDelta', () => {
  it('adjusts signoff.confidence immediately', () => {
    const state = createInitialState(1, { signoff: createSignoffState(0.5) })
    const next = applyDecision(state, confidenceCard, 'reassure')
    expect(next.signoff.confidence).toBeCloseTo(0.7)
  })
})

describe('dependencyAction', () => {
  it("'complete' sets the target dependency to fully ready", () => {
    const state = createInitialState(1, { dependencies: sampleDependencyPool })
    expect(getReadiness(state.dependencies, 'dep-a')).toBe(0.5)
    const next = applyDecision(state, dependencyCard, 'fix-it-properly')
    expect(getReadiness(next.dependencies, 'dep-a')).toBe(1)
  })
})

describe('audit surcharge', () => {
  it('adds an extra capacity cost to a sourceFix option once the audit is active', () => {
    const state = createInitialState(1, {
      dependencies: sampleDependencyPool,
      initialFlags: [AUDIT_ACTIVE_FLAG],
    })
    const next = applyDecision(state, dependencyCard, 'fix-it-properly')
    expect(next.shown.team_capacity).toBe(-1)
  })

  it('does not apply the surcharge when the audit is not active', () => {
    const state = createInitialState(1, { dependencies: sampleDependencyPool })
    const next = applyDecision(state, dependencyCard, 'fix-it-properly')
    expect(next.shown.team_capacity).toBe(0)
  })
})

describe('answerCredibilityQuery effects', () => {
  const definitions: CredibilityQueryDefinition[] = [
    {
      id: 'q1',
      turn: 'February',
      query: 'x',
      truth: 'x',
      options: [
        {
          id: 'restate',
          label: 'x',
          durability: 'high',
          shown: [{ metric: 'team_capacity', delta: -3, delayTurns: 0 }],
          hidden: [{ metric: 'accuracy', delta: 2, delayTurns: 0 }],
        },
      ],
    },
  ]

  it('applies the chosen option effects to shown and truth', () => {
    const state = createInitialState(1, { credibility: createCredibilityPool(definitions) })
    const next = answerCredibilityQuery(state, 'q1', 'restate')
    expect(next.shown.team_capacity).toBe(-3)
    expect(next.truth.accuracy).toBe(2)
  })

  it('is equivalent whether reached via state.ts or credibility.ts directly, for the bookkeeping half', () => {
    const state = createInitialState(1, { credibility: createCredibilityPool(definitions) })
    const viaState = answerCredibilityQuery(state, 'q1', 'restate')
    const viaPoolDirectly = answerQuery(state.credibility, 'q1', 'restate')
    expect(viaState.credibility.answers).toEqual(viaPoolDirectly.answers)
  })
})

describe('applyFlavorEvent', () => {
  const event: FlavorEvent = {
    id: 'evt-1',
    turn: 'September',
    type: 'flavor_event',
    headline: 'x',
    body: 'x',
    effects: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
  }

  const silentLandingEvent: FlavorEvent = {
    id: 'evt-2',
    turn: 'September',
    type: 'flavor_event',
    attributedTo: 'some-earlier-decision',
    headline: 'x',
    body: 'x',
    effects: [],
  }

  it('applies its own effects to the shown channel', () => {
    const state = createInitialState(1)
    const next = applyFlavorEvent(state, event)
    expect(next.shown.goodwill).toBe(-1)
  })

  it('records the event as acknowledged, even with no effects of its own', () => {
    const state = createInitialState(1)
    const next = applyFlavorEvent(state, silentLandingEvent)
    expect(next.acknowledgedFlavorEvents).toEqual(['evt-2'])
    expect(next.shown.goodwill).toBe(0)
  })

  it('does not mutate the state it was given', () => {
    const state = createInitialState(1)
    applyFlavorEvent(state, event)
    expect(state.shown.goodwill).toBe(0)
    expect(state.acknowledgedFlavorEvents).toEqual([])
  })
})

describe('handover variant application', () => {
  const variant: HandoverVariant = {
    id: 'test-variant',
    title: 'Test',
    note: 'x',
    inherited: 'x',
    initialConfidence: 0.4,
    initialRecurringDebt: 3,
    auditProbability: 0,
    dependencyReadinessOverrides: { 'dep-a': 0.1 },
    latentFlags: ['some_latent_flag'],
  }

  it('sets initial confidence from the variant, not the default', () => {
    const state = createInitialState(1, { handover: variant })
    expect(state.signoff.confidence).toBe(0.4)
  })

  it('sets initial recurring debt on truth', () => {
    const state = createInitialState(1, { handover: variant })
    expect(state.truth.recurring_debt).toBe(3)
  })

  it('adds latent flags at creation', () => {
    const state = createInitialState(1, { handover: variant })
    expect(state.flags.has('some_latent_flag')).toBe(true)
  })

  it('overrides named dependency readiness on top of the pool passed in', () => {
    const state = createInitialState(1, {
      dependencies: sampleDependencyPool,
      handover: variant,
    })
    expect(getReadiness(state.dependencies, 'dep-a')).toBe(0.1)
    expect(getReadiness(state.dependencies, 'dep-b')).toBe(1) // untouched, not overridden
  })

  it('combines initialFlags with the variant latent flags rather than overwriting them', () => {
    const state = createInitialState(1, { handover: variant, initialFlags: ['extra_flag'] })
    expect(state.flags.has('some_latent_flag')).toBe(true)
    expect(state.flags.has('extra_flag')).toBe(true)
  })
})

describe('acknowledgedFlavorEvents lifecycle', () => {
  it('is cleared on turn advance, via the full script runner', async () => {
    const { runScript } = await import('./simulate')
    const event: FlavorEvent = {
      id: 'evt-3',
      turn: 'September',
      type: 'flavor_event',
      headline: 'x',
      body: 'x',
      effects: [],
    }
    const state = runScript(
      1,
      [],
      [{ type: 'advance' }, { type: 'acknowledge', eventId: 'evt-3' }, { type: 'advance' }],
      {},
      [event],
    )
    expect(state.acknowledgedFlavorEvents).toEqual([])
  })
})
