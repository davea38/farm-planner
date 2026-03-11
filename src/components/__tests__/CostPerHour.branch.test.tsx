import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CostPerHour } from "../CostPerHour"
import { UnitContext } from "@/lib/UnitContext"
import type { CostPerHourInputs } from "@/lib/types"

const metricUnits = { area: "ha" as const, speed: "km" as const }

function renderWithUnits(ui: React.ReactElement, units = metricUnits) {
  return render(
    <UnitContext.Provider value={{ units, setUnits: () => {} }}>
      {ui}
    </UnitContext.Provider>
  )
}

describe("CostPerHour – branch coverage", () => {
  it("shows zero-value warning when hoursPerYear is 0", () => {
    const inputs: CostPerHourInputs = {
      purchasePrice: 92751,
      yearsOwned: 7,
      salePrice: 40000,
      hoursPerYear: 0,
      interestRate: 2,
      insuranceRate: 2,
      storageRate: 1,

      fuelConsumptionPerHr: 14,
      fuelPrice: 60,
      repairsPct: 1,
      labourCost: 14,
      contractorCharge: 45,
    }
    renderWithUnits(<CostPerHour initialInputs={inputs} />)
    expect(screen.getByText(/Enter a value for/)).toBeInTheDocument()
    expect(screen.getByText(/hours worked per year/)).toBeInTheDocument()
  })

  it("shows zero-value warning when yearsOwned is 0", () => {
    const inputs: CostPerHourInputs = {
      purchasePrice: 92751,
      yearsOwned: 0,
      salePrice: 40000,
      hoursPerYear: 700,
      interestRate: 2,
      insuranceRate: 2,
      storageRate: 1,

      fuelConsumptionPerHr: 14,
      fuelPrice: 60,
      repairsPct: 1,
      labourCost: 14,
      contractorCharge: 45,
    }
    renderWithUnits(<CostPerHour initialInputs={inputs} />)
    expect(screen.getByText(/years owned/)).toBeInTheDocument()
  })

  it("shows red banner when contractor is cheaper", () => {
    const inputs: CostPerHourInputs = {
      purchasePrice: 300000,
      yearsOwned: 5,
      salePrice: 50000,
      hoursPerYear: 200,
      interestRate: 5,
      insuranceRate: 3,
      storageRate: 2,

      fuelConsumptionPerHr: 20,
      fuelPrice: 75,
      repairsPct: 5,
      labourCost: 20,
      contractorCharge: 30,
    }
    renderWithUnits(<CostPerHour initialInputs={inputs} />)
    expect(screen.getByText(/save.*year using a contractor/i)).toBeInTheDocument()
  })

  it("shows amber banner at break-even", () => {
    // Need totalCostPerHr ≈ contractorCharge such that saving is within 10% of contractor total
    const inputs: CostPerHourInputs = {
      purchasePrice: 50000,
      yearsOwned: 10,
      salePrice: 10000,
      hoursPerYear: 500,
      interestRate: 2,
      insuranceRate: 1,
      storageRate: 0.5,

      fuelConsumptionPerHr: 0,
      fuelPrice: 0,
      repairsPct: 0,
      labourCost: 14,
      contractorCharge: 23,
    }
    renderWithUnits(<CostPerHour initialInputs={inputs} />)
    expect(screen.getAllByText(/break-even/).length).toBeGreaterThanOrEqual(1)
  })

  it("shows green banner when owning is cheaper", () => {
    const inputs: CostPerHourInputs = {
      purchasePrice: 50000,
      yearsOwned: 10,
      salePrice: 10000,
      hoursPerYear: 1000,
      interestRate: 2,
      insuranceRate: 1,
      storageRate: 0.5,

      fuelConsumptionPerHr: 0,
      fuelPrice: 0,
      repairsPct: 0,
      labourCost: 14,
      contractorCharge: 45,
    }
    renderWithUnits(<CostPerHour initialInputs={inputs} />)
    expect(screen.getByText(/save.*year by owning/i)).toBeInTheDocument()
  })

  it("calls onChange when input is modified", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(<CostPerHour onChange={onChange} />)

    const purchaseInput = screen.getByDisplayValue("92751")
    await user.clear(purchaseInput)
    await user.type(purchaseInput, "100000")

    expect(onChange).toHaveBeenCalled()
  })

  it("clears source badge when user manually edits a field that had a source", async () => {
    const user = userEvent.setup()
    renderWithUnits(<CostPerHour />)

    // Expand the AHDB Fuel Prices collapsible section first
    await user.click(screen.getByText(/AHDB Fuel Prices/))
    // Click "Use red diesel price" to set a source badge on fuelPrice
    await user.click(screen.getByRole("button", { name: /use red diesel/i }))
    // Source badge should now be visible
    expect(screen.getByText("AHDB fuel price")).toBeInTheDocument()

    // Find the fuel price input and manually edit it to trigger update("fuelPrice")
    const fuelPriceInput = screen.getByDisplayValue(/74\.91/)
    await user.clear(fuelPriceInput)
    await user.type(fuelPriceInput, "80")

    // Source badge should be removed after manual edit
    expect(screen.queryByText("AHDB fuel price")).not.toBeInTheDocument()
  })

  // Note: saved machine loading and dirty-state tracking tests were removed.
  // Save/load/dirty-change functionality moved to MachinesTab (centralized architecture).
  // Those behaviors are now tested in machineProfileLoading.test.tsx and MachinesTab.test.tsx.
})
