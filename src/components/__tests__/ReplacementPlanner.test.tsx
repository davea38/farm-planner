import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ReplacementPlanner } from "../ReplacementPlanner"
import { UnitContext } from "@/lib/UnitContext"
import type { ReplacementPlannerState } from "@/lib/types"

// Mock crypto.randomUUID
vi.stubGlobal("crypto", { randomUUID: () => `uuid-${Math.random().toString(36).slice(2)}` })

const defaultUnits = { area: "ha" as const, speed: "km" as const }

function renderWithUnits(ui: React.ReactElement) {
  return render(
    <UnitContext.Provider value={{ units: defaultUnits, setUnits: () => {} }}>
      {ui}
    </UnitContext.Provider>
  )
}

const testState: ReplacementPlannerState = {
  machines: [
    {
      id: "m1",
      name: "Tractor 1",
      category: "tractor",
      condition: "used",
      yearOfManufacture: null,
      purchaseDate: null,
      usePerYear: 500,
      timeToChange: 3,
      currentHours: 2000,
      priceToChange: 150000,
      currentValue: 50000,
    },
    {
      id: "m2",
      name: "Combine",
      category: "combine",
      condition: "used",
      yearOfManufacture: null,
      purchaseDate: null,
      usePerYear: 200,
      timeToChange: 5,
      currentHours: 1000,
      priceToChange: 300000,
      currentValue: 100000,
    },
  ],
  farmIncome: 350000,
}

describe("ReplacementPlanner", () => {
  it("renders machine names", () => {
    renderWithUnits(<ReplacementPlanner initialState={testState} />)
    expect(screen.getByDisplayValue("Tractor 1")).toBeInTheDocument()
    // "Combine" appears in both name input and category select; check name input specifically
    const nameInputs = screen.getAllByPlaceholderText("Machine name")
    expect(nameInputs.some((el) => (el as HTMLInputElement).value === "Combine")).toBe(true)
  })

  it("displays budget summary section", () => {
    renderWithUnits(<ReplacementPlanner initialState={testState} />)
    expect(screen.getByText("Your budget")).toBeInTheDocument()
    expect(screen.getByText("Total replacement spend")).toBeInTheDocument()
    expect(screen.getByText("Average annual cost")).toBeInTheDocument()
  })

  it("displays timeline section", () => {
    renderWithUnits(<ReplacementPlanner initialState={testState} />)
    expect(screen.getByText("Timeline")).toBeInTheDocument()
  })

  it("shows cost to budget for each machine", () => {
    renderWithUnits(<ReplacementPlanner initialState={testState} />)
    // Machine 1: 150000 - 50000 = £100,000
    // Machine 2: 300000 - 100000 = £200,000
    // These may appear multiple times (in machine row + timeline), use getAllByText
    expect(screen.getAllByText("£100,000").length).toBeGreaterThan(0)
    expect(screen.getAllByText("£200,000").length).toBeGreaterThan(0)
  })

  it("adds a new machine", async () => {
    const user = userEvent.setup()
    renderWithUnits(<ReplacementPlanner initialState={testState} />)

    await user.click(screen.getByText("+ Add Machine"))

    expect(screen.getByDisplayValue("New machine")).toBeInTheDocument()
  })

  it("removes a machine", async () => {
    const user = userEvent.setup()
    renderWithUnits(<ReplacementPlanner initialState={testState} />)

    const removeButtons = screen.getAllByText("Remove")
    await user.click(removeButtons[0])

    expect(screen.queryByDisplayValue("Tractor 1")).not.toBeInTheDocument()
    const nameInputs = screen.getAllByPlaceholderText("Machine name")
    expect(nameInputs.some((el) => (el as HTMLInputElement).value === "Combine")).toBe(true)
  })

  it("calls onChange when machine is updated", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(<ReplacementPlanner initialState={testState} onChange={onChange} />)

    const nameInput = screen.getByDisplayValue("Tractor 1")
    await user.clear(nameInput)
    await user.type(nameInput, "Big Tractor")

    expect(onChange).toHaveBeenCalled()
  })

  it("shows green banner when pctOfIncome < 20%", () => {
    const lowCostState: ReplacementPlannerState = {
      machines: [
        {
          id: "m1",
          name: "Small",
          category: "other",
          condition: "used",
          yearOfManufacture: null,
          purchaseDate: null,
          usePerYear: 100,
          timeToChange: 1,
          currentHours: 500,
          priceToChange: 10000,
          currentValue: 5000,
        },
      ],
      farmIncome: 350000,
    }
    renderWithUnits(<ReplacementPlanner initialState={lowCostState} />)
    expect(screen.getByText(/comfortable/)).toBeInTheDocument()
  })

  it("shows amber banner when farmIncome is 0", () => {
    const zeroIncomeState: ReplacementPlannerState = {
      ...testState,
      farmIncome: 0,
    }
    renderWithUnits(<ReplacementPlanner initialState={zeroIncomeState} />)
    expect(screen.getByText(/Enter farm income/)).toBeInTheDocument()
  })

  it("shows red banner when pctOfIncome > 35%", () => {
    const highCostState: ReplacementPlannerState = {
      machines: [
        {
          id: "m1",
          name: "Expensive",
          category: "other",
          condition: "used",
          yearOfManufacture: null,
          purchaseDate: null,
          usePerYear: 1000,
          timeToChange: 1,
          currentHours: 0,
          priceToChange: 500000,
          currentValue: 0,
        },
      ],
      farmIncome: 100000,
    }
    renderWithUnits(<ReplacementPlanner initialState={highCostState} />)
    expect(screen.getByText(/eating your profits/)).toBeInTheDocument()
  })

  it("shows friendly message when cost to budget is negative (downsizing)", () => {
    const downsizeState: ReplacementPlannerState = {
      machines: [
        {
          id: "m1",
          name: "Downsize tractor",
          category: "tractor",
          condition: "used",
          yearOfManufacture: null,
          purchaseDate: null,
          usePerYear: 500,
          timeToChange: 2,
          currentHours: 1000,
          priceToChange: 30000,
          currentValue: 80000,
        },
      ],
      farmIncome: 350000,
    }
    renderWithUnits(<ReplacementPlanner initialState={downsizeState} />)
    // Should show "You'll receive £50,000" instead of "£-50,000"
    expect(screen.getByText(/You'll receive/)).toBeInTheDocument()
    expect(screen.getByText(/£50,000/)).toBeInTheDocument()
  })

  it("shows empty timeline message when all timeToChange are 0", () => {
    const noReplacementState: ReplacementPlannerState = {
      machines: [
        {
          id: "m1",
          name: "Old",
          category: "other",
          condition: "used",
          yearOfManufacture: null,
          purchaseDate: null,
          usePerYear: 500,
          timeToChange: 0,
          currentHours: 5000,
          priceToChange: 100000,
          currentValue: 10000,
        },
      ],
      farmIncome: 350000,
    }
    renderWithUnits(<ReplacementPlanner initialState={noReplacementState} />)
    expect(screen.getByText(/Set replacement years/)).toBeInTheDocument()
  })
})
