import { useMemo, useState } from 'react'
import { placeholderDependencyPool } from './content/placeholderDependencies'
import { placeholderErrorPool, placeholderPopulation } from './content/placeholderErrors'
import { pendingCredibilityQueries, pendingDecisionCards, pendingFlavorEvents } from './content/pending'
import { credibilityPoolFrom, selectRunContent } from './content/selectRun'
import type { ErrorPool } from './engine/cascade'
import { computeCoda } from './engine/coda'
import type { CredibilityQueryDefinition } from './engine/credibility'
import { determineSignoffOutcome, type FinaleState, type SignoffOutcome } from './engine/finale'
import { deriveReadiness } from './engine/signoff'
import type { DecisionCard, FlavorEvent } from './engine/types'
import { TURN_SEQUENCE } from './engine/types'
import { Card } from './ui/Card'
import { CodaSequence } from './ui/CodaSequence'
import { Dashboard } from './ui/Dashboard'
import { Debrief } from './ui/Debrief'
import { FinaleQueue } from './ui/FinaleQueue'
import { FlavorEventCard } from './ui/FlavorEventCard'
import { HandoverScreen } from './ui/HandoverScreen'
import { SignoffScene } from './ui/SignoffScene'
import { useGame } from './ui/useGame'

// Fixed for now so a reload doesn't reshuffle anything mid-build. Seed
// selection (e.g. from a shared link) is a later concern.
const SEED = 20260816

type PendingItem =
  | { kind: 'flavor'; event: FlavorEvent }
  | { kind: 'decision'; card: DecisionCard }
  | { kind: 'credibility'; query: CredibilityQueryDefinition }

type FinalePhase = 'cycle' | 'queue' | 'signoff' | 'debrief' | 'coda' | 'complete'

function App() {
  const content = useMemo(() => selectRunContent(SEED), [])
  const pools = useMemo(
    () => ({
      errors: placeholderErrorPool,
      dependencies: placeholderDependencyPool,
      credibility: credibilityPoolFrom(content),
      handover: content.handover,
      initialFlags: content.initialFlags,
    }),
    [content],
  )
  const { state, decide, advance, answerCredibilityQueryAction, acknowledgeFlavorEvent } = useGame(SEED, pools)

  const [finalePhase, setFinalePhase] = useState<FinalePhase>('cycle')
  const [signoffOutcome, setSignoffOutcome] = useState<SignoffOutcome | null>(null)
  const [finaleErrorPool, setFinaleErrorPool] = useState<ErrorPool | null>(null)

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

  const handleFinaleComplete = (finaleState: FinaleState) => {
    const readiness = deriveReadiness({
      errors: finaleState.pool,
      credibility: state.credibility,
      dependencies: state.dependencies,
    })
    setFinaleErrorPool(finaleState.pool)
    setSignoffOutcome(determineSignoffOutcome(readiness, state.signoff.confidence))
    setFinalePhase('signoff')
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>Within Tolerance</h1>
        <p className="turn-label">
          {finalePhase === 'cycle'
            ? state.turn
            : finalePhase === 'coda'
              ? 'The following November'
              : 'Confirmation, through the day'}
        </p>
      </header>

      {finalePhase === 'cycle' && <Dashboard state={state} population={placeholderPopulation} />}

      {finalePhase === 'cycle' && activeItem?.kind === 'flavor' && (
        <FlavorEventCard
          event={activeItem.event}
          onAcknowledge={() => acknowledgeFlavorEvent(activeItem.event)}
        />
      )}
      {finalePhase === 'cycle' && activeItem?.kind === 'decision' && (
        <Card card={activeItem.card} onChoose={(optionId) => decide(activeItem.card, optionId)} />
      )}
      {finalePhase === 'cycle' && activeItem?.kind === 'credibility' && (
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
      {finalePhase === 'cycle' && !activeItem && !isFinalTurn && (
        <section className="card">
          <p>Nothing else due this turn.</p>
          <button type="button" className="advance-button" onClick={advance}>
            Advance to {TURN_SEQUENCE[state.turnIndex + 1]}
          </button>
        </section>
      )}
      {finalePhase === 'cycle' && !activeItem && isFinalTurn && (
        <section className="card">
          <p>The setup is done. Confirmation opens.</p>
          <button type="button" className="advance-button" onClick={() => setFinalePhase('queue')}>
            Open the queue
          </button>
        </section>
      )}

      {finalePhase === 'queue' && (
        <FinaleQueue
          definitions={content.finaleErrorDefinitions}
          vignettes={content.finaleVignettes}
          onComplete={handleFinaleComplete}
        />
      )}

      {finalePhase === 'signoff' && signoffOutcome && (
        <SignoffScene outcome={signoffOutcome} onContinue={() => setFinalePhase('debrief')} />
      )}

      {finalePhase === 'debrief' && (
        <Debrief
          state={state}
          seed={SEED}
          cards={content.cards}
          credibilityDefinitions={content.credibilityDefinitions}
          pools={pools}
          finaleErrors={finaleErrorPool}
          onContinue={() => setFinalePhase('coda')}
        />
      )}

      {finalePhase === 'coda' && (
        <CodaSequence
          coda={computeCoda(SEED, state, content.cards, finaleErrorPool ?? undefined)}
          onComplete={() => setFinalePhase('complete')}
        />
      )}

      {finalePhase === 'complete' && (
        <section className="card">
          <p className="dev-note">
            That's the whole cycle, September to the following November. The visual design pass (spec §13)
            lands in build order step 10.
          </p>
        </section>
      )}
    </main>
  )
}

export default App
