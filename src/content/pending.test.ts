import { describe, expect, it } from 'vitest'
import { createCredibilityPool, type CredibilityQueryDefinition } from '../engine/credibility'
import { createInitialState } from '../engine/state'
import type { DecisionCard, FlavorEvent } from '../engine/types'
import { pendingCredibilityQueries, pendingDecisionCards, pendingFlavorEvents } from './pending'

const attributedEvent: FlavorEvent = {
  id: 'evt-attributed',
  turn: 'December',
  type: 'flavor_event',
  attributedTo: 'some-card:option-a',
  headline: 'x',
  body: 'x',
  effects: [],
}

const ambientEvent: FlavorEvent = {
  id: 'evt-ambient',
  turn: 'December',
  type: 'flavor_event',
  headline: 'x',
  body: 'x',
  effects: [],
}

const card: DecisionCard = {
  id: 'some-card',
  turn: 'October',
  trigger: 'scheduled',
  prompt: 'x',
  context: 'x',
  options: [
    { id: 'option-a', label: 'x', currency: 'capacity', teaser: 'x', shown: [], hidden: [] },
    { id: 'option-b', label: 'x', currency: 'accuracy', teaser: 'x', shown: [], hidden: [] },
  ],
}

function stateAtDecember(decisions: Array<{ cardId: string; optionId: string }> = []) {
  let state = createInitialState(1)
  state = { ...state, turn: 'December', turnIndex: 4 }
  for (const d of decisions) {
    state = {
      ...state,
      decisions: [...state.decisions, { turnIndex: 2, cardId: d.cardId, optionId: d.optionId }],
    }
  }
  return state
}

describe('pendingFlavorEvents', () => {
  it('does NOT show an attributed event if the player never made that specific decision', () => {
    const state = stateAtDecember() // no decisions at all
    const pending = pendingFlavorEvents([attributedEvent], state)
    expect(pending).toHaveLength(0)
  })

  it('does NOT show an attributed event if the player chose a DIFFERENT option on the same card', () => {
    const state = stateAtDecember([{ cardId: 'some-card', optionId: 'option-b' }])
    const pending = pendingFlavorEvents([attributedEvent], state)
    expect(pending).toHaveLength(0)
  })

  it('DOES show an attributed event once the exact option was chosen', () => {
    const state = stateAtDecember([{ cardId: 'some-card', optionId: 'option-a' }])
    const pending = pendingFlavorEvents([attributedEvent], state)
    expect(pending.map((e) => e.id)).toEqual(['evt-attributed'])
  })

  it('always shows an ambient (non-attributed) event on its turn', () => {
    const state = stateAtDecember()
    const pending = pendingFlavorEvents([ambientEvent], state)
    expect(pending.map((e) => e.id)).toEqual(['evt-ambient'])
  })

  it('does not show an event whose turn does not match', () => {
    const state = createInitialState(1) // Handover, not December
    const pending = pendingFlavorEvents([ambientEvent], state)
    expect(pending).toHaveLength(0)
  })

  it('does not re-show an already-acknowledged event', () => {
    let state = stateAtDecember()
    state = { ...state, acknowledgedFlavorEvents: ['evt-ambient'] }
    const pending = pendingFlavorEvents([ambientEvent], state)
    expect(pending).toHaveLength(0)
  })
})

describe('pendingDecisionCards', () => {
  const scheduledCard: DecisionCard = { ...card, id: 'sched', trigger: 'scheduled' }
  const conditionalCard: DecisionCard = {
    ...card,
    id: 'cond',
    trigger: 'conditional',
    requires: ['some_flag'],
  }

  it('always includes a scheduled card on its turn', () => {
    let state = createInitialState(1)
    state = { ...state, turn: 'October' }
    expect(pendingDecisionCards([scheduledCard], state).map((c) => c.id)).toEqual(['sched'])
  })

  it('excludes a conditional card whose flag is not set', () => {
    let state = createInitialState(1)
    state = { ...state, turn: 'October' }
    expect(pendingDecisionCards([conditionalCard], state)).toHaveLength(0)
  })

  it('includes a conditional card once its flag is set', () => {
    let state = createInitialState(1)
    state = { ...state, turn: 'October', flags: new Set(['some_flag']) }
    expect(pendingDecisionCards([conditionalCard], state).map((c) => c.id)).toEqual(['cond'])
  })

  it('excludes a card already decided this turn', () => {
    let state = createInitialState(1)
    state = {
      ...state,
      turn: 'October',
      turnIndex: 2,
      decisions: [{ turnIndex: 2, cardId: 'sched', optionId: 'option-a' }],
    }
    expect(pendingDecisionCards([scheduledCard], state)).toHaveLength(0)
  })
})

describe('pendingCredibilityQueries', () => {
  const query: CredibilityQueryDefinition = {
    id: 'q1',
    turn: 'February',
    query: 'x',
    truth: 'x',
    options: [{ id: 'o1', label: 'x', durability: 'high', shown: [], hidden: [] }],
  }

  it('shows an unanswered query on its turn', () => {
    let state = createInitialState(1, { credibility: createCredibilityPool([query]) })
    state = { ...state, turn: 'February' }
    expect(pendingCredibilityQueries([query], state).map((q) => q.id)).toEqual(['q1'])
  })

  it('does not show an already-answered query', () => {
    let state = createInitialState(1, { credibility: createCredibilityPool([query]) })
    state = {
      ...state,
      turn: 'February',
      credibility: { definitions: [query], answers: { q1: 'o1' } },
    }
    expect(pendingCredibilityQueries([query], state)).toHaveLength(0)
  })
})
