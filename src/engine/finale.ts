import { createErrorPool, type ErrorDefinition, type ErrorPool, type ErrorResolution, resolveError } from './cascade'

/**
 * The finale: the final validation run (spec §10). Structurally distinct
 * from the turn loop, as Clearing is in the reference game — but
 * mechanically it's the same cascade from §6, just under a clock. Deals
 * in whichever resolution the player picks for each vignette:
 *
 * - `source_fix` ("Fix at source"): costs the most clock time, and per
 *   §6.1 can raise the open count if it unblocks deeper tiers.
 * - `extract_fix` ("Override"): cheap, clears the count, leaves debt.
 * - `unresolved` ("Leave in tolerance"): free — just don't resolve it.
 */
export const TIME_COST_SECONDS: Record<ErrorResolution, number> = {
  source_fix: 8,
  extract_fix: 1,
  unresolved: 0,
}

export const FINALE_CLOCK_SECONDS = 90

/** One record surfaced in the live queue — the narrative wrapper around an ErrorDefinition. */
export interface FinaleVignette {
  id: string
  errorId: string
  studentRef: string
  course: string
  humanContext: string
}

export interface FinaleState {
  pool: ErrorPool
  vignettes: FinaleVignette[]
  /** Index into `vignettes` of the one currently on screen. */
  currentIndex: number
  clockSecondsRemaining: number
  /** Ids resolved before the clock ran out. */
  resolvedOrder: string[]
  /** True once the clock hit zero and everything left was auto-overridden. */
  timeExpired: boolean
}

export function createFinaleState(
  definitions: ErrorDefinition[],
  vignettes: FinaleVignette[],
  clockSeconds: number = FINALE_CLOCK_SECONDS,
): FinaleState {
  return {
    pool: createErrorPool(definitions),
    vignettes,
    currentIndex: 0,
    clockSecondsRemaining: clockSeconds,
    resolvedOrder: [],
    timeExpired: false,
  }
}

export function currentVignette(state: FinaleState): FinaleVignette | undefined {
  return state.vignettes[state.currentIndex]
}

export function isQueueComplete(state: FinaleState): boolean {
  return state.currentIndex >= state.vignettes.length || state.timeExpired
}

/**
 * Resolve the current vignette and deduct its time cost from the clock,
 * moving to the next one. If the deduction takes the clock to zero or
 * below, everything still unresolved is auto-overridden in one pass —
 * "the game says so in one flat line" (spec §10.2).
 */
export function resolveCurrentVignette(state: FinaleState, resolution: ErrorResolution): FinaleState {
  const vignette = currentVignette(state)
  if (!vignette) return state

  const pool = resolution === 'unresolved' ? state.pool : resolveError(state.pool, vignette.errorId, resolution)
  const clockSecondsRemaining = Math.max(0, state.clockSecondsRemaining - TIME_COST_SECONDS[resolution])
  const resolvedOrder = [...state.resolvedOrder, vignette.id]
  const currentIndex = state.currentIndex + 1

  if (clockSecondsRemaining === 0) {
    return autoOverrideRemaining({
      ...state,
      pool,
      clockSecondsRemaining,
      resolvedOrder,
      currentIndex,
    })
  }

  return { ...state, pool, clockSecondsRemaining, resolvedOrder, currentIndex }
}

/** Called when the wall clock itself runs out mid-vignette, independent of any button press. */
export function expireClock(state: FinaleState): FinaleState {
  if (state.timeExpired) return state
  return autoOverrideRemaining({ ...state, clockSecondsRemaining: 0 })
}

function autoOverrideRemaining(state: FinaleState): FinaleState {
  let pool = state.pool
  for (const vignette of state.vignettes.slice(state.currentIndex)) {
    pool = resolveError(pool, vignette.errorId, 'extract_fix')
  }
  return { ...state, pool, currentIndex: state.vignettes.length, timeExpired: true }
}

export type SignoffOutcome = 'signs' | 'signs_conditionally' | 'does_not_sign'

/**
 * The Registrar signs, or signs conditionally, or does not (spec §10.3).
 * Thresholds are an interpretive choice — the spec describes the scene,
 * not the exact cutoffs.
 */
export function determineSignoffOutcome(readiness: number, confidence: number): SignoffOutcome {
  if (readiness >= 0.7 && confidence >= 0.5) return 'signs'
  if (readiness >= 0.4 || confidence >= 0.3) return 'signs_conditionally'
  return 'does_not_sign'
}
