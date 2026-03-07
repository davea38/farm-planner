import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ReplacementPlanner } from "../ReplacementPlanner"
import { UnitContext } from "@/lib/UnitContext"
import type { ReplacementPlannerState } from "@/lib/types"

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
      yearOfManufacture: 2018,
      purchaseDate: "2019-06-15",
      usePerYear: 500,
      timeToChange: 3,
      currentHours: 2000,
      priceToChange: 150000,
      currentValue: 50000,
    },
  ],
  farmIncome: 350000,
}

describe("ReplacementPlanner – machine details fields", () => {
  it("renders category select with correct value", () => {
    renderWithUnits(<ReplacementPlanner initialState={testState} />)
    expect(screen.getByText("Tractor")).toBeInTheDocument()
  })

  it("renders condition radio buttons", () => {
    renderWithUnits(<ReplacementPlanner initialState={testState} />)
    const usedRadio = screen.getByLabelText("Used")
    const newRadio = screen.getByLabelText("New")
    expect(usedRadio).toBeInTheDocument()
    expect(newRadio).toBeInTheDocument()
    expect(usedRadio).toBeChecked()
    expect(newRadio).not.toBeChecked()
  })

  it("toggles condition between new and used", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(<ReplacementPlanner initialState={testState} onChange={onChange} />)

    const newRadio = screen.getByLabelText("New")
    await user.click(newRadio)

    expect(newRadio).toBeChecked()
    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ReplacementPlannerState
    expect(lastCall.machines[0].condition).toBe("new")
  })

  it("renders year of manufacture input", () => {
    renderWithUnits(<ReplacementPlanner initialState={testState} />)
    expect(screen.getByDisplayValue("2018")).toBeInTheDocument()
  })

  it("renders purchase date input with correct value", () => {
    renderWithUnits(<ReplacementPlanner initialState={testState} />)
    expect(screen.getByDisplayValue("2019-06-15")).toBeInTheDocument()
  })

  it("allows clearing purchase date (not yet purchased)", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(<ReplacementPlanner initialState={testState} onChange={onChange} />)

    const dateInput = screen.getByDisplayValue("2019-06-15")
    await user.clear(dateInput)

    expect(onChange).toHaveBeenCalled()
  })

  it("new machine defaults to category 'other' and condition 'used'", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(<ReplacementPlanner initialState={testState} onChange={onChange} />)

    await user.click(screen.getByText("+ Add Machine"))

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ReplacementPlannerState
    const newMachine = lastCall.machines[lastCall.machines.length - 1]
    expect(newMachine.category).toBe("other")
    expect(newMachine.condition).toBe("used")
    expect(newMachine.yearOfManufacture).toBeNull()
    expect(newMachine.purchaseDate).toBeNull()
  })

  it("renders null purchase date as empty input", () => {
    const noPurchaseState: ReplacementPlannerState = {
      machines: [
        {
          id: "m1",
          name: "Unpurchased",
          category: "tractor",
          condition: "new",
          yearOfManufacture: 2024,
          purchaseDate: null,
          usePerYear: 0,
          timeToChange: 0,
          currentHours: 0,
          priceToChange: 0,
          currentValue: 0,
        },
      ],
      farmIncome: 350000,
    }
    renderWithUnits(<ReplacementPlanner initialState={noPurchaseState} />)
    // The date input should exist and be empty
    const dateInputs = screen.getAllByLabelText("Purchase date")
    expect(dateInputs[0]).toHaveValue("")
  })
})
