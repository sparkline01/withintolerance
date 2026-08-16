import { pickOne, type Rng } from './prng'

/**
 * The handover note the cycle opens on (spec §8). Selected once per run by
 * seed, so it does three things at once: sets difficulty, provides replay
 * variety, and establishes the emotional opening — you are being scored on
 * decisions you did not make.
 */
export interface HandoverVariant {
  id: string
  /** The predecessor's name, used as the display title. */
  title: string
  /** The note itself, paragraphs separated by \n\n. */
  note: string
  /** Short italic summary shown under the note, e.g. "Inherited: ...". */
  inherited: string
  initialConfidence: number
  initialRecurringDebt: number
  /** 0-1. Whether the OfS audit branch (spec §9.2) fires this run is rolled once, at selection time. */
  auditProbability: number
  /** Dependency id -> starting readiness override, in place of that dependency's own default. */
  dependencyReadinessOverrides?: Record<string, number>
  latentFlags: string[]
}

export function selectHandoverVariant(rng: Rng, variants: readonly HandoverVariant[]): HandoverVariant {
  return pickOne(rng, variants)
}
