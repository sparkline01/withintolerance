import type { ErrorDefinition } from '../engine/cascade'
import type { FinaleVignette } from '../engine/finale'

/**
 * The finale's live queue content (spec §10.2, §15): 15-20 vignettes,
 * 12-14 drawn per run. `v1`/`v2` deliberately share a record across two
 * tiers, so fixing v1 properly at source can genuinely reveal v2 and
 * raise the open count mid-queue, same as the cascade mechanic elsewhere
 * (§6.1) — the finale is under a clock, not a different set of rules.
 * `v9`'s context line is the spec's own worked example (§10.2), reused
 * verbatim as the canonical case.
 */
export const finaleErrorDefinitions: ErrorDefinition[] = [
  { id: 'fin-e1', recordId: 'fin-r1', tier: 1, severity: 'blocking', ruleCode: '[VERIFY] STRUCT-101', label: 'Withdrawal date unresolved' },
  { id: 'fin-e2', recordId: 'fin-r1', tier: 2, severity: 'blocking', ruleCode: '[VERIFY] REF-201', label: 'Module marks do not reconcile' },
  { id: 'fin-e3', recordId: 'fin-r3', tier: 1, severity: 'blocking', ruleCode: '[VERIFY] STRUCT-102', label: 'Course code from a superseded portfolio review' },
  { id: 'fin-e4', recordId: 'fin-r4', tier: 2, severity: 'blocking', ruleCode: '[VERIFY] REF-202', label: 'Conflicting entry qualifications across systems' },
  { id: 'fin-e5', recordId: 'fin-r5', tier: 3, severity: 'blocking', ruleCode: '[VERIFY] XVAL-301', label: 'Fee status contradicts the funding body record' },
  { id: 'fin-e6', recordId: 'fin-r6', tier: 1, severity: 'blocking', ruleCode: '[VERIFY] STRUCT-103', label: 'HUSID does not match the pattern' },
  { id: 'fin-e7', recordId: 'fin-r7', tier: 4, severity: 'blocking', ruleCode: '[VERIFY] XREC-401', label: 'Same student appears twice under different names' },
  { id: 'fin-e8', recordId: 'fin-r8', tier: 3, severity: 'advisory', ruleCode: '[VERIFY] XDQ-302', label: 'Disability code inconsistent with support-fund claim' },
  { id: 'fin-e9', recordId: 'fin-r9', tier: 2, severity: 'blocking', ruleCode: '[VERIFY] REF-203', label: 'Module instance has no linked course' },
  { id: 'fin-e10', recordId: 'fin-r10', tier: 1, severity: 'blocking', ruleCode: '[VERIFY] STRUCT-104', label: 'Postcode does not validate' },
  { id: 'fin-e11', recordId: 'fin-r11', tier: 5, severity: 'blocking', ruleCode: '[VERIFY] XYR-501', label: "Contradicts last year's return for the same student" },
  { id: 'fin-e12', recordId: 'fin-r12', tier: 1, severity: 'blocking', ruleCode: '[VERIFY] STRUCT-105', label: 'Placement-hours field is blank' },
  { id: 'fin-e13', recordId: 'fin-r13', tier: 3, severity: 'advisory', ruleCode: '[VERIFY] XDQ-303', label: 'Ethnicity data mismatch across two self-reported sources' },
  { id: 'fin-e14', recordId: 'fin-r14', tier: 2, severity: 'blocking', ruleCode: '[VERIFY] REF-204', label: 'Course code resolves to a closed course' },
  { id: 'fin-e15', recordId: 'fin-r15', tier: 1, severity: 'blocking', ruleCode: '[VERIFY] STRUCT-106', label: 'Two applications, one enrolment, ambiguous link' },
  { id: 'fin-e16', recordId: 'fin-r16', tier: 4, severity: 'blocking', ruleCode: '[VERIFY] XREC-402', label: 'Fee record contradicts funding body, again, differently' },
  { id: 'fin-e17', recordId: 'fin-r17', tier: 1, severity: 'blocking', ruleCode: '[VERIFY] STRUCT-107', label: 'Interruption date after withdrawal date' },
  { id: 'fin-e18', recordId: 'fin-r18', tier: 3, severity: 'advisory', ruleCode: '[VERIFY] XDQ-304', label: 'Support-fund flag unreviewed since last owner left' },
]

