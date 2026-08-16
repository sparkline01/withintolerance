import { useEffect, useRef, useState } from 'react'
import type { ErrorDefinition, ErrorResolution } from '../engine/cascade'
import { totalOpenErrors } from '../engine/cascade'
import {
  createFinaleState,
  currentVignette,
  expireClock,
  type FinaleState,
  type FinaleVignette,
  isQueueComplete,
  resolveCurrentVignette,
} from '../engine/finale'

/**
 * The real-time queue (spec §10.2). Structurally different from every
 * other screen: a wall-clock countdown instead of turn-based pacing.
 * What matters for determinism (spec §2) is the LOGGED SEQUENCE of
 * resolutions, not the exact timing of a given playthrough — the clock is
 * the pressure that produces that sequence, same as the rest of the game
 * is produced by a decision log.
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
      <div className={state.clockSecondsRemaining <= 15 ? 'finale-clock finale-clock-urgent' : 'finale-clock'}>
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
        <button type="button" className="card-option" onClick={() => resolve('unresolved')}>
          <span className="option-label">Leave in tolerance</span>
          <span className="option-teaser">Free.</span>
        </button>
      </div>
    </section>
  )
}
