import { describe, expect, it } from 'vitest'
import { cards as coreCards } from './cards'
import { allFlavorEvents } from './flavorEvents'
import { handoverVariants } from './handoverVariants'
import { selectRunContent } from './selectRun'
import { thingsDoneToYouPool } from './thingsDoneToYou'

describe('selectRunContent', () => {
  it('is deterministic for a given seed', () => {
    const a = selectRunContent(12345)
    const b = selectRunContent(12345)
    expect(a.handover.id).toBe(b.handover.id)
    expect(a.cards.map((c) => c.id)).toEqual(b.cards.map((c) => c.id))
    expect(a.flavorEvents.map((e) => e.id)).toEqual(b.flavorEvents.map((e) => e.id))
    expect(a.credibilityDefinitions.map((q) => q.id)).toEqual(b.credibilityDefinitions.map((q) => q.id))
    expect(a.initialFlags).toEqual(b.initialFlags)
  })

  it('picks a real handover variant', () => {
    const content = selectRunContent(1)
    expect(handoverVariants.map((v) => v.id)).toContain(content.handover.id)
  })

  it('includes every core card, plus a drawn subset of things-done-to-you', () => {
    const content = selectRunContent(1)
    for (const card of coreCards) {
      expect(content.cards.some((c) => c.id === card.id)).toBe(true)
    }
    const drawnThingsDoneToYou = content.cards.filter((c) =>
      thingsDoneToYouPool.some((t) => t.id === c.id),
    )
    expect(drawnThingsDoneToYou.length).toBe(8)
    expect(content.cards.length).toBe(coreCards.length + 8)
  })

  it('includes every attributed flavor event, plus a drawn subset of ambient ones', () => {
    const content = selectRunContent(1)
    const attributedIds = allFlavorEvents.filter((e) => e.attributedTo).map((e) => e.id)
    for (const id of attributedIds) {
      expect(content.flavorEvents.some((e) => e.id === id)).toBe(true)
    }
    expect(content.flavorEvents.length).toBe(attributedIds.length + 16)
  })

  it('draws exactly 5 credibility queries from the pool of 8', () => {
    const content = selectRunContent(1)
    expect(content.credibilityDefinitions).toHaveLength(5)
    const ids = new Set(content.credibilityDefinitions.map((q) => q.id))
    expect(ids.size).toBe(5) // no duplicates
  })

  it('sets audit_fires in initialFlags only on runs where the roll succeeds', () => {
    // Sweep a range of seeds; with 5 handover variants at varying audit
    // probabilities this should produce both outcomes across a wide sweep.
    const outcomes = new Set<boolean>()
    for (let seed = 0; seed < 200; seed++) {
      const content = selectRunContent(seed)
      outcomes.add(content.initialFlags.includes('audit_fires'))
    }
    expect(outcomes.has(true)).toBe(true)
    expect(outcomes.has(false)).toBe(true)
  })

  it('always includes every handover variant\'s own latent flags', () => {
    const content = selectRunContent(7)
    for (const flag of content.handover.latentFlags) {
      expect(content.initialFlags).toContain(flag)
    }
  })

  it('different seeds can select different handover variants', () => {
    const seen = new Set<string>()
    for (let seed = 0; seed < 50; seed++) {
      seen.add(selectRunContent(seed).handover.id)
    }
    expect(seen.size).toBeGreaterThan(1)
  })
})
