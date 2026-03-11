import { describe, it, expect } from "vitest"
import {
  calcCostPerHectare,
  calcCostPerHour,
  calcWorkrate,
  calcReplacementSummary,
} from "../calculations"
import type {
  CostPerHectareInputs,
  CostPerHourInputs,
  WorkrateInputs,
  ReplacementMachine,
} from "../types"

function makeMachine(overrides: Omit<ReplacementMachine, "category" | "condition" | "yearOfManufacture" | "purchaseDate">): ReplacementMachine {
  return { category: "other", condition: "used", yearOfManufacture: null, purchaseDate: null, ...overrides }
}

// ---------- calcCostPerHectare ----------

describe("calcCostPerHectare", () => {
  const base: CostPerHectareInputs = {
    purchasePrice: 126000,
    yearsOwned: 8,
    salePrice: 34000,
    hectaresPerYear: 1200,
    interestRate: 2,
    insuranceRate: 2,
    storageRate: 1,
    workRate: 4,
    labourCost: 14,
    fuelPrice: 53,
    fuelUse: 20,
    repairsPct: 2,
    contractorCharge: 76,
  }

  it("calculates average value correctly", () => {
    const r = calcCostPerHectare(base)
    expect(r.averageValue).toBe((126000 + 34000) / 2)
  })

  it("handles yearsOwned = 0 (no depreciation)", () => {
    const r = calcCostPerHectare({ ...base, yearsOwned: 0 })
    expect(r.annualDepreciation).toBe(0)
  })

  it("handles hectaresPerYear = 0 (no fixed cost per ha)", () => {
    const r = calcCostPerHectare({ ...base, hectaresPerYear: 0 })
    expect(r.fixedCostPerHa).toBe(0)
    expect(r.repairsPerHa).toBe(0)
  })

  it("handles workRate = 0 (no labour per ha)", () => {
    const r = calcCostPerHectare({ ...base, workRate: 0 })
    expect(r.labourPerHa).toBe(0)
  })

  it("computes positive annualSaving when contractor is cheaper", () => {
    // Make owning very expensive
    const r = calcCostPerHectare({ ...base, contractorCharge: 10 })
    expect(r.annualSaving).toBeGreaterThan(0)
  })

  it("computes negative annualSaving when owning is cheaper", () => {
    const r = calcCostPerHectare(base)
    expect(r.annualSaving).toBeLessThan(0)
  })
})

// ---------- calcCostPerHour ----------

describe("calcCostPerHour", () => {
  const base: CostPerHourInputs = {
    purchasePrice: 92751,
    yearsOwned: 7,
    salePrice: 40000,
    hoursPerYear: 700,
    interestRate: 2,
    insuranceRate: 2,
    storageRate: 1,

    fuelConsumptionPerHr: 14,
    fuelPrice: 60,
    repairsPct: 1,
    labourCost: 14,
    contractorCharge: 45,
  }

  it("calculates average value", () => {
    const r = calcCostPerHour(base)
    expect(r.averageValue).toBe((92751 + 40000) / 2)
  })

  it("handles yearsOwned = 0", () => {
    const r = calcCostPerHour({ ...base, yearsOwned: 0 })
    expect(r.annualDepreciation).toBe(0)
  })

  it("handles hoursPerYear = 0", () => {
    const r = calcCostPerHour({ ...base, hoursPerYear: 0 })
    expect(r.fixedCostPerHr).toBe(0)
    expect(r.repairsPerHr).toBe(0)
  })

  it("calculates fuel cost per hour correctly", () => {
    const r = calcCostPerHour(base)
    // fuelPerHr = fuelConsumptionPerHr * fuelPrice / 100 (L/hr * p/L / 100 = £/hr)
    expect(r.fuelPerHr).toBeCloseTo(14 * 60 / 100)
  })

  it("fuel cost is consumption × price (e.g. hauling burns fuel without covering area)", () => {
    const r = calcCostPerHour(base)
    expect(r.fuelPerHr).toBeGreaterThan(0)
    expect(r.fuelPerHr).toBeCloseTo(14 * 60 / 100)
  })

  it("labour per hr equals labourCost directly", () => {
    const r = calcCostPerHour(base)
    expect(r.labourPerHr).toBe(14)
  })

  it("calculates annual saving", () => {
    const r = calcCostPerHour(base)
    const expected = (r.totalCostPerHr - base.contractorCharge) * base.hoursPerYear
    expect(r.annualSaving).toBeCloseTo(expected)
  })

  it("returns all expected fields", () => {
    const r = calcCostPerHour(base)
    expect(r).toHaveProperty("averageValue")
    expect(r).toHaveProperty("annualInterest")
    expect(r).toHaveProperty("annualDepreciation")
    expect(r).toHaveProperty("annualInsurance")
    expect(r).toHaveProperty("annualStorage")
    expect(r).toHaveProperty("totalFixedCostPerYear")
    expect(r).toHaveProperty("fixedCostPerHr")
    expect(r).toHaveProperty("labourPerHr")
    expect(r).toHaveProperty("fuelPerHr")
    expect(r).toHaveProperty("repairsPerHr")
    expect(r).toHaveProperty("totalCostPerHr")
    expect(r).toHaveProperty("annualSaving")
  })
})

