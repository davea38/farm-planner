import { estimateFuelConsumption, HP_REFERENCE_POINTS } from "@/lib/fuel-consumption-data"

describe("estimateFuelConsumption", () => {
  it("100 HP → 24.4 L/hr", () => {
    expect(estimateFuelConsumption(100)).toBeCloseTo(24.4)
  })

  it("200 HP → 48.8 L/hr", () => {
    expect(estimateFuelConsumption(200)).toBeCloseTo(48.8)
  })

  it("0 HP → 0 L/hr", () => {
    expect(estimateFuelConsumption(0)).toBe(0)
  })
})

describe("HP_REFERENCE_POINTS", () => {
  it("has 6 entries", () => {
    expect(HP_REFERENCE_POINTS).toHaveLength(6)
  })
})
