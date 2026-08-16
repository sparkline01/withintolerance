import { describe, expect, it } from 'vitest'
import { AUDIT_ACTIVE_FLAG } from '../engine/state'
import { cards as coreCards } from './cards'
import { allFlavorEvents } from './flavorEvents'
import { handoverVariants } from './handoverVariants'
import { placeholderDependencyPool } from './placeholderDependencies'
import { thingsDoneToYouPool } from './thingsDoneToYou'

const allCards = [...coreCards, ...thingsDoneToYouPool]
const dependencyIds = new Set(placeholderDependencyPool.definitions.map((d) => d.id))

describe('card ids', () => {
  it('are unique across the core set and the things-done-to-you pool', () => {
    const ids = allCards.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('are unique within each card\'s own options', () => {
    for (const card of allCards) {
      const ids = card.options.map((o) => o.id)
      expect(new Set(ids).size, `duplicate option id on ${card.id}`).toBe(ids.length)
    }
  })
})

describe('conditional cards', () => {
  it('every `requires` flag is actually set somewhere (an option, a handover variant, or the audit roll)', () => {
    const settableFlags = new Set<string>(['audit_fires'])
    for (const card of allCards) {
      for (const option of card.options) {
        for (const flag of option.setsFlags ?? []) settableFlags.add(flag)
      }
    }
    for (const variant of handoverVariants) {
      for (const flag of variant.latentFlags) settableFlags.add(flag)
    }

    for (const card of allCards) {
      if (card.trigger !== 'conditional') continue
      for (const flag of card.requires ?? []) {
        expect(settableFlags.has(flag), `"${card.id}" requires unsettable flag "${flag}"`).toBe(true)
      }
    }
  })

  it('every conditional card actually declares at least one `requires` flag', () => {
    for (const card of allCards) {
      if (card.trigger === 'conditional') {
        expect(card.requires && card.requires.length > 0, `"${card.id}" is conditional but requires nothing`).toBe(
          true,
        )
      }
    }
  })
})

describe('unlocks', () => {
  it('every unlocks target is a real card id', () => {
    const allIds = new Set(allCards.map((c) => c.id))
    for (const card of allCards) {
      for (const option of card.options) {
        for (const target of option.unlocks ?? []) {
          expect(allIds.has(target), `"${card.id}:${option.id}" unlocks unknown card "${target}"`).toBe(true)
        }
      }
    }
  })
})

describe('dependencyAction references', () => {
  it('every dependencyAction points at a real dependency id', () => {
    for (const card of allCards) {
      for (const option of card.options) {
        if (option.dependencyAction) {
          expect(
            dependencyIds.has(option.dependencyAction.dependencyId),
            `"${card.id}:${option.id}" references unknown dependency "${option.dependencyAction.dependencyId}"`,
          ).toBe(true)
        }
      }
    }
  })
})

describe('audit flag naming', () => {
  it('the literal "audit_active" string used in content matches AUDIT_ACTIVE_FLAG in state.ts', () => {
    const auditCard = coreCards.find((c) => c.id === 'feb-ofs-audit-branch')
    expect(auditCard).toBeDefined()
    for (const option of auditCard!.options) {
      expect(option.setsFlags).toContain(AUDIT_ACTIVE_FLAG)
    }
  })
})

describe('flavor event attribution', () => {
  it('every attributedTo value matches a real cardId:optionId pair', () => {
    const validPairs = new Set<string>()
    for (const card of allCards) {
      for (const option of card.options) validPairs.add(`${card.id}:${option.id}`)
    }
    for (const event of allFlavorEvents) {
      if (event.attributedTo) {
        expect(validPairs.has(event.attributedTo), `flavor event "${event.id}" attributed to unknown "${event.attributedTo}"`).toBe(
          true,
        )
      }
    }
  })

  it('flavor event ids are unique', () => {
    const ids = allFlavorEvents.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('no flavor event effect touches accuracy or you — those channels are hidden by design', () => {
    for (const event of allFlavorEvents) {
      for (const effect of event.effects) {
        expect(['accuracy', 'you']).not.toContain(effect.metric)
      }
    }
  })
})

describe('handover variant dependency overrides', () => {
  it('every override key is a real dependency id', () => {
    for (const variant of handoverVariants) {
      for (const depId of Object.keys(variant.dependencyReadinessOverrides ?? {})) {
        expect(dependencyIds.has(depId), `handover "${variant.id}" overrides unknown dependency "${depId}"`).toBe(
          true,
        )
      }
    }
  })

  it('handover variant ids are unique', () => {
    const ids = handoverVariants.map((v) => v.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
