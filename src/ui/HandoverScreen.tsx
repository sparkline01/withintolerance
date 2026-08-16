import type { HandoverVariant } from '../engine/handover'

/**
 * The Handover turn (spec §9's turn 0: "Setup, no decisions, one click").
 * Establishes the opening premise — you are being scored on decisions you
 * did not make — before the cycle proper begins.
 */
export function HandoverScreen({ variant, onBegin }: { variant: HandoverVariant; onBegin: () => void }) {
  return (
    <section className="card handover-screen">
      <h2>{variant.title}</h2>
      {variant.note.split('\n\n').map((paragraph, i) => (
        <p key={i} className="handover-paragraph">
          {paragraph}
        </p>
      ))}
      <p className="handover-inherited">{variant.inherited}</p>
      <button type="button" className="advance-button" onClick={onBegin}>
        Open the cycle
      </button>
    </section>
  )
}
