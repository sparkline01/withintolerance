import { useReducer } from 'react'
import type { ErrorPool, ErrorResolution } from '../engine/cascade'
import { advanceTurn, applyDecision, createInitialState, resolveError } from '../engine/state'
import type { DecisionCard, GameState } from '../engine/types'

type Action =
  | { type: 'decide'; card: DecisionCard; optionId: string }
  | { type: 'advance' }
  | { type: 'resolveError'; errorId: string; resolution: ErrorResolution }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'decide':
      return applyDecision(state, action.card, action.optionId)
    case 'advance':
      return advanceTurn(state)
    case 'resolveError':
      return resolveError(state, action.errorId, action.resolution)
  }
}

/**
 * Thin React binding over the pure engine (src/engine). The reducer itself
 * does no work beyond dispatching to the same functions the determinism
 * tests exercise directly, so nothing UI-specific leaks into engine logic.
 */
export function useGame(seed: number, errorPool: ErrorPool) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInitialState(seed, errorPool),
  )

  return {
    state,
    decide: (card: DecisionCard, optionId: string) => dispatch({ type: 'decide', card, optionId }),
    advance: () => dispatch({ type: 'advance' }),
    resolveErrorAction: (errorId: string, resolution: ErrorResolution) =>
      dispatch({ type: 'resolveError', errorId, resolution }),
  }
}
