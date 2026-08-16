import type { CredibilityQueryDefinition } from '../engine/credibility'
import { isAnswered } from '../engine/credibility'
import type { DecisionCard, FlavorEvent, GameState } from '../engine/types'

/**
 * Flavor events due this turn. An attributed event (spec §5.2 — narrates a
 * decision's delayed effect landing) must only appear if the player
 * actually chose that option; turn matching alone isn't enough, since the
 * event's authored `turn` is just "whenever this would land if chosen."
 */
export function pendingFlavorEvents(events: readonly FlavorEvent[], state: GameState): FlavorEvent[] {
  const madeDecisions = new Set(state.decisions.map((d) => `${d.cardId}:${d.optionId}`))
  return events.filter((event) => {
    if (event.turn !== state.turn) return false
    if (state.acknowledgedFlavorEvents.includes(event.id)) return false
    if (event.attributedTo && !madeDecisions.has(event.attributedTo)) return false
    return true
  })
}

/** Decision cards due this turn: scheduled cards always, conditional cards only once their flags are set. */
export function pendingDecisionCards(cards: readonly DecisionCard[], state: GameState): DecisionCard[] {
  const decidedThisTurn = new Set(
    state.decisions.filter((d) => d.turnIndex === state.turnIndex).map((d) => d.cardId),
  )
  return cards.filter((card) => {
    if (card.turn !== state.turn || decidedThisTurn.has(card.id)) return false
    if (card.trigger === 'conditional') {
      return (card.requires ?? []).every((flag) => state.flags.has(flag))
    }
    return true
  })
}

export function pendingCredibilityQueries(
  queries: readonly CredibilityQueryDefinition[],
  state: GameState,
): CredibilityQueryDefinition[] {
  return queries.filter((q) => q.turn === state.turn && !isAnswered(state.credibility, q.id))
}
