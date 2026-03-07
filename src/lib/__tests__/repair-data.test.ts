import { describe, it, expect } from "vitest"
import { lookupRepairPct, machineTypes } from "../repair-data"

describe("lookupRepairPct", () => {
  it("returns 0 for zero hours", () => {
    expect(lookupRepairPct("tractors", 0)).toBe(0)
  })

  it("returns 0 for negative hours", () => {
    expect(lookupRepairPct("tractors", -100)).toBe(0)
  })

  // --- Tractors ---
  it("returns minimum bracket for tractors at low hours", () => {
    expect(lookupRepairPct("tractors", 100)).toBe(3) // <= 500 → 3%
  })

  it("interpolates between tractor brackets", () => {
    // Between 500 (3%) and 750 (3.5%)
    const pct = lookupRepairPct("tractors", 625)
    expect(pct).toBeCloseTo(3.25)
  })

  it("returns exact bracket value for tractors", () => {
    expect(lookupRepairPct("tractors", 500)).toBe(3)
    expect(lookupRepairPct("tractors", 750)).toBe(3.5)
    expect(lookupRepairPct("tractors", 1000)).toBe(5)
    expect(lookupRepairPct("tractors", 1500)).toBe(7)
  })

  it("extrapolates beyond max tractor bracket", () => {
    // 1500 = 7%, perExtra100 = 0.5
    // 1600 → 7 + (100/100) * 0.5 = 7.5
    expect(lookupRepairPct("tractors", 1600)).toBeCloseTo(7.5)
    // 2000 → 7 + (500/100) * 0.5 = 9.5
    expect(lookupRepairPct("tractors", 2000)).toBeCloseTo(9.5)
  })

  // --- Standard machinery ---
  it("returns minimum bracket for combines at low hours", () => {
    expect(lookupRepairPct("combines", 10)).toBe(1.5) // <= 50
  })

  it("interpolates between standard brackets", () => {
    // combines: [50, 1.5], [100, 2.5] → midpoint 75 → 2.0
    expect(lookupRepairPct("combines", 75)).toBeCloseTo(2.0)
  })

  it("extrapolates beyond max standard bracket", () => {
    // ploughs: max [200, 14], perExtra100 = 6
    // 300 → 14 + (100/100) * 6 = 20
    expect(lookupRepairPct("ploughs", 300)).toBeCloseTo(20)
  })

  it("handles each machine type at exact bracket values", () => {
    expect(lookupRepairPct("combines", 50)).toBe(1.5)
    expect(lookupRepairPct("combines", 200)).toBe(4.5)
    expect(lookupRepairPct("ploughs", 50)).toBe(4.5)
    expect(lookupRepairPct("rotaryCultivators", 100)).toBe(7)
    expect(lookupRepairPct("discHarrows", 150)).toBe(7.5)
    expect(lookupRepairPct("tedders", 200)).toBe(8.5)
    expect(lookupRepairPct("cerealDrills", 100)).toBe(4)
    expect(lookupRepairPct("grainDryers", 200)).toBe(3)
  })

  it("grain dryers extrapolate slowly", () => {
    // grainDryers: max [200, 3], perExtra100 = 0.5
    // 400 → 3 + (200/100) * 0.5 = 4
    expect(lookupRepairPct("grainDryers", 400)).toBeCloseTo(4)
  })
})

describe("machineTypes", () => {
  it("has 9 machine type entries", () => {
    expect(machineTypes).toHaveLength(9)
  })

  it("includes tractors", () => {
    expect(machineTypes.find((m) => m.type === "tractors")).toBeDefined()
  })

  it("each entry has label and type", () => {
    machineTypes.forEach((mt) => {
      expect(mt.label).toBeTruthy()
      expect(mt.type).toBeTruthy()
    })
  })
})
