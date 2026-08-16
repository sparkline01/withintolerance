import { createCredibilityPool, type CredibilityQueryDefinition } from '../engine/credibility'

/**
 * PLACEHOLDER credibility queries for wiring up the readiness calculation
 * (build order step 5). The full set of 8 (spec §15) is later content —
 * the first entry reuses the spec's own worked example (§5.7) verbatim.
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
      },
      {
        id: 'demand',
        label: 'Explain it as a genuine change in part-time demand, which is also happening',
        durability: 'low',
      },
      {
        id: 'portfolio',
        label: 'Explain it as a coding change following a portfolio review',
        durability: 'medium',
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
      },
      {
        id: 'entry-tariff-review',
        label: 'Frame it as a deliberate entry-tariff review',
        durability: 'medium',
      },
      {
        id: 'name-the-cause',
        label: 'Name the competitor pricing pressure directly',
        durability: 'high',
      },
    ],
  },
]

export const placeholderCredibilityPool = createCredibilityPool(definitions)
