import { describe, expect, it } from 'vitest'
import {
  answerQuery,
  answeredCount,
  createCredibilityPool,
  getDurability,
  isAnswered,
  totalCount,
  type CredibilityQueryDefinition,
} from './credibility'

const definitions: CredibilityQueryDefinition[] = [
  {
    id: 'q1',
    turn: 'February',
    query: 'A 40% fall in part-time first degree headcount.',
    truth: 'Two courses moved to a partner in 2023 and the mapping never followed them.',
    options: [
      { id: 'restate', label: 'Restate the courses correctly', durability: 'high' },
      { id: 'demand', label: 'Explain it as demand', durability: 'low' },
      { id: 'portfolio', label: 'Explain it as a coding change', durability: 'medium' },
    ],
  },
]

describe('credibility queries', () => {
  it('starts with nothing answered', () => {
    const pool = createCredibilityPool(definitions)
    expect(isAnswered(pool, 'q1')).toBe(false)
    expect(answeredCount(pool)).toBe(0)
    expect(totalCount(pool)).toBe(1)
  })

  it('records an answer and exposes its durability', () => {
    const pool = answerQuery(createCredibilityPool(definitions), 'q1', 'demand')
    expect(isAnswered(pool, 'q1')).toBe(true)
    expect(answeredCount(pool)).toBe(1)
    expect(getDurability(pool, 'q1')).toBe('low')
  })

  it('changing the answer changes the recorded durability', () => {
    let pool = answerQuery(createCredibilityPool(definitions), 'q1', 'demand')
    expect(getDurability(pool, 'q1')).toBe('low')
    pool = answerQuery(pool, 'q1', 'restate')
    expect(getDurability(pool, 'q1')).toBe('high')
    expect(answeredCount(pool)).toBe(1) // still just the one query, re-answered
  })

  it('returns null durability for an unanswered query', () => {
    const pool = createCredibilityPool(definitions)
    expect(getDurability(pool, 'q1')).toBeNull()
  })

  it('throws on an unknown query id', () => {
    expect(() => answerQuery(createCredibilityPool(definitions), 'not-real', 'restate')).toThrow()
  })

  it('throws on an unknown option id for a real query', () => {
    expect(() => answerQuery(createCredibilityPool(definitions), 'q1', 'not-real')).toThrow()
  })

  it('does not mutate the pool it was given', () => {
    const pool = createCredibilityPool(definitions)
    const before = JSON.stringify(pool)
    answerQuery(pool, 'q1', 'restate')
    expect(JSON.stringify(pool)).toBe(before)
  })
})
