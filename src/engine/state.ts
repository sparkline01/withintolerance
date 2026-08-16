import {
  createErrorPool,
  type ErrorPool,
  type ErrorResolution,
  resolveError as resolveErrorInPool,
} from './cascade'
import {
  type DecisionCard,
  type GameState,
  type MetricRecord,
  TURN_SEQUENCE,
  zeroMetrics,
} from './types'

function cloneMetrics(record: MetricRecord): MetricRecord {
  return { ...record }
}

/**
 * Deep-ish clone of the parts of GameState that get mutated-in-place by
 * naive code. Every engine function returns a new state rather than
 * mutating its input, both for React-friendliness and because the
 * counterfactual re-simulation (spec §12.3) depends on being able to
 * replay from any point without earlier runs bleeding into later ones.
 */
function cloneState(state: GameState): GameState {
  return {
    seed: state.seed,
    turnIndex: state.turnIndex,
    turn: state.turn,
    decisions: state.decisions.slice(),
    scheduledEffects: state.scheduledEffects.slice(),
    shown: cloneMetrics(state.shown),
    truth: cloneMetrics(state.truth),
    errors: { definitions: state.errors.definitions, resolutions: { ...state.errors.resolutions } },
    flags: new Set(state.flags),
    history: state.history.slice(),
  }
}

export function createInitialState(seed: number, errorPool: ErrorPool = createErrorPool([])): GameState {
  const shown = zeroMetrics()
  const truth = zeroMetrics()
  return {
    seed,
    turnIndex: 0,
    turn: TURN_SEQUENCE[0],
    decisions: [],
    scheduledEffects: [],
    shown,
    truth,
    errors: errorPool,
    flags: new Set(),
    history: [
      {
        turnIndex: 0,
        turn: TURN_SEQUENCE[0],
        shown: cloneMetrics(shown),
        truth: cloneMetrics(truth),
      },
    ],
  }
}

/** Resolve one error in the pool (spec §6). Does not touch shown/truth directly — see cascade.ts for why. */
export function resolveError(
  state: GameState,
  errorId: string,
  resolution: ErrorResolution,
): GameState {
  const next = cloneState(state)
  next.errors = resolveErrorInPool(next.errors, errorId, resolution)
  return next
}

/**
 * Apply one chosen option from one card. Immediate effects (delayTurns: 0)
 * land in `shown`/`truth` straight away; everything else is pushed onto the
 * scheduler and applied later by `advanceTurn` (spec §5.2).
 */
export function applyDecision(
  state: GameState,
  card: DecisionCard,
  optionId: string,
): GameState {
  const option = card.options.find((o) => o.id === optionId)
  if (!option) {
    throw new Error(`Unknown option "${optionId}" on card "${card.id}"`)
  }

  const next = cloneState(state)
  const attributedTo = `${card.id}:${option.id}`

  for (const effect of option.shown) {
    if (effect.delayTurns === 0) {
      next.shown[effect.metric] += effect.delta
    } else {
      next.scheduledEffects.push({
        metric: effect.metric,
        delta: effect.delta,
        landingTurnIndex: next.turnIndex + effect.delayTurns,
        channel: 'shown',
        attributedTo,
      })
    }
  }

  for (const effect of option.hidden) {
    if (effect.delayTurns === 0) {
      next.truth[effect.metric] += effect.delta
    } else {
      next.scheduledEffects.push({
        metric: effect.metric,
        delta: effect.delta,
        landingTurnIndex: next.turnIndex + effect.delayTurns,
        channel: 'hidden',
        attributedTo,
      })
    }
  }

  for (const flag of option.setsFlags ?? []) {
    next.flags.add(flag)
  }

  next.decisions.push({
    turnIndex: state.turnIndex,
    cardId: card.id,
    optionId: option.id,
  })

  // Overwrite this turn's just-pushed history snapshot rather than appending,
  // since a turn can carry several decisions before advancing.
  next.history[next.history.length - 1] = {
    turnIndex: next.turnIndex,
    turn: next.turn,
    shown: cloneMetrics(next.shown),
    truth: cloneMetrics(next.truth),
  }

  return next
}

/**
 * Move to the next turn, applying any effects scheduled to land on it and
 * logging the resulting shown/truth snapshot to history (spec §5.2, §12.4).
 */
export function advanceTurn(state: GameState): GameState {
  const nextIndex = state.turnIndex + 1
  if (nextIndex >= TURN_SEQUENCE.length) {
    throw new Error(
      'advanceTurn called past the end of TURN_SEQUENCE — the finale module takes over from here (spec §10)',
    )
  }

  const next = cloneState(state)
  next.turnIndex = nextIndex
  next.turn = TURN_SEQUENCE[nextIndex]

  const landing = next.scheduledEffects.filter((e) => e.landingTurnIndex === nextIndex)
  next.scheduledEffects = next.scheduledEffects.filter((e) => e.landingTurnIndex !== nextIndex)

  for (const effect of landing) {
    const bucket = effect.channel === 'shown' ? next.shown : next.truth
    bucket[effect.metric] += effect.delta
  }

  next.history.push({
    turnIndex: next.turnIndex,
    turn: next.turn,
    shown: cloneMetrics(next.shown),
    truth: cloneMetrics(next.truth),
  })

  return next
}
