import { describe, it, expect } from "vitest"
import { getDepreciationCategory, getDepreciationOptions } from "../category-mapping"
import { DEPRECIATION_PROFILES } from "../depreciation-data"
import type { MachineCategory as ReplacementCategory } from "../types"

const ALL_REPLACEMENT_CATEGORIES: ReplacementCategory[] = [
  "tractor", "combine", "sprayer", "drill",
  "cultivator", "trailer", "handler", "other",
]

describe("getDepreciationCategory", () => {
  it("maps every replacement category to a valid depreciation category", () => {
    for (const cat of ALL_REPLACEMENT_CATEGORIES) {
      const result = getDepreciationCategory(cat)
      expect(DEPRECIATION_PROFILES[result]).toBeDefined()
    }
  })

  it.each([
    ["tractor", "tractors_large"],
    ["combine", "combines"],
    ["sprayer", "sprayers"],
    ["drill", "drills"],
    ["cultivator", "tillage"],
    ["trailer", "miscellaneous"],
    ["handler", "miscellaneous"],
    ["other", "miscellaneous"],
  ] as const)("maps %s → %s", (replacement, expected) => {
    expect(getDepreciationCategory(replacement)).toBe(expected)
  })
})

describe("getDepreciationOptions", () => {
  it("returns at least one option for every replacement category", () => {
    for (const cat of ALL_REPLACEMENT_CATEGORIES) {
      const options = getDepreciationOptions(cat)
      expect(options.length).toBeGreaterThanOrEqual(1)
    }
  })

  it("returns all valid depreciation categories", () => {
    for (const cat of ALL_REPLACEMENT_CATEGORIES) {
      for (const opt of getDepreciationOptions(cat)) {
        expect(DEPRECIATION_PROFILES[opt]).toBeDefined()
      }
    }
  })

  it("includes both tractor sizes for tractor category", () => {
    const options = getDepreciationOptions("tractor")
    expect(options).toContain("tractors_large")
    expect(options).toContain("tractors_small")
  })

  it("first option matches the default mapping", () => {
    for (const cat of ALL_REPLACEMENT_CATEGORIES) {
      const options = getDepreciationOptions(cat)
      expect(options[0]).toBe(getDepreciationCategory(cat))
    }
  })
})
