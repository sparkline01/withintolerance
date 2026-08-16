/**
 * Core data types for the Within Tolerance engine.
 * See docs/spec.md §2.1, §3, §4, §5 for the design this implements.
 */

import type { ErrorPool } from './cascade'

/** The five scored axes (spec §3) plus the two tracked-but-unscored values. */
export type MetricKey =
  | 'accuracy' // axis 1 — never shown during play, revealed at debrief only
  | 'timeliness' // axis 2
  | 'downstream' // axis 3 — "how it looks downstream"
  | 'goodwill' // axis 4
  | 'team_capacity' // axis 5
  | 'you' // hidden meter, drains via the `self` currency (§4.2)
  | 'recurring_debt' // not an axis — surfaces in the coda (§11)

export const METRIC_KEYS: readonly MetricKey[] = [
  'accuracy',
  'timeliness',
  'downstream',
  'goodwill',
  'team_capacity',
  'you',
  'recurring_debt',
]

export type MetricRecord = Record<MetricKey, number>

/** The main turn sequence (spec §9). Finale and coda are separate modules layered on top. */
export const TURN_SEQUENCE = [
  'Handover',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
  'May',
  'June',
  'July',
] as const

export type TurnId = (typeof TURN_SEQUENCE)[number]

export type Currency = 'capacity' | 'accuracy' | 'goodwill' | 'self'

/**
 * A single effect. `delayTurns` of 0 applies immediately on the turn the
 * decision is made; otherwise it is scheduled and applied when it lands.
 * `channel` distinguishes the displayed dashboard value (`shown`) from the
 * real underlying value (`truth`) — these frequently move in different
 * directions or by different amounts (spec §2.1, §5.1).
 */
export interface Effect {
  metric: MetricKey
  delta: number
  delayTurns: number
}

export interface DecisionOption {
  id: string
  label: string
  currency: Currency
  teaser: string
  sourceFix?: boolean
  shown: Effect[]
  hidden: Effect[]
  unlocks?: string[]
  setsFlags?: string[]
}

export interface DecisionCard {
  id: string
  turn: TurnId
  trigger: 'scheduled' | 'conditional'
  requires?: string[]
  prompt: string
  context: string
  options: DecisionOption[]
}

export interface FlavorEvent {
  id: string
  turn: TurnId
  type: 'flavor_event'
  attributedTo?: string
  headline: string
  body: string
  effects: Effect[]
}

/** An effect waiting to land on a future turn, per the scheduler (spec §5.2). */
export interface ScheduledEffect {
  metric: MetricKey
  delta: number
  landingTurnIndex: number
  channel: 'shown' | 'hidden'
  attributedTo: string
}

export interface DecisionLogEntry {
  turnIndex: number
  cardId: string
  optionId: string
}

/** One turn's snapshot of shown vs truth — the raw material for the forecast-accuracy table (spec §12.4). */
export interface HistoryEntry {
  turnIndex: number
  turn: TurnId
  shown: MetricRecord
  truth: MetricRecord
}

export interface GameState {
  seed: number
  turnIndex: number
  turn: TurnId
  decisions: DecisionLogEntry[]
  scheduledEffects: ScheduledEffect[]
  shown: MetricRecord
  truth: MetricRecord
  errors: ErrorPool
  flags: Set<string>
  history: HistoryEntry[]
  // Not yet implemented — later build-order steps (spec §16 steps 2/5):
  // dependencies: SourceDependency[]
  // roster: StaffMember[]
  // credibility: CredibilityQuery[]
  // signoff: { readiness: number; confidence: number; escalationRung: number }
  // inherited: HandoverVariant
}

export function zeroMetrics(): MetricRecord {
  const record = {} as MetricRecord
  for (const key of METRIC_KEYS) record[key] = 0
  return record
}
