import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  loadState,
  saveState,
  exportToFile,
  importFromFile,
  loadUnitPreferences,
  saveUnitPreferences,
  useAutoSave,
} from "../storage"
import { renderHook } from "@testing-library/react"
import type { AppState } from "../types"

// Mock crypto.randomUUID for deterministic IDs
vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-1234",
})

function createValidState(): AppState {
  return {
    version: 3,
    lastSaved: "2026-01-01T00:00:00.000Z",
    costPerHectare: {
      current: {
        purchasePrice: 126000,
        yearsOwned: 8,
        salePrice: 34000,
        hectaresPerYear: 1200,
        interestRate: 2,
        insuranceRate: 2,
        storageRate: 1,
        workRate: 4,
        labourCost: 14,
        fuelPrice: 0.53,
        fuelUse: 20,
        repairsPct: 2,
        contractorCharge: 76,
      },
      savedMachines: [],
    },
    costPerHour: {
      current: {
        purchasePrice: 92751,
        yearsOwned: 7,
        salePrice: 40000,
        hoursPerYear: 700,
        interestRate: 2,
        insuranceRate: 2,
        storageRate: 1,

        fuelConsumptionPerHr: 14,
        fuelPrice: 0.6,
        repairsPct: 1,
        labourCost: 14,
        contractorCharge: 45,
      },
      savedMachines: [],
    },
    compareMachines: {
      machineA: {
        name: "A",
        width: 4,
        capacity: 800,
        speed: 6,
        applicationRate: 180,
        transportTime: 5,
        fillingTime: 10,
        fieldEfficiency: 65,
      },
      machineB: {
        name: "B",
        width: 30,
        capacity: 2000,
        speed: 12,
        applicationRate: 250,
        transportTime: 5,
        fillingTime: 10,
        fieldEfficiency: 75,
      },
    },
    replacementPlanner: {
      machines: [],
      farmIncome: 350000,
    },
    contractingIncome: {
      services: [],
    },
  }
}

describe("loadState", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("returns default state when localStorage is empty", () => {
    const state = loadState()
    expect(state.version).toBe(3)
    expect(state.costPerHectare).toBeDefined()
    expect(state.costPerHour).toBeDefined()
    expect(state.compareMachines).toBeDefined()
    expect(state.replacementPlanner).toBeDefined()
  })

  it("loads valid state from localStorage", () => {
    const saved = createValidState()
    localStorage.setItem("farmPlanner", JSON.stringify(saved))
    const state = loadState()
    expect(state.costPerHectare.current.purchasePrice).toBe(126000)
  })

  it("returns default state for invalid JSON", () => {
    localStorage.setItem("farmPlanner", "not json")
    const state = loadState()
    expect(state.version).toBe(3)
  })

  it("returns default state for invalid structure", () => {
    localStorage.setItem("farmPlanner", JSON.stringify({ foo: "bar" }))
    const state = loadState()
    expect(state.version).toBe(3)
  })

  it("migrates v0 data to v2", () => {
    const v0Data = {
      costPerHectare: { current: {}, savedMachines: [] },
      costPerHour: { current: {}, savedMachines: [] },
      compareMachines: { machineA: {}, machineB: {} },
      replacementPlanner: { machines: [], farmIncome: 350000 },
    }
    localStorage.setItem("farmPlanner", JSON.stringify(v0Data))
    const state = loadState()
    expect(state.version).toBe(3)
    expect(state.lastSaved).toBeDefined()
    expect(state.contractingIncome).toEqual({ services: [] })
  })

  it("returns default state for future version", () => {
    const futureData = {
      ...createValidState(),
      version: 999,
    }
    localStorage.setItem("farmPlanner", JSON.stringify(futureData))
    const state = loadState()
    // Should fall back to defaults since migration returns null for future versions
    expect(state.version).toBe(3)
  })
})

describe("saveState", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("saves state to localStorage", () => {
    const state = createValidState()
    saveState(state)
    const raw = localStorage.getItem("farmPlanner")
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.version).toBe(3)
    expect(parsed.lastSaved).toBeDefined()
  })
})

describe("exportToFile", () => {
  it("creates and clicks a download link", () => {
    const createObjectURL = vi.fn(() => "blob:test")
    const revokeObjectURL = vi.fn()
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL })

    const clickSpy = vi.fn()
    const appendSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node)
    const removeSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node)

    // Mock createElement to track clicks
    const origCreate = document.createElement.bind(document)
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag)
      if (tag === "a") {
        vi.spyOn(el as HTMLAnchorElement, "click").mockImplementation(clickSpy)
      }
      return el
    })

    const state = createValidState()
    exportToFile(state)

    expect(createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalled()
    expect(appendSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()

    vi.restoreAllMocks()
  })
})

