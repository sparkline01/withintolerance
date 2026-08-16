import { createErrorPool, type ErrorPool, type ErrorResolution } from './cascade'
import { createCredibilityPool, type CredibilityPool } from './credibility'
import { createDependencyPool, type DependencyPool } from './dependencies'
import { createSignoffState, type SignoffState } from './signoff'
import {
  advanceTurn,
  answerCredibilityQuery,
  applyDecision,
  chaseDependency,
  createInitialState,
  escalateDependency,
  resolveError,
} from './state'
import type { DecisionCard, GameState } from './types'

export type ScriptStep =
  | { type: 'decide'; cardId: string; optionId: string }
  | { type: 'advance' }
  | { type: 'resolve'; errorId: string; resolution: ErrorResolution }
  | { type: 'chase'; dependencyId: string }
  | { type: 'escalate'; dependencyId: string }
  | { type: 'answer'; queryId: string; optionId: string }

export interface InitialPools {
  errors?: ErrorPool
  dependencies?: DependencyPool
  credibility?: CredibilityPool
  signoff?: SignoffState
}

/**
 * Replay an ordered script of decisions, turn-advances, error resolutions,
 * dependency actions, and credibility answers from a fresh state. This is
 * the shape the determinism guarantee is built on: the same (seed, cards,
 * pools, script) must always produce the same GameState, and the
 * counterfactual re-simulation (spec §12.3) is just this function called
 * again with one script entry removed or swapped.
 */
export function runScript(
  seed: number,
  cards: readonly DecisionCard[],
  script: readonly ScriptStep[],
  pools: InitialPools = {},
): GameState {
  const cardsById = new Map(cards.map((c) => [c.id, c]))
  let state = createInitialState(seed, {
    errors: pools.errors ?? createErrorPool([]),
    dependencies: pools.dependencies ?? createDependencyPool([]),
    credibility: pools.credibility ?? createCredibilityPool([]),
    signoff: pools.signoff ?? createSignoffState(),
  })

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
    } else {
      state = advanceTurn(state)
    }
  }

  return state
}
