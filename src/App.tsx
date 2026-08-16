import { cards } from './content/cards'
import { placeholderErrorPool, placeholderPopulation } from './content/placeholderErrors'
import { TURN_SEQUENCE } from './engine/types'
import { Card } from './ui/Card'
import { Dashboard } from './ui/Dashboard'
import { useGame } from './ui/useGame'

// Fixed for now so a reload doesn't reshuffle anything mid-build. Seed
// selection (e.g. from a shared link) is a later concern.
const SEED = 20260816

function App() {
  const { state, decide, advance } = useGame(SEED, placeholderErrorPool)

  const decidedThisTurn = new Set(
    state.decisions.filter((d) => d.turnIndex === state.turnIndex).map((d) => d.cardId),
  )
  const pendingCards = cards.filter(
    (card) => card.turn === state.turn && !decidedThisTurn.has(card.id),
  )
  const activeCard = pendingCards[0]
  const isFinalTurn = state.turnIndex >= TURN_SEQUENCE.length - 1

  return (
    <main className="app">
      <header className="app-header">
        <h1>Within Tolerance</h1>
        <p className="turn-label">{state.turn}</p>
      </header>

      <Dashboard state={state} errors={state.errors} population={placeholderPopulation} />

      {activeCard ? (
        <Card card={activeCard} onChoose={(optionId) => decide(activeCard, optionId)} />
      ) : (
        <section className="card">
          <p>Nothing else due this turn.</p>
          {isFinalTurn ? (
            <p className="dev-note">
              End of implemented turns — the finale module (spec §10) lands in build order step 7.
            </p>
          ) : (
            <button type="button" className="advance-button" onClick={advance}>
              Advance to {TURN_SEQUENCE[state.turnIndex + 1]}
            </button>
          )}
        </section>
      )}
    </main>
  )
}

export default App
