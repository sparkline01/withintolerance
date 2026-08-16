import { useEffect, useRef, useState } from 'react'
import { openErrorsByTier, totalOpenErrors, type ErrorPool } from '../engine/cascade'
import { TURN_SEQUENCE, type GameState } from '../engine/types'

const CONFIDENCE_LABELS = [
  'Extract only',
  'Partially validated',
  'Within tolerance',
  'Submitted, unsigned',
] as const

/** Turn index the deadline falls on — matches "9 / May" in spec §9's turn table. */
const DEADLINE_TURN_INDEX = TURN_SEQUENCE.indexOf('May')

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
 * Those never appear until the debrief.
 *
 * Mobile treatment: a collapsed three-item strip (records in the return,
 * open errors with delta, days to deadline) with everything else behind a
 * single "Full position" tap — per spec, this is thematically better than
 * the desktop version, not a compromise, so it's the only mode implemented
 * for now. The desktop always-expanded panel is a later pass.
 */
export function Dashboard({
  state,
  errors,
  population,
}: {
  state: GameState
  errors: ErrorPool
  population: number
}) {
  const [expanded, setExpanded] = useState(false)
  const openTotal = totalOpenErrors(errors)
  const openByTier = openErrorsByTier(errors)

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
        <div className="dashboard-item">
          <span className="dashboard-label">Records in the return</span>
          <span className="dashboard-value">{recordsInReturn.toLocaleString()}</span>
          <span className="dashboard-sub">{confidenceLabel(state.turnIndex)}</span>
        </div>
        <div className="dashboard-item">
          <span className="dashboard-label">Open errors</span>
          <span className="dashboard-value">
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
          <p className="full-position-note">
            Team roster, source dependencies, credibility queries, and sign-off gates aren't modelled
            yet — build order step 5.
          </p>
        </div>
      )}
    </div>
  )
}
