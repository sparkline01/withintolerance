import type { DecisionCard } from '../engine/types'

/**
 * Renders one decision card. Deliberately no visual distinction between
 * currencies (icon, colour) — spec §13.4: "the player should not be able
 * to pattern-match 'the safe one' without reading the teaser." Unstyled
 * per build order step 3; the visual pass is step 10.
 */
export function Card({
  card,
  onChoose,
}: {
  card: DecisionCard
  onChoose: (optionId: string) => void
}) {
  return (
    <section className="card">
      <h2>{card.prompt}</h2>
      <p className="card-context">{card.context}</p>
      <div className="card-options">
        {card.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="card-option"
            onClick={() => onChoose(option.id)}
          >
            <span className="option-label">{option.label}</span>
            <span className="option-teaser">{option.teaser}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
