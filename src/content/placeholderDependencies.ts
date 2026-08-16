import { createDependencyPool, type DependencyDefinition } from '../engine/dependencies'

/**
 * PLACEHOLDER dependency content for wiring up sign-off (build order
 * step 5). The full suggested set from spec §5.5. Real tuning of
 * readiness/slip/cost values is a later content pass — the first entry
 * reuses the spec's own worked example numbers exactly.
 */
const definitions: DependencyDefinition[] = [
  {
    id: 'entry-quals',
    label: 'Entry qualifications',
    owner: 'admissions',
    ownerName: 'Ruth',
    initialReadiness: 0.67,
    slipsPerTurn: 0.05,
    chaseCost: { goodwill: -1 },
    escalateCost: { goodwill: -3 },
    workaroundAvailable: true,
    workaroundAccuracyPenalty: -3,
  },
  {
    id: 'module-course-structure',
    label: 'Module and course structure',
    owner: 'faculties',
    ownerName: 'the module leads',
    initialReadiness: 0.5,
    slipsPerTurn: 0.04,
    chaseCost: { goodwill: -1 },
    escalateCost: { goodwill: -2, team_capacity: -1 },
    workaroundAvailable: true,
    workaroundAccuracyPenalty: -2,
  },
  {
    id: 'partner-provider-returns',
    label: 'Partner/franchise provider returns',
    owner: 'partner data',
    ownerName: 'Priyanka',
    initialReadiness: 0.3,
    slipsPerTurn: 0.06,
    chaseCost: { goodwill: -1 },
    escalateCost: { goodwill: -2 },
    workaroundAvailable: true,
    workaroundAccuracyPenalty: -2,
  },
  {
    id: 'withdrawal-interruption-dates',
    label: 'Withdrawal and interruption dates',
    owner: 'registry',
    ownerName: 'the registry team',
    initialReadiness: 0.55,
    slipsPerTurn: 0.03,
    chaseCost: { goodwill: -1 },
    escalateCost: { goodwill: -2 },
    workaroundAvailable: true,
    workaroundAccuracyPenalty: -2,
  },
  {
    id: 'fee-funding-status',
    label: 'Fee and funding status',
    owner: 'finance',
    ownerName: 'Aiden',
    initialReadiness: 0.6,
    slipsPerTurn: 0.03,
    chaseCost: { goodwill: -1 },
    escalateCost: { goodwill: -2 },
    workaroundAvailable: true,
    workaroundAccuracyPenalty: -2,
  },
  {
    id: 'disability-support-data',
    label: 'Disability and support data',
    owner: 'student support',
    ownerName: 'the student support team',
    initialReadiness: 0.45,
    slipsPerTurn: 0.04,
    chaseCost: { goodwill: -1 },
    escalateCost: { goodwill: -2 },
    workaroundAvailable: true,
    workaroundAccuracyPenalty: -3,
  },
  {
    id: 'off-venue-placement-activity',
    label: 'Off-venue and placement activity',
    owner: 'placements',
    ownerName: 'the placements office',
    initialReadiness: 0.35,
    slipsPerTurn: 0.05,
    chaseCost: { goodwill: -1 },
    escalateCost: { goodwill: -2 },
    workaroundAvailable: true,
    workaroundAccuracyPenalty: -2,
  },
  {
    id: 'staff-owned-course-changes',
    label: 'Staff-owned course changes never notified to the SRS',
    owner: 'faculties',
    ownerName: 'nobody in particular',
    initialReadiness: 0.2,
    slipsPerTurn: 0.02,
    chaseCost: { goodwill: -1 },
    escalateCost: { goodwill: -3 },
    // No workaround: this is the one that genuinely can't be papered over.
    workaroundAvailable: false,
    workaroundAccuracyPenalty: 0,
  },
]

export const placeholderDependencyPool = createDependencyPool(definitions)
