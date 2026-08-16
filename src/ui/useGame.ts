import { useReducer } from 'react'
import type { ErrorResolution } from '../engine/cascade'
import type { InitialPools } from '../engine/simulate'
import {
  advanceTurn,
  answerCredibilityQuery,
  applyDecision,
  applyFlavorEvent,
  chaseDependency,
  createInitialState,
  escalateDependency,
  resolveError,
} from '../engine/state'
import type { DecisionCard, FlavorEvent, GameState } from '../engine/types'

type Action =
  | { type: 'decide'; card: DecisionCard; optionId: string }
  | { type: 'advance' }
  | { type: 'resolveError'; errorId: string; resolution: ErrorResolution }
  | { type: 'chaseDependency'; dependencyId: string }
  | { type: 'escalateDependency'; dependencyId: string }
  | { type: 'answerCredibilityQuery'; queryId: string; optionId: string }
  | { type: 'acknowledgeFlavorEvent'; event: FlavorEvent }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'decide':
      return applyDecision(state, action.card, action.optionId)
    case 'advance':
      return advanceTurn(state)
    case 'resolveError':
      return resolveError(state, action.errorId, action.resolution)
    case 'chaseDependency':
      return chaseDependency(state, action.dependencyId)
    case 'escalateDependency':
      return escalateDependency(state, action.dependencyId)
    case 'answerCredibilityQuery':
      return answerCredibilityQuery(state, action.queryId, action.optionId)
    case 'acknowledgeFlavorEvent':
      return applyFlavorEvent(state, action.event)
  }
}

/**
 * Thin React binding over the pure engine (src/engine). The reducer itself
 * does no work beyond dispatching to the same functions the determinism
 * tests exercise directly, so nothing UI-specific leaks into engine logic.
 */
export function useGame(seed: number, pools: InitialPools) {
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialState(seed, pools))

  return {
    state,
    decide: (card: DecisionCard, optionId: string) => dispatch({ type: 'decide', card, optionId }),
    advance: () => dispatch({ type: 'advance' }),
    resolveErrorAction: (errorId: string, resolution: ErrorResolution) =>
      dispatch({ type: 'resolveError', errorId, resolution }),
    chaseDependencyAction: (dependencyId: string) => dispatch({ type: 'chaseDependency', dependencyId }),
    escalateDependencyAction: (dependencyId: string) =>
      dispatch({ type: 'escalateDependency', dependencyId }),
    answerCredibilityQueryAction: (queryId: string, optionId: string) =>
      dispatch({ type: 'answerCredibilityQuery', queryId, optionId }),
    acknowledgeFlavorEvent: (event: FlavorEvent) => dispatch({ type: 'acknowledgeFlavorEvent', event }),
  }
}
