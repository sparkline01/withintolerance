import { useMemo } from 'react'
import { placeholderDependencyPool } from './content/placeholderDependencies'
import { placeholderErrorPool, placeholderPopulation } from './content/placeholderErrors'
import { pendingCredibilityQueries, pendingDecisionCards, pendingFlavorEvents } from './content/pending'
import { credibilityPoolFrom, selectRunContent } from './content/selectRun'
import type { CredibilityQueryDefinition } from './engine/credibility'
import type { DecisionCard, FlavorEvent } from './engine/types'
import { TURN_SEQUENCE } from './engine/types'
import { Card } from './ui/Card'
import { Dashboard } from './ui/Dashboard'
import { FlavorEventCard } from './ui/FlavorEventCard'
import { HandoverScreen } from './ui/HandoverScreen'
import { useGame } from './ui/useGame'

// Fixed for now so a reload doesn't reshuffle anything mid-build. Seed
// selection (e.g. from a shared link) is a later concern.
const SEED = 20260816

type PendingItem =
  | { kind: 'flavor'; event: FlavorEvent }
  | { kind: 'decision'; card: DecisionCard }
  | { kind: 'credibility'; query: CredibilityQueryDefinition }

function App() {
  const content = useMemo(() => selectRunContent(SEED), [])
  const { state, decide, advance, answerCredibilityQueryAction, acknowledgeFlavorEvent } = useGame(SEED, {
    errors: placeholderErrorPool,
    dependencies: placeholderDependencyPool,
    credibility: credibilityPoolFrom(content),
    handover: content.handover,
    initialFlags: content.initialFlags,
  })

  if (state.turn === 'Handover') {
    return (
      <main className="app">
        <header className="app-header">
          <h1>Within Tolerance</h1>
        </header>
        <HandoverScreen variant={content.handover} onBegin={advance} />
      </main>
    )
  }

  const pendingItems: PendingItem[] = [
    ...pendingFlavorEvents(content.flavorEvents, state).map((event) => ({ kind: 'flavor' as const, event })),
    ...pendingDecisionCards(content.cards, state).map((card) => ({ kind: 'decision' as const, card })),
    ...pendingCredibilityQueries(content.credibilityDefinitions, state).map((query) => ({
      kind: 'credibility' as const,
      query,
    })),
  ]
  const activeItem = pendingItems[0]
  const isFinalTurn = state.turnIndex >= TURN_SEQUENCE.length - 1

  return (
    <main className="app">
      <header className="app-header">
        <h1>Within Tolerance</h1>
        <p className="turn-label">{state.turn}</p>
      </header>

      <Dashboard state={state} population={placeholderPopulation} />

      {activeItem?.kind === 'flavor' && (
        <FlavorEventCard
          event={activeItem.event}
          onAcknowledge={() => acknowledgeFlavorEvent(activeItem.event)}
        />
      )}
      {activeItem?.kind === 'decision' && (
        <Card card={activeItem.card} onChoose={(optionId) => decide(activeItem.card, optionId)} />
      )}
      {activeItem?.kind === 'credibility' && (
        <section className="card">
          <h2>{activeItem.query.query}</h2>
          <div className="card-options">
            {activeItem.query.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className="card-option"
                onClick={() => answerCredibilityQueryAction(activeItem.query.id, option.id)}
              >
                <span className="option-label">{option.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}
      {!activeItem && (
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
