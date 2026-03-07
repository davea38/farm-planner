import {
  DEPRECIATION_PROFILES,
  getRemainingValuePct,
  getEstimatedValue,
  getDepreciationLoss,
  getAnnualDepreciation,
  findSweetSpot,
} from "@/lib/depreciation-data"

describe("DEPRECIATION_PROFILES", () => {
  it("has 8 machine categories", () => {
    expect(Object.keys(DEPRECIATION_PROFILES)).toHaveLength(8)
  })

  it("every profile starts at 100% for year 0", () => {
    for (const profile of Object.values(DEPRECIATION_PROFILES)) {
      expect(profile.remainingValueByAge[0]).toBe(100)
    }
  })

  it("every profile has 13 entries (years 0–12)", () => {
    for (const profile of Object.values(DEPRECIATION_PROFILES)) {
      expect(profile.remainingValueByAge).toHaveLength(13)
    }
  })

  it("values are monotonically decreasing", () => {
    for (const profile of Object.values(DEPRECIATION_PROFILES)) {
      for (let i = 1; i < profile.remainingValueByAge.length; i++) {
        expect(profile.remainingValueByAge[i])
          .toBeLessThanOrEqual(profile.remainingValueByAge[i - 1])
      }
    }
  })

  it("all values are between 0 and 100", () => {
    for (const profile of Object.values(DEPRECIATION_PROFILES)) {
      profile.remainingValueByAge.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(100)
      })
    }
  })
})

describe("getRemainingValuePct", () => {
  it("tractors_large year 0 = 100%", () => {
    expect(getRemainingValuePct("tractors_large", 0)).toBe(100)
  })

  it("tractors_large year 1 = 67%", () => {
    expect(getRemainingValuePct("tractors_large", 1)).toBe(67)
  })

  it("combines year 5 = 39%", () => {
    expect(getRemainingValuePct("combines", 5)).toBe(39)
  })

  it("clamps to year 12 for age > 12", () => {
    expect(getRemainingValuePct("combines", 20)).toBe(18)
  })

  it("clamps to year 0 for negative age", () => {
    expect(getRemainingValuePct("combines", -5)).toBe(100)
  })
})

describe("getEstimatedValue", () => {
  it("£126k tractor at 8 years", () => {
    expect(getEstimatedValue("tractors_large", 126000, 8)).toBeCloseTo(45360, -2)
  })

  it("£300k combine at 5 years", () => {
    expect(getEstimatedValue("combines", 300000, 5)).toBeCloseTo(117000, -2)
  })
})

describe("getDepreciationLoss", () => {
  it("£126k tractor at 8 years loses ~£80k", () => {
    const loss = getDepreciationLoss("tractors_large", 126000, 8)
    expect(loss).toBeCloseTo(80640, -2)
  })
})

describe("getAnnualDepreciation", () => {
  it("£126k tractor years 0–8 = ~£10k/year", () => {
    const annual = getAnnualDepreciation("tractors_large", 126000, 0, 8)
    expect(annual).toBeCloseTo(10080, -2)
  })

  it("returns 0 for zero span", () => {
    expect(getAnnualDepreciation("combines", 300000, 5, 5)).toBe(0)
  })
})

describe("findSweetSpot", () => {
  it("returns a year between 2 and 12", () => {
    for (const key of Object.keys(DEPRECIATION_PROFILES)) {
      const yr = findSweetSpot(key as any)
      expect(yr).toBeGreaterThanOrEqual(2)
      expect(yr).toBeLessThanOrEqual(12)
    }
  })

  it("combines sweet spot is around year 2–6", () => {
    const yr = findSweetSpot("combines")
    expect(yr).toBeGreaterThanOrEqual(2)
    expect(yr).toBeLessThanOrEqual(7)
  })
})
