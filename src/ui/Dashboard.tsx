import { useEffect, useRef, useState } from 'react'
import { openErrorsByTier, totalOpenErrors } from '../engine/cascade'
import { displayState, type DependencyDisplayState } from '../engine/dependencies'
import { deriveReadiness } from '../engine/signoff'
import { DEADLINE_TURN_INDEX, TURN_SEQUENCE, type GameState } from '../engine/types'
import { DigitGrid } from './DigitGrid'

const CONFIDENCE_LABELS = [
  'Extract only',
  'Partially validated',
  'Within tolerance',
  'Submitted, unsigned',
] as const

const DEPENDENCY_CHIP_LABEL: Record<DependencyDisplayState, string> = {
  ready: 'Ready',
  partial: 'Partial',
  not_started: 'Not started',
  chased: 'Chased',
  no_reply: 'Nobody has replied',
}

function confidenceLabel(turnIndex: number): string {
  const progress = turnIndex / (TURN_SEQUENCE.length - 1)
  const index = Math.min(
    CONFIDENCE_LABELS.length - 1,
    Math.floor(progress * CONFIDENCE_LABELS.length),
  )
  return CONFIDENCE_LABELS[index]
}

/**
 * Note what is deliberately NOT here, per spec §5.8: accuracy, and `you`.
 * Those never appear until the debrief. Confidence is shown as a bar per
 * spec, but never as the accountable officer's reasoning — just the number.
 *
 * Mobile treatment: a collapsed three-item strip (records in the return,
 * open errors with delta, days to deadline) with everything else behind a
 * single "Full position" tap — per spec, this is thematically better than
 * the desktop version, not a compromise, so it's the only mode implemented
 * for now. The desktop always-expanded panel is a later pass.
 */
export function Dashboard({ state, population }: { state: GameState; population: number }) {
  const [expanded, setExpanded] = useState(false)
  const openTotal = totalOpenErrors(state.errors)
  const openByTier = openErrorsByTier(state.errors)
  const readiness = deriveReadiness({
    errors: state.errors,
    credibility: state.credibility,
    dependencies: state.dependencies,
  })

  const previousTurnIndex = useRef(state.turnIndex)
  const openAtTurnStart = useRef(openTotal)
  useEffect(() => {
    if (previousTurnIndex.current !== state.turnIndex) {
      previousTurnIndex.current = state.turnIndex
      openAtTurnStart.current = openTotal
    }
    // Only reset the baseline when the turn actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.turnIndex])
  const delta = openTotal - openAtTurnStart.current

  const recordsInReturn = population - openByTier[1]
  const turnsToDeadline = DEADLINE_TURN_INDEX - state.turnIndex
  const pastDeadline = turnsToDeadline < 0

  return (
    <div className="dashboard">
      <div className="dashboard-strip">
        <div className="dashboard-item dashboard-item-headline">
          <span className="dashboard-label">Records in the return</span>
          <span className="dashboard-value">
            <DigitGrid value={recordsInReturn} ghostValue={Math.round(recordsInReturn + state.truth.accuracy)} />
          </span>
          <span className="dashboard-sub">{confidenceLabel(state.turnIndex)}</span>
        </div>
        <div className="dashboard-item">
          <span className="dashboard-label">Open errors</span>
          <span className={openTotal > 0 ? 'dashboard-value blocking' : 'dashboard-value'}>
            {openTotal}
            {delta !== 0 && (
              <span className={delta > 0 ? 'delta-up' : 'delta-down'}>
                {' '}
                ({delta > 0 ? '+' : ''}
                {delta})
              </span>
            )}
          </span>
        </div>
        <div className="dashboard-item">
          <span className="dashboard-label">{pastDeadline ? 'Days past deadline' : 'Turns to deadline'}</span>
          <span className={pastDeadline ? 'dashboard-value overdue' : 'dashboard-value'}>
            {pastDeadline ? Math.abs(turnsToDeadline) : turnsToDeadline}
          </span>
        </div>
      </div>

      <button type="button" className="full-position-toggle" onClick={() => setExpanded((v) => !v)}>
        {expanded ? 'Hide full position' : 'Full position'}
      </button>

      {expanded && (
        <div className="full-position">
          <p>
            Turn {state.turnIndex} of {TURN_SEQUENCE.length - 1} — {state.turn}
          </p>

          <p className="signoff-row">
            Readiness
            <progress max={1} value={readiness} /> {Math.round(readiness * 100)}%
          </p>
          <p className="signoff-row">
            Confidence
            <progress max={1} value={state.signoff.confidence} /> {Math.round(state.signoff.confidence * 100)}%
          </p>
          {state.signoff.escalationRung > 0 && (
            <p className="escalation-note">Escalation rung {state.signoff.escalationRung} of 5</p>
          )}

          <table>
            <thead>
              <tr>
                <th>Tier</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {([1, 2, 3, 4, 5] as const).map((tier) => (
                <tr key={tier}>
                  <td>Tier {tier}</td>
                  <td>{openByTier[tier]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table>
            <thead>
              <tr>
                <th>Metric (shown)</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Timeliness</td>
                <td>{state.shown.timeliness}</td>
              </tr>
              <tr>
                <td>Downstream</td>
                <td>{state.shown.downstream}</td>
              </tr>
              <tr>
                <td>Goodwill</td>
                <td>{state.shown.goodwill}</td>
              </tr>
              <tr>
                <td>Team capacity</td>
                <td>{state.shown.team_capacity}</td>
              </tr>
            </tbody>
          </table>

          <p className="dependency-heading">Source dependencies</p>
          <div className="dependency-chips">
            {state.dependencies.definitions.map((def) => (
              <span key={def.id} className={`dependency-chip chip-${displayState(state.dependencies, def.id)}`}>
                {def.label}: {DEPENDENCY_CHIP_LABEL[displayState(state.dependencies, def.id)]}
              </span>
            ))}
          </div>

          <p className="full-position-note">
            {state.credibility.definitions.length > 0
              ? `Credibility: ${Object.keys(state.credibility.answers).length} of ${state.credibility.definitions.length} queries answered.`
              : 'No open credibility queries.'}{' '}
            Team roster isn't modelled yet.
          </p>
        </div>
      )}
    </div>
  )
}
