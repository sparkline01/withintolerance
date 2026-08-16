import type { DecisionCard } from '../engine/types'

/**
 * "Things done to you" (spec §9.1, §15): a pool of 12 one-option cards,
 * of which a run draws ~8 via src/content/selectRun.ts. Deliberately
 * standalone rather than part of an NPC chain — the point is that these
 * just happen, unconnected to anything the player did.
 */
export const thingsDoneToYouPool: DecisionCard[] = [
  {
    id: 'sept-sits-license-lapse',
    turn: 'September',
    trigger: 'scheduled',
    prompt: 'The SITS licence renewal was missed over the summer.',
    context: 'IT are on it. IT are always on it.',
    options: [
      {
        id: 'work-around-read-only',
        label: 'Work around the read-only access for now',
        currency: 'self',
        teaser: 'A workaround, not a fix.',
        shown: [{ metric: 'timeliness', delta: -1, delayTurns: 0 }],
        hidden: [{ metric: 'you', delta: -1, delayTurns: 0 }],
      },
    ],
  },
  {
    id: 'oct-marcus-laptop',
    turn: 'October',
    trigger: 'scheduled',
    prompt: "Marcus's laptop has been stuck in IT triage for two weeks.",
    context: 'He has been coding entry qualifications on a shared machine in the corner.',
    options: [
      {
        id: 'lend-yours',
        label: 'Lend him yours and work from a notebook',
        currency: 'self',
        teaser: 'It is 2026. This is still happening.',
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
  {
    id: 'oct-wifi-outage',
    turn: 'October',
    trigger: 'scheduled',
    prompt: "The building's wifi has been down since Tuesday.",
    context: 'Facilities have a ticket open. The ticket has a number now.',
    options: [
      {
        id: 'work-in-shifts',
        label: 'Work from the one wired desk in the office, in shifts',
        currency: 'self',
        teaser: 'Character-building, apparently.',
        shown: [{ metric: 'timeliness', delta: -1, delayTurns: 0 }],
        hidden: [{ metric: 'you', delta: -1, delayTurns: 0 }],
      },
    ],
  },
  {
    id: 'nov-denise-jury-service',
    turn: 'November',
    trigger: 'scheduled',
    prompt: 'Denise has been called for jury service.',
    context: 'Two weeks, possibly four. Nobody argues with a jury summons.',
    options: [
      {
        id: 'absorb-her-workload',
        label: 'Absorb her workload across the team',
        currency: 'capacity',
        teaser: 'The one person with the whole cycle in her head, gone for a month.',
        shown: [{ metric: 'team_capacity', delta: -2, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
  {
    id: 'dec-priyanka-leave-clash',
    turn: 'December',
    trigger: 'scheduled',
    prompt: "Priyanka's two contracted days this month land entirely over the Christmas closure.",
    context: "The partner data window does not move for anyone's contract.",
    options: [
      {
        id: 'cover-partner-chase',
        label: 'Cover the partner chase yourself over the break',
        currency: 'self',
        teaser: "Someone has to. It's going to be you.",
        shown: [],
        hidden: [{ metric: 'you', delta: -2, delayTurns: 0 }],
      },
    ],
  },
  {
    id: 'dec-sits-patch-breaks-query',
    turn: 'December',
    trigger: 'scheduled',
    prompt: 'A routine SITS patch has broken the extract query.',
    context: 'Nobody flagged it as a breaking change. It rarely is, until it is.',
    options: [
      {
        id: 'rebuild-the-query',
        label: 'Rebuild the query from scratch',
        currency: 'capacity',
        teaser: 'A day gone to something that worked fine on Friday.',
        sourceFix: true,
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 1, delayTurns: 0 }],
      },
    ],
  },
  {
    id: 'jan-server-migration',
    turn: 'January',
    trigger: 'scheduled',
    prompt: 'IT have scheduled the SITS server migration for the same week as the in-year commit.',
    context: 'The email went to a distribution list you are not on.',
    options: [
      {
        id: 'move-everything-early',
        label: 'Move everything you can before the window opens',
        currency: 'capacity',
        teaser: "A week of your life, rearranged by someone else's calendar.",
        shown: [
          { metric: 'team_capacity', delta: -1, delayTurns: 0 },
          { metric: 'timeliness', delta: -1, delayTurns: 0 },
        ],
        hidden: [],
      },
    ],
  },
  {
    id: 'feb-marcus-resignation',
    turn: 'February',
    trigger: 'scheduled',
    prompt: 'Marcus has handed in his notice.',
    context: 'More money, less interesting work, somewhere else. Fair enough.',
    options: [
      {
        id: 'cover-and-recruit',
        label: 'Start recruiting while covering his work yourself',
        currency: 'capacity',
        teaser: 'Two jobs, one person, for at least six weeks.',
        shown: [{ metric: 'team_capacity', delta: -2, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
  {
    id: 'feb-parking-permit-email',
    turn: 'February',
    trigger: 'scheduled',
    prompt: 'Someone in Estates has emailed the whole team about parking permits.',
    context: 'It has nothing to do with anyone. It takes four minutes to read anyway.',
    options: [
      {
        id: 'read-delete-move-on',
        label: 'Read it, delete it, move on',
        currency: 'self',
        teaser: 'Four minutes you will never discuss again.',
        shown: [],
        hidden: [],
      },
    ],
  },
  {
    id: 'mar-audit-request-unrelated',
    turn: 'March',
    trigger: 'scheduled',
    prompt: 'Internal Audit want your access logs for an unrelated review.',
    context: 'Nobody explains why. You provide them anyway.',
    options: [
      {
        id: 'pull-the-logs',
        label: 'Pull the logs and move on',
        currency: 'self',
        teaser: "Twenty minutes you didn't have this week either.",
        shown: [],
        hidden: [{ metric: 'you', delta: -1, delayTurns: 0 }],
      },
    ],
  },
  {
    id: 'may-fire-alarm-testing',
    turn: 'May',
    trigger: 'scheduled',
    prompt: 'Estates have scheduled fire alarm testing for deadline week.',
    context: 'Nobody thought to check the calendar first.',
    options: [
      {
        id: 'work-around-interruptions',
        label: 'Work around the interruptions',
        currency: 'self',
        teaser: 'Four evacuations. Four re-logins.',
        shown: [{ metric: 'timeliness', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
  {
    id: 'jun-registrar-holiday',
    turn: 'June',
    trigger: 'scheduled',
    prompt: 'The Registrar is on leave for the second week of June.',
    context: 'Sign-off now waits for her return, whenever the queries land.',
    options: [
      {
        id: 'queue-for-return',
        label: 'Queue everything for her first day back',
        currency: 'capacity',
        teaser: 'A week compressed into a morning.',
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
]