describe("loadUnitPreferences", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("returns defaults when empty", () => {
    const prefs = loadUnitPreferences()
    expect(prefs).toEqual({ area: "ha", speed: "km" })
  })

  it("loads valid preferences", () => {
    localStorage.setItem("farmPlannerUnits", JSON.stringify({ area: "acres", speed: "miles" }))
    const prefs = loadUnitPreferences()
    expect(prefs.area).toBe("acres")
    expect(prefs.speed).toBe("miles")
  })

  it("returns defaults for invalid preferences", () => {
    localStorage.setItem("farmPlannerUnits", JSON.stringify({ area: "invalid", speed: "km" }))
    const prefs = loadUnitPreferences()
    expect(prefs).toEqual({ area: "ha", speed: "km" })
  })

  it("returns defaults for invalid JSON", () => {
    localStorage.setItem("farmPlannerUnits", "broken")
    const prefs = loadUnitPreferences()
    expect(prefs).toEqual({ area: "ha", speed: "km" })
  })

  it("returns defaults for non-object", () => {
    localStorage.setItem("farmPlannerUnits", JSON.stringify("string"))
    const prefs = loadUnitPreferences()
    expect(prefs).toEqual({ area: "ha", speed: "km" })
  })
})

describe("saveUnitPreferences", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("saves preferences to localStorage", () => {
    saveUnitPreferences({ area: "acres", speed: "miles" })
    const raw = localStorage.getItem("farmPlannerUnits")
    expect(JSON.parse(raw!)).toEqual({ area: "acres", speed: "miles" })
  })
})

describe("importFromFile", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("imports valid JSON file", async () => {
    const state = createValidState()
    const blob = new Blob([JSON.stringify(state)], { type: "application/json" })
    const file = new File([blob], "test.json", { type: "application/json" })

    const result = await importFromFile(file)
    expect(result.version).toBe(3)
    expect(result.costPerHectare).toBeDefined()
  })

  it("rejects invalid structure", async () => {
    const blob = new Blob([JSON.stringify({ foo: "bar" })], { type: "application/json" })
    const file = new File([blob], "test.json", { type: "application/json" })

    await expect(importFromFile(file)).rejects.toThrow("Invalid farm planner data file")
  })

  it("rejects invalid JSON", async () => {
    const blob = new Blob(["not json at all"], { type: "text/plain" })
    const file = new File([blob], "test.txt", { type: "text/plain" })

    await expect(importFromFile(file)).rejects.toThrow("Could not read file")
  })

  it("rejects future version files", async () => {
    const futureState = { ...createValidState(), version: 999 }
    const blob = new Blob([JSON.stringify(futureState)], { type: "application/json" })
    const file = new File([blob], "future.json", { type: "application/json" })

    await expect(importFromFile(file)).rejects.toThrow("Unsupported data version")
  })
})

describe("useAutoSave", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("does not save on first render", () => {
    const state = createValidState()
    renderHook(() => useAutoSave(state, 100))

    vi.advanceTimersByTime(200)
    expect(localStorage.getItem("farmPlanner")).toBeNull()
  })

  it("saves after data changes and delay", () => {
    const state1 = createValidState()
    const { rerender } = renderHook(
      ({ data }) => useAutoSave(data, 100),
      { initialProps: { data: state1 } }
    )

    const state2 = { ...state1, lastSaved: "2026-02-01" }
    rerender({ data: state2 })

    vi.advanceTimersByTime(150)
    expect(localStorage.getItem("farmPlanner")).toBeTruthy()
  })

  it("debounces rapid changes", () => {
    const state1 = createValidState()
    const { rerender } = renderHook(
      ({ data }) => useAutoSave(data, 500),
      { initialProps: { data: state1 } }
    )

    // Trigger multiple changes rapidly
    rerender({ data: { ...state1, lastSaved: "change1" } })
    vi.advanceTimersByTime(100)
    rerender({ data: { ...state1, lastSaved: "change2" } })
    vi.advanceTimersByTime(100)
    rerender({ data: { ...state1, lastSaved: "change3" } })

    // Should not have saved yet
    expect(localStorage.getItem("farmPlanner")).toBeNull()

    // After full delay, should save
    vi.advanceTimersByTime(600)
    expect(localStorage.getItem("farmPlanner")).toBeTruthy()
  })
})
