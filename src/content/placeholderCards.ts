import type { DecisionCard } from '../engine/types'

/**
 * PLACEHOLDER content for wiring up the turn loop and dashboard (build
 * order step 3). Not the real 25-30 card set — that's step 4/6, written
 * to the §14.7 length cap and pressure-tested on an actual phone before
 * anything past it gets built. This exists only to prove the loop works
 * end to end with more than one card per turn and a turn with nothing
 * scheduled at all.
 */
export const placeholderCards: DecisionCard[] = [
  {
    id: 'sept-coding-manual',
    turn: 'September',
    trigger: 'scheduled',
    prompt: 'The collection has opened.',
    context: 'Nothing has gone wrong yet, which is the problem.',
    options: [
      {
        id: 'read-the-addendum',
        label: 'Read the coding manual addendum properly before extracting',
        currency: 'capacity',
        teaser: 'Costs a day now. Costs less later.',
        shown: [{ metric: 'timeliness', delta: -1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 1, delayTurns: 0 }],
      },
      {
        id: 'extract-first',
        label: 'Extract first, read the addendum if something looks wrong',
        currency: 'accuracy',
        teaser: 'Faster. Something will look wrong in October.',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 3 }],
      },
    ],
  },
  {
    id: 'sept-team-briefing',
    turn: 'September',
    trigger: 'scheduled',
    prompt: 'Denise wants ten minutes to brief the team on this year’s changes.',
    context: 'Sam is being seconded to enrolment for six weeks starting this month.',
    options: [
      {
        id: 'full-briefing',
        label: 'Give the team the full picture, including the secondment',
        currency: 'capacity',
        teaser: 'They will plan around it instead of being blindsided.',
        shown: [{ metric: 'team_capacity', delta: 1, delayTurns: 0 }],
        hidden: [],
      },
      {
        id: 'self-handle-it',
        label: 'Handle the gap yourself and brief the team later',
        currency: 'self',
        teaser: 'One less thing on the agenda this week.',
        shown: [],
        hidden: [{ metric: 'you', delta: -1, delayTurns: 0 }],
      },
    ],
  },
  {
    id: 'oct-entry-quals-uncoded',
    turn: 'October',
    trigger: 'scheduled',
    prompt: 'The entry qualifications are not coded.',
    context:
      'Admissions have coded 3,100 of 4,600. Ruth says they are on it. Ruth said that last year, in February.',
    options: [
      {
        id: 'work-through-with-ruth',
        label: "Book a room and work through them with Ruth's team",
        currency: 'capacity',
        teaser: 'Four days. They will be right, and they will be right next year too.',
        sourceFix: true,
        shown: [{ metric: 'team_capacity', delta: -2, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 3, delayTurns: 0 }],
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
  // November deliberately has no scheduled card yet, to prove the turn
  // loop copes with a quiet turn — this is exactly what §9 turn 4
  // (December, "the quiet month that is not") will eventually replace.
]
