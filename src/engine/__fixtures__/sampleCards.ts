import type { DecisionCard } from '../types'

/**
 * Test-only fixture cards. NOT real content — real card authoring is build
 * order step 6 (spec §16). These exist purely to exercise the engine
 * (immediate effects, delayed/scheduled effects, flags) in engine tests.
 */
export const sampleCards: DecisionCard[] = [
  {
    id: 'sept-warmup',
    turn: 'September',
    trigger: 'scheduled',
    prompt: 'The collection has opened.',
    context: 'Nothing has gone wrong yet, which is the problem.',
    options: [
      {
        id: 'only-option',
        label: 'Open the extract',
        currency: 'capacity',
        teaser: 'Someone has to look at it first.',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 1, delayTurns: 0 }],
      },
    ],
  },
  // Verbatim from docs/spec.md §5.1.
  {
    id: 'oct-entry-quals-uncoded',
    turn: 'October',
    trigger: 'scheduled',
    prompt: 'The entry qualifications are not coded.',
    context:
      "Admissions have coded 3,100 of 4,600. Ruth says they are on it. Ruth said that last year, in February.",
    options: [
      {
        id: 'work-through-with-ruth',
        label: "Book a room and work through them with Ruth's team",
        currency: 'capacity',
        teaser: 'Four days. They will be right, and they will be right next year too.',
        sourceFix: true,
        shown: [{ metric: 'team_capacity', delta: -2, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 3, delayTurns: 0 }],
        unlocks: [],
        setsFlags: ['ruth_owes_you_nothing_now'],
      },
      {
        id: 'default-to-modal',
        label: 'Default the uncoded ones to the modal value for the course',
        currency: 'accuracy',
        teaser: 'It will pass. Most of them will even be correct.',
        sourceFix: false,
        shown: [{ metric: 'timeliness', delta: 2, delayTurns: 0 }],
        hidden: [
          { metric: 'accuracy', delta: -3, delayTurns: 0 },
          { metric: 'recurring_debt', delta: 1, delayTurns: 0 },
        ],
      },
      {
        id: 'escalate-to-pvc',
        label: 'Raise it with the PVC as a risk to submission',
        currency: 'goodwill',
        teaser: 'It will move. Ruth will hear about it from someone else first.',
        shown: [{ metric: 'goodwill', delta: -2, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 2, delayTurns: 2 }],
        unlocks: ['jan-ruth-remembers'],
      },
      {
        id: 'take-it-home',
        label: 'Take the extract home and do them yourself',
        currency: 'self',
        teaser: 'Nobody needs to know it took two weekends.',
        shown: [],
        hidden: [
          { metric: 'accuracy', delta: 2, delayTurns: 0 },
          { metric: 'you', delta: -2, delayTurns: 0 },
        ],
      },
    ],
  },
]
