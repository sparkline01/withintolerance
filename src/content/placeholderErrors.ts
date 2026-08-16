import { createErrorPool, type ErrorDefinition } from '../engine/cascade'

/**
 * PLACEHOLDER error pool for wiring up the dashboard (build order step 3).
 * Rule codes are illustrative only — see docs/spec.md §0. Real content is
 * authored in a later step, once the finale module (§10) that mostly
 * consumes it exists.
 */
const definitions: ErrorDefinition[] = [
  {
    id: 'husid-mismatch',
    recordId: 'record-0142',
    tier: 1,
    severity: 'blocking',
    ruleCode: '[VERIFY] STRUCT-002',
    label: 'HUSID does not match the pattern for this provider',
  },
  {
    id: 'course-code-unresolved',
    recordId: 'record-0142',
    tier: 2,
    severity: 'blocking',
    ruleCode: '[VERIFY] REF-014',
    label: 'Course code does not resolve to a KIS record',
  },
  {
    id: 'fee-out-of-range',
    recordId: 'record-0201',
    tier: 1,
    severity: 'blocking',
    ruleCode: '[VERIFY] STRUCT-009',
    label: 'Fee value missing for a chargeable route',
  },
  {
    id: 'disability-code-advisory',
    recordId: 'record-0355',
    tier: 3,
    severity: 'advisory',
    ruleCode: '[VERIFY] XDQ-032',
    label: 'Disability code inconsistent with support-fund claim',
  },
]

/**
 * A plausible expected population for a mid-tariff provider — matches the
 * 4,600 used in the entry-quals example throughout the spec. Used by the
 * dashboard to derive "records in the return" as population minus the
 * records currently failing to load (tier-1 errors).
 */
export const placeholderPopulation = 4600

export const placeholderErrorPool = createErrorPool(definitions)
