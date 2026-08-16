import type { DecisionCard } from '../engine/types'

/**
 * Build order step 6 (spec §16): the full core card set (25, within the
 * 25-30 target). Distinct from src/content/thingsDoneToYou.ts, which is
 * its own drawn-per-run pool (spec §15's "12, drawing ~8" is a SEPARATE
 * line item from "Scheduled decision cards | 25-30").
 *
 * Six NPC chains run through this set via requires/unlocks/setsFlags:
 * Ruth (entry quals), Sam (being poached), Priyanka (partner data),
 * Farida (Marketing), the Registrar (confidence), and Professor Okafor
 * (the counting dispute). The `audit_fires` flag (set at run-selection
 * time, spec §9.2) gates the OfS branch conditionally, same mechanism.
 */
export const cards: DecisionCard[] = [
  // --- September ---------------------------------------------------------
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
  {
    id: 'sept-vc-strategic-plan',
    turn: 'September',
    trigger: 'scheduled',
    prompt: 'The strategic plan has been refreshed.',
    context: 'It now runs to sixty pages. Four of them are about students.',
    options: [
      {
        id: 'read-all-sixty',
        label: 'Read all sixty pages and note what changed',
        currency: 'capacity',
        teaser: 'Two hours you will not get back.',
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
      {
        id: 'skim-the-four',
        label: 'Skim the four pages that mention data',
        currency: 'self',
        teaser: 'Efficient. Also probably fine.',
        shown: [],
        hidden: [{ metric: 'you', delta: -1, delayTurns: 0 }],
      },
    ],
  },

  // --- October -------------------------------------------------------------
  // Canonical example, reused verbatim from docs/spec.md §5.1. Ruth chain, part 1 of 3.
  {
    id: 'oct-entry-quals-uncoded',
    turn: 'October',
    trigger: 'scheduled',
    npc: { name: 'Ruth', role: 'Head of Admissions' },
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
        dependencyAction: { dependencyId: 'entry-quals', action: 'complete' },
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
        setsFlags: ['escalated_on_ruth'],
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
    id: 'oct-aiden-finance-audit-prep',
    turn: 'October',
    trigger: 'scheduled',
    npc: { name: 'Aiden', role: 'Director of Finance' },
    prompt: 'Aiden wants the fee data audit-ready a term early.',
    context: "Internal audit is circling something unrelated. He'd like to not be part of it.",
    options: [
      {
        id: 'reconcile-now',
        label: 'Do the reconciliation now, properly',
        currency: 'capacity',
        teaser: 'Slow now. Nothing to explain later.',
        sourceFix: true,
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 1, delayTurns: 0 }],
        dependencyAction: { dependencyId: 'fee-funding-status', action: 'chase' },
      },
      {
        id: 'tell-him-in-hand',
        label: "Tell him it's already in hand",
        currency: 'goodwill',
        teaser: 'Mostly true. Mostly.',
        shown: [{ metric: 'goodwill', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 0 }],
      },
    ],
  },

  // --- November --------------------------------------------------------
  // Priyanka chain, part 1 of 2.
  {
    id: 'nov-partner-pdf',
    turn: 'November',
    trigger: 'scheduled',
    npc: { name: 'Priyanka', role: 'Partner Data' },
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
        dependencyAction: { dependencyId: 'partner-provider-returns', action: 'complete' },
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
        dependencyAction: { dependencyId: 'partner-provider-returns', action: 'chase' },
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
  {
    id: 'nov-denise-2019-courses',
    turn: 'November',
    trigger: 'scheduled',
    npc: { name: 'Denise', role: 'Senior Data Officer' },
    prompt: 'You ask Denise why the 2019 courses are coded the way they are.',
    context: 'She looks at you for a second before she answers.',
    options: [
      {
        id: 'hear-the-full-history',
        label: 'Let her walk you through the whole history',
        currency: 'capacity',
        teaser: "Half an hour. You'll never have to ask again.",
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 1, delayTurns: 0 }],
      },
      {
        id: 'take-the-short-version',
        label: 'Take the short version and move on',
        currency: 'self',
        teaser: "Enough to get by. Not enough to fix it.",
        shown: [],
        hidden: [{ metric: 'you', delta: -1, delayTurns: 0 }],
      },
    ],
  },

  // --- December -----------------------------------------------------------
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
  // Sam chain, part 2 of 3.
  {
    id: 'dec-sam-job-offer',
    turn: 'December',
    trigger: 'scheduled',
    npc: { name: 'Sam', role: 'SRS and Reporting' },
    prompt: 'Sam has been offered a permanent post at Northgate.',
    context: 'They told you before they told HR. That is not nothing.',
    options: [
      {
        id: 'counter-offer',
        label: 'Put together a counter-offer with Finance',
        currency: 'capacity',
        teaser: "Two weeks Finance doesn't want to give you.",
        shown: [
          { metric: 'team_capacity', delta: -1, delayTurns: 0 },
          { metric: 'goodwill', delta: -1, delayTurns: 0 },
        ],
        hidden: [],
        setsFlags: ['sam_stays'],
      },
      {
        id: 'ask-to-stay-through-commit',
        label: 'Ask them to stay through the in-year commit, then go',
        currency: 'goodwill',
        teaser: 'A fair ask. Also a countdown now.',
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [],
        setsFlags: ['sam_delayed_leave'],
      },
      {
        id: 'wish-them-well',
        label: 'Wish them well and start planning the gap',
        currency: 'accuracy',
        teaser: 'Honest. Also how you lose them fastest.',
        shown: [],
        hidden: [],
        setsFlags: ['sam_leaving'],
      },
    ],
  },
  {
    id: 'dec-ofs-coding-manual-consultation',
    turn: 'December',
    trigger: 'scheduled',
    prompt: "OfS is consulting on next year's coding manual.",
    context: 'Responses are due in three weeks. Nobody has read the draft.',
    options: [
      {
        id: 'write-a-proper-response',
        label: 'Write a proper response with Denise',
        currency: 'capacity',
        teaser: 'It might even change something.',
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
      {
        id: 'submit-sector-template',
        label: "Submit the sector body's template response",
        currency: 'goodwill',
        teaser: 'Fast. Says nothing about you specifically.',
        shown: [],
        hidden: [],
      },
    ],
  },

  // --- January --------------------------------------------------------
  // Ruth chain, part 2 of 3 — only appears if you went over her head in October.
  {
    id: 'jan-ruth-remembers',
    turn: 'January',
    trigger: 'conditional',
    requires: ['escalated_on_ruth'],
    npc: { name: 'Ruth', role: 'Head of Admissions' },
    prompt: 'Ruth has not replied to your last two emails.',
    context: "She heard from the PVC's office before she heard from you. That was in October.",
    options: [
      {
        id: 'visit-in-person',
        label: 'Go and see her in person, no email trail',
        currency: 'capacity',
        teaser: 'Twenty minutes. Slower to fix, faster to forgive.',
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 1, delayTurns: 0 }],
      },
      {
        id: 'send-apology',
        label: 'Send a longer apology and promise to loop her in earlier',
        currency: 'goodwill',
        teaser: 'Words are cheap. She knows that.',
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
      {
        id: 'stop-chasing',
        label: 'Stop chasing and do the next round of coding yourself',
        currency: 'self',
        teaser: 'It was always going to come to this.',
        shown: [],
        hidden: [
          { metric: 'accuracy', delta: 1, delayTurns: 0 },
          { metric: 'you', delta: -2, delayTurns: 0 },
        ],
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
        // Its real payoff is mar-dean-ruling-arrives, not a delayed effect here.
        shown: [{ metric: 'timeliness', delta: -1, delayTurns: 0 }],
        hidden: [],
        setsFlags: ['awaiting_coding_ruling'],
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
    id: 'jan-marcus-second-mistake',
    turn: 'January',
    trigger: 'scheduled',
    npc: { name: 'Marcus', role: 'Data Officer' },
    prompt: 'Marcus has made the same mistake again.',
    context: "Different course, same wrong assumption. He's trying.",
    options: [
      {
        id: 'sit-with-him',
        label: "Sit with him and fix how he's approaching it",
        currency: 'capacity',
        teaser: 'An hour today. Fewer of these later.',
        sourceFix: true,
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 1, delayTurns: 0 }],
      },
      {
        id: 'fix-it-and-say-nothing',
        label: 'Fix it yourself again and say nothing',
        currency: 'self',
        teaser: "Faster. He'll never learn this way.",
        shown: [],
        hidden: [
          { metric: 'accuracy', delta: 1, delayTurns: 0 },
          { metric: 'you', delta: -1, delayTurns: 0 },
        ],
      },
    ],
  },

  // --- February -------------------------------------------------------
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
        confidenceDelta: 0.05,
      },
      {
        id: 'tracking-to-plan',
        label: "Tell her it's tracking to plan",
        currency: 'accuracy',
        teaser: 'It calms the room. For now.',
        shown: [{ metric: 'goodwill', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 3 }],
        setsFlags: ['reassured_registrar_feb'],
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
  {
    id: 'feb-priyanka-contact-leaves',
    turn: 'February',
    trigger: 'scheduled',
    prompt: 'The partner has lost the contact who sends the data.',
    context: 'Priyanka says nobody has replied to her since.',
    options: [
      {
        id: 'escalate-to-registrar',
        label: "Escalate to the partner's registrar directly",
        currency: 'capacity',
        teaser: 'Slower, but it goes to someone who exists.',
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [],
        dependencyAction: { dependencyId: 'partner-provider-returns', action: 'escalate' },
      },
      {
        id: 'wait-for-replacement',
        label: 'Wait for them to appoint a replacement',
        currency: 'goodwill',
        teaser: 'Cheapest option. Also the slowest.',
        shown: [],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 3 }],
      },
      {
        id: 'rebuild-mapping-yourself',
        label: 'Rebuild the partner mapping from what you already have',
        currency: 'self',
        teaser: 'Imperfect, and entirely yours.',
        shown: [],
        hidden: [
          { metric: 'accuracy', delta: 1, delayTurns: 0 },
          { metric: 'you', delta: -2, delayTurns: 0 },
        ],
      },
    ],
  },
  // Sam chain, part 3 of 3 — only if you let them go in December.
  {
    id: 'feb-sam-departure',
    turn: 'February',
    trigger: 'conditional',
    requires: ['sam_leaving'],
    prompt: "Sam's last day is Friday.",
    context: 'The handover document is four bullet points long.',
    options: [
      {
        id: 'redistribute-yourself',
        label: 'Redistribute their work across the remaining team',
        currency: 'self',
        teaser: 'Everyone absorbs a little more than they should.',
        shown: [{ metric: 'team_capacity', delta: -2, delayTurns: 0 }],
        hidden: [{ metric: 'you', delta: -1, delayTurns: 0 }],
      },
    ],
  },
  // The OfS audit branch (spec §9.2). audit_fires is set at run-selection
  // time by src/content/selectRun.ts, not by anything the player does.
  {
    id: 'feb-ofs-audit-branch',
    turn: 'February',
    trigger: 'conditional',
    requires: ['audit_fires'],
    prompt: "OfS is reviewing last year's return. Not yours.",
    context: 'They have found something. It is now, somehow, your problem too.',
    options: [
      {
        id: 'cooperate-fully',
        label: 'Pull the evidence together properly',
        currency: 'capacity',
        teaser: "Two turns of work for a return you didn't make.",
        shown: [{ metric: 'team_capacity', delta: -2, delayTurns: 0 }],
        hidden: [],
        // audit_active must match AUDIT_ACTIVE_FLAG in src/engine/state.ts.
        setsFlags: ['audit_active'],
        confidenceDelta: -0.1,
      },
      {
        id: 'minimum-required',
        label: 'Provide the minimum requested and nothing more',
        currency: 'goodwill',
        teaser: 'Correct, and visibly reluctant.',
        shown: [
          { metric: 'team_capacity', delta: -1, delayTurns: 0 },
          { metric: 'goodwill', delta: -1, delayTurns: 0 },
        ],
        hidden: [],
        setsFlags: ['audit_active'],
        confidenceDelta: -0.15,
      },
    ],
  },

  // --- March ------------------------------------------------------------
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
  // Farida chain, part 2 of 2.
  {
    id: 'mar-farida-follow-up',
    turn: 'March',
    trigger: 'scheduled',
    npc: { name: 'Farida', role: 'Director of Marketing' },
    prompt: 'The number you gave Farida in November no longer holds.',
    context: 'It has already gone into a funding bid. Nobody has updated it.',
    options: [
      {
        id: 'ask-to-correct-bid',
        label: "Ask her to correct the bid before it's submitted",
        currency: 'capacity',
        teaser: 'Tight timing. Still possible.',
        shown: [
          { metric: 'goodwill', delta: -1, delayTurns: 0 },
          { metric: 'team_capacity', delta: -1, delayTurns: 0 },
        ],
        hidden: [{ metric: 'accuracy', delta: 1, delayTurns: 0 }],
      },
      {
        id: 'let-it-stand',
        label: 'Let the bid go as it is',
        currency: 'accuracy',
        teaser: 'Wrong for a while. Quietly.',
        shown: [],
        hidden: [
          { metric: 'accuracy', delta: -1, delayTurns: 0 },
          { metric: 'recurring_debt', delta: 1, delayTurns: 0 },
        ],
      },
      {
        id: 'flag-to-finance',
        label: "Flag it to Finance so it's on record somewhere",
        currency: 'goodwill',
        teaser: 'Covers you. Does not fix the bid.',
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
  // Dean chain, part 2 of 2 — only if you asked for a written ruling.
  {
    id: 'mar-dean-ruling-arrives',
    turn: 'March',
    trigger: 'conditional',
    requires: ['awaiting_coding_ruling'],
    npc: { name: 'Professor Okafor', role: 'Dean, Health Sciences' },
    prompt: 'The written ruling has come back.',
    context: 'It does not agree with the Dean. She has seen it too.',
    options: [
      {
        id: 'recode-now',
        label: 'Recode the placement students to the ruling now',
        currency: 'capacity',
        teaser: 'Right before the deadline. Also just right.',
        sourceFix: true,
        shown: [
          { metric: 'timeliness', delta: -1, delayTurns: 0 },
          { metric: 'goodwill', delta: -1, delayTurns: 0 },
        ],
        hidden: [{ metric: 'accuracy', delta: 2, delayTurns: 0 }],
      },
      {
        id: 'phase-in-next-year',
        label: 'Phase it in from next year instead',
        currency: 'accuracy',
        teaser: 'Quieter. Also a second wrong year, not one.',
        shown: [{ metric: 'goodwill', delta: 1, delayTurns: 0 }],
        hidden: [
          { metric: 'accuracy', delta: -1, delayTurns: 0 },
          { metric: 'recurring_debt', delta: 1, delayTurns: 0 },
        ],
      },
    ],
  },

  // --- May ------------------------------------------------------------
  {
    id: 'may-deadline-pressure',
    turn: 'May',
    trigger: 'scheduled',
    prompt: 'Confirmation closes in four weeks.',
    context: 'The number everyone has been quoting is still the modelled one.',
    options: [
      {
        id: 'all-team-validation-push',
        label: 'Run an all-team validation push this week',
        currency: 'capacity',
        teaser: 'Everyone, every evening, for a week.',
        shown: [{ metric: 'team_capacity', delta: -2, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 2, delayTurns: 0 }],
      },
      {
        id: 'focus-highest-volume',
        label: 'Focus only on the highest-volume courses',
        currency: 'accuracy',
        teaser: 'Covers most of the number. Not all of it.',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 0 }],
      },
      {
        id: 'weekend-pass-yourself',
        label: 'Take the weekend and do a full pass yourself',
        currency: 'self',
        teaser: 'You have done this before. It never gets shorter.',
        shown: [],
        hidden: [
          { metric: 'accuracy', delta: 1, delayTurns: 0 },
          { metric: 'you', delta: -2, delayTurns: 0 },
        ],
      },
    ],
  },
  // Registrar chain, part 2 of 3 — only if you reassured her falsely in February.
  {
    id: 'may-registrar-reality-check',
    turn: 'May',
    trigger: 'conditional',
    requires: ['reassured_registrar_feb'],
    npc: { name: 'the Registrar', role: 'Academic Registrar' },
    prompt: 'It is May. It was not tracking to plan.',
    context: 'She remembers exactly what you told her in February.',
    options: [
      {
        id: 'own-it-plainly',
        label: 'Own it plainly and bring the real numbers',
        currency: 'self',
        teaser: 'There is no good version of this conversation.',
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [],
        confidenceDelta: -0.1,
      },
    ],
  },

  // --- June -----------------------------------------------------------
  // Registrar chain, part 3 of 3.
  {
    id: 'jun-signoff-push',
    turn: 'June',
    trigger: 'scheduled',
    npc: { name: 'the Registrar', role: 'Academic Registrar' },
    prompt: 'The Registrar wants a final walkthrough before she signs.',
    context: 'Not a summary. Every tier, every exception, in the room.',
    options: [
      {
        id: 'prepare-full-walkthrough',
        label: 'Prepare the full walkthrough, properly',
        currency: 'capacity',
        teaser: 'A day of prep for twenty minutes of meeting.',
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [],
        confidenceDelta: 0.1,
      },
      {
        id: 'talk-from-memory',
        label: 'Talk her through it from memory',
        currency: 'self',
        teaser: 'You know this data better than any document does.',
        shown: [],
        hidden: [{ metric: 'you', delta: -1, delayTurns: 0 }],
        confidenceDelta: 0.05,
      },
    ],
  },

  // --- July: finale setup (spec §10.1) ---------------------------------
  // Ordinary decision cards setting strategy for the final run. The queue
  // itself (src/engine/finale.ts) takes over once these are cleared.
  {
    id: 'july-what-to-fix',
    turn: 'July',
    trigger: 'scheduled',
    prompt: 'The final run is tomorrow. What gets fixed first?',
    context: 'You cannot do all of it. You can choose which part you do properly.',
    options: [
      {
        id: 'prioritise-highest-tier',
        label: 'Prioritise the highest-tier blocking errors',
        currency: 'capacity',
        teaser: 'Fewer records. Each one done right.',
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 1, delayTurns: 0 }],
      },
      {
        id: 'prioritise-highest-volume',
        label: 'Prioritise the highest-volume courses',
        currency: 'accuracy',
        teaser: 'Covers the most students. Not the worst errors.',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: -1, delayTurns: 0 }],
      },
      {
        id: 'ask-each-school',
        label: 'Ask each school which of their records matter most',
        currency: 'goodwill',
        teaser: "They'll all say all of them.",
        shown: [{ metric: 'goodwill', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
      {
        id: 'triage-yourself',
        label: 'Triage the whole list yourself tonight',
        currency: 'self',
        teaser: 'Nobody else has seen the full picture.',
        shown: [],
        hidden: [
          { metric: 'accuracy', delta: 1, delayTurns: 0 },
          { metric: 'you', delta: -2, delayTurns: 0 },
        ],
      },
    ],
  },
  {
    id: 'july-who-works-weekend',
    turn: 'July',
    trigger: 'scheduled',
    npc: { name: 'Denise', role: 'Senior Data Officer' },
    prompt: 'Someone needs to work the weekend before the run.',
    context: 'Denise has already said yes. You have not asked her yet.',
    options: [
      {
        id: 'let-denise-and-thank-her',
        label: 'Let her do it, and thank her properly',
        currency: 'capacity',
        teaser: 'She was always going to say yes.',
        shown: [
          { metric: 'team_capacity', delta: -1, delayTurns: 0 },
          { metric: 'goodwill', delta: 1, delayTurns: 0 },
        ],
        hidden: [],
      },
      {
        id: 'do-the-weekend-yourself',
        label: 'Do the weekend yourself instead',
        currency: 'self',
        teaser: 'She has done enough weekends this cycle.',
        shown: [],
        hidden: [{ metric: 'you', delta: -2, delayTurns: 0 }],
      },
      {
        id: 'split-between-whoevers-free',
        label: "Split it between whoever's free",
        currency: 'goodwill',
        teaser: "Nobody's really free. Some are less busy.",
        shown: [{ metric: 'team_capacity', delta: -1, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
  {
    id: 'july-known-issues-decision',
    turn: 'July',
    trigger: 'scheduled',
    prompt: 'Submit with known issues documented, or hold for one more pass?',
    context: "Holding costs a week you don't have. Submitting means writing down what's still wrong.",
    options: [
      {
        id: 'hold-for-one-more-pass',
        label: 'Hold for one more pass',
        currency: 'capacity',
        teaser: 'A week you will spend explaining why you took it.',
        shown: [{ metric: 'timeliness', delta: -2, delayTurns: 0 }],
        hidden: [{ metric: 'accuracy', delta: 1, delayTurns: 0 }],
      },
      {
        id: 'submit-with-issues-documented',
        label: 'Submit now with issues documented',
        currency: 'accuracy',
        teaser: 'Honest, on time, and still wrong in places.',
        shown: [{ metric: 'timeliness', delta: 1, delayTurns: 0 }],
        hidden: [],
      },
    ],
  },
  {
    id: 'july-team-briefing',
    turn: 'July',
    trigger: 'scheduled',
    prompt: 'You brief the team on tomorrow\'s run.',
    context: 'Twenty minutes. Nobody asks the question everyone is thinking.',
    options: [
      {
        id: 'answer-the-unasked-question',
        label: 'Answer the unasked question anyway',
        currency: 'capacity',
        teaser: 'It will not be a good answer. It will be honest.',
        shown: [{ metric: 'goodwill', delta: 1, delayTurns: 0 }],
        hidden: [],
      },
      {
        id: 'keep-it-short',
        label: 'Keep the briefing short and let people ask you privately',
        currency: 'self',
        teaser: 'Fewer nerves in the room. More in your inbox.',
        shown: [],
        hidden: [{ metric: 'you', delta: -1, delayTurns: 0 }],
      },
    ],
  },
]
