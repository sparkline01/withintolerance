import { useMemo, useState } from 'react'
import type { ErrorPool } from '../engine/cascade'
import type { CredibilityQueryDefinition } from '../engine/credibility'
import {
  type AxisSummary,
  type BandedAxis,
  type ForecastRow,
  computeAxisSummaries,
  computeCounterfactuals,
  computeFinalAccuracy,
  computeSelfCount,
  counterfactualSentence,
  forecastTable,
} from '../engine/debrief'
import type { InitialPools } from '../engine/state'
import type { DecisionCard, GameState } from '../engine/types'
import { DigitGrid } from './DigitGrid'
import { ForecastChart } from './ForecastChart'

const AXIS_LABEL: Record<BandedAxis, string> = {
  accuracy: 'Accuracy',
  timeliness: 'Timeliness and compliance',
  downstream: 'How it looks downstream',
  goodwill: 'Institutional goodwill',
  team_capacity: 'Team capacity',
}

function buildShareText(axisSummaries: AxisSummary[], forecast: ForecastRow[]): string {
  const last = forecast[forecast.length - 1]
  const gap = last ? Math.abs(last.truth - last.shown) : 0
  return [
    'WITHIN TOLERANCE',
    ...axisSummaries.map((s) => `${AXIS_LABEL[s.axis]}: ${s.band.label}`),
    `Accuracy gap at close: ${gap} points.`,
  ].join('\n')
}

/**
 * The debrief (spec §12). Opens with the reveal (§12.1/§12.4) before any
 * scoring, per the spec's own ordering — the payoff of the whole
 * shown/truth architecture should land first.
 */
export function Debrief({
  state,
  seed,
  cards,
  credibilityDefinitions,
  pools,
  finaleErrors,
  onContinue,
}: {
  state: GameState
  seed: number
  cards: DecisionCard[]
  credibilityDefinitions: CredibilityQueryDefinition[]
  pools: InitialPools
  finaleErrors: ErrorPool | null
  onContinue: () => void
}) {
  const [copied, setCopied] = useState(false)

  const finalAccuracy = useMemo(
    () => computeFinalAccuracy(state, finaleErrors ?? undefined),
    [state, finaleErrors],
  )
  const axisSummaries = useMemo(() => computeAxisSummaries(state, finalAccuracy), [state, finalAccuracy])
  const selfCount = useMemo(() => computeSelfCount(state, cards), [state, cards])
  const forecast = useMemo(() => forecastTable(state), [state])
  const counterfactuals = useMemo(
    () => computeCounterfactuals(seed, cards, credibilityDefinitions, pools, state.actionLog, state.turnIndex, 3),
    [seed, cards, credibilityDefinitions, pools, state],
  )
  const shareText = useMemo(() => buildShareText(axisSummaries, forecast), [axisSummaries, forecast])

  return (
    <div className="debrief">
      <h2>Debrief</h2>

      <section className="debrief-section">
        <h3>Shown vs true</h3>
        <p className="digit-grid-resolve-label">Accuracy, resolved</p>
        <p className="dashboard-value digit-grid-large">
          <DigitGrid value={forecast[forecast.length - 1]?.shown ?? 0} ghostValue={finalAccuracy} resolved />
        </p>
        <ForecastChart rows={forecast} />
        <p className="chart-legend">
          <span className="legend-shown">— shown</span> <span className="legend-truth">— true</span>
        </p>
      </section>

      <section className="debrief-section">
        <h3>Where you landed</h3>
        <ul className="axis-list">
          {axisSummaries.map((s) => (
            <li key={s.axis}>
              <strong>{AXIS_LABEL[s.axis]}</strong>: {s.band.label} ({s.value >= 0 ? '+' : ''}
              {s.value})
            </li>
          ))}
        </ul>
        <p className="debrief-note">You cannot win all five. That is not a flaw in the scoring.</p>
      </section>

      <section className="debrief-section">
        <h3>Three decisions that decided it</h3>
        {counterfactuals.length === 0 ? (
          <p>Nothing you did moved the number enough to isolate.</p>
        ) : (
          <ul className="counterfactual-list">
            {counterfactuals.map((c, i) => (
              <li key={i}>{counterfactualSentence(c)}</li>
            ))}
          </ul>
        )}
      </section>

      <details className="debrief-section">
        <summary>Forecast accuracy, turn by turn</summary>
        <table>
          <thead>
            <tr>
              <th>Turn</th>
              <th>Shown</th>
              <th>True</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {forecast.map((row) => (
              <tr key={row.turnIndex}>
                <td>{row.turn}</td>
                <td>{row.shown}</td>
                <td>{row.truth}</td>
                <td>
                  {row.error >= 0 ? '+' : ''}
                  {row.error}
                  {row.errorPercent !== null && ` (${row.errorPercent.toFixed(0)}%)`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <section className="debrief-section">
        <p>
          You took {selfCount.totalDecisions} decisions. {selfCount.selfDecisions} of them were somebody else's
          job.
        </p>
      </section>

      <section className="debrief-section">
        <h3>Share it</h3>
        <pre className="share-text">{shareText}</pre>
        <button
          type="button"
          className="advance-button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(shareText)
              setCopied(true)
            } catch {
              setCopied(false)
            }
          }}
        >
          {copied ? 'Copied' : 'Copy for posting'}
        </button>
      </section>

      <button type="button" className="advance-button" onClick={onContinue}>
        See what happens next
      </button>
    </div>
  )
}
