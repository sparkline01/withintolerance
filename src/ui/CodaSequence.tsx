import { useState } from 'react'
import {
  type CodaContent,
  credibilityReturnsSentence,
  goodThingSentence,
  metricPublishesSentence,
  recurringDebtSentence,
} from '../engine/coda'

/**
 * The coda (spec §11): four fixed frames, set the following November.
 * Headlines stay fixed regardless of which branch a screen's content
 * falls into — only the body is templated from what actually happened.
 */
const FRAMES: Array<{ key: keyof CodaContent; headline: string; sentence: (coda: CodaContent) => string }> = [
  { key: 'metricPublishes', headline: 'A metric publishes.', sentence: (c) => metricPublishesSentence(c.metricPublishes) },
  { key: 'credibilityReturns', headline: 'Credibility, revisited.', sentence: (c) => credibilityReturnsSentence(c.credibilityReturns) },
  { key: 'recurringDebt', headline: 'The mapping, again.', sentence: (c) => recurringDebtSentence(c.recurringDebt) },
  { key: 'goodThing', headline: 'One thing holds.', sentence: (c) => goodThingSentence(c.goodThing) },
]

export function CodaSequence({ coda, onComplete }: { coda: CodaContent; onComplete: () => void }) {
  const [index, setIndex] = useState(0)
  const frame = FRAMES[index]
  const isLast = index === FRAMES.length - 1

  return (
    <section className="card coda-screen">
      <p className="coda-timestamp">The following November.</p>
      <h2>{frame.headline}</h2>
      <p className="card-context coda-body">{frame.sentence(coda)}</p>
      <button
        type="button"
        className="advance-button"
        onClick={() => (isLast ? onComplete() : setIndex((i) => i + 1))}
      >
        {isLast ? 'That was the cycle.' : 'Right. Next.'}
      </button>
    </section>
  )
}
