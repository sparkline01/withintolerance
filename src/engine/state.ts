import {
  createErrorPool,
  type ErrorPool,
  type ErrorResolution,
  resolveError as resolveErrorInPool,
} from './cascade'
import {
  answerQuery as answerQueryInPool,
  createCredibilityPool,
  type CredibilityPool,
} from './credibility'
import {
  chaseDependency as chaseDependencyInPool,
  createDependencyPool,
  degradeDependencies,
  type DependencyPool,
  escalateDependency as escalateDependencyInPool,
} from './dependencies'
import {
  advanceEscalation,
  createSignoffState,
  deriveReadiness,
  STANDING_WEEKLY_CAPACITY_COST,
  type SignoffState,
} from './signoff'
import {
  DEADLINE_TURN_INDEX,
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
    dependencies: {
      definitions: state.dependencies.definitions,
      runtime: { ...state.dependencies.runtime },
    },
    credibility: { definitions: state.credibility.definitions, answers: { ...state.credibility.answers } },
    signoff: { ...state.signoff },
    flags: new Set(state.flags),
    history: state.history.slice(),
  }
}

export function createInitialState(
  seed: number,
  pools: {
    errors?: ErrorPool
    dependencies?: DependencyPool
    credibility?: CredibilityPool
    signoff?: SignoffState
  } = {},
): GameState {
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
    errors: pools.errors ?? createErrorPool([]),
    dependencies: pools.dependencies ?? createDependencyPool([]),
    credibility: pools.credibility ?? createCredibilityPool([]),
    signoff: pools.signoff ?? createSignoffState(),
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

export function chaseDependency(state: GameState, dependencyId: string): GameState {
  const next = cloneState(state)
  next.dependencies = chaseDependencyInPool(next.dependencies, dependencyId)
  return next
}

export function escalateDependency(state: GameState, dependencyId: string): GameState {
  const next = cloneState(state)
  next.dependencies = escalateDependencyInPool(next.dependencies, dependencyId)
  return next
}

export function answerCredibilityQuery(
  state: GameState,
  queryId: string,
  optionId: string,
): GameState {
  const next = cloneState(state)
  next.credibility = answerQueryInPool(next.credibility, queryId, optionId)
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
 * Move to the next turn: land scheduled effects, degrade untouched
 * dependencies, apply the escalation ladder's standing-weekly cost, check
 * whether a new rung is triggered, and log the resulting snapshot to
 * history (spec §5.2, §5.5, §7.3, §12.4).
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

  next.dependencies = degradeDependencies(next.dependencies)

  // Rung 3+ ("standing weekly"): costs capacity every remaining turn (§7.3).
  if (next.signoff.escalationRung >= 3) {
    next.shown.team_capacity -= STANDING_WEEKLY_CAPACITY_COST
  }

  // Past the deadline and not yet fully ready: the ladder advances one rung
  // per turn. Readiness of 1 means fully ready — no further escalation.
  if (nextIndex > DEADLINE_TURN_INDEX) {
    const readiness = deriveReadiness({
      errors: next.errors,
      credibility: next.credibility,
      dependencies: next.dependencies,
    })
    if (readiness < 1) {
      next.signoff = advanceEscalation(next.signoff)
    }
  }

  next.history.push({
    turnIndex: next.turnIndex,
    turn: next.turn,
    shown: cloneMetrics(next.shown),
    truth: cloneMetrics(next.truth),
  })

  return next
}
