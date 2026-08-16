import type { HandoverVariant } from '../engine/handover'

/**
 * The five handover variants (spec §8). One is selected per run by seed.
 * "Wendy" is the spec's own worked example, reused verbatim; the other
 * four match the archetypes the spec suggests: perfect documentation
 * hiding wrong data, no handover at all, a genuinely high bar to meet,
 * and a predecessor who is now your stakeholder.
 */
export const handoverVariants: HandoverVariant[] = [
  {
    id: 'wendy',
    title: 'Wendy',
    note: [
      'A plastic wallet, on the desk, with a note on the front.',
      '"Everything\'s on the shared drive. The mapping document is called Mapping FINAL. There\'s another one called Mapping FINAL (new) - use that one. The partner data comes from Priya at Northgate, she\'s fine, just chase her in November not December. Anything else, ask Denise. Sorry about the modules. Wendy."',
    ].join('\n\n'),
    inherited:
      'Inherited: source mapping unreviewed since 2023. Partner data manual. Previous return signed off eleven weeks late.',
    initialConfidence: 0.55,
    initialRecurringDebt: 2,
    auditProbability: 0.3,
    dependencyReadinessOverrides: {
      'module-course-structure': 0.3,
      'partner-provider-returns': 0.2,
    },
    latentFlags: ['wendy_handover'],
  },
  {
    id: 'helen',
    title: 'Helen',
    note: [
      'A ring binder, tabbed and indexed, on the desk.',
      '"Section 1 is the process map. Section 2 is the exceptions log, cross-referenced to Section 4. Section 3 is empty - I never got to write up the workaround for the placement-hours field, but Section 5 explains why it matters. Call if anything\'s unclear. Helen."',
      'Everything is beautifully documented. Nobody has checked in three years whether Section 5 still matches what the system actually does.',
    ].join('\n\n'),
    inherited:
      'Inherited: documentation excellent, unreviewed against the live system since the last SITS upgrade. Confidence high, currently unearned.',
    initialConfidence: 0.75,
    initialRecurringDebt: 4,
    auditProbability: 0.35,
    dependencyReadinessOverrides: {
      'off-venue-placement-activity': 0.2,
    },
    latentFlags: ['helen_handover', 'documentation_trap'],
  },
  {
    id: 'no-note',
    title: '(no note)',
    note: [
      'There is no note.',
      "Your predecessor left in April, mid-cycle, and nobody has told you why. The shared drive has a folder called 'DO NOT DELETE - ASK' with a name in it from an old email chain. You do not know who that is.",
    ].join('\n\n'),
    inherited:
      'Inherited: nothing. No handover, no documentation index, no context beyond what the extract itself shows.',
    initialConfidence: 0.45,
    initialRecurringDebt: 3,
    auditProbability: 0.4,
    dependencyReadinessOverrides: {
      'entry-quals': 0.2,
      'disability-support-data': 0.15,
    },
    latentFlags: ['no_handover', 'mid_cycle_departure'],
  },
  {
    id: 'priti',
    title: 'Priti',
    note: [
      'A single page, precise and complete.',
      '"Everything is current. The two open items are noted below with dates. My direct line is still active until the end of the month if you need anything. It has been a genuine pleasure. Priti."',
      'It has clearly been a genuine pleasure for whoever manages you, too. They mention her unprompted, twice, in your first week.',
    ].join('\n\n'),
    inherited: 'Inherited: a clean position and a standard you did not set. Everyone remembers what "normal" looked like.',
    initialConfidence: 0.8,
    initialRecurringDebt: 0,
    auditProbability: 0.2,
    latentFlags: ['priti_handover', 'high_bar'],
  },
  {
    id: 'jonathan',
    title: 'Jonathan',
    note: [
      'A short email, forwarded, with "good luck!" added at the top.',
      '"You\'ll have seen most of this already from the other side. Ping me if you need anything - I\'m just upstairs now. Excited to see what you do with it. Jonathan."',
      'He is, technically, now the person you report the risk register to.',
    ].join('\n\n'),
    inherited:
      'Inherited: a return in reasonable shape, and a predecessor who is now your line manager\'s line manager. Every problem you surface is a problem he used to own.',
    initialConfidence: 0.65,
    initialRecurringDebt: 1,
    auditProbability: 0.25,
    latentFlags: ['jonathan_handover', 'predecessor_is_now_stakeholder'],
  },
]
