import type { FlavorEvent } from '../engine/types'

/**
 * Flavor events (spec §5.3, §15). Two kinds, both in this one pool:
 *
 * - Attributed: narrate the landing of an earlier decision's delayed
 *   effect. The mechanical change already happened via the scheduler
 *   (state.ts applies it on the landing turn) — these carry empty
 *   `effects` and exist purely so the player is told, per spec §5.2's
 *   "must be narrated" rule. `attributedTo` matches `${cardId}:${optionId}`.
 * - Ambient: standalone colour, may carry a small effect of their own.
 *
 * Effects here must never touch `accuracy` or `you` — those metrics are
 * only ever moved through a decision option's `hidden` channel (spec §3's
 * "never shown as a score" applies just as much to a flavor event as to
 * the dashboard). Flavor event effects always land on `shown`.
 *
 * This is a starting pool (25), short of the "40+" the spec's content
 * table describes — the drawing mechanism in selectRun.ts is built to
 * keep working as more are added later.
 */

// --- Attributed: narrate a scheduled effect landing --------------------
const attributedEvents: FlavorEvent[] = [
  {
    id: 'land-sept-coding-manual-flagged',
    turn: 'December',
    type: 'flavor_event',
    attributedTo: 'sept-coding-manual:ask-schools-to-flag',
    headline: 'A school has finally flagged the coding manual issue.',
    body: 'Three months late, and correct. The two fields are fixed.',
    effects: [],
  },
  {
    id: 'land-oct-escalate-pvc',
    turn: 'December',
    type: 'flavor_event',
    attributedTo: 'oct-entry-quals-uncoded:escalate-to-pvc',
    headline: "The PVC's intervention on entry quals has landed.",
    body: 'Admissions found the time once someone above Ruth asked. Ruth has not forgotten who asked.',
    effects: [],
  },
  {
    id: 'land-nov-partner-export',
    turn: 'February',
    type: 'flavor_event',
    attributedTo: 'nov-partner-pdf:ask-for-proper-export',
    headline: "The partner's proper export has arrived.",
    body: 'Three weeks, as promised. It is, for once, exactly what was asked for.',
    effects: [],
  },
  {
    id: 'land-feb-tracking-to-plan',
    turn: 'June',
    type: 'flavor_event',
    attributedTo: 'feb-registrar-signoff-preview:tracking-to-plan',
    headline: 'The gap between "tracking to plan" and the plan is now visible.',
    body: 'Nobody says February out loud. Everybody is thinking it.',
    effects: [],
  },
  {
    id: 'land-feb-priyanka-wait',
    turn: 'June',
    type: 'flavor_event',
    attributedTo: 'feb-priyanka-contact-leaves:wait-for-replacement',
    headline: 'The partner still has not appointed a replacement contact.',
    body: 'Four months on. Priyanka has stopped expecting a reply.',
    effects: [],
  },
]

