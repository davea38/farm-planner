import { describe, it, expect, vi } from "vitest"
import { migrateV5toV6 } from "../storage"
import { defaultCostPerHectare, defaultCostPerHour, defaultMachineA, defaultMachineB } from "../defaults"
import type { MachineProfile } from "../types"

vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-v6",
})

function createV5State(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    version: 5,
    lastSaved: "2026-03-01T00:00:00.000Z",
    costPerHectare: {
      savedMachines: [
        {
          name: "Drill",
          machineType: "drills",
          inputs: {
            purchasePrice: 50000, yearsOwned: 5, salePrice: 10000,
            hectaresPerYear: 300, interestRate: 2, insuranceRate: 2,
            storageRate: 1, workRate: 4, labourCost: 14, fuelPrice: 0.85,
            fuelUse: 15, repairsPct: 2, contractorCharge: 60,
          },
        },
        {
          name: "Sprayer",
          machineType: "sprayers",
          inputs: {
            purchasePrice: 80000, yearsOwned: 6, salePrice: 20000,
            hectaresPerYear: 500, interestRate: 2, insuranceRate: 2,
            storageRate: 1, workRate: 6, labourCost: 14, fuelPrice: 0.85,
            fuelUse: 12, repairsPct: 3, contractorCharge: 30,
          },
        },
      ],
    },
    costPerHour: {
      savedMachines: [
        {
          name: "Telehandler",
          machineType: "miscellaneous",
          inputs: {
            purchasePrice: 60000, yearsOwned: 6, salePrice: 20000,
            hoursPerYear: 800, interestRate: 3, insuranceRate: 2,
            storageRate: 1, fuelConsumptionPerHr: 12, fuelPrice: 0.85,
            repairsPct: 2, labourCost: 14, contractorCharge: 50,
          },
        },
      ],
    },
    compareMachines: {
      machineA: { name: "A", width: 4, capacity: 800, speed: 6, applicationRate: 180, transportTime: 5, fillingTime: 10, fieldEfficiency: 65 },
      machineB: { name: "B", width: 30, capacity: 2000, speed: 12, applicationRate: 250, transportTime: 5, fillingTime: 10, fieldEfficiency: 75 },
    },
    replacementPlanner: { machines: [], farmIncome: 400000 },
    contractingIncome: { services: [] },
    ...overrides,
  }
}

