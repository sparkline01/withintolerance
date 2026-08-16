import { averageReadiness, type DependencyPool } from './dependencies'
import { answeredCount, totalCount, type CredibilityPool } from './credibility'
import { openErrorsByTier, type ErrorPool } from './cascade'

/**
 * Sign-off (spec §7). Two independent gates: readiness is mechanical and
 * derived from the other pools; confidence is the accountable officer's
 * willingness to sign, which only moves when something explicitly spends
 * it and cannot be rebuilt inside one cycle.
 */
export interface SignoffState {
  /** 0-1. Starts from the inherited handover variant once §8 is built; a fixed baseline until then. */
  confidence: number
  /** 0-5, per the escalation ladder (§7.3). 0 = not escalated. */
  escalationRung: number
}

export const DEFAULT_CONFIDENCE = 0.7

export function createSignoffState(confidence: number = DEFAULT_CONFIDENCE): SignoffState {
  return { confidence, escalationRung: 0 }
}

export function adjustConfidence(state: SignoffState, delta: number): SignoffState {
  return { ...state, confidence: Math.max(0, Math.min(1, state.confidence + delta)) }
}

/**
 * Readiness (§7.1): errors below threshold, credibility queries answered,
 * dependencies resolved or worked around. Equal-weighted average of three
 * components, each 0-1 — a defensible, testable choice where the spec
 * gives the ingredients but not exact weights.
 */
export function deriveReadiness(pools: {
  errors: ErrorPool
  credibility: CredibilityPool
  dependencies: DependencyPool
}): number {
  const byTier = openErrorsByTier(pools.errors)
  const totalBlockingDefined = pools.errors.definitions.filter((d) => d.severity === 'blocking').length
  const openBlocking = Object.values(byTier).reduce((a, b) => a + b, 0)
  const errorComponent = totalBlockingDefined === 0 ? 1 : 1 - openBlocking / totalBlockingDefined

  const totalQueries = totalCount(pools.credibility)
  const credibilityComponent = totalQueries === 0 ? 1 : answeredCount(pools.credibility) / totalQueries

  const dependencyComponent = averageReadiness(pools.dependencies)

  return (errorComponent + credibilityComponent + dependencyComponent) / 3
}

/** Turns spent at rung 3+ pay a standing-weekly capacity cost every remaining turn (§7.3 rung 3). */
export const STANDING_WEEKLY_CAPACITY_COST = 1

/**
 * Advance the escalation ladder by one rung. Called once per turn once the
 * deadline has passed and readiness hasn't reached 1 — the caller (state.ts)
 * owns that timing decision. Reaching rung 5 drops confidence to the floor,
 * per §7.3's "Formal contact."
 */
export function advanceEscalation(state: SignoffState): SignoffState {
  const escalationRung = Math.min(5, state.escalationRung + 1)
  const confidence = escalationRung >= 5 ? 0 : state.confidence
  return { confidence, escalationRung }
}
