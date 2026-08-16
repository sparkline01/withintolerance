import { describe, expect, it } from 'vitest'
import { sampleCards } from './__fixtures__/sampleCards'
import { runScript, type ScriptStep } from './simulate'

// One full pass through the fixture cards, including a delayed hidden
// effect that lands two turns after the decision that scheduled it.
const script: ScriptStep[] = [
  { type: 'advance' }, // Handover -> September (turnIndex 1)
  { type: 'decide', cardId: 'sept-warmup', optionId: 'only-option' },
  { type: 'advance' }, // September -> October (turnIndex 2)
  { type: 'decide', cardId: 'oct-entry-quals-uncoded', optionId: 'escalate-to-pvc' },
  { type: 'advance' }, // October -> November (turnIndex 3) — nothing lands yet
  { type: 'advance' }, // November -> December (turnIndex 4) — delayed hidden accuracy lands
  { type: 'advance' }, // December -> January (turnIndex 5)
]

describe('effect scheduler', () => {
  it('applies immediate effects straight away', () => {
    const state = runScript(1, sampleCards, script.slice(0, 2))
    expect(state.shown.timeliness).toBe(1)
    expect(state.truth.accuracy).toBe(1)
  })

  it('keeps shown and hidden/truth effects on separate channels', () => {
    const state = runScript(1, sampleCards, script.slice(0, 4))
    // escalate-to-pvc: shown goodwill -2 immediate, hidden accuracy +2 delayed 2 turns
    expect(state.shown.goodwill).toBe(-2)
    expect(state.truth.accuracy).toBe(1) // only sept-warmup's +1 has landed so far
  })

  it('does not apply a delayed effect before its landing turn', () => {
    const state = runScript(1, sampleCards, script.slice(0, 5)) // through November
    expect(state.truth.accuracy).toBe(1)
    expect(state.scheduledEffects).toHaveLength(1)
  })

  it('applies a delayed effect exactly on its landing turn and then clears it', () => {
    const state = runScript(1, sampleCards, script.slice(0, 6)) // through December
    expect(state.truth.accuracy).toBe(3) // 1 (sept) + 2 (delayed escalate-to-pvc)
    expect(state.scheduledEffects).toHaveLength(0)
  })

  it('leaves the landed effect applied on later turns', () => {
    const state = runScript(1, sampleCards, script) // through January
    expect(state.truth.accuracy).toBe(3)
  })

  it('records flags set by a chosen option', () => {
    const withRuth: ScriptStep[] = [
      { type: 'advance' },
      { type: 'advance' },
      { type: 'decide', cardId: 'oct-entry-quals-uncoded', optionId: 'work-through-with-ruth' },
    ]
    const state = runScript(1, sampleCards, withRuth)
    expect(state.flags.has('ruth_owes_you_nothing_now')).toBe(true)
  })

  it('throws on an unknown option id', () => {
    const bad: ScriptStep[] = [
      { type: 'advance' },
      { type: 'advance' },
      { type: 'decide', cardId: 'oct-entry-quals-uncoded', optionId: 'not-a-real-option' },
    ]
    expect(() => runScript(1, sampleCards, bad)).toThrow()
  })
})

describe('determinism', () => {
  it('produces byte-for-byte identical output for the same seed and script', () => {
    const runA = runScript(42, sampleCards, script)
    const runB = runScript(42, sampleCards, script)

    // Sets don't survive JSON.stringify usefully, so compare flags separately.
    expect([...runA.flags].sort()).toEqual([...runB.flags].sort())
    expect(JSON.stringify({ ...runA, flags: undefined })).toBe(
      JSON.stringify({ ...runB, flags: undefined }),
    )
  })

  it('produces identical history logs across repeated runs', () => {
    const runA = runScript(99, sampleCards, script)
    const runB = runScript(99, sampleCards, script)
    expect(runA.history).toEqual(runB.history)
  })

  it('leaves earlier runs unaffected by a later, different script (no shared mutable state)', () => {
    const baseline = runScript(7, sampleCards, script.slice(0, 4))
    const baselineSnapshot = JSON.parse(
      JSON.stringify({ ...baseline, flags: [...baseline.flags] }),
    )

    // Run something else entirely from a fresh state.
    runScript(7, sampleCards, [
      { type: 'advance' },
      { type: 'advance' },
      { type: 'decide', cardId: 'oct-entry-quals-uncoded', optionId: 'take-it-home' },
    ])

    const after = JSON.parse(JSON.stringify({ ...baseline, flags: [...baseline.flags] }))
    expect(after).toEqual(baselineSnapshot)
  })
})
