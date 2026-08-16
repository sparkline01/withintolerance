import { accuracyDebtCount, type ErrorPool } from './cascade'
import type { CredibilityQueryDefinition } from './credibility'
import { pendingWorkaroundPenalty } from './dependencies'
import { advanceTurn, applyDecision, answerCredibilityQuery, createInitialState, type InitialPools } from './state'
import {
  type ActionLogEntry,
  type DecisionCard,
  type GameState,
  METRIC_KEYS,
  type MetricKey,
  type TurnId,
} from './types'

/**
 * The debrief (spec §12). Everything here is a pure derivation over a
 * finished GameState (and, for counterfactuals, a replay of it) — nothing
 * new is stored on GameState itself.
 */

// --- 12.1/12.4: the reveal and forecast-accuracy table ------------------

export interface ForecastRow {
  turnIndex: number
  turn: TurnId
  shown: number
  truth: number
  /** shown - truth. Positive means the dashboard over-stated it. */
  error: number
  errorPercent: number | null
}

/** Straight render of history[] for the accuracy axis — the meter that was never shown (spec §12.1, §12.4). */
export function forecastTable(state: GameState): ForecastRow[] {
  return state.history.map((entry) => {
    const shown = entry.shown.accuracy
    const truth = entry.truth.accuracy
    const error = shown - truth
    const errorPercent = truth !== 0 ? (error / Math.abs(truth)) * 100 : null
    return { turnIndex: entry.turnIndex, turn: entry.turn, shown, truth, error, errorPercent }
  })
}

// --- Final accuracy: the pieces cascade.ts and dependencies.ts deliberately left uncombined ---

/**
 * Combines truth.accuracy with the debt cascade.ts and dependencies.ts
 * compute but never auto-apply (by design — see their own doc comments):
 * unresolved errors in the main cycle, unresolved errors in the finale
 * queue, and the silent workaround penalty for anything that never
 * reached readiness. This is "submission time" — the one place all three
 * get combined into a single number.
 */
export function computeFinalAccuracy(state: GameState, finaleErrors?: ErrorPool): number {
  let total = state.truth.accuracy
  total -= accuracyDebtCount(state.errors)
  if (finaleErrors) total -= accuracyDebtCount(finaleErrors)
  total += pendingWorkaroundPenalty(state.dependencies) // already negative
  return total
}

// --- 12.2: per-axis banding ------------------------------------------

export type BandedAxis = 'accuracy' | 'timeliness' | 'downstream' | 'goodwill' | 'team_capacity'

export const BANDED_AXES: readonly BandedAxis[] = ['accuracy', 'timeliness', 'downstream', 'goodwill', 'team_capacity']

export interface Band {
  label: string
  /** 0 = best band, 3 = worst. */
  tier: 0 | 1 | 2 | 3
}

const STANDARD_BAND_LABELS = [
  'Materially accurate',
  'Broadly reliable',
  'Subject to qualification',
  'Not fit for purpose',
] as const

// Deliberately different register for goodwill, per spec §3.1.
const GOODWILL_BAND_LABELS = [
  'They will help you next year',
  'They will help you if you ask nicely',
  'You are a request now',
  'You are a problem now',
] as const

/**
 * Illustrative thresholds (spec §0 — the spec gives the banding concept,
 * not exact cutoffs). A single shared scale, since every metric here
 * accumulates from the same-sized per-decision deltas (roughly ±1 to ±3).
 */
const BAND_THRESHOLDS: readonly [number, number, number] = [5, 0, -8]

function tierFor(value: number): 0 | 1 | 2 | 3 {
  if (value >= BAND_THRESHOLDS[0]) return 0
  if (value >= BAND_THRESHOLDS[1]) return 1
  if (value >= BAND_THRESHOLDS[2]) return 2
  return 3
}

export function bandFor(axis: BandedAxis, value: number): Band {
  const tier = tierFor(value)
  const labels = axis === 'goodwill' ? GOODWILL_BAND_LABELS : STANDARD_BAND_LABELS
  return { label: labels[tier], tier }
}

export interface AxisSummary {
  axis: BandedAxis
  value: number
  band: Band
}

export function computeAxisSummaries(state: GameState, finalAccuracy: number): AxisSummary[] {
  return [
    { axis: 'accuracy', value: finalAccuracy, band: bandFor('accuracy', finalAccuracy) },
    { axis: 'timeliness', value: state.shown.timeliness, band: bandFor('timeliness', state.shown.timeliness) },
    { axis: 'downstream', value: state.shown.downstream, band: bandFor('downstream', state.shown.downstream) },
    { axis: 'goodwill', value: state.shown.goodwill, band: bandFor('goodwill', state.shown.goodwill) },
    {
      axis: 'team_capacity',
      value: state.shown.team_capacity,
      band: bandFor('team_capacity', state.shown.team_capacity),
    },
  ]
}

// --- 12.5: the self count --------------------------------------------

export interface SelfCount {
  totalDecisions: number
  selfDecisions: number
}

/** "You took N decisions yourself. M of them were somebody else's job." (spec §4.2) */
export function computeSelfCount(state: GameState, cards: readonly DecisionCard[]): SelfCount {
  const cardsById = new Map(cards.map((c) => [c.id, c]))
  let selfDecisions = 0
  for (const decision of state.decisions) {
    const option = cardsById.get(decision.cardId)?.options.find((o) => o.id === decision.optionId)
    if (option?.currency === 'self') selfDecisions++
  }
  return { totalDecisions: state.decisions.length, selfDecisions }
}

