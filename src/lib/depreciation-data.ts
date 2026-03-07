export type MachineCategory =
  | "tractors_small"
  | "tractors_large"
  | "combines"
  | "forage_harvesters"
  | "sprayers"
  | "tillage"
  | "drills"
  | "miscellaneous"

export interface DepreciationProfile {
  label: string
  description: string
  /** Remaining value as % of list price at age 0, 1, 2, ... 12 years */
  remainingValueByAge: number[]
  /** Typical economic life in years */
  typicalLife: number
  /** The "steepest drop" year range, for highlighting on the graph */
  steepestDropYears: [number, number]
}

/**
 * Remaining value as % of new list price by age (years 0–12).
 * Source: ASAE D497 via Mississippi State Extension P3543.
 * Cross-referenced with Farmers Weekly UK tractor data.
 * Year 0 = 100% (purchase). Values plateau after year 12.
 */
export const DEPRECIATION_PROFILES: Record<MachineCategory, DepreciationProfile> = {
  tractors_small: {
    label: "Tractors (80–149 HP)",
    description: "Utility and mid-range tractors",
    remainingValueByAge: [100, 68, 62, 57, 53, 49, 46, 44, 41, 39, 37, 35, 34],
    typicalLife: 10,
    steepestDropYears: [0, 3],
  },
  tractors_large: {
    label: "Tractors (150+ HP)",
    description: "Large arable and heavy-duty tractors",
    remainingValueByAge: [100, 67, 59, 54, 49, 45, 42, 39, 36, 34, 32, 30, 28],
    typicalLife: 8,
    steepestDropYears: [0, 3],
  },
  combines: {
    label: "Combine Harvesters",
    description: "Combine harvesters and crop harvesting equipment",
    remainingValueByAge: [100, 69, 58, 50, 44, 39, 35, 31, 28, 25, 22, 20, 18],
    typicalLife: 8,
    steepestDropYears: [0, 4],
  },
  forage_harvesters: {
    label: "Forage Harvesters & Balers",
    description: "Self-propelled and trailed forage equipment, balers",
    remainingValueByAge: [100, 56, 50, 46, 42, 39, 37, 34, 32, 30, 28, 27, 25],
    typicalLife: 10,
    steepestDropYears: [0, 2],
  },
  sprayers: {
    label: "Sprayers",
    description: "Self-propelled and trailed crop sprayers",
    remainingValueByAge: [100, 61, 54, 49, 45, 42, 39, 36, 34, 31, 30, 28, 26],
    typicalLife: 8,
    steepestDropYears: [0, 3],
  },
  tillage: {
    label: "Tillage Equipment",
    description: "Ploughs, cultivators, disc harrows, power harrows",
    remainingValueByAge: [100, 61, 54, 49, 45, 42, 39, 36, 34, 31, 30, 28, 26],
    typicalLife: 10,
    steepestDropYears: [0, 3],
  },
  drills: {
    label: "Drills & Planters",
    description: "Seed drills, precision planters, combination drills",
    remainingValueByAge: [100, 65, 60, 56, 53, 50, 48, 46, 44, 42, 40, 39, 38],
    typicalLife: 10,
    steepestDropYears: [0, 3],
  },
  miscellaneous: {
    label: "Other Equipment",
    description: "Telehandlers, loaders, grain dryers, trailers, rollers",
    remainingValueByAge: [100, 61, 54, 49, 45, 42, 39, 36, 34, 31, 30, 28, 26],
    typicalLife: 10,
    steepestDropYears: [0, 3],
  },
}

export const DATA_SOURCE = {
  name: "ASAE D497 / Mississippi State Extension",
  note: "Based on auction sale values. Actual value depends on condition, brand, and local market.",
}

/** Look up remaining value % for a given category and age */
export function getRemainingValuePct(category: MachineCategory, ageYears: number): number {
  const profile = DEPRECIATION_PROFILES[category]
  const clamped = Math.max(0, Math.min(Math.round(ageYears), 12))
  return profile.remainingValueByAge[clamped]
}

/** Calculate estimated market value */
export function getEstimatedValue(
  category: MachineCategory,
  purchasePrice: number,
  ageYears: number
): number {
  return purchasePrice * getRemainingValuePct(category, ageYears) / 100
}

/** Calculate total depreciation cost (£ lost) */
export function getDepreciationLoss(
  category: MachineCategory,
  purchasePrice: number,
  ageYears: number
): number {
  return purchasePrice - getEstimatedValue(category, purchasePrice, ageYears)
}

/** Annual depreciation cost between two years */
export function getAnnualDepreciation(
  category: MachineCategory,
  purchasePrice: number,
  fromYear: number,
  toYear: number
): number {
  const span = toYear - fromYear
  if (span <= 0) return 0
  const valueLost = getEstimatedValue(category, purchasePrice, fromYear)
    - getEstimatedValue(category, purchasePrice, toYear)
  return valueLost / span
}

/**
 * Find the "sweet spot" year — where annual depreciation cost
 * drops below a threshold (the curve flattens out).
 * Returns the year where keeping the machine another year
 * costs less than the average annual depreciation so far.
 */
export function findSweetSpot(category: MachineCategory): number {
  const profile = DEPRECIATION_PROFILES[category]
  const values = profile.remainingValueByAge
  for (let yr = 2; yr < values.length - 1; yr++) {
    const marginalLoss = values[yr - 1] - values[yr]
    const avgLossSoFar = (100 - values[yr]) / yr
    if (marginalLoss < avgLossSoFar) return yr
  }
  return profile.typicalLife
}
