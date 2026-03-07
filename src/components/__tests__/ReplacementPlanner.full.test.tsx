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

describe("ReplacementPlanner – MachineRow interactions", () => {
  const state: ReplacementPlannerState = {
    machines: [
      {
        id: "m1",
        name: "Tractor",
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
    ],
    farmIncome: 350000,
  }

  it("updates machine name when typed", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(<ReplacementPlanner initialState={state} onChange={onChange} />)

    const nameInput = screen.getByPlaceholderText("Machine name")
    expect((nameInput as HTMLInputElement).value).toBe("Tractor")
    await user.clear(nameInput)
    await user.type(nameInput, "Big Tractor")

    expect(screen.getByDisplayValue("Big Tractor")).toBeInTheDocument()
    expect(onChange).toHaveBeenCalled()
  })

  it("updates machine numeric fields", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(<ReplacementPlanner initialState={state} onChange={onChange} />)

    // Update "Replace in" field (which has value 3)
    const replaceInInput = screen.getByDisplayValue("3")
    await user.clear(replaceInInput)
    await user.type(replaceInInput, "5")

    expect(onChange).toHaveBeenCalled()
  })

  it("updates farm income", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(<ReplacementPlanner initialState={state} onChange={onChange} />)

    const incomeInput = screen.getByDisplayValue("350000")
    await user.clear(incomeInput)
    await user.type(incomeInput, "500000")

    expect(onChange).toHaveBeenCalled()
  })

  it("shows amber banner when pctOfIncome is between 20-35%", () => {
    const amberState: ReplacementPlannerState = {
      machines: [
        {
          id: "m1",
          name: "Combine",
          category: "combine",
          condition: "used",
          yearOfManufacture: null,
          purchaseDate: null,
          usePerYear: 200,
          timeToChange: 1,
          currentHours: 0,
          priceToChange: 400000,
          currentValue: 0,
        },
      ],
      farmIncome: 200000,
    }
    renderWithUnits(<ReplacementPlanner initialState={amberState} />)
    expect(screen.getByText(/keep an eye on it/)).toBeInTheDocument()
  })

  it("renders without initial state (uses defaults)", () => {
    renderWithUnits(<ReplacementPlanner />)
    // Should render with default 10 machines
    const removeButtons = screen.getAllByText("Remove")
    expect(removeButtons.length).toBe(10)
  })

  it("updates use/year, current hours, cost to replace, and current value fields", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(<ReplacementPlanner initialState={state} onChange={onChange} />)

    // Use/year field (value=500)
    const useInput = screen.getByDisplayValue("500")
    await user.clear(useInput)
    await user.type(useInput, "600")
    expect(onChange).toHaveBeenCalled()

    // Current hours field (value=2000)
    const hoursInput = screen.getByDisplayValue("2000")
    await user.clear(hoursInput)
    await user.type(hoursInput, "2500")

    // Replacement price field (value=150000)
    const costInput = screen.getByDisplayValue("150000")
    await user.clear(costInput)
    await user.type(costInput, "160000")

    // Current value field (value=50000)
    const valueInput = screen.getByDisplayValue("50000")
    await user.clear(valueInput)
    await user.type(valueInput, "55000")
  })
})
