import type { MachineCategory as ReplacementCategory } from "./types"
import type { MachineCategory as DepreciationCategory } from "./depreciation-data"

/**
 * Canonical display labels for each replacement category.
 * This is the single source of truth — MACHINE_CATEGORIES in defaults.ts
 * is derived from this record so the two can never drift apart.
 */
export const CATEGORY_LABELS: Record<ReplacementCategory, string> = {
  tractor: "Tractor",
  combine: "Combine",
  sprayer: "Sprayer",
  drill: "Drill",
  cultivator: "Cultivator",
  trailer: "Trailer",
  handler: "Handler",
  other: "Other",
}

/**
 * Maps each replacement planner category to its default depreciation category.
 *
 * Tractors default to "tractors_large" because most farm tractors in a replacement
 * plan are 150+ HP arable machines. Use `getDepreciationOptions` for the full list
 * of possible matches (e.g. both tractor sizes).
 */
const DEFAULT_MAPPING: Record<ReplacementCategory, DepreciationCategory> = {
  tractor: "tractors_large",
  combine: "combines",
  sprayer: "sprayers",
  drill: "drills",
  cultivator: "tillage",
  trailer: "miscellaneous",
  handler: "miscellaneous",
  other: "miscellaneous",
}

/**
 * Where a replacement category could match more than one depreciation profile,
 * list all candidates in order of likelihood.
 */
const ALL_OPTIONS: Record<ReplacementCategory, DepreciationCategory[]> = {
  tractor: ["tractors_large", "tractors_small"],
  combine: ["combines"],
  sprayer: ["sprayers"],
  drill: ["drills"],
  cultivator: ["tillage"],
  trailer: ["miscellaneous"],
  handler: ["miscellaneous"],
  other: ["miscellaneous", "forage_harvesters", "tillage", "drills", "sprayers", "combines", "tractors_large", "tractors_small"],
}

/** Get the single best-match depreciation category for a replacement category. */
export function getDepreciationCategory(category: ReplacementCategory): DepreciationCategory {
  return DEFAULT_MAPPING[category] ?? "miscellaneous"
}

/**
 * Get all plausible depreciation categories for a replacement category,
 * ordered from most to least likely. Useful for presenting a picker when
 * the default might not be right (e.g. small vs large tractor).
 */
export function getDepreciationOptions(category: ReplacementCategory): DepreciationCategory[] {
  return ALL_OPTIONS[category]
}