// ---------- calcWorkrate ----------

describe("calcWorkrate", () => {
  const base: WorkrateInputs = {
    name: "Test",
    width: 4,
    capacity: 800,
    speed: 6,
    applicationRate: 180,
    transportTime: 5,
    fillingTime: 10,
    fieldEfficiency: 65,
  }

  it("calculates spot rate = width * speed / 10", () => {
    const r = calcWorkrate(base)
    expect(r.spotRate).toBeCloseTo(4 * 6 / 10)
  })

  it("calculates area per load = capacity / applicationRate", () => {
    const r = calcWorkrate(base)
    expect(r.areaPerLoad).toBeCloseTo(800 / 180)
  })

  it("calculates filling rate = capacity / fillingTime", () => {
    const r = calcWorkrate(base)
    expect(r.fillingRate).toBeCloseTo(800 / 10)
  })

  it("handles applicationRate = 0", () => {
    const r = calcWorkrate({ ...base, applicationRate: 0 })
    expect(r.areaPerLoad).toBe(0)
  })

  it("handles fillingTime = 0", () => {
    const r = calcWorkrate({ ...base, fillingTime: 0 })
    expect(r.fillingRate).toBe(0)
  })

  it("handles zero spotRate (width=0)", () => {
    const r = calcWorkrate({ ...base, width: 0 })
    expect(r.spotRate).toBe(0)
    expect(r.overallEfficiency).toBe(0)
  })

  it("handles zero fieldEfficiency", () => {
    const r = calcWorkrate({ ...base, fieldEfficiency: 0 })
    expect(r.applicationTime).toBe(0)
  })

  it("percentages sum to ~100%", () => {
    const r = calcWorkrate(base)
    const sum = r.applicationPct + r.fillingPct + r.transportPct
    expect(sum).toBeCloseTo(100, 0)
  })

  it("overall work rate is less than spot rate (due to filling/transport)", () => {
    const r = calcWorkrate(base)
    expect(r.overallWorkRate).toBeLessThan(r.spotRate)
  })

  it("handles all zeros gracefully", () => {
    const r = calcWorkrate({
      name: "Zero",
      width: 0,
      capacity: 0,
      speed: 0,
      applicationRate: 0,
      transportTime: 0,
      fillingTime: 0,
      fieldEfficiency: 0,
    })
    expect(r.spotRate).toBe(0)
    expect(r.overallWorkRate).toBe(0)
    expect(r.applicationPct).toBe(0)
    expect(r.fillingPct).toBe(0)
    expect(r.transportPct).toBe(0)
  })
})

// ---------- calcReplacementSummary ----------

