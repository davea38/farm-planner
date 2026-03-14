import { describe, it, expect, vi, beforeEach } from "vitest"
import { loadState, saveState, importFromFile } from "../storage"
import type { AppState } from "../types"
import { defaultCostPerHectare, defaultCostPerHour, defaultMachineA, defaultMachineB } from "../defaults"

vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-migration",
})

/**
 * Builds a v3 state (pre-machineType) with optional saved machines.
 * This is what localStorage would contain before the v3->v4 migration.
 */
function createV3StateWithMachines() {
  return {
    version: 3,
    lastSaved: "2026-01-01T00:00:00.000Z",
    costPerHectare: {
      current: {
        purchasePrice: 126000, yearsOwned: 8, salePrice: 34000,
        hectaresPerYear: 1200, interestRate: 2, insuranceRate: 2,
        storageRate: 1, workRate: 4, labourCost: 14, fuelPrice: 53,
        fuelUse: 20, repairsPct: 2, contractorCharge: 76,
      },
      savedMachines: [
        { name: "Old Drill", inputs: { purchasePrice: 50000 } },
        { name: "Old Sprayer", inputs: { purchasePrice: 80000 } },
      ],
    },
    costPerHour: {
      current: {
        purchasePrice: 92751, yearsOwned: 7, salePrice: 40000,
        hoursPerYear: 700, interestRate: 2, insuranceRate: 2,
        storageRate: 1, fuelConsumptionPerHr: 14, fuelPrice: 60,
        repairsPct: 1, labourCost: 14, contractorCharge: 45,
      },
      savedMachines: [
        { name: "Old Loader", inputs: { purchasePrice: 60000 } },
      ],
    },
    compareMachines: {
      machineA: { name: "A", width: 4, capacity: 800, speed: 6, applicationRate: 180, transportTime: 5, fillingTime: 10, fieldEfficiency: 65 },
      machineB: { name: "B", width: 30, capacity: 2000, speed: 12, applicationRate: 250, transportTime: 5, fillingTime: 10, fieldEfficiency: 75 },
    },
    replacementPlanner: { machines: [], farmIncome: 350000 },
    contractingIncome: { services: [] },
  }
}

function createV6State(): AppState {
  return {
    version: 6,
    lastSaved: "2026-01-01T00:00:00.000Z",
    savedMachines: [
      {
        name: "Drill",
        machineType: "drills",
        costMode: "hectare",
        costPerHectare: {
          purchasePrice: 50000, yearsOwned: 5, salePrice: 10000, hectaresPerYear: 300,
          interestRate: 2, insuranceRate: 2, storageRate: 1, workRate: 4,
          labourCost: 14, fuelPrice: 60, fuelUse: 15, repairsPct: 2, contractorCharge: 60,
        },
        costPerHour: { ...defaultCostPerHour },
        compareMachines: { machineA: { ...defaultMachineA }, machineB: { ...defaultMachineB } },
      },
      {
        name: "Telehandler",
        machineType: "miscellaneous",
        costMode: "hour",
        costPerHectare: { ...defaultCostPerHectare },
        costPerHour: {
          purchasePrice: 60000, yearsOwned: 6, salePrice: 20000, hoursPerYear: 800,
          interestRate: 3, insuranceRate: 2, storageRate: 1,
          fuelConsumptionPerHr: 12, fuelPrice: 60, repairsPct: 2,
          labourCost: 14, contractorCharge: 50,
        },
        compareMachines: { machineA: { ...defaultMachineA }, machineB: { ...defaultMachineB } },
      },
    ],
    replacementPlanner: { machines: [], farmIncome: 350000 },
    contractingIncome: { services: [] },
  }
}

