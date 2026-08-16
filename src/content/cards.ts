import type { DecisionCard } from '../engine/types'

/**
 * Build order step 4 (spec §16): the first real ten cards, written to the
 * §14.7 length cap (context: two short sentences hard cap; option labels:
 * one line; teasers: one line, no subordinate clauses) and pressure-tested
 * at a 380px viewport. Deliberately includes the grammar-breaks §4.3 calls
 * for: a one-option "thing done to you" card (oct-marcus-rework), a card
 * where the goodwill option is correct and rewarded (nov-marketing-league-
 * table), a two-options-both-bad card (dec-finance-fields), and one late
 * card where `self` is unambiguously right (mar-board-pack-typo).
 *
 * Not yet the full 25-30 card set — that's step 6, once this batch has
 * been played and the feel confirmed.
 */
export const cards: DecisionCard[] = [
  {
    id: 'sept-coding-manual',
    turn: 'September',
    trigger: 'scheduled',
    prompt: 'The coding manual addendum landed last week.',
    context: 'Two field definitions changed. Nobody has told the schools yet.',
    options: [
      {
        id: 'brief-schools-first',
        label: 'Brief every school before anyone extracts',
        currency: 'capacity',
        teaser: 'Costs a week. Nobody re-codes twice.',
        sourceFix: true,
        shown: [{ metric: 'timeliness', delta: -1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 2, delayTurns: 0 }],
      },
      {
        id: 'extract-then-patch',
        label: 'Extract now, patch the two fields later',
        currency: 'accuracy',
        teaser: 'Faster today. Wrong until you patch it.',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [
          { metric: 'accuracy', delta: -2, delayTurns: 0 },
          { metric: 'recurring_debt', delta: 1, delayTurns: 0 },
        ],
      },
      {
        id: 'ask-schools-to-flag',
        label: 'Ask the schools to flag anything that looks off',
        currency: 'goodwill',
        teaser: "Eventually. They'll remember you asked.",
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 1, delayTurns: 3 }],
      },
      {
        id: 'check-it-yourself',
        label: 'Check the two fields yourself against every course',
        currency: 'self',
        teaser: "It's Sunday. Nobody needs to know that.",
        shown: [],
        hidden: [
          { metric: 'accuracy', delta: 1, delayTurns: 0 },
          { metric: 'you', delta: -2, delayTurns: 0 },
        ],
      },
    ],
  },
  {
    id: 'sept-sam-conference',
    turn: 'September',
    trigger: 'scheduled',
    npc: { name: 'Sam', role: 'SRS and Reporting' },
    prompt: 'Sam wants three days at the Jisc conference in November.',
    context: 'The dates land right before the in-year commit. You already suspect why they want to go.',
    options: [
      {
        id: 'approve-and-redistribute',
        label: 'Approve it, and redistribute their work across the team',
        currency: 'capacity',
        teaser: 'Everyone absorbs a little. Nobody absorbs much.',
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
      {
        id: 'approve-shorten',
        label: 'Approve it, but ask them to skip the last day',
        currency: 'goodwill',
        teaser: "A small ask. They'll notice you made it.",
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
      {
        id: 'cover-it-yourself',
        label: 'Cover their work yourself so nothing moves',
        currency: 'self',
        teaser: 'Nobody needs to know what that cost you.',
        shown: [],
        hidden: [{ metric: 'you', delta: -2, delayTurns: 0 }],
      },
    ],
  },
  // Canonical example, reused verbatim from docs/spec.md §5.1.
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
  // Grammar-break: one option, no real choice. Spec §9.1.
  {
    id: 'oct-marcus-rework',
    turn: 'October',
    trigger: 'scheduled',
    prompt: "Marcus's module mappings are wrong.",
    context: 'Not badly, but consistently. You are the only one who will notice before March.',
    options: [
      {
        id: 'redo-it-yourself',
        label: 'Redo it yourself before the extract goes out',
        currency: 'self',
        teaser: 'Telling him would cost more than doing it.',
        shown: [{ metric: 'timeliness', delta: -1, delayTurns: 0 }],
        hidden: [
          { metric: 'accuracy', delta: 1, delayTurns: 0 },
          { metric: 'you', delta: -2, delayTurns: 0 },
        ],
      },
    ],
  },
  {
    id: 'nov-partner-pdf',
    turn: 'November',
    trigger: 'scheduled',
    prompt: 'The partner data has arrived as a PDF.',
    context: 'Priyanka says this is normal. It is not normal.',
    options: [
      {
        id: 'transcribe-in-house',
        label: 'Have Priyanka transcribe it by hand, properly',
        currency: 'capacity',
        teaser: 'Two days. Right for every year after.',
        sourceFix: true,
        shown: [{ metric: 'team_capacity', delta: -2, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 2, delayTurns: 0 }],
        setsFlags: ['partner_transcription_process'],
      },
      {
        id: 'ocr-and-spot-check',
        label: 'Run it through OCR and spot-check ten rows',
        currency: 'accuracy',
        teaser: 'It will pass. Row eleven is anyone’s guess.',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [
          { metric: 'accuracy', delta: -2, delayTurns: 0 },
          { metric: 'recurring_debt', delta: 1, delayTurns: 0 },
        ],
      },
      {
        id: 'ask-for-proper-export',
        label: 'Ask the partner to resend as a proper export',
        currency: 'goodwill',
        teaser: "They'll agree. It will take three weeks.",
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 2, delayTurns: 3 }],
      },
      {
        id: 'transcribe-yourself',
        label: 'Transcribe it yourself tonight',
        currency: 'self',
        teaser: 'Faster than asking anyone for help.',
        shown: [],
        hidden: [
          { metric: 'accuracy', delta: 1, delayTurns: 0 },
          { metric: 'you', delta: -2, delayTurns: 0 },
        ],
      },
    ],
  },
  // Grammar-break: the goodwill option is correct here, and the game
  // rewards it, so the player can't learn a single dominant strategy.
  {
    id: 'nov-marketing-league-table',
    turn: 'November',
    trigger: 'scheduled',
    npc: { name: 'Farida', role: 'Director of Marketing' },
    prompt: "Farida wants this year's continuation number for a press release.",
    context: 'It is November. The number will not be real until July.',
    options: [
      {
        id: 'give-caveated-range',
        label: 'Give her the modelled range, with a confidence caveat',
        currency: 'goodwill',
        teaser: "She'll quote the top of it. At least it's honest.",
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
      {
        id: 'give-last-years-number',
        label: "Give her last year's confirmed number instead",
        currency: 'accuracy',
        teaser: 'Technically true. Also not this year’s.',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 0 }],
      },
      {
        id: 'decline',
        label: "Tell her it isn't ready",
        currency: 'capacity',
        teaser: "True. She'll go around you next time.",
        shown: [{ metric: 'goodwill', delta: -2, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
  // Grammar-break: two options, both genuinely bad.
  {
    id: 'dec-finance-fields',
    turn: 'December',
    trigger: 'scheduled',
    npc: { name: 'Aiden', role: 'Director of Finance' },
    prompt: 'Finance wants the funding-relevant fields prioritised, now.',
    context: 'That means everything else waits. December is already short-staffed.',
    options: [
      {
        id: 'prioritise-finance',
        label: "Reorder the queue around Finance's fields",
        currency: 'capacity',
        teaser: 'Everything else slips into January.',
        shown: [
          { metric: 'timeliness', delta: -1, delayTurns: 0 },
          { metric: 'goodwill', delta: 1, delayTurns: 0 },
        ],
        hidden: [],
      },
      {
        id: 'hold-the-order',
        label: 'Keep the existing order and ask Finance to wait',
        currency: 'goodwill',
        teaser: 'They will escalate it by Thursday.',
        shown: [{ metric: 'goodwill', delta: -2, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
  {
    id: 'jan-dean-counting',
    turn: 'January',
    trigger: 'scheduled',
    npc: { name: 'Professor Okafor', role: 'Dean, Health Sciences' },
    prompt: 'The Dean wants placement students counted as full-time.',
    context: 'The regulations are genuinely ambiguous here. She has a reason to prefer this reading.',
    options: [
      {
        id: 'get-written-ruling',
        label: 'Get a written ruling from the coding manual owner',
        currency: 'capacity',
        teaser: "Two weeks. After that, it's official.",
        shown: [{ metric: 'timeliness', delta: -1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 2, delayTurns: 4 }],
      },
      {
        id: 'accept-her-reading',
        label: 'Accept her reading and code it that way',
        currency: 'accuracy',
        teaser: "It's defensible. It's also convenient.",
        shown: [{ metric: 'goodwill', delta: 1, delayTurns: 0 }],
        hidden: [
          { metric: 'accuracy', delta: -1, delayTurns: 0 },
          { metric: 'recurring_debt', delta: 1, delayTurns: 0 },
        ],
      },
      {
        id: 'use-conservative-reading',
        label: 'Push back and use the more conservative reading',
        currency: 'goodwill',
        teaser: "She'll remember this at the next away day.",
        shown: [{ metric: 'goodwill', delta: -2, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 1, delayTurns: 0 }],
      },
      {
        id: 'read-it-yourself',
        label: 'Read the regulations yourself, properly, this weekend',
        currency: 'self',
        teaser: 'Somebody should have done this in 2019.',
        shown: [],
        hidden: [
          { metric: 'accuracy', delta: 1, delayTurns: 0 },
          { metric: 'you', delta: -2, delayTurns: 0 },
        ],
      },
    ],
  },
  {
    id: 'feb-registrar-signoff-preview',
    turn: 'February',
    trigger: 'scheduled',
    npc: { name: 'the Registrar', role: 'Academic Registrar' },
    prompt: 'The Registrar wants an early read on whether this year will be clean.',
    context: 'She asks every February. She remembers the answer every July.',
    options: [
      {
        id: 'honest-tier-by-tier',
        label: 'Give her the honest tier-by-tier picture',
        currency: 'capacity',
        teaser: "Not reassuring. At least it's true.",
        shown: [{ metric: 'goodwill', delta: 1, delayTurns: 0 }],
        hidden: [],
      },
      {
        id: 'tracking-to-plan',
        label: "Tell her it's tracking to plan",
        currency: 'accuracy',
        teaser: 'It calms the room. For now.',
        shown: [{ metric: 'goodwill', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 3 }],
      },
      {
        id: 'defer-the-question',
        label: 'Suggest she ask again closer to the deadline',
        currency: 'goodwill',
        teaser: 'She will ask sooner, not later.',
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
      {
        id: 'one-pager-yourself',
        label: 'Prepare a one-page version yourself, tonight',
        currency: 'self',
        teaser: 'Better than her reading the raw tracker.',
        shown: [{ metric: 'goodwill', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'you', delta: -1, delayTurns: 0 }],
      },
    ],
  },
  // Grammar-break: late, and `self` is unambiguously the right call.
  {
    id: 'mar-board-pack-typo',
    turn: 'March',
    trigger: 'scheduled',
    prompt: 'The subject-mix table has a typo in the March board pack.',
    context: 'Wrong row order, right numbers. Nobody has circulated it yet.',
    options: [
      {
        id: 'fix-it-yourself',
        label: 'Fix it yourself before it goes out',
        currency: 'self',
        teaser: 'Two minutes. Done.',
        shown: [],
        hidden: [],
      },
      {
        id: 'raise-at-pre-board',
        label: "Raise it at the pre-board meeting so it's tracked",
        currency: 'capacity',
        teaser: 'A ten-minute conversation about a typo.',
        shown: [{ metric: 'timeliness', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
]