describe("calcReplacementSummary", () => {
  it("returns at least 7 years (minimum span of 6 + year 0)", () => {
    const machines: ReplacementMachine[] = []
    const result = calcReplacementSummary(machines, 350000, 2026, 6)
    expect(result.annualCosts.length).toBe(7) // years 0..6
  })

  it("places machine cost in the correct year", () => {
    const machines: ReplacementMachine[] = [
      makeMachine({
        id: "1",
        name: "Tractor",
        usePerYear: 500,
        timeToChange: 3,
        currentHours: 2000,
        priceToChange: 150000,
        currentValue: 50000,
      }),
    ]
    const result = calcReplacementSummary(machines, 350000, 2026, 6)
    // Cost should be at index 3 (year 2029)
    expect(result.annualCosts[3].cost).toBe(100000) // 150000 - 50000
    expect(result.annualCosts[3].year).toBe(2029)
  })

  it("skips machines with timeToChange <= 0", () => {
    const machines: ReplacementMachine[] = [
      makeMachine({
        id: "1",
        name: "Old",
        usePerYear: 500,
        timeToChange: 0,
        currentHours: 5000,
        priceToChange: 100000,
        currentValue: 10000,
      }),
    ]
    const result = calcReplacementSummary(machines, 350000, 2026, 6)
    expect(result.totalSpend).toBe(0)
  })

  it("extends span to accommodate latest machine", () => {
    const machines: ReplacementMachine[] = [
      makeMachine({
        id: "1",
        name: "Far future",
        usePerYear: 100,
        timeToChange: 10,
        currentHours: 0,
        priceToChange: 80000,
        currentValue: 20000,
      }),
    ]
    const result = calcReplacementSummary(machines, 350000, 2026, 6)
    // Effective span should be 10 (> 6), so 11 entries
    expect(result.annualCosts.length).toBe(11)
    expect(result.annualCosts[10].year).toBe(2036)
  })

  it("calculates totalSpend across all machines", () => {
    const machines: ReplacementMachine[] = [
      makeMachine({ id: "1", name: "A", usePerYear: 500, timeToChange: 2, currentHours: 0, priceToChange: 100000, currentValue: 30000 }),
      makeMachine({ id: "2", name: "B", usePerYear: 300, timeToChange: 4, currentHours: 0, priceToChange: 60000, currentValue: 10000 }),
    ]
    const result = calcReplacementSummary(machines, 350000, 2026, 6)
    expect(result.totalSpend).toBe(70000 + 50000)
  })

  it("calculates pctOfIncome correctly", () => {
    const machines: ReplacementMachine[] = [
      makeMachine({ id: "1", name: "A", usePerYear: 500, timeToChange: 1, currentHours: 0, priceToChange: 70000, currentValue: 0 }),
    ]
    const result = calcReplacementSummary(machines, 350000, 2026, 6)
    // effectiveSpan is 6 (the minimum); average divides by effectiveSpan, not annualCosts.length
    const avgCost = result.totalSpend / 6
    expect(result.pctOfIncome).toBeCloseTo((avgCost / 350000) * 100)
  })

  it("handles zero farmIncome", () => {
    const machines: ReplacementMachine[] = [
      makeMachine({ id: "1", name: "A", usePerYear: 500, timeToChange: 1, currentHours: 0, priceToChange: 70000, currentValue: 0 }),
    ]
    const result = calcReplacementSummary(machines, 0, 2026, 6)
    expect(result.pctOfIncome).toBe(0)
  })

  it("accumulates multiple machines in the same year", () => {
    const machines: ReplacementMachine[] = [
      makeMachine({ id: "1", name: "A", usePerYear: 500, timeToChange: 2, currentHours: 0, priceToChange: 50000, currentValue: 10000 }),
      makeMachine({ id: "2", name: "B", usePerYear: 300, timeToChange: 2, currentHours: 0, priceToChange: 80000, currentValue: 20000 }),
    ]
    const result = calcReplacementSummary(machines, 350000, 2026, 6)
    // Both in year index 2: (50000-10000) + (80000-20000) = 40000 + 60000 = 100000
    expect(result.annualCosts[2].cost).toBe(100000)
  })
})
