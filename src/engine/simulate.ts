import type { ErrorResolution } from './cascade'
import {
  advanceTurn,
  answerCredibilityQuery,
  applyDecision,
  applyFlavorEvent,
  chaseDependency,
  createInitialState,
  escalateDependency,
  type InitialPools,
  resolveError,
} from './state'
import type { DecisionCard, FlavorEvent, GameState } from './types'

export type ScriptStep =
  | { type: 'decide'; cardId: string; optionId: string }
  | { type: 'advance' }
  | { type: 'resolve'; errorId: string; resolution: ErrorResolution }
  | { type: 'chase'; dependencyId: string }
  | { type: 'escalate'; dependencyId: string }
  | { type: 'answer'; queryId: string; optionId: string }
  | { type: 'acknowledge'; eventId: string }

export type { InitialPools }

/**
 * Replay an ordered script of decisions, turn-advances, error resolutions,
 * dependency actions, credibility answers, and flavor-event acknowledgements
 * from a fresh state. This is the shape the determinism guarantee is built
 * on: the same (seed, cards, pools, script) must always produce the same
 * GameState, and the counterfactual re-simulation (spec §12.3) is just this
 * function called again with one script entry removed or swapped.
 */
export function runScript(
  seed: number,
  cards: readonly DecisionCard[],
  script: readonly ScriptStep[],
  pools: InitialPools = {},
  flavorEvents: readonly FlavorEvent[] = [],
): GameState {
  const cardsById = new Map(cards.map((c) => [c.id, c]))
  const eventsById = new Map(flavorEvents.map((e) => [e.id, e]))
  let state = createInitialState(seed, pools)

  for (const step of script) {
    if (step.type === 'decide') {
      const card = cardsById.get(step.cardId)
      if (!card) throw new Error(`Unknown card "${step.cardId}"`)
      state = applyDecision(state, card, step.optionId)
    } else if (step.type === 'resolve') {
      state = resolveError(state, step.errorId, step.resolution)
    } else if (step.type === 'chase') {
      state = chaseDependency(state, step.dependencyId)
    } else if (step.type === 'escalate') {
      state = escalateDependency(state, step.dependencyId)
    } else if (step.type === 'answer') {
      state = answerCredibilityQuery(state, step.queryId, step.optionId)
    } else if (step.type === 'acknowledge') {
      const event = eventsById.get(step.eventId)
      if (!event) throw new Error(`Unknown flavor event "${step.eventId}"`)
      state = applyFlavorEvent(state, event)
    } else {
      state = advanceTurn(state)
    }
  }

  return state
}
