/**
 * The error pool and cascade mechanic (spec §6). This is the single most
 * important mechanic after the shown/truth split: fixing a blocking error
 * *properly* unblocks the tiers behind it, and the open-error count goes up
 * — the game's thesis delivered as a mechanic rather than a debrief
 * paragraph. Suppressing an error takes the count down and keeps it down,
 * because nothing behind it ever gets evaluated.
 *
 * This module is deliberately self-contained and pure — no dependency on
 * GameState or the turn loop. `state.ts` wires it in as one field.
 */

export type ErrorTier = 1 | 2 | 3 | 4 | 5

export const ERROR_TIERS: readonly ErrorTier[] = [1, 2, 3, 4, 5]

/**
 * Blocking errors mask every deeper tier on the same record until
 * source-fixed. Advisory ("tolerance") errors never block, and are never
 * counted in the open-error total shown on the dashboard — they are the
 * quiet, correct-looking, largest contributor to the accuracy gap (§6.3).
 */
export type ErrorSeverity = 'blocking' | 'advisory'

/**
 * - `source_fix`: genuinely corrected at source. Clears the error and, for
 *   blocking errors, unblocks deeper tiers on the same record.
 * - `extract_fix`: overridden, defaulted, or the record excluded. Clears the
 *   error from the open count, sets recurring debt, but does NOT unblock
 *   deeper tiers — the record was suppressed, not fixed.
 * - `unresolved`: the default. Still substantively wrong.
 */
export type ErrorResolution = 'unresolved' | 'source_fix' | 'extract_fix'

export interface ErrorDefinition {
  id: string
  recordId: string
  tier: ErrorTier
  severity: ErrorSeverity
  ruleCode: string
  label: string
}

export interface ErrorPool {
  definitions: ErrorDefinition[]
  /** Keyed by ErrorDefinition.id. Absent entries are treated as 'unresolved'. */
  resolutions: Record<string, ErrorResolution>
}

export function createErrorPool(definitions: ErrorDefinition[]): ErrorPool {
  return { definitions, resolutions: {} }
}

export function getResolution(pool: ErrorPool, errorId: string): ErrorResolution {
  return pool.resolutions[errorId] ?? 'unresolved'
}

/**
 * A tier-n error is reachable only if every blocking error on the same
 * record at a shallower tier has been source-fixed. An unresolved or
 * merely extract-fixed ancestor keeps everything behind it masked.
 */
export function isReachable(pool: ErrorPool, error: ErrorDefinition): boolean {
  const blockingAncestors = pool.definitions.filter(
    (d) => d.recordId === error.recordId && d.severity === 'blocking' && d.tier < error.tier,
  )
  return blockingAncestors.every((a) => getResolution(pool, a.id) === 'source_fix')
}

/** Whether an error currently counts toward the visible dashboard total. */
export function isOpen(pool: ErrorPool, error: ErrorDefinition): boolean {
  if (error.severity === 'advisory') return false
  if (!isReachable(pool, error)) return false
  return getResolution(pool, error.id) === 'unresolved'
}

export function openErrorsByTier(pool: ErrorPool): Record<ErrorTier, number> {
  const counts: Record<ErrorTier, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const def of pool.definitions) {
    if (isOpen(pool, def)) counts[def.tier] += 1
  }
  return counts
}

export function totalOpenErrors(pool: ErrorPool): number {
  return Object.values(openErrorsByTier(pool)).reduce((a, b) => a + b, 0)
}

/**
 * Errors still substantively wrong in the underlying data, whether or not
 * they are currently visible on the dashboard. Masking a problem doesn't
 * fix it — this is what should drag down truth.accuracy at read time. Left
 * as a plain count rather than folded into GameState.truth automatically,
 * so callers (dashboard, debrief) decide how to weight and combine it.
 */
export function accuracyDebtCount(pool: ErrorPool): number {
  return pool.definitions.filter((d) => getResolution(pool, d.id) !== 'source_fix').length
}

/** Every extract-fix leaves recurring debt behind, regardless of severity (§6.2). */
export function recurringDebtCount(pool: ErrorPool): number {
  return pool.definitions.filter((d) => getResolution(pool, d.id) === 'extract_fix').length
}

export function resolveError(
  pool: ErrorPool,
  errorId: string,
  resolution: ErrorResolution,
): ErrorPool {
  const exists = pool.definitions.some((d) => d.id === errorId)
  if (!exists) throw new Error(`Unknown error "${errorId}"`)
  return {
    definitions: pool.definitions,
    resolutions: { ...pool.resolutions, [errorId]: resolution },
  }
}
