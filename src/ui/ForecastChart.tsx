import type { ForecastRow } from '../engine/debrief'

const WIDTH = 320
const HEIGHT = 140
const PADDING = 20

/**
 * Shown vs truth for the accuracy axis across the whole cycle, gap shaded
 * (spec §12.1) — the payoff of the shown/truth split built in step 1. On
 * mobile this chart IS the forecast table (spec §12.4's mobile
 * treatment); the turn-by-turn table below it is the desktop expansion.
 */
export function ForecastChart({ rows }: { rows: ForecastRow[] }) {
  if (rows.length === 0) return null

  const allValues = rows.flatMap((r) => [r.shown, r.truth])
  const min = Math.min(0, ...allValues)
  const max = Math.max(0, ...allValues)
  const range = max - min || 1

  const xStep = rows.length > 1 ? (WIDTH - PADDING * 2) / (rows.length - 1) : 0
  const xFor = (index: number) => PADDING + index * xStep
  const yFor = (value: number) => HEIGHT - PADDING - ((value - min) / range) * (HEIGHT - PADDING * 2)

  const shownPoints = rows.map((r, i) => `${xFor(i)},${yFor(r.shown)}`).join(' ')
  const truthPoints = rows.map((r, i) => `${xFor(i)},${yFor(r.truth)}`).join(' ')
  const gapPolygon = [
    ...rows.map((r, i) => `${xFor(i)},${yFor(r.shown)}`),
    ...rows
      .slice()
      .reverse()
      .map((r, i) => `${xFor(rows.length - 1 - i)},${yFor(r.truth)}`),
  ].join(' ')

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="forecast-chart"
      role="img"
      aria-label="Shown versus true accuracy across the cycle"
    >
      <polygon points={gapPolygon} className="forecast-gap" />
      <polyline points={shownPoints} className="forecast-line-shown" fill="none" />
      <polyline points={truthPoints} className="forecast-line-truth" fill="none" />
    </svg>
  )
}
