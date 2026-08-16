import { describe, expect, it } from 'vitest'
import {
  buildCredibilityReturnsScreen,
  buildGoodThingScreen,
  buildMetricPublishesScreen,
  buildRecurringDebtScreen,
  computeCoda,
  credibilityReturnsSentence,
  findGoodThingCandidates,
  goodThingSentence,
  metricPublishesSentence,
  recurringDebtSentence,
  selectResurfacingAnswer,
} from './coda'
import { answerQuery, createCredibilityPool, type CredibilityQueryDefinition } from './credibility'
import { createRng } from './prng'
import { applyDecision, createInitialState } from './state'
import type { DecisionCard } from './types'

const cards: DecisionCard[] = [
  {
    id: 'card-fix',
    turn: 'October',
    trigger: 'scheduled',
    prompt: 'A source-fixable problem',
    context: 'x',
    options: [
      {
        id: 'fix-properly',
        label: 'Fix it properly',
        currency: 'capacity',
        teaser: 'x',
        sourceFix: true,
        shown: [],
        hidden: [],
      },
      {
        id: 'suppress-it',
        label: 'Suppress it',
        currency: 'accuracy',
        teaser: 'x',
        shown: [],
        hidden: [],
      },
    ],
  },
  {
    id: 'card-dependency',
    turn: 'November',
    trigger: 'scheduled',
    prompt: 'A dependency problem',
    context: 'x',
    options: [
      {
        id: 'complete-dependency',
        label: 'Resolve it outright',
        currency: 'capacity',
        teaser: 'x',
        shown: [],
        hidden: [],
        dependencyAction: { dependencyId: 'dep-x', action: 'complete' },
      },
    ],
  },
]

describe('buildMetricPublishesScreen', () => {
  it('reports the gap between shown and final accuracy', () => {
    const state = createInitialState(1)
    const next = { ...state, shown: { ...state.shown, accuracy: 0 }, truth: { ...state.truth, accuracy: -12 } }
    expect(buildMetricPublishesScreen(next).gap).toBe(12)
  })
})

describe('selectResurfacingAnswer', () => {
  const definitions: CredibilityQueryDefinition[] = [
    {
      id: 'q-high',
      turn: 'February',
      query: 'x',
      truth: 'x',
      options: [{ id: 'o', label: 'high durability answer', durability: 'high', shown: [], hidden: [] }],
    },
    {
      id: 'q-low',
      turn: 'March',
      query: 'x',
      truth: 'x',
      options: [{ id: 'o', label: 'low durability answer', durability: 'low', shown: [], hidden: [] }],
    },
  ]

  it('never resurfaces a high-durability answer, regardless of the roll', () => {
    let pool = createCredibilityPool([definitions[0]])
    pool = answerQuery(pool, 'q-high', 'o')
    // Try many seeds — high durability has 0 probability, so it should never hit.
    for (let seed = 0; seed < 50; seed++) {
      expect(selectResurfacingAnswer(createRng(seed), pool)).toBeNull()
    }
  })

  it('sometimes resurfaces a low-durability answer across a range of seeds', () => {
    let pool = createCredibilityPool([definitions[1]])
    pool = answerQuery(pool, 'q-low', 'o')
    const outcomes = new Set<boolean>()
    for (let seed = 0; seed < 50; seed++) {
      outcomes.add(selectResurfacingAnswer(createRng(seed), pool) !== null)
    }
    expect(outcomes.has(true)).toBe(true)
    expect(outcomes.has(false)).toBe(true)
  })

  it('returns null when nothing has been answered', () => {
    const pool = createCredibilityPool(definitions)
    expect(selectResurfacingAnswer(createRng(1), pool)).toBeNull()
  })
})

describe('buildCredibilityReturnsScreen', () => {
  it('reports found: false when nothing resurfaces', () => {
    const pool = createCredibilityPool([])
    const screen = buildCredibilityReturnsScreen(createRng(1), pool)
    expect(screen.found).toBe(false)
  })
})

describe('buildRecurringDebtScreen', () => {
  it('reads truth.recurring_debt directly', () => {
    const state = createInitialState(1)
    const next = { ...state, truth: { ...state.truth, recurring_debt: 4 } }
    expect(buildRecurringDebtScreen(next).debtCount).toBe(4)
  })
})