describe("v5 → v6 migration: unified machine data model", () => {
  it("Test 1: merges 2 hectare + 1 hour machine into unified array with correct order", () => {
    const v5 = createV5State()
    const result = migrateV5toV6(v5)

    expect(result.version).toBe(6)
    const machines = result.savedMachines as MachineProfile[]
    expect(machines).toHaveLength(3)

    // Hectare machines first
    expect(machines[0].name).toBe("Drill")
    expect(machines[0].costMode).toBe("hectare")
    expect(machines[1].name).toBe("Sprayer")
    expect(machines[1].costMode).toBe("hectare")

    // Hour machine last
    expect(machines[2].name).toBe("Telehandler")
    expect(machines[2].costMode).toBe("hour")
  })

  it("Test 2: preserves all input values from the original cost mode", () => {
    const v5 = createV5State()
    const result = migrateV5toV6(v5)
    const machines = result.savedMachines as MachineProfile[]

    // Hectare machine preserves its hectare inputs
    expect(machines[0].costPerHectare.purchasePrice).toBe(50000)
    expect(machines[0].costPerHectare.hectaresPerYear).toBe(300)
    expect(machines[0].costPerHectare.contractorCharge).toBe(60)

    // Hour machine preserves its hour inputs
    expect(machines[2].costPerHour.purchasePrice).toBe(60000)
    expect(machines[2].costPerHour.hoursPerYear).toBe(800)
    expect(machines[2].costPerHour.fuelConsumptionPerHr).toBe(12)
  })

  it("Test 3: fills missing cost mode with defaults", () => {
    const v5 = createV5State()
    const result = migrateV5toV6(v5)
    const machines = result.savedMachines as MachineProfile[]

    // Hectare machine gets default hour data
    expect(machines[0].costPerHour).toEqual(defaultCostPerHour)
    expect(machines[0].costPerHour.purchasePrice).toBe(defaultCostPerHour.purchasePrice)

    // Hour machine gets default hectare data
    expect(machines[2].costPerHectare).toEqual(defaultCostPerHectare)
    expect(machines[2].costPerHectare.hectaresPerYear).toBe(defaultCostPerHectare.hectaresPerYear)
  })

  it("Test 4: remaps linkedMachineSource for hectare machines", () => {
    const v5 = createV5State({
      contractingIncome: {
        services: [
          { id: "svc1", name: "Drilling", linkedMachineSource: "hectare:1" },
        ],
      },
    })

    const result = migrateV5toV6(v5)
    const contracting = result.contractingIncome as { services: Array<{ linkedMachineSource: string | null }> }
    // hectare:1 = second hectare machine = index 1 in unified array
    expect(contracting.services[0].linkedMachineSource).toBe("1")
  })

  it("Test 5: remaps linkedMachineSource for hour machines offset after hectare machines", () => {
    const v5 = createV5State({
      contractingIncome: {
        services: [
          { id: "svc1", name: "Loading", linkedMachineSource: "hour:0" },
        ],
      },
    })

    const result = migrateV5toV6(v5)
    const contracting = result.contractingIncome as { services: Array<{ linkedMachineSource: string | null }> }
    // hour:0 = first hour machine, after 2 hectare machines = index 2
    expect(contracting.services[0].linkedMachineSource).toBe("2")
  })

  it("Test 6: handles empty machine lists", () => {
    const v5 = createV5State({
      costPerHectare: { savedMachines: [] },
      costPerHour: { savedMachines: [] },
    })

    const result = migrateV5toV6(v5)
    expect(result.version).toBe(6)
    expect(result.savedMachines).toEqual([])
  })

  it("Test 7: preserves replacementPlanner and contractingIncome", () => {
    const v5 = createV5State()
    const result = migrateV5toV6(v5)

    const planner = result.replacementPlanner as { farmIncome: number }
    expect(planner.farmIncome).toBe(400000)

    const contracting = result.contractingIncome as { services: unknown[] }
    expect(contracting.services).toEqual([])
  })

  it("Test 8: removes top-level costPerHectare, costPerHour, and compareMachines keys", () => {
    const v5 = createV5State()
    const result = migrateV5toV6(v5)

    expect(result).not.toHaveProperty("costPerHectare")
    expect(result).not.toHaveProperty("costPerHour")
    expect(result).not.toHaveProperty("compareMachines")
    expect(result).toHaveProperty("savedMachines")
    expect(result).toHaveProperty("replacementPlanner")
    expect(result).toHaveProperty("contractingIncome")
    expect(result).toHaveProperty("lastSaved")
  })

  it("preserves machineType from v5 machines", () => {
    const v5 = createV5State()
    const result = migrateV5toV6(v5)
    const machines = result.savedMachines as MachineProfile[]

    expect(machines[0].machineType).toBe("drills")
    expect(machines[1].machineType).toBe("sprayers")
    expect(machines[2].machineType).toBe("miscellaneous")
  })

  it("defaults machineType to miscellaneous when missing", () => {
    const v5 = createV5State()
    const haMachines = ((v5.costPerHectare as Record<string, unknown>).savedMachines as Array<Record<string, unknown>>)
    delete haMachines[0].machineType

    const result = migrateV5toV6(v5)
    const machines = result.savedMachines as MachineProfile[]
    expect(machines[0].machineType).toBe("miscellaneous")
  })

  it("copies global compareMachines into each machine profile", () => {
    const v5 = createV5State()
    const result = migrateV5toV6(v5)
    const machines = result.savedMachines as MachineProfile[]

    for (const machine of machines) {
      expect(machine.compareMachines.machineA.name).toBe("A")
      expect(machine.compareMachines.machineA.width).toBe(4)
      expect(machine.compareMachines.machineB.name).toBe("B")
      expect(machine.compareMachines.machineB.width).toBe(30)
    }
  })

  it("uses default compareMachines when global is missing", () => {
    const v5 = createV5State()
    delete v5.compareMachines

    const result = migrateV5toV6(v5)
    const machines = result.savedMachines as MachineProfile[]

    expect(machines[0].compareMachines.machineA).toEqual(defaultMachineA)
    expect(machines[0].compareMachines.machineB).toEqual(defaultMachineB)
  })

  it("nullifies linkedMachineSource when old reference is not in index map", () => {
    const v5 = createV5State({
      contractingIncome: {
        services: [
          { id: "svc1", name: "Unknown", linkedMachineSource: "hectare:99" },
        ],
      },
    })

    const result = migrateV5toV6(v5)
    const contracting = result.contractingIncome as { services: Array<{ linkedMachineSource: string | null }> }
    expect(contracting.services[0].linkedMachineSource).toBeNull()
  })

  it("leaves null linkedMachineSource unchanged", () => {
    const v5 = createV5State({
      contractingIncome: {
        services: [
          { id: "svc1", name: "Manual", linkedMachineSource: null },
        ],
      },
    })

    const result = migrateV5toV6(v5)
    const contracting = result.contractingIncome as { services: Array<{ linkedMachineSource: string | null }> }
    expect(contracting.services[0].linkedMachineSource).toBeNull()
  })
})
