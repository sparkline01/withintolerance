import { useEffect, useRef, useState } from 'react'
import type { ErrorDefinition, ErrorResolution } from '../engine/cascade'
import { totalOpenErrors } from '../engine/cascade'
import {
  createFinaleState,
  currentVignette,
  expireClock,
  FINALE_CLOCK_SECONDS,
  type FinaleState,
  type FinaleVignette,
  isQueueComplete,
  resolveCurrentVignette,
} from '../engine/finale'

const URGENT_THRESHOLD_SECONDS = 15

/**
 * The real-time queue (spec §10.2). Structurally different from every
 * other screen: a wall-clock countdown instead of turn-based pacing.
 * What matters for determinism (spec §2) is the LOGGED SEQUENCE of
 * resolutions, not the exact timing of a given playthrough — the clock is
 * the pressure that produces that sequence, same as the rest of the game
 * is produced by a decision log.
 *
 * Mobile treatment (spec §13.4): a top-edge bar rather than a dominant
 * numeric clock — this is the one place motion is justified at all.
 */
export function FinaleQueue({
  definitions,
  vignettes,
  onComplete,
}: {
  definitions: ErrorDefinition[]
  vignettes: FinaleVignette[]
  onComplete: (state: FinaleState) => void
}) {
  const [state, setState] = useState<FinaleState>(() => createFinaleState(definitions, vignettes))
  const notifiedRef = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (isQueueComplete(prev)) return prev
        const remaining = prev.clockSecondsRemaining - 1
        return remaining <= 0 ? expireClock(prev) : { ...prev, clockSecondsRemaining: remaining }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isQueueComplete(state) && !notifiedRef.current) {
      notifiedRef.current = true
      onComplete(state)
    }
  }, [state, onComplete])

  const vignette = currentVignette(state)
  const definition = vignette ? definitions.find((d) => d.id === vignette.errorId) : undefined
  const openCount = totalOpenErrors(state.pool)
  const stillHolding = vignettes.length - state.currentIndex
  const urgent = state.clockSecondsRemaining <= URGENT_THRESHOLD_SECONDS

  const resolve = (resolution: ErrorResolution) => setState((prev) => resolveCurrentVignette(prev, resolution))

  if (isQueueComplete(state) || !vignette || !definition) {
    return (
      <section className="card finale-complete">
        <p>{state.timeExpired ? '0:00. Phones off.' : 'Phones off. You got to all of them.'}</p>
        <p className="card-context">{openCount} still open.</p>
      </section>
    )
  }

  const minutes = Math.floor(state.clockSecondsRemaining / 60)
  const seconds = String(state.clockSecondsRemaining % 60).padStart(2, '0')

  return (
    <section className="card finale-queue">
      <div
        className="finale-bar-track"
        role="progressbar"
        aria-label="Time remaining"
        aria-valuenow={state.clockSecondsRemaining}
        aria-valuemin={0}
        aria-valuemax={FINALE_CLOCK_SECONDS}
      >
        <div
          className={urgent ? 'finale-bar-fill finale-bar-urgent' : 'finale-bar-fill'}
          style={{ width: `${(state.clockSecondsRemaining / FINALE_CLOCK_SECONDS) * 100}%` }}
        />
      </div>
      <div className={urgent ? 'finale-clock finale-clock-urgent' : 'finale-clock'}>
        {minutes}:{seconds}
        <span className="finale-holding"> — {stillHolding} still holding</span>
      </div>
      <h2>
        {vignette.course}. {definition.label}.
      </h2>
      <p className="card-context">
        Student {vignette.studentRef} — Tier {definition.tier}, {definition.ruleCode}
      </p>
      <p className="card-context">{vignette.humanContext}</p>
      <div className="card-options">
        <button type="button" className="card-option" onClick={() => resolve('source_fix')}>
          <span className="option-label">Fix at source</span>
          <span className="option-teaser">8 seconds off the clock.</span>
        </button>
        <button type="button" className="card-option" onClick={() => resolve('extract_fix')}>
          <span className="option-label">Override</span>
          <span className="option-teaser">1 second off the clock.</span>
        </button>
        <button type="button" className="card-option card-option-tolerance" onClick={() => resolve('unresolved')}>
          <span className="option-label">Leave in tolerance</span>
          <span className="option-teaser">Free.</span>
        </button>
      </div>
    </section>
  )
}
