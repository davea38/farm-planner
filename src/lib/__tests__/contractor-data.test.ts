import { describe, it, expect } from "vitest"
import { NAAC_RATES, NAAC_SOURCE, getRatesByCategory, getRatesByUnit } from "@/lib/contractor-data"

describe("contractor-data", () => {
  it("has at least 120 rates", () => {
    expect(NAAC_RATES.length).toBeGreaterThanOrEqual(120)
  })

  it("ploughing light = £79.21/ha", () => {
    const r = NAAC_RATES.find(r => r.operation === "Ploughing (light)")
    expect(r?.rate).toBe(79.21)
    expect(r?.unit).toBe("ha")
  })

  it("slug pelleting corrected to £11.35/ha", () => {
    const r = NAAC_RATES.find(r => r.operation === "Slug pelleting")
    expect(r?.rate).toBe(11.35)
    expect(r?.unit).toBe("ha")
  })

  it("lime spreading corrected to £9.53/tonne", () => {
    const r = NAAC_RATES.find(r => r.operation === "Lime spreading")
    expect(r?.rate).toBe(9.53)
    expect(r?.unit).toBe("tonne")
  })

  it("getRatesByCategory returns correct subset", () => {
    const soil = getRatesByCategory("Soil Prep")
    expect(soil.length).toBeGreaterThan(5)
    expect(soil.every(r => r.category === "Soil Prep")).toBe(true)
  })

  it('getRatesByUnit("hr") returns hourly rates across categories', () => {
    const hourly = getRatesByUnit("hr")
    expect(hourly.length).toBeGreaterThan(4)
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

  it("getRatesByUnit covers all 6 unit types", () => {
    expect(getRatesByUnit("ha").length).toBeGreaterThan(0)
    expect(getRatesByUnit("hr").length).toBeGreaterThan(0)
    expect(getRatesByUnit("bale").length).toBeGreaterThan(0)
    expect(getRatesByUnit("tonne").length).toBeGreaterThan(0)
    expect(getRatesByUnit("head").length).toBeGreaterThan(0)
    expect(getRatesByUnit("m").length).toBeGreaterThan(0)
  })

  it("has 12 categories", () => {
    const categories = new Set(NAAC_RATES.map(r => r.category))
    expect(categories.size).toBe(12)
  })

  it("has new categories", () => {
    const categories = new Set(NAAC_RATES.map(r => r.category))
    expect(categories.has("Bale Wrapping")).toBe(true)
    expect(categories.has("Slurry & Manure")).toBe(true)
    expect(categories.has("Hedges & Boundaries")).toBe(true)
    expect(categories.has("Mobile Feed")).toBe(true)
    expect(categories.has("Livestock Services")).toBe(true)
    expect(categories.has("Specialist")).toBe(true)
  })

  it("Tractor Hire has 10 entries", () => {
    const tractorHire = getRatesByCategory("Tractor Hire")
    expect(tractorHire.length).toBe(10)
  })

  it("handles dual-rate operations (same operation, different units)", () => {
    const forage = NAAC_RATES.filter(r => r.operation === "Forage harvesting")
    expect(forage.length).toBe(2)
    expect(forage.some(r => r.unit === "ha")).toBe(true)
    expect(forage.some(r => r.unit === "hr")).toBe(true)
  })
})
