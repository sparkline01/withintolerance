import type { SignoffOutcome } from '../engine/finale'

/**
 * The emotional end of the cycle, per spec §10.3 — a short scene, not a
 * screen of numbers. The debrief with the actual numbers follows (step 8).
 */
const COPY: Record<SignoffOutcome, { heading: string; body: string }> = {
  signs: {
    heading: 'She signs.',
    body: 'No questions beyond the ones already answered. It is done.',
  },
  signs_conditionally: {
    heading: 'She signs, conditionally.',
    body: 'A note goes in the file. You will be asked about it again, once, in writing.',
  },
  does_not_sign: {
    heading: 'She does not sign.',
    body: 'Not today. There is a list, and your name is at the top of it.',
  },
}

export function SignoffScene({ outcome, onContinue }: { outcome: SignoffOutcome; onContinue: () => void }) {
  const copy = COPY[outcome]
  return (
    <section className="card signoff-scene">
      <h2>{copy.heading}</h2>
      <p className="card-context">{copy.body}</p>
      <button type="button" className="advance-button" onClick={onContinue}>
        Continue
      </button>
    </section>
  )
}
