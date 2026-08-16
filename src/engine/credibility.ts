import type { Effect, TurnId } from './types'

/**
 * Credibility queries — the "explain this number" moments (spec §5.7).
 * `durability` is hidden from the player; all three answers are accepted
 * in-cycle regardless of which is chosen, but low/medium durability
 * answers go into the coda pool (§11) with different odds of coming back.
 * The coda isn't built yet (step 9) — this module just tracks answers and
 * exposes durability for whenever it is.
 */
export type CredibilityDurability = 'low' | 'medium' | 'high'

/**
 * Options carry shown/hidden effects just like a decision card's options
 * (spec §5.7's own example shows a `shown` array per option) — a
 * credibility query mechanically IS a decision, just one whose durability
 * is hidden and whose consequences may resurface in the coda.
 */
export interface CredibilityOption {
  id: string
  label: string
  durability: CredibilityDurability
  shown: Effect[]
  hidden: Effect[]
}

export interface CredibilityQueryDefinition {
  id: string
  turn: TurnId
  query: string
  truth: string
  options: CredibilityOption[]
}

export interface CredibilityPool {
  definitions: CredibilityQueryDefinition[]
  /** Keyed by query id -> chosen option id. */
  answers: Record<string, string>
}

export function createCredibilityPool(definitions: CredibilityQueryDefinition[]): CredibilityPool {
  return { definitions, answers: {} }
}

export function isAnswered(pool: CredibilityPool, queryId: string): boolean {
  return queryId in pool.answers
}

export function answeredCount(pool: CredibilityPool): number {
  return Object.keys(pool.answers).length
}

export function totalCount(pool: CredibilityPool): number {
  return pool.definitions.length
}

export function answerQuery(
  pool: CredibilityPool,
  queryId: string,
  optionId: string,
): CredibilityPool {
  const definition = pool.definitions.find((d) => d.id === queryId)
  if (!definition) throw new Error(`Unknown credibility query "${queryId}"`)
  if (!definition.options.some((o) => o.id === optionId)) {
    throw new Error(`Unknown option "${optionId}" on credibility query "${queryId}"`)
  }
  return { definitions: pool.definitions, answers: { ...pool.answers, [queryId]: optionId } }
}

export function getDurability(pool: CredibilityPool, queryId: string): CredibilityDurability | null {
  const chosenId = pool.answers[queryId]
  if (!chosenId) return null
  const definition = pool.definitions.find((d) => d.id === queryId)
  const option = definition?.options.find((o) => o.id === chosenId)
  return option?.durability ?? null
}
