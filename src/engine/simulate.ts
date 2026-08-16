import { advanceTurn, applyDecision, createInitialState } from './state'
import type { DecisionCard, GameState } from './types'

export type ScriptStep =
  | { type: 'decide'; cardId: string; optionId: string }
  | { type: 'advance' }

/**
 * Replay an ordered script of decisions and turn-advances from a fresh state.
 * This is the shape the determinism guarantee is built on: the same
 * (seed, cards, script) must always produce the same GameState, and the
 * counterfactual re-simulation (spec §12.3) is just this function called
 * again with one script entry removed or swapped.
 */
export function runScript(
  seed: number,
  cards: readonly DecisionCard[],
  script: readonly ScriptStep[],
): GameState {
  const cardsById = new Map(cards.map((c) => [c.id, c]))
  let state = createInitialState(seed)

  for (const step of script) {
    if (step.type === 'decide') {
      const card = cardsById.get(step.cardId)
      if (!card) throw new Error(`Unknown card "${step.cardId}"`)
      state = applyDecision(state, card, step.optionId)
    } else {
      state = advanceTurn(state)
    }
  }

  return state
}
