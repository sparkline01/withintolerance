import { computeFinalAccuracy } from './debrief'
import type { ErrorPool } from './cascade'
import {
  type CredibilityDurability,
  type CredibilityOption,
  type CredibilityPool,
  type CredibilityQueryDefinition,
  getDurability,
  isAnswered,
} from './credibility'
import { createRng, pickOne, type Rng } from './prng'
import type { DecisionCard, GameState } from './types'

/**
 * The coda (spec §11): four fixed frames, set the following November,
 * templated from what actually happened. This is what a statutory return
 * has that the admissions reference game doesn't — consequences land 15
 * months out, in someone else's inbox, about a return half forgotten.
 */

// --- Screen 1: a metric publishes ---------------------------------------

export interface MetricPublishesScreen {
  type: 'metric_publishes'
  gap: number
}

export function buildMetricPublishesScreen(state: GameState, finaleErrors?: ErrorPool): MetricPublishesScreen {
  const finalAccuracy = computeFinalAccuracy(state, finaleErrors)
  const shown = state.shown.accuracy
  return { type: 'metric_publishes', gap: Math.abs(shown - finalAccuracy) }
}

// --- Screen 2: a low-durability explanation returns ---------------------

const RESURFACE_PROBABILITY: Record<CredibilityDurability, number> = {
  low: 0.75,
  medium: 0.35,
  high: 0,
}

export interface CredibilityReturnsScreen {
  type: 'credibility_returns'
  found: boolean
  query?: string
  yourAnswer?: string
}

/** Rolls each answered query in a fixed order; the first one to "hit" its durability's odds resurfaces. */
export function selectResurfacingAnswer(
  rng: Rng,
  pool: CredibilityPool,
): { query: CredibilityQueryDefinition; option: CredibilityOption } | null {
  for (const definition of pool.definitions) {
    if (!isAnswered(pool, definition.id)) continue
    const durability = getDurability(pool, definition.id)
    if (!durability) continue
    if (rng() < RESURFACE_PROBABILITY[durability]) {
      const optionId = pool.answers[definition.id]
      const option = definition.options.find((o) => o.id === optionId)
      if (option) return { query: definition, option }
    }
  }
  return null
}

export function buildCredibilityReturnsScreen(rng: Rng, pool: CredibilityPool): CredibilityReturnsScreen {
  const hit = selectResurfacingAnswer(rng, pool)
  if (!hit) return { type: 'credibility_returns', found: false }
  return { type: 'credibility_returns', found: true, query: hit.query.query, yourAnswer: hit.option.label }
}

// --- Screen 3: recurring debt resurfaces --------------------------------

export interface RecurringDebtScreen {
  type: 'recurring_debt'
  debtCount: number
}

export function buildRecurringDebtScreen(state: GameState): RecurringDebtScreen {
  return { type: 'recurring_debt', debtCount: state.truth.recurring_debt }
}

// --- Screen 4: one good thing -------------------------------------------

export interface GoodThingScreen {
  type: 'good_thing'
  found: boolean
  cardPrompt?: string
  optionLabel?: string
}

interface GoodThingCandidate {
  cardPrompt: string
  optionLabel: string
}

/** A source fix, or an option that directly completed a dependency — either one genuinely holds. */
export function findGoodThingCandidates(state: GameState, cards: readonly DecisionCard[]): GoodThingCandidate[] {
  const cardsById = new Map(cards.map((c) => [c.id, c]))
  const candidates: GoodThingCandidate[] = []
  for (const decision of state.decisions) {
    const card = cardsById.get(decision.cardId)
    const option = card?.options.find((o) => o.id === decision.optionId)
    if (!card || !option) continue
    if (option.sourceFix || option.dependencyAction?.action === 'complete') {
      candidates.push({ cardPrompt: card.prompt, optionLabel: option.label })
    }
  }
  return candidates
}

export function buildGoodThingScreen(
  rng: Rng,
  state: GameState,
  cards: readonly DecisionCard[],
): GoodThingScreen {
  const candidates = findGoodThingCandidates(state, cards)
  if (candidates.length === 0) return { type: 'good_thing', found: false }
  const chosen = pickOne(rng, candidates)
  return { type: 'good_thing', found: true, cardPrompt: chosen.cardPrompt, optionLabel: chosen.optionLabel }
}

// --- Assembling the whole coda -------------------------------------------

export interface CodaContent {
  metricPublishes: MetricPublishesScreen
  credibilityReturns: CredibilityReturnsScreen
  recurringDebt: RecurringDebtScreen
  goodThing: GoodThingScreen
}

/**
 * A seed offset from the run seed, not the same rng instance selectRun.ts
 * consumed — the coda's rolls (which credibility answer resurfaces, which
 * good thing gets picked) are a separate deterministic draw, not
 * entangled with content selection.
 */
export function computeCoda(
  seed: number,
  state: GameState,
  cards: readonly DecisionCard[],
  finaleErrors?: ErrorPool,
): CodaContent {
  const rng = createRng(seed ^ 0x5eed)
  return {
    metricPublishes: buildMetricPublishesScreen(state, finaleErrors),
    credibilityReturns: buildCredibilityReturnsScreen(rng, state.credibility),
    recurringDebt: buildRecurringDebtScreen(state),
    goodThing: buildGoodThingScreen(rng, state, cards),
  }
}

// --- Templated sentences (spec §15: "4 fixed frames, templated content") ---

export function metricPublishesSentence(screen: MetricPublishesScreen): string {
  const pointWord = screen.gap === 1 ? 'point' : 'points'
  return `It is built from what the return showed, not from what was actually true. The gap between them is ${screen.gap} ${pointWord} — the same one nobody saw until July.`
}

export function credibilityReturnsSentence(screen: CredibilityReturnsScreen): string {
  if (!screen.found) {
    return "Every explanation you gave held. That will not always be true. This year, it was."
  }
  return `OfS wants supporting evidence for: "${screen.query}"\n\nYour answer at the time: "${screen.yourAnswer}"\n\nIt has your predecessor's name on the file, not yours. That will not save you.`
}

export function recurringDebtSentence(screen: RecurringDebtScreen): string {
  if (screen.debtCount === 0) {
    return "You didn't leave any of that behind. It is a small thing. It is also the only thing that stayed fixed."
  }
  return `Whoever is doing the return now has emailed you. The extract fixes you made are still sitting where you left them — ${screen.debtCount} of them — doing exactly what they always did.`
}

export function goodThingSentence(screen: GoodThingScreen): string {
  if (!screen.found) {
    return "You got through the cycle. That doesn't announce itself anywhere, but it's real, and it was yours."
  }
  return `The fix you made on "${screen.cardPrompt}" — "${screen.optionLabel}" — is still there, still correct, still nobody's problem. Nobody knows you did it. That was rather the point.`
}
