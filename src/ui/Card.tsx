import type { DecisionCard } from '../engine/types'
import { Avatar } from './Avatar'

/**
 * Renders one decision card. Deliberately no visual distinction between
 * currencies (icon, colour) — spec §13.4: "the player should not be able
 * to pattern-match 'the safe one' without reading the teaser."
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
      {card.npc && (
        <p className="card-npc">
          <Avatar name={card.npc.name} />
          <span>
            Have you got a minute? — <strong>{card.npc.name}</strong>, {card.npc.role}
          </span>
        </p>
      )}
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
