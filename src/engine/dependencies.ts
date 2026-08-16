import type { MetricKey } from './types'

/**
 * Source dependencies — data the player doesn't own (spec §5.5). This is
 * where delay actually comes from: dependencies degrade if left alone, and
 * a workaround fires silently at submission time for anything that never
 * reached readiness. The player who never looked doesn't get told; they
 * find out in the debrief.
 */
export interface DependencyDefinition {
  id: string
  label: string
  owner: string
  ownerName: string
  /** 0-1. Starting readiness before any turns pass or any action is taken. */
  initialReadiness: number
  /** Readiness lost per turn if left untouched. */
  slipsPerTurn: number
  chaseCost: Partial<Record<MetricKey, number>>
  escalateCost: Partial<Record<MetricKey, number>>
  workaroundAvailable: boolean
  /** Applied to truth.accuracy at submission if readiness never reached 1. */
  workaroundAccuracyPenalty: number
}

export type DependencyAction = 'chase' | 'escalate'

interface DependencyRuntime {
  readiness: number
  chaseCount: number
  escalateCount: number
}

export interface DependencyPool {
  definitions: DependencyDefinition[]
  runtime: Record<string, DependencyRuntime>
}

/**
 * Display label for the dashboard chip grid (spec §5.8). Interpretive
 * thresholds, since the spec gives the vocabulary but not exact cutoffs:
 * "no reply" means chased more than once and still stuck below halfway.
 */
export type DependencyDisplayState = 'ready' | 'partial' | 'not_started' | 'chased' | 'no_reply'

const CHASE_BUMP = 0.2
const ESCALATE_BUMP = 0.4
const NO_REPLY_CHASE_THRESHOLD = 2
const NO_REPLY_READINESS_CEILING = 0.5

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function createDependencyPool(definitions: DependencyDefinition[]): DependencyPool {
  const runtime: Record<string, DependencyRuntime> = {}
  for (const def of definitions) {
    runtime[def.id] = { readiness: clamp01(def.initialReadiness), chaseCount: 0, escalateCount: 0 }
  }
  return { definitions, runtime }
}

function getRuntime(pool: DependencyPool, id: string): DependencyRuntime {
  const runtime = pool.runtime[id]
  if (!runtime) throw new Error(`Unknown dependency "${id}"`)
  return runtime
}

export function getReadiness(pool: DependencyPool, id: string): number {
  return getRuntime(pool, id).readiness
}

export function displayState(pool: DependencyPool, id: string): DependencyDisplayState {
  const runtime = getRuntime(pool, id)
  if (runtime.readiness >= 1) return 'ready'
  if (
    runtime.chaseCount >= NO_REPLY_CHASE_THRESHOLD &&
    runtime.readiness < NO_REPLY_READINESS_CEILING
  ) {
    return 'no_reply'
  }
  if (runtime.chaseCount >= 1 || runtime.escalateCount >= 1) return 'chased'
  if (runtime.readiness > 0) return 'partial'
  return 'not_started'
}

function withRuntime(
  pool: DependencyPool,
  id: string,
  update: (runtime: DependencyRuntime) => DependencyRuntime,
): DependencyPool {
  const current = getRuntime(pool, id)
  return {
    definitions: pool.definitions,
    runtime: { ...pool.runtime, [id]: update(current) },
  }
}

export function chaseDependency(pool: DependencyPool, id: string): DependencyPool {
  return withRuntime(pool, id, (runtime) => ({
    readiness: clamp01(runtime.readiness + CHASE_BUMP),
    chaseCount: runtime.chaseCount + 1,
    escalateCount: runtime.escalateCount,
  }))
}

export function escalateDependency(pool: DependencyPool, id: string): DependencyPool {
  return withRuntime(pool, id, (runtime) => ({
    readiness: clamp01(runtime.readiness + ESCALATE_BUMP),
    chaseCount: runtime.chaseCount,
    escalateCount: runtime.escalateCount + 1,
  }))
}

/** Passive per-turn degradation for everything not yet fully ready (spec §5.5). */
export function degradeDependencies(pool: DependencyPool): DependencyPool {
  const runtime: Record<string, DependencyRuntime> = {}
  for (const def of pool.definitions) {
    const current = pool.runtime[def.id]
    runtime[def.id] =
      current.readiness >= 1
        ? current
        : { ...current, readiness: clamp01(current.readiness - def.slipsPerTurn) }
  }
  return { definitions: pool.definitions, runtime }
}

/**
 * The silent penalty for everything that never reached readiness by
 * submission. Deliberately a pure derivation, not auto-applied to
 * GameState.truth by this module — callers (signoff/debrief) decide when
 * "submission time" actually is and combine it with everything else.
 */
export function pendingWorkaroundPenalty(pool: DependencyPool): number {
  let total = 0
  for (const def of pool.definitions) {
    if (!def.workaroundAvailable) continue
    const runtime = pool.runtime[def.id]
    if (runtime.readiness < 1) total += def.workaroundAccuracyPenalty
  }
  return total
}

export function averageReadiness(pool: DependencyPool): number {
  if (pool.definitions.length === 0) return 1
  const total = pool.definitions.reduce((sum, def) => sum + pool.runtime[def.id].readiness, 0)
  return total / pool.definitions.length
}
