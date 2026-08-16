import { createCredibilityPool, type CredibilityQueryDefinition } from '../engine/credibility'

/**
 * The full 8 credibility queries (spec §15). A run draws 4-5 of these via
 * selectRun.ts, not all 8. Numbers and scenarios are illustrative (§0) —
 * the first two reuse/extend the spec's own worked examples (§5.7).
 */
const definitions: CredibilityQueryDefinition[] = [
  {
    id: 'feb-part-time-drop',
    turn: 'February',
    query: 'A 40% fall in part-time first degree headcount.',
    truth: 'Two courses moved to a partner in 2023 and the mapping never followed them.',
    options: [
      {
        id: 'restate',
        label: 'Restate the courses correctly and resubmit the affected records',
        durability: 'high',
        shown: [{ metric: 'team_capacity', delta: -3, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 2, delayTurns: 0 }],
      },
      {
        id: 'demand',
        label: 'Explain it as a genuine change in part-time demand, which is also happening',
        durability: 'low',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 0 }],
      },
      {
        id: 'portfolio',
        label: 'Explain it as a coding change following a portfolio review',
        durability: 'medium',
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
  {
    id: 'jan-engineering-dip',
    turn: 'January',
    query: 'Engineering applications are down against every comparator.',
    truth: 'A clearing partner undercut on entry requirements and nobody flagged it.',
    options: [
      {
        id: 'sector-trend',
        label: 'Frame it as a sector-wide trend this cycle',
        durability: 'low',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 0 }],
      },
      {
        id: 'entry-tariff-review',
        label: 'Frame it as a deliberate entry-tariff review',
        durability: 'medium',
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
      {
        id: 'name-the-cause',
        label: 'Name the competitor pricing pressure directly',
        durability: 'high',
        shown: [
          { metric: 'team_capacity', delta: -2, delayTurns: 0 },
          { metric: 'goodwill', delta: -1, delayTurns: 0 },
        ],
        hidden: [{ metric: 'accuracy', delta: 1, delayTurns: 0 }],
      },
    ],
  },
  {
    id: 'oct-international-surge',
    turn: 'October',
    query: 'International enrolments are up 30% against the plan.',
    truth: 'A partner recruitment agent double-counted applicants who later withdrew.',
    options: [
      {
        id: 'reconcile',
        label: "Reconcile against the agent's raw list and correct it",
        durability: 'high',
        shown: [{ metric: 'team_capacity', delta: -2, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 2, delayTurns: 0 }],
      },
      {
        id: 'report-as-given',
        label: 'Report the number as given',
        durability: 'low',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -2, delayTurns: 0 }],
      },
      {
        id: 'caveat-provisional',
        label: 'Caveat it as provisional pending agent reconciliation',
        durability: 'medium',
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
  {
    id: 'nov-access-intake-query',
    turn: 'November',
    query: 'Access intake looks lower than the strategic plan committed to.',
    truth: 'Two widening-participation flags were dropped in a coding manual update in September.',
    options: [
      {
        id: 'reflag-properly',
        label: 'Re-flag the affected records properly',
        durability: 'high',
        shown: [{ metric: 'team_capacity', delta: -2, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 2, delayTurns: 0 }],
      },
      {
        id: 'softer-pool',
        label: 'Report it as a softer applicant pool from target schools',
        durability: 'low',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 0 }],
      },
      {
        id: 'one-year-dip',
        label: 'Report it as a one-year dip and monitor next cycle',
        durability: 'medium',
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
  {
    id: 'dec-business-league-jump',
    turn: 'December',
    query: 'Business school jumped fourteen places in an unofficial table.',
    truth: "A competitor's numbers dropped, not yours; the table doesn't say that.",
    options: [
      {
        id: 'correct-the-record',
        label: "Correct the record and note it's relative, not absolute",
        durability: 'high',
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
      {
        id: 'let-marketing-run-with-it',
        label: 'Let Marketing run with it',
        durability: 'low',
        shown: [{ metric: 'goodwill', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 0 }],
      },
      {
        id: 'note-internally',
        label: 'Note it internally, say nothing publicly',
        durability: 'medium',
        shown: [],
        hidden: [],
      },
    ],
  },
  {
    id: 'mar-nursing-numbers-query',
    turn: 'March',
    query: 'Nursing numbers are 200 below the funded number.',
    truth: 'A validation rule silently excluded records with a missing placement-hours field.',
    options: [
      {
        id: 'fix-the-rule',
        label: 'Fix the validation rule and resubmit the excluded records',
        durability: 'high',
        shown: [{ metric: 'team_capacity', delta: -2, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 2, delayTurns: 0 }],
      },
      {
        id: 'reduced-interest',
        label: 'Report it as reduced applicant interest this cycle',
        durability: 'low',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 0 }],
      },
      {
        id: 'placement-capacity',
        label: 'Report it as a placement capacity constraint',
        durability: 'medium',
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
  {
    id: 'may-computing-spike',
    turn: 'May',
    query: 'Computing applications have doubled year on year.',
    truth: 'A clearing agent contract signed in October brought in volume nobody modelled.',
    options: [
      {
        id: 'explain-agent-contract',
        label: 'Explain the agent contract in full',
        durability: 'high',
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 1, delayTurns: 0 }],
      },
      {
        id: 'sector-wide-growth',
        label: 'Frame it as sector-wide growth in Computing',
        durability: 'low',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 0 }],
      },
      {
        id: 'deliberate-strategy',
        label: 'Frame it as a deliberate growth strategy',
        durability: 'medium',
        shown: [{ metric: 'goodwill', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 0 }],
      },
    ],
  },
  {
    id: 'jun-mature-student-drop',
    turn: 'June',
    query: 'Mature student numbers have fallen 15%.',
    truth: 'A fee-status field was miscoded for a returning-learner cohort and wrongly excluded them.',
    options: [
      {
        id: 'correct-fee-status',
        label: 'Correct the fee-status coding and resubmit',
        durability: 'high',
        shown: [{ metric: 'team_capacity', delta: -2, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 2, delayTurns: 0 }],
      },
      {
        id: 'wider-decline',
        label: 'Report it as a wider decline in mature applicants',
        durability: 'low',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 0 }],
      },
      {
        id: 'timing-effect',
        label: 'Report it as a timing effect this cycle',
        durability: 'medium',
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
]

export const placeholderCredibilityPool = createCredibilityPool(definitions)
export const allCredibilityDefinitions = definitions