export const finaleVignettes: FinaleVignette[] = [
  {
    id: 'fin-v1',
    errorId: 'fin-e1',
    studentRef: '24601',
    course: 'Nursing',
    humanContext:
      'Withdrew in week 4. Or in week 11. The two systems disagree and the person who would know is on maternity leave.',
  },
  {
    id: 'fin-v2',
    errorId: 'fin-e2',
    studentRef: '24601',
    course: 'Nursing',
    humanContext: "Once the withdrawal date resolves, the module marks don't reconcile either.",
  },
  {
    id: 'fin-v3',
    errorId: 'fin-e3',
    studentRef: '18332',
    course: 'Business',
    humanContext: 'The course code changed in a portfolio review. Nobody updated this one record.',
  },
  {
    id: 'fin-v4',
    errorId: 'fin-e4',
    studentRef: '09215',
    course: 'Computing',
    humanContext: 'Two systems, two different entry qualifications, both entered in good faith.',
  },
  {
    id: 'fin-v5',
    errorId: 'fin-e5',
    studentRef: '31007',
    course: 'Engineering',
    humanContext: "The fee status contradicts the funding body's own record of the same student.",
  },
  {
    id: 'fin-v6',
    errorId: 'fin-e6',
    studentRef: '22841',
    course: 'Creative Arts',
    humanContext: 'A HUSID typo. One digit. It has been wrong since enrolment.',
  },
  {
    id: 'fin-v7',
    errorId: 'fin-e7',
    studentRef: '15590',
    course: 'Health Sciences',
    humanContext: 'This student appears twice, under two slightly different names.',
  },
  {
    id: 'fin-v8',
    errorId: 'fin-e8',
    studentRef: '27364',
    course: 'Nursing',
    humanContext: "The disability code doesn't match the support-fund claim. Nobody's sure which one's right.",
  },
  {
    id: 'fin-v9',
    errorId: 'fin-e9',
    studentRef: '08821',
    course: 'Business',
    humanContext: "Module instance has no linked course. Owning department says it's a validation bug, not their data.",
  },
  {
    id: 'fin-v10',
    errorId: 'fin-e10',
    studentRef: '33102',
    course: 'Engineering',
    humanContext: "The postcode doesn't validate. The student lives on a road that changed name last year.",
  },
  {
    id: 'fin-v11',
    errorId: 'fin-e11',
    studentRef: '19477',
    course: 'Computing',
    humanContext: 'Contradicts what was returned last year, for the same student, under the same rules.',
  },
  {
    id: 'fin-v12',
    errorId: 'fin-e12',
    studentRef: '26650',
    course: 'Health Sciences',
    humanContext: 'Placement-hours field is blank. The placement definitely happened.',
  },
  {
    id: 'fin-v13',
    errorId: 'fin-e13',
    studentRef: '04213',
    course: 'Business',
    humanContext: "Ethnicity data doesn't match what was collected at enrolment. Both are self-reported.",
  },
  {
    id: 'fin-v14',
    errorId: 'fin-e14',
    studentRef: '37788',
    course: 'Nursing',
    humanContext: 'Course code resolves to a course that closed in 2022.',
  },
  {
    id: 'fin-v15',
    errorId: 'fin-e15',
    studentRef: '12904',
    course: 'Creative Arts',
    humanContext: "Two applications, one enrolment, and the extract can't tell which application won.",
  },
  {
    id: 'fin-v16',
    errorId: 'fin-e16',
    studentRef: '29561',
    course: 'Engineering',
    humanContext: "This student's fee record contradicts their own funding body's record, again, differently this time.",
  },
  {
    id: 'fin-v17',
    errorId: 'fin-e17',
    studentRef: '06734',
    course: 'Computing',
    humanContext: 'Interruption date is after the withdrawal date. Someone entered them in the wrong order.',
  },
  {
    id: 'fin-v18',
    errorId: 'fin-e18',
    studentRef: '21398',
    course: 'Health Sciences',
    humanContext: "The support-fund flag was set by someone who left in October. Nobody's checked it since.",
  },
]
