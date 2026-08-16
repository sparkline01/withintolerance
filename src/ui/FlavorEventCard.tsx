import type { FlavorEvent } from '../engine/types'

/**
 * A flavor event has no choices, per spec §5.3 — just an acknowledgement.
 * Unstyled per build order step 3; matches Card.tsx's tap-target sizing.
 */
export function FlavorEventCard({ event, onAcknowledge }: { event: FlavorEvent; onAcknowledge: () => void }) {
  return (
    <section className="card flavor-event">
      <h2>{event.headline}</h2>
      <p className="card-context">{event.body}</p>
      <button type="button" className="advance-button" onClick={onAcknowledge}>
        Right. Next.
      </button>
    </section>
  )
}
