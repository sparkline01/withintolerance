import { createCredibilityPool, type CredibilityQueryDefinition } from '../engine/credibility'
import type { HandoverVariant } from '../engine/handover'
import { selectHandoverVariant } from '../engine/handover'
import { createRng, pickN } from '../engine/prng'
import type { DecisionCard, FlavorEvent } from '../engine/types'
import { allCredibilityDefinitions } from './placeholderCredibility'
import { cards as coreCards } from './cards'
import { allFlavorEvents } from './flavorEvents'
import { handoverVariants } from './handoverVariants'
import { thingsDoneToYouPool } from './thingsDoneToYou'

const AMBIENT_FLAVOR_DRAW_COUNT = 16
const CREDIBILITY_DRAW_COUNT = 5
const THINGS_DONE_TO_YOU_DRAW_COUNT = 8

export interface RunContent {
  handover: HandoverVariant
  cards: DecisionCard[]
  flavorEvents: FlavorEvent[]
  credibilityDefinitions: CredibilityQueryDefinition[]
  initialFlags: string[]
}

/**
 * Everything about a run that varies by seed but isn't itself game state:
 * which handover note opens the cycle, whether the OfS audit branch fires
 * (spec §9.2), and which subset of the flavor-event / credibility-query /
 * "things done to you" pools this playthrough draws (spec §15's "drawing
 * ~N per run" pools). One rng, consumed in a fixed order, so the whole
 * selection is as deterministic as the engine itself.
 */
export function selectRunContent(seed: number): RunContent {
  const rng = createRng(seed)

  const handover = selectHandoverVariant(rng, handoverVariants)
  const auditFires = rng() < handover.auditProbability

  const drawnThingsDoneToYou = pickN(rng, thingsDoneToYouPool, THINGS_DONE_TO_YOU_DRAW_COUNT)
  const cards = [...coreCards, ...drawnThingsDoneToYou]

  const attributed = allFlavorEvents.filter((e) => e.attributedTo)
  const ambientPool = allFlavorEvents.filter((e) => !e.attributedTo)
  const drawnAmbient = pickN(rng, ambientPool, AMBIENT_FLAVOR_DRAW_COUNT)
  const flavorEvents = [...attributed, ...drawnAmbient]

  const credibilityDefinitions = pickN(rng, allCredibilityDefinitions, CREDIBILITY_DRAW_COUNT)

  const initialFlags = [...handover.latentFlags]
  if (auditFires) initialFlags.push('audit_fires')

  return { handover, cards, flavorEvents, credibilityDefinitions, initialFlags }
}

export function credibilityPoolFrom(content: RunContent) {
  return createCredibilityPool(content.credibilityDefinitions)
}
