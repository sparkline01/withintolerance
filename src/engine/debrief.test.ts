import { describe, expect, it } from 'vitest'
import { createErrorPool, type ErrorDefinition } from './cascade'
import { createCredibilityPool, type CredibilityQueryDefinition } from './credibility'
import { createDependencyPool, type DependencyDefinition } from './dependencies'
import {
  bandFor,
  computeAxisSummaries,
  computeCounterfactuals,
  computeFinalAccuracy,
  computeSelfCount,
  counterfactualSentence,
  forecastTable,
} from './debrief'
import { advanceTurn, answerCredibilityQuery, applyDecision, createInitialState } from './state'
import type { DecisionCard } from './types'

const cards: DecisionCard[] = [
  {
    id: 'card-a',
    turn: 'September',
    trigger: 'scheduled',
    prompt: 'Prompt A',
    context: 'x',
    options: [
      {
        id: 'a-high-impact',
        label: 'High impact choice',
        currency: 'accuracy',
        teaser: 'x',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 5, delayTurns: 0 }],
      },
      {
        id: 'a-low-impact',
        label: 'Low impact choice',
        currency: 'self',
        teaser: 'x',
        shown: [],
        hidden: [{ metric: 'accuracy', delta: 1, delayTurns: 0 }],
      },
    ],
  },
  {
    id: 'card-b',
    turn: 'October',
    trigger: 'scheduled',
    prompt: 'Prompt B',
    context: 'x',
    options: [
      {
        id: 'b-medium-impact',
        label: 'Medium impact choice',
        currency: 'goodwill',
        teaser: 'x',
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 3, delayTurns: 0 }],
      },
      {
        id: 'b-self',
        label: 'Do it yourself',
        currency: 'self',
        teaser: 'x',
        shown: [],
        hidden: [{ metric: 'you', delta: -2, delayTurns: 0 }],
      },
    ],
  },
  {
    id: 'card-c',
    turn: 'November',
    trigger: 'scheduled',
    prompt: 'Prompt C',
    context: 'x',
    options: [
      {
        id: 'c-no-hidden-effect',
        label: 'No real consequence',
        currency: 'capacity',
        teaser: 'x',
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
]

describe('computeFinalAccuracy', () => {
  const blockingError: ErrorDefinition = {
    id: 'e1',
    recordId: 'r1',
    tier: 1,
    severity: 'blocking',
    ruleCode: 'X',
    label: 'x',
  }
  const dependency: DependencyDefinition = {
    id: 'd1',
    label: 'x',
    owner: 'x',
    ownerName: 'x',
    initialReadiness: 0.2,
    slipsPerTurn: 0,
    chaseCost: {},
    escalateCost: {},
    workaroundAvailable: true,
    workaroundAccuracyPenalty: -4,
  }

  it('is just truth.accuracy when there are no errors or dependency penalties', () => {
    const state = createInitialState(1)
    const next = { ...state, truth: { ...state.truth, accuracy: 10 } }
    expect(computeFinalAccuracy(next)).toBe(10)
  })

  it('subtracts unresolved main-cycle error debt', () => {
    const state = createInitialState(1, { errors: createErrorPool([blockingError]) })
    const next = { ...state, truth: { ...state.truth, accuracy: 10 } }
    expect(computeFinalAccuracy(next)).toBe(9) // 10 - 1 unresolved error
  })

  it('subtracts finale error debt when a finale pool is passed', () => {
    const state = createInitialState(1)
    const next = { ...state, truth: { ...state.truth, accuracy: 10 } }
    const finaleErrors = createErrorPool([blockingError, { ...blockingError, id: 'e2', recordId: 'r2' }])
    expect(computeFinalAccuracy(next, finaleErrors)).toBe(8) // 10 - 2 unresolved finale errors
  })

  it('adds the (negative) dependency workaround penalty', () => {
    const state = createInitialState(1, { dependencies: createDependencyPool([dependency]) })
    const next = { ...state, truth: { ...state.truth, accuracy: 10 } }
    expect(computeFinalAccuracy(next)).toBe(6) // 10 + (-4)
  })
})

describe('bandFor', () => {
  it('uses the standard band labels for non-goodwill axes', () => {
    expect(bandFor('accuracy', 10).label).toBe('Materially accurate')
    expect(bandFor('accuracy', -20).label).toBe('Not fit for purpose')
  })

  it('uses the distinct goodwill band labels', () => {
    expect(bandFor('goodwill', 10).label).toBe('They will help you next year')
    expect(bandFor('goodwill', -20).label).toBe('You are a problem now')
  })

  it('bands are monotonic: higher value never gives a worse tier', () => {
    const values = [-30, -10, -5, 0, 3, 6, 20]
    let lastTier = 0
    for (const v of values) {
      const tier = bandFor('accuracy', v).tier
      expect(tier).toBeLessThanOrEqual(lastTier === 0 ? 3 : lastTier)
      lastTier = tier
    }
  })
})

describe('computeAxisSummaries', () => {
  it('reads the four shown axes straight from state.shown, and takes finalAccuracy as given', () => {
    const state = createInitialState(1)
    const next = {
      ...state,
      shown: { ...state.shown, timeliness: 3, downstream: -2, goodwill: 4, team_capacity: -6 },
    }
    const summaries = computeAxisSummaries(next, 7)
    const byAxis = Object.fromEntries(summaries.map((s) => [s.axis, s.value]))
    expect(byAxis).toEqual({ accuracy: 7, timeliness: 3, downstream: -2, goodwill: 4, team_capacity: -6 })
  })
})

describe('computeSelfCount', () => {
  it('counts only decisions whose chosen option currency is self', () => {
    const state = createInitialState(1)
    const withDecisions = {
      ...state,
      decisions: [
        { turnIndex: 1, cardId: 'card-a', optionId: 'a-high-impact' },
        { turnIndex: 2, cardId: 'card-b', optionId: 'b-self' },
        { turnIndex: 3, cardId: 'card-c', optionId: 'c-no-hidden-effect' },
      ],
    }
    expect(computeSelfCount(withDecisions, cards)).toEqual({ totalDecisions: 3, selfDecisions: 1 })
  })
})

describe('forecastTable', () => {
  it('renders shown/truth/error straight from history', () => {
    const state = createInitialState(1)
    const withHistory = {
      ...state,
      history: [
        { turnIndex: 0, turn: 'Handover' as const, shown: { ...state.shown }, truth: { ...state.truth } },
        {
          turnIndex: 1,
          turn: 'September' as const,
          shown: { ...state.shown, accuracy: 0 },
          truth: { ...state.truth, accuracy: 5 },
        },
      ],
    }
    const table = forecastTable(withHistory)
    expect(table[1]).toMatchObject({ turnIndex: 1, turn: 'September', shown: 0, truth: 5, error: -5 })
    expect(table[1].errorPercent).toBeCloseTo(-100)
  })

  it('leaves errorPercent null when truth is zero, to avoid dividing by it', () => {
    const state = createInitialState(1)
    const table = forecastTable(state)
    expect(table[0].errorPercent).toBeNull()
  })
})

describe('computeCounterfactuals', () => {
  const script = [
    { type: 'advance' as const },
    { type: 'decide' as const, cardId: 'card-a', optionId: 'a-high-impact' },
    { type: 'advance' as const },
    { type: 'decide' as const, cardId: 'card-b', optionId: 'b-medium-impact' },
    { type: 'advance' as const },
    { type: 'decide' as const, cardId: 'card-c', optionId: 'c-no-hidden-effect' },
  ]

  function buildState() {
    let state = createInitialState(1)
    // Mirror the script by hand so we get a real actionLog + turnIndex progression.
    for (const step of script) {
      state =
        step.type === 'advance'
          ? advanceTurn(state)
          : applyDecision(state, cards.find((c) => c.id === step.cardId)!, step.optionId)
    }
    return state
  }

  it('ranks by hidden impact and only returns entries with nonzero hidden effects', () => {
    const state = buildState()
    const results = computeCounterfactuals(1, cards, [], {}, state.actionLog, state.turnIndex, 3)
    // card-c's option has no hidden effects at all, so it should never appear.
    expect(results.some((r) => r.prompt === 'Prompt C')).toBe(false)
    // Highest impact (delta 5) should be first.
    expect(results[0].prompt).toBe('Prompt A')
    expect(results[0].deltas.accuracy).toBe(5)
  })

  it('the counterfactual delta matches the omitted decision\'s own hidden effect, in isolation', () => {
    const state = buildState()
    const results = computeCounterfactuals(1, cards, [], {}, state.actionLog, state.turnIndex, 3)
    const b = results.find((r) => r.prompt === 'Prompt B')
    expect(b?.deltas.accuracy).toBe(3)
  })

  it('produces a readable sentence including the metric delta', () => {
    const state = buildState()
    const results = computeCounterfactuals(1, cards, [], {}, state.actionLog, state.turnIndex, 1)
    const sentence = counterfactualSentence(results[0])
    expect(sentence).toContain('High impact choice')
    expect(sentence).toContain('Prompt A')
    // The option added +5 accuracy, so without it accuracy would be lower.
    expect(sentence).toContain('accuracy would have finished 5 points lower')
  })

  it('returns an empty array when nothing in the log has a nonzero hidden effect', () => {
    let state = createInitialState(1)
    state = advanceTurn(state)
    state = applyDecision(state, cards.find((c) => c.id === 'card-c')!, 'c-no-hidden-effect')
    const results = computeCounterfactuals(1, cards, [], {}, state.actionLog, state.turnIndex, 3)
    expect(results).toEqual([])
  })

  it('is deterministic: running it twice on the same inputs gives the same result', () => {
    const state = buildState()
    const a = computeCounterfactuals(1, cards, [], {}, state.actionLog, state.turnIndex, 3)
    const b = computeCounterfactuals(1, cards, [], {}, state.actionLog, state.turnIndex, 3)
    expect(a).toEqual(b)
  })
})

describe('counterfactuals including a credibility answer', () => {
  const credibilityDefs: CredibilityQueryDefinition[] = [
    {
      id: 'q1',
      turn: 'September',
      query: 'Why is this number odd?',
      truth: 'x',
      options: [
        {
          id: 'answer-well',
          label: 'Answer it properly',
          durability: 'high',
          shown: [],
          hidden: [{ metric: 'accuracy', delta: 4, delayTurns: 0 }],
        },
      ],
    },
  ]

  it('includes a credibility answer in the ranking and can omit it in the replay', () => {
    let state = createInitialState(1, { credibility: createCredibilityPool(credibilityDefs) })
    state = advanceTurn(state)
    state = answerCredibilityQuery(state, 'q1', 'answer-well')

    const results = computeCounterfactuals(
      1,
      [],
      credibilityDefs,
      { credibility: createCredibilityPool(credibilityDefs) },
      state.actionLog,
      state.turnIndex,
      3,
    )
    expect(results).toHaveLength(1)
    expect(results[0].prompt).toBe('Why is this number odd?')
    expect(results[0].deltas.accuracy).toBe(4)
  })
})
