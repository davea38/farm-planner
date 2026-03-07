import { describe, it, expect } from "vitest"
import { NAAC_RATES, NAAC_SOURCE, getRatesByCategory, getRatesByUnit } from "@/lib/contractor-data"

describe("contractor-data", () => {
  it("has at least 30 rates", () => {
    expect(NAAC_RATES.length).toBeGreaterThanOrEqual(30)
  })

  it("ploughing light = £79.21/ha", () => {
    const r = NAAC_RATES.find(r => r.operation === "Ploughing (light)")
    expect(r?.rate).toBe(79.21)
    expect(r?.unit).toBe("ha")
  })

  it("getRatesByCategory returns correct subset", () => {
    const soil = getRatesByCategory("Soil Prep")
    expect(soil.length).toBeGreaterThan(5)
    expect(soil.every(r => r.category === "Soil Prep")).toBe(true)
  })

  it('getRatesByUnit("hr") returns tractor hire rates', () => {
    const hourly = getRatesByUnit("hr")
    expect(hourly.length).toBe(4)
    expect(hourly.every(r => r.unit === "hr")).toBe(true)
  })

  it("all rates are positive numbers", () => {
    NAAC_RATES.forEach(r => {
      expect(r.rate).toBeGreaterThan(0)
    })
  })

  it("has correct source metadata", () => {
    expect(NAAC_SOURCE.name).toBe("NAAC / Farmers Weekly")
    expect(NAAC_SOURCE.year).toBe("2025-26")
  })

  it("getRatesByUnit covers all unit types", () => {
    expect(getRatesByUnit("ha").length).toBeGreaterThan(0)
    expect(getRatesByUnit("hr").length).toBeGreaterThan(0)
    expect(getRatesByUnit("bale").length).toBeGreaterThan(0)
  })

  it("has 6 categories", () => {
    const categories = new Set(NAAC_RATES.map(r => r.category))
    expect(categories.size).toBe(6)
  })
})
