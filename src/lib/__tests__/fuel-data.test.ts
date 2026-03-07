import { FUEL_PRICES } from "@/lib/fuel-data"

describe("FUEL_PRICES", () => {
  it("exports current red diesel price", () => {
    expect(FUEL_PRICES.redDiesel.current).toBe(74.91)
  })

  it("exports current pump diesel price", () => {
    expect(FUEL_PRICES.pumpDiesel.current).toBe(141.22)
  })

  it("has 5 years of historical data", () => {
    expect(FUEL_PRICES.historical).toHaveLength(5)
  })

  it("historical data is in chronological order", () => {
    const years = FUEL_PRICES.historical.map((h) => h.year)
    expect(years).toEqual([2022, 2023, 2024, 2025, 2026])
  })

  it("has AHDB source attribution", () => {
    expect(FUEL_PRICES.source).toBe("AHDB")
  })
})