// --- Ambient: standalone colour, drawn per run --------------------------
const ambientEvents: FlavorEvent[] = [
  {
    id: 'amb-sept-husid-question',
    turn: 'September',
    type: 'flavor_event',
    headline: 'A student has emailed asking why their HUSID looks "wrong."',
    body: 'It is not wrong. Explaining why takes four paragraphs he will not read.',
    effects: [],
  },
  {
    id: 'amb-sept-onboarding-spreadsheet',
    turn: 'September',
    type: 'flavor_event',
    headline: 'The onboarding spreadsheet for new starters is, once again, three systems out of date.',
    body: 'Marcus discovers this by trying to follow it.',
    effects: [],
  },
  {
    id: 'amb-oct-clean-validation-run',
    turn: 'October',
    type: 'flavor_event',
    headline: 'A validation report runs cleanly for the first time all year.',
    body: 'Nobody trusts it. Denise reruns it twice to be sure.',
    effects: [],
  },
  {
    id: 'amb-oct-fast-extract',
    turn: 'October',
    type: 'flavor_event',
    headline: 'The extract completes in eleven minutes instead of the usual ninety.',
    body: 'Nobody knows why. Nobody is going to ask.',
    effects: [],
  },
  {
    id: 'amb-nov-partner-template-request',
    turn: 'November',
    type: 'flavor_event',
    headline: 'A prospective partner asks for a data-sharing template.',
    body: 'You send them the one from three partners ago. It still mostly applies.',
    effects: [],
  },
  {
    id: 'amb-nov-kettle-breaks',
    turn: 'November',
    type: 'flavor_event',
    headline: 'The office kettle breaks.',
    body: 'Priorities are established within the hour.',
    effects: [],
  },
  {
    id: 'amb-dec-folder-rename',
    turn: 'December',
    type: 'flavor_event',
    headline: 'Someone has renamed the shared drive folder structure without telling anyone.',
    body: 'Everything still works. Nobody can find anything by intuition anymore.',
    effects: [],
  },
  {
    id: 'amb-dec-christmas-card',
    turn: 'December',
    type: 'flavor_event',
    headline: "The Christmas card from the partner provider arrives before their data does.",
    body: 'It is a nice card.',
    effects: [],
  },
  {
    id: 'amb-jan-good-question',
    turn: 'January',
    type: 'flavor_event',
    headline: "A students' union rep asks a genuinely good question about the return.",
    body: 'You do not have a good answer ready. You will next year.',
    effects: [],
  },
  {
    id: 'amb-jan-coffee-machine-fixed',
    turn: 'January',
    type: 'flavor_event',
    headline: "The coffee machine in the data team's corner has been fixed.",
    body: 'Morale improves by a measurable, unrecorded amount.',
    effects: [],
  },
  {
    id: 'amb-feb-newspaper-citation',
    turn: 'February',
    type: 'flavor_event',
    headline: 'A national newspaper cites "HESA data" for a claim that is not in the return.',
    body: 'Nobody at the paper will confirm which year, or which field.',
    effects: [],
  },
  {
    id: 'amb-feb-old-bug-found',
    turn: 'February',
    type: 'flavor_event',
    headline: 'Denise finds a rule that has been quietly wrong since 2021.',
    body: 'She looks almost disappointed it was not more interesting.',
    effects: [],
  },
  {
    id: 'amb-feb-vc-mention',
    turn: 'February',
    type: 'flavor_event',
    headline: 'The Vice-Chancellor mentions your team by name in a briefing, favourably.',
    body: 'Nobody tells you which slide you were on.',
    effects: [{ metric: 'goodwill', delta: 1, delayTurns: 0 }],
  },
  {
    id: 'amb-mar-relabelled-column',
    turn: 'March',
    type: 'flavor_event',
    headline: 'A software update changes how one export column is labelled, not what is in it.',
    body: 'Three people ask if the numbers have changed. They have not.',
    effects: [],
  },
  {
    id: 'amb-mar-satisfaction-survey-clash',
    turn: 'March',
    type: 'flavor_event',
    headline: 'The student satisfaction survey opens the same week as your validation deadline.',
    body: 'Everyone in the building is suddenly interested in response rates. Not yours.',
    effects: [{ metric: 'timeliness', delta: -1, delayTurns: 0 }],
  },
  {
    id: 'amb-may-competitor-trade-press',
    turn: 'May',
    type: 'flavor_event',
    headline: "A competitor's return makes the trade press for the wrong reasons.",
    body: 'Their Head of Data Returns has your sympathy and nothing else useful to offer.',
    effects: [],
  },
  {
    id: 'amb-may-stale-shared-spreadsheet',
    turn: 'May',
    type: 'flavor_event',
    headline: "Someone finds last year's return still open in a shared spreadsheet.",
    body: 'Being edited, by someone who left in October. Nobody knows who granted the access.',
    effects: [{ metric: 'recurring_debt', delta: 1, delayTurns: 0 }],
  },
  {
    id: 'amb-jun-air-conditioning-fails',
    turn: 'June',
    type: 'flavor_event',
    headline: 'The building air conditioning fails during the hottest week of the year.',
    body: 'Sign-off proceeds anyway, at a temperature nobody signs off on.',
    effects: [],
  },
  {
    id: 'amb-jun-colleague-compares-notes',
    turn: 'June',
    type: 'flavor_event',
    headline: 'A colleague from another provider calls to compare notes.',
    body: 'Their year sounds worse. This is, briefly, comforting.',
    effects: [],
  },
  {
    id: 'amb-jul-next-years-dates',
    turn: 'July',
    type: 'flavor_event',
    headline: "Someone asks if next year's collection dates have been confirmed yet.",
    body: 'They have not. They never really are.',
    effects: [],
  },
]

export const allFlavorEvents: FlavorEvent[] = [...attributedEvents, ...ambientEvents]
