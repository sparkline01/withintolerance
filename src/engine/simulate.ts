import { createErrorPool, type ErrorPool, type ErrorResolution } from './cascade'
import { advanceTurn, applyDecision, createInitialState, resolveError } from './state'
import type { DecisionCard, GameState } from './types'

export type ScriptStep =
  | { type: 'decide'; cardId: string; optionId: string }
  | { type: 'advance' }
  | { type: 'resolve'; errorId: string; resolution: ErrorResolution }

/**
 * Replay an ordered script of decisions, turn-advances, and error
 * resolutions from a fresh state. This is the shape the determinism
 * guarantee is built on: the same (seed, cards, errorPool, script) must
 * always produce the same GameState, and the counterfactual re-simulation
 * (spec §12.3) is just this function called again with one script entry
 * removed or swapped.
 */
export function runScript(
  seed: number,
  cards: readonly DecisionCard[],
  script: readonly ScriptStep[],
  errorPool: ErrorPool = createErrorPool([]),
): GameState {
  const cardsById = new Map(cards.map((c) => [c.id, c]))
  let state = createInitialState(seed, errorPool)

  for (const step of script) {
    if (step.type === 'decide') {
      const card = cardsById.get(step.cardId)
      if (!card) throw new Error(`Unknown card "${step.cardId}"`)
      state = applyDecision(state, card, step.optionId)
    } else if (step.type === 'resolve') {
      state = resolveError(state, step.errorId, step.resolution)
    } else {
      state = advanceTurn(state)
    }
  }

  return state
}