describe("v3 -> v6 migration: machineType on saved machines", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("adds machineType 'miscellaneous' to every hectare saved machine (now in savedMachines)", () => {
    const v3 = createV3StateWithMachines()
    localStorage.setItem("farmPlanner", JSON.stringify(v3))

    const state = loadState()
    expect(state.version).toBe(6)
    // The hectare machines are first in the unified savedMachines array
    const hectareMachines = state.savedMachines.filter(m => m.costMode === "hectare")
    for (const m of hectareMachines) {
      expect(m.machineType).toBe("miscellaneous")
    }
  })

  it("adds machineType 'miscellaneous' to every hour saved machine (now in savedMachines)", () => {
    const v3 = createV3StateWithMachines()
    localStorage.setItem("farmPlanner", JSON.stringify(v3))

    const state = loadState()
    const hourMachines = state.savedMachines.filter(m => m.costMode === "hour")
    for (const m of hourMachines) {
      expect(m.machineType).toBe("miscellaneous")
    }
  })

  it("migrates without error when savedMachines arrays are empty", () => {
    const v3 = createV3StateWithMachines()
    v3.costPerHectare.savedMachines = []
    v3.costPerHour.savedMachines = []
    localStorage.setItem("farmPlanner", JSON.stringify(v3))

    const state = loadState()
    expect(state.version).toBe(6)
    expect(state.savedMachines).toEqual([])
  })

  it("does not overwrite machineType if it already exists on v3 data", () => {
    const v3 = createV3StateWithMachines()
    // Simulate a machine that somehow already has machineType
    ;(v3.costPerHectare.savedMachines[0] as Record<string, unknown>).machineType = "sprayers"
    localStorage.setItem("farmPlanner", JSON.stringify(v3))

    const state = loadState()
    const hectareMachines = state.savedMachines.filter(m => m.costMode === "hectare")
    expect(hectareMachines[0].machineType).toBe("sprayers")
    // The second one should get the default
    expect(hectareMachines[1].machineType).toBe("miscellaneous")
  })

  it("migrates all the way from v0 to v6 including machineType", () => {
    const v0 = {
      costPerHectare: {
        current: {},
        savedMachines: [{ name: "Ancient Drill", inputs: {} }],
      },
      costPerHour: { current: {}, savedMachines: [] },
      compareMachines: { machineA: {}, machineB: {} },
      replacementPlanner: { machines: [], farmIncome: 350000 },
    }
    localStorage.setItem("farmPlanner", JSON.stringify(v0))

    const state = loadState()
    expect(state.version).toBe(6)
    expect(state.savedMachines[0].machineType).toBe("miscellaneous")
  })
})

describe("machineType persistence (save / load round-trip)", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("preserves machineType through save and load", () => {
    const state = createV6State()
    saveState(state)

    const loaded = loadState()
    expect(loaded.savedMachines[0].machineType).toBe("drills")
    expect(loaded.savedMachines[1].machineType).toBe("miscellaneous")
  })

  it("preserves machineType through export and import", async () => {
    const state = createV6State()
    const json = JSON.stringify({ ...state, lastSaved: new Date().toISOString() })
    const blob = new Blob([json], { type: "application/json" })
    const file = new File([blob], "test.json", { type: "application/json" })

    const imported = await importFromFile(file)
    expect(imported.savedMachines[0].machineType).toBe("drills")
    expect(imported.savedMachines[1].machineType).toBe("miscellaneous")
  })

  it("preserves different machineType values across multiple saved machines", () => {
    const state = createV6State()
    state.savedMachines.push({
      name: "Sprayer",
      machineType: "sprayers",
      costMode: "hectare",
      costPerHectare: state.savedMachines[0].costPerHectare,
      costPerHour: { ...defaultCostPerHour },
      compareMachines: { machineA: { ...defaultMachineA }, machineB: { ...defaultMachineB } },
    })
    saveState(state)

    const loaded = loadState()
    expect(loaded.savedMachines[0].machineType).toBe("drills")
    expect(loaded.savedMachines[2].machineType).toBe("sprayers")
  })
})
