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
  completeDependency as completeDependencyInPool,
  createDependencyPool,
  degradeDependencies,
  type DependencyPool,
  escalateDependency as escalateDependencyInPool,
} from './dependencies'
import type { HandoverVariant } from './handover'
import {
  adjustConfidence,
  advanceEscalation,
  createSignoffState,
  deriveReadiness,
  STANDING_WEEKLY_CAPACITY_COST,
  type SignoffState,
} from './signoff'
import {
  DEADLINE_TURN_INDEX,
  type DecisionCard,
  type DependencyAction,
  type Effect,
  type FlavorEvent,
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
    acknowledgedFlavorEvents: state.acknowledgedFlavorEvents.slice(),
    flags: new Set(state.flags),
    history: state.history.slice(),
  }
}

export interface InitialPools {
  errors?: ErrorPool
  dependencies?: DependencyPool
  credibility?: CredibilityPool
  signoff?: SignoffState
  initialFlags?: string[]
  handover?: HandoverVariant
}

export function createInitialState(seed: number, pools: InitialPools = {}): GameState {
  const shown = zeroMetrics()
  const truth = zeroMetrics()

  let dependencies = pools.dependencies ?? createDependencyPool([])
  let signoff = pools.signoff ?? createSignoffState()
  const flags = new Set(pools.initialFlags ?? [])

  const handover = pools.handover
  if (handover) {
    signoff = createSignoffState(handover.initialConfidence)
    truth.recurring_debt = handover.initialRecurringDebt
    for (const flag of handover.latentFlags) flags.add(flag)
    if (handover.dependencyReadinessOverrides) {
      const runtime = { ...dependencies.runtime }
      for (const [depId, readiness] of Object.entries(handover.dependencyReadinessOverrides)) {
        if (runtime[depId]) runtime[depId] = { ...runtime[depId], readiness }
      }
      dependencies = { definitions: dependencies.definitions, runtime }
    }
  }

  return {
    seed,
    turnIndex: 0,
    turn: TURN_SEQUENCE[0],
    decisions: [],
    scheduledEffects: [],
    shown,
    truth,
    errors: pools.errors ?? createErrorPool([]),
    dependencies,
    credibility: pools.credibility ?? createCredibilityPool([]),
    signoff,
    acknowledgedFlavorEvents: [],
    flags,
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

/**
 * Shared by applyDecision, answerCredibilityQuery, and applyFlavorEvent: an
 * immediate effect (delayTurns: 0) lands straight away, anything else is
 * scheduled (spec §5.2). Mutates the already-cloned `next` in place — every
 * caller owns its own clone, so this never touches caller-visible state.
 */
function applyEffects(
  next: GameState,
  shownEffects: Effect[],
  hiddenEffects: Effect[],
  attributedTo: string,
): void {
  for (const effect of shownEffects) {
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

  for (const effect of hiddenEffects) {
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
}

function applyDependencyAction(pool: DependencyPool, action: DependencyAction): DependencyPool {
  switch (action.action) {
    case 'chase':
      return chaseDependencyInPool(pool, action.dependencyId)
    case 'escalate':
      return escalateDependencyInPool(pool, action.dependencyId)
    case 'complete':
      return completeDependencyInPool(pool, action.dependencyId)
  }
}

/** Set once an audit branch (spec §9.2) is resolved and its process change takes hold. */
export const AUDIT_ACTIVE_FLAG = 'audit_active'
const AUDIT_SOURCE_FIX_SURCHARGE = 1

function snapshotHistory(next: GameState): void {
  next.history[next.history.length - 1] = {
    turnIndex: next.turnIndex,
    turn: next.turn,
    shown: cloneMetrics(next.shown),
    truth: cloneMetrics(next.truth),
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

  const definition = next.credibility.definitions.find((d) => d.id === queryId)
  const option = definition?.options.find((o) => o.id === optionId)
  if (option) {
    applyEffects(next, option.shown, option.hidden, `${queryId}:${optionId}`)
  }

  snapshotHistory(next)
  return next
}

/**
 * Apply one chosen option from one card: metric effects (spec §5.2), any
 * confidence adjustment (§7.2), and any direct dependency action (§5.5) —
 * some options simply ARE the fix for a dependency, rather than moving a
 * metric that stands in for it.
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

  applyEffects(next, option.shown, option.hidden, attributedTo)

  // The OfS audit's mandatory process change makes every remaining proper
  // fix cost a little more (spec §9.2) — applied on top of the option's
  // own authored cost, not instead of it.
  if (option.sourceFix && next.flags.has(AUDIT_ACTIVE_FLAG)) {
    next.shown.team_capacity -= AUDIT_SOURCE_FIX_SURCHARGE
  }

  if (option.confidenceDelta) {
    next.signoff = adjustConfidence(next.signoff, option.confidenceDelta)
  }

  if (option.dependencyAction) {
    next.dependencies = applyDependencyAction(next.dependencies, option.dependencyAction)
  }

  for (const flag of option.setsFlags ?? []) {
    next.flags.add(flag)
  }

  next.decisions.push({
    turnIndex: state.turnIndex,
    cardId: card.id,
    optionId: option.id,
  })

  snapshotHistory(next)
  return next
}

/**
 * Acknowledge a flavor event: its effects (if any) apply immediately to the
 * shown channel, since a flavor event is by definition something visibly
 * happening now — even when it's narrating the landing of an earlier
 * decision's already-applied hidden effect, in which case its own effects
 * list is empty and this is pure bookkeeping so it doesn't show twice.
 */
export function applyFlavorEvent(state: GameState, event: FlavorEvent): GameState {
  const next = cloneState(state)
  applyEffects(next, event.effects, [], event.id)
  next.acknowledgedFlavorEvents.push(event.id)
  snapshotHistory(next)
  return next
}

/**
 * Move to the next turn: land scheduled effects, degrade untouched
 * dependencies, apply the escalation ladder's standing-weekly cost, check
 * whether a new rung is triggered, clear this turn's acknowledged flavor
 * events, and log the resulting snapshot to history (spec §5.2, §5.5,
 * §7.3, §12.4).
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
  next.acknowledgedFlavorEvents = []

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
