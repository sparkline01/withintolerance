import { createErrorPool, type ErrorDefinition } from '../cascade'

/**
 * Test-only fixture. NOT real content — real rule codes and record
 * scenarios are authored later (spec §16 step 2 build-out / step 6).
 *
 * `student-a`: a blocking tier-1 error masks a blocking tier-2 error,
 * which in turn masks an advisory tier-3 error. Source-fixing tier 1
 * should reveal tier 2 as open; source-fixing tier 2 should reveal that
 * tier 3 is reachable but never counted, because it's advisory.
 *
 * `student-b`: a single blocking tier-1 error with nothing behind it, for
 * the simple "one fix, one fewer open error" case.
 */
const definitions: ErrorDefinition[] = [
  {
    id: 'a-tier1',
    recordId: 'student-a',
    tier: 1,
    severity: 'blocking',
    ruleCode: '[VERIFY] STRUCT-001',
    label: 'Record will not load',
  },
  {
    id: 'a-tier2',
    recordId: 'student-a',
    tier: 2,
    severity: 'blocking',
    ruleCode: '[VERIFY] REF-014',
    label: 'Course code does not resolve',
  },
  {
    id: 'a-tier3',
    recordId: 'student-a',
    tier: 3,
    severity: 'advisory',
    ruleCode: '[VERIFY] XDQ-032',
    label: 'Fee value outside expected range for this route',
  },
  {
    id: 'b-tier1',
    recordId: 'student-b',
    tier: 1,
    severity: 'blocking',
    ruleCode: '[VERIFY] STRUCT-002',
    label: 'Missing HUSID',
  },
]

export const sampleErrorPool = createErrorPool(definitions)
