import { createDependencyPool, type DependencyDefinition } from '../dependencies'

/** Test-only fixture. NOT real content — see src/content/placeholderDependencies.ts for that. */
const definitions: DependencyDefinition[] = [
  {
    id: 'dep-a',
    label: 'Dependency A',
    owner: 'admissions',
    ownerName: 'Ruth',
    initialReadiness: 0.5,
    slipsPerTurn: 0.1,
    chaseCost: { goodwill: -1 },
    escalateCost: { goodwill: -3 },
    workaroundAvailable: true,
    workaroundAccuracyPenalty: -3,
  },
  {
    id: 'dep-b',
    label: 'Dependency B',
    owner: 'faculties',
    ownerName: 'the module leads',
    initialReadiness: 1,
    slipsPerTurn: 0.2,
    chaseCost: { goodwill: -1 },
    escalateCost: { goodwill: -2 },
    workaroundAvailable: false,
    workaroundAccuracyPenalty: 0,
  },
]

export const sampleDependencyPool = createDependencyPool(definitions)