describe('findGoodThingCandidates', () => {
  it('finds decisions where the option is a sourceFix', () => {
    let state = createInitialState(1)
    state = { ...state, decisions: [{ turnIndex: 2, cardId: 'card-fix', optionId: 'fix-properly' }] }
    const candidates = findGoodThingCandidates(state, cards)
    expect(candidates).toEqual([{ cardPrompt: 'A source-fixable problem', optionLabel: 'Fix it properly' }])
  })

  it('finds decisions where the option directly completes a dependency', () => {
    let state = createInitialState(1)
    state = { ...state, decisions: [{ turnIndex: 3, cardId: 'card-dependency', optionId: 'complete-dependency' }] }
    const candidates = findGoodThingCandidates(state, cards)
    expect(candidates).toEqual([{ cardPrompt: 'A dependency problem', optionLabel: 'Resolve it outright' }])
  })

  it('excludes a suppressed (extract-fix-style) decision', () => {
    let state = createInitialState(1)
    state = { ...state, decisions: [{ turnIndex: 2, cardId: 'card-fix', optionId: 'suppress-it' }] }
    expect(findGoodThingCandidates(state, cards)).toEqual([])
  })
})

describe('buildGoodThingScreen', () => {
  it('reports found: false when no qualifying decision exists', () => {
    const state = createInitialState(1)
    const screen = buildGoodThingScreen(createRng(1), state, cards)
    expect(screen.found).toBe(false)
  })

  it('picks a genuine candidate when one exists', () => {
    let state = createInitialState(1)
    state = { ...state, decisions: [{ turnIndex: 2, cardId: 'card-fix', optionId: 'fix-properly' }] }
    const screen = buildGoodThingScreen(createRng(1), state, cards)
    expect(screen.found).toBe(true)
    expect(screen.cardPrompt).toBe('A source-fixable problem')
  })
})

describe('computeCoda', () => {
  it('is deterministic for the same seed and state', () => {
    let state = createInitialState(1)
    state = applyDecision(state, cards[0], 'fix-properly')
    const a = computeCoda(42, state, cards)
    const b = computeCoda(42, state, cards)
    expect(a).toEqual(b)
  })

  it('assembles all four screens', () => {
    const state = createInitialState(1)
    const coda = computeCoda(1, state, cards)
    expect(coda.metricPublishes.type).toBe('metric_publishes')
    expect(coda.credibilityReturns.type).toBe('credibility_returns')
    expect(coda.recurringDebt.type).toBe('recurring_debt')
    expect(coda.goodThing.type).toBe('good_thing')
  })
})

describe('sentence templates', () => {
  it('metricPublishesSentence includes the gap', () => {
    expect(metricPublishesSentence({ type: 'metric_publishes', gap: 9 })).toContain('9 points')
  })

  it('metricPublishesSentence uses the singular for a gap of exactly 1', () => {
    const sentence = metricPublishesSentence({ type: 'metric_publishes', gap: 1 })
    expect(sentence).toContain('1 point ')
    expect(sentence).not.toContain('1 points')
  })

  it('credibilityReturnsSentence branches on found', () => {
    expect(credibilityReturnsSentence({ type: 'credibility_returns', found: false })).toContain('held')
    expect(
      credibilityReturnsSentence({
        type: 'credibility_returns',
        found: true,
        query: 'Why is X down?',
        yourAnswer: 'A sector trend',
      }),
    ).toContain('Why is X down?')
  })

  it('recurringDebtSentence branches on debtCount', () => {
    expect(recurringDebtSentence({ type: 'recurring_debt', debtCount: 0 })).toContain("didn't leave")
    expect(recurringDebtSentence({ type: 'recurring_debt', debtCount: 3 })).toContain('3 of them')
  })

  it('goodThingSentence branches on found, and never undercuts the positive case with a negation', () => {
    const positive = goodThingSentence({
      type: 'good_thing',
      found: true,
      cardPrompt: 'The entry qualifications are not coded.',
      optionLabel: "Book a room and work through them with Ruth's team",
    })
    expect(positive).toContain("Book a room and work through them with Ruth's team")
    expect(positive.toLowerCase()).not.toContain('but')
  })
})