// --- 12.3: counterfactual re-simulation --------------------------------

interface ResolvedAction {
  entry: ActionLogEntry
  label: string
  prompt: string
  turn: TurnId
  hiddenImpact: number
}

function resolveAction(
  entry: ActionLogEntry,
  cards: readonly DecisionCard[],
  credibilityDefinitions: readonly CredibilityQueryDefinition[],
): ResolvedAction | null {
  if (entry.type === 'decide') {
    const card = cards.find((c) => c.id === entry.cardId)
    const option = card?.options.find((o) => o.id === entry.optionId)
    if (!card || !option) return null
    return {
      entry,
      label: option.label,
      prompt: card.prompt,
      turn: card.turn,
      hiddenImpact: option.hidden.reduce((sum, e) => sum + Math.abs(e.delta), 0),
    }
  }
  const query = credibilityDefinitions.find((q) => q.id === entry.queryId)
  const option = query?.options.find((o) => o.id === entry.optionId)
  if (!query || !option) return null
  return {
    entry,
    label: option.label,
    prompt: query.query,
    turn: query.turn,
    hiddenImpact: option.hidden.reduce((sum, e) => sum + Math.abs(e.delta), 0),
  }
}

/**
 * Replays a (possibly filtered) actionLog against a fresh state up to
 * `finalTurnIndex`. Flavor events aren't replayed — they aren't logged
 * anywhere replayable (acknowledgedFlavorEvents resets every turn by
 * design). That's fine for computing a DELTA between two replays: both
 * the baseline and the omitted-entry replay skip flavor events equally,
 * so whatever small effects they'd have contributed cancels out of the
 * comparison even though neither replay exactly reproduces the true
 * final state on its own.
 */
function replay(
  seed: number,
  cards: readonly DecisionCard[],
  pools: InitialPools,
  actionLog: readonly ActionLogEntry[],
  finalTurnIndex: number,
): GameState {
  let state = createInitialState(seed, pools)
  const cardsById = new Map(cards.map((c) => [c.id, c]))

  for (let turnIndex = 0; turnIndex <= finalTurnIndex; turnIndex++) {
    if (turnIndex > 0) state = advanceTurn(state)
    for (const entry of actionLog) {
      if (entry.turnIndex !== turnIndex) continue
      if (entry.type === 'decide') {
        const card = cardsById.get(entry.cardId)
        if (card) state = applyDecision(state, card, entry.optionId)
      } else {
        state = answerCredibilityQuery(state, entry.queryId, entry.optionId)
      }
    }
  }

  return state
}

export interface CounterfactualResult {
  label: string
  prompt: string
  turn: TurnId
  /** baseline - withoutIt, per metric. Positive means making that choice raised the metric. */
  deltas: Partial<Record<MetricKey, number>>
}

/**
 * Identifies the highest-impact choices by total |hidden effect| and
 * re-runs the cycle with each individually omitted (spec §12.3). Requires
 * the whole engine to be a pure function of (seed, actions) — built that
 * way from the first commit, per the spec's own warning that retrofitting
 * this later is painful.
 */
export function computeCounterfactuals(
  seed: number,
  cards: readonly DecisionCard[],
  credibilityDefinitions: readonly CredibilityQueryDefinition[],
  pools: InitialPools,
  actionLog: readonly ActionLogEntry[],
  finalTurnIndex: number,
  count = 3,
): CounterfactualResult[] {
  const resolved = actionLog
    .map((entry) => resolveAction(entry, cards, credibilityDefinitions))
    .filter((r): r is ResolvedAction => r !== null && r.hiddenImpact > 0)
    .sort((a, b) => b.hiddenImpact - a.hiddenImpact)
    .slice(0, count)

  if (resolved.length === 0) return []

  const baseline = replay(seed, cards, pools, actionLog, finalTurnIndex)

  return resolved.map((action) => {
    const withoutIt = actionLog.filter((e) => e !== action.entry)
    const withoutItState = replay(seed, cards, pools, withoutIt, finalTurnIndex)

    const deltas: Partial<Record<MetricKey, number>> = {}
    for (const key of METRIC_KEYS) {
      const delta = baseline.truth[key] - withoutItState.truth[key]
      if (delta !== 0) deltas[key] = delta
    }

    return { label: action.label, prompt: action.prompt, turn: action.turn, deltas }
  })
}

const METRIC_PHRASE: Record<MetricKey, string> = {
  accuracy: 'accuracy',
  timeliness: 'timeliness',
  downstream: 'how it looks downstream',
  goodwill: 'goodwill',
  team_capacity: 'team capacity',
  you: 'what it cost you personally',
  recurring_debt: 'recurring debt',
}

export function counterfactualSentence(result: CounterfactualResult): string {
  const parts = Object.entries(result.deltas)
    .filter(([key]) => key !== 'recurring_debt' || result.deltas.recurring_debt !== 0)
    .map(([key, delta]) => {
      const magnitude = Math.abs(delta ?? 0)
      const direction = (delta ?? 0) > 0 ? 'lower' : 'higher'
      return `${METRIC_PHRASE[key as MetricKey]} would have finished ${magnitude} point${magnitude === 1 ? '' : 's'} ${direction}`
    })

  const detail = parts.length > 0 ? parts.join(', and ') : 'nothing measurable would have changed'
  return `You chose "${result.label}" for "${result.prompt}" in ${result.turn}. Without it, ${detail}.`
}
