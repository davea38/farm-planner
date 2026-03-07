import { describe, it, expect } from "vitest"
import {
  calculateContractingService,
  calculateContractingSummary,
} from "@/lib/calculations"

describe("calculateContractingService", () => {
  it("calculates gross income", () => {
    const r = calculateContractingService(119.34, 400, 85, 2000)
    expect(r.grossIncome).toBeCloseTo(47736, 0)
  })

  it("calculates total own cost", () => {
    const r = calculateContractingService(119.34, 400, 85, 2000)
    expect(r.totalOwnCost).toBeCloseTo(36000, 0)
  })

  it("calculates profit per unit", () => {
    const r = calculateContractingService(119.34, 400, 85, 2000)
    // 119.34 - 85 - (2000/400) = 119.34 - 85 - 5 = 29.34
    expect(r.profitPerUnit).toBeCloseTo(29.34, 2)
  })

  it("calculates annual profit", () => {
    const r = calculateContractingService(119.34, 400, 85, 2000)
    expect(r.annualProfit).toBeCloseTo(11736, 0)
  })

  it("calculates margin percentage", () => {
    const r = calculateContractingService(119.34, 400, 85, 2000)
    // 11736 / 47736 * 100 = 24.58%
    expect(r.marginPct).toBeCloseTo(24.58, 0)
  })

  it("handles zero volume gracefully", () => {
    const r = calculateContractingService(100, 0, 50, 1000)
    expect(r.grossIncome).toBe(0)
    expect(r.profitPerUnit).toBe(0)
    expect(r.marginPct).toBe(0)
  })

  it("returns negative margin for loss-making service", () => {
    const r = calculateContractingService(50, 100, 60, 500)
    // gross = 5000, cost = 6500, profit = -1500
    expect(r.annualProfit).toBeLessThan(0)
    expect(r.marginPct).toBeLessThan(0)
  })
})

describe("calculateContractingSummary", () => {
  it("aggregates multiple services", () => {
    const services = [
      calculateContractingService(119.34, 400, 85, 2000),
      calculateContractingService(50, 200, 30, 500),
    ]
    const summary = calculateContractingSummary(services)
    expect(summary.serviceCount).toBe(2)
    expect(summary.totalGrossIncome).toBeCloseTo(47736 + 10000, 0)
    expect(summary.totalProfit).toBeCloseTo(11736 + 3500, 0)
  })

  it("handles empty services array", () => {
    const summary = calculateContractingSummary([])
    expect(summary.totalGrossIncome).toBe(0)
    expect(summary.totalProfit).toBe(0)
    expect(summary.overallMarginPct).toBe(0)
    expect(summary.serviceCount).toBe(0)
  })

  it("calculates overall margin", () => {
    const services = [
      calculateContractingService(100, 100, 70, 0),
      calculateContractingService(100, 100, 90, 0),
    ]
    const summary = calculateContractingSummary(services)
    // total income = 20000, total cost = 16000, profit = 4000
    expect(summary.overallMarginPct).toBeCloseTo(20, 0)
  })
})
