import { describe, it, expect } from "vitest"
import { fromDisplay, toDisplay, displayUnit, CONVERSIONS } from "../units"

describe("fromDisplay edge cases", () => {
  it("converts km/hr from miles when area is ha (speed-only conversion)", () => {
    // area = "ha", speed = "miles" — should still convert km/hr
    const result = fromDisplay(10, "km/hr", { area: "ha", speed: "miles" })
    expect(result).toBeCloseTo(10 / CONVERSIONS.kmToMiles)
  })

  it("returns value unchanged for unknown unit in metric mode", () => {
    expect(fromDisplay(42, "widgets", { area: "ha", speed: "km" })).toBe(42)
  })

  it("returns value unchanged for unknown unit in imperial mode", () => {
    expect(fromDisplay(42, "widgets", { area: "acres", speed: "miles" })).toBe(42)
  })
})

describe("toDisplay edge cases", () => {
  it("converts km/hr with area=ha and speed=miles", () => {
    const result = toDisplay(10, "km/hr", { area: "ha", speed: "miles" })
    expect(result).toBeCloseTo(10 * CONVERSIONS.kmToMiles)
  })

  it("returns value unchanged for units without ha or km", () => {
    expect(toDisplay(42, "£/hr", { area: "acres", speed: "miles" })).toBe(42)
  })
})

describe("displayUnit edge cases", () => {
  it("returns metric unit when area is ha", () => {
    expect(displayUnit("ha", { area: "ha", speed: "km" })).toBe("ha")
  })

  it("returns mph when speed is miles", () => {
    expect(displayUnit("km/hr", { area: "ha", speed: "miles" })).toBe("mph")
  })

  it("returns metric unit for non-area non-speed units", () => {
    expect(displayUnit("£/hr", { area: "acres", speed: "miles" })).toBe("£/hr")
  })
})
