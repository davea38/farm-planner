import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CostPerHectare } from "../CostPerHectare"
import { UnitContext } from "@/lib/UnitContext"
import type { CostPerHectareInputs } from "@/lib/types"
import type { UnitPreferences } from "@/lib/units"

const metricUnits = { area: "ha" as const, speed: "km" as const }

function renderWithUnits(ui: React.ReactElement, units: UnitPreferences = metricUnits) {
  return render(
    <UnitContext.Provider value={{ units, setUnits: () => {} }}>
      {ui}
    </UnitContext.Provider>
  )
}

describe("CostPerHectare – branch coverage", () => {
  it("shows zero-value warning when hectaresPerYear is 0", () => {
    const inputs: CostPerHectareInputs = {
      purchasePrice: 126000,
      yearsOwned: 8,
      salePrice: 34000,
      hectaresPerYear: 0,
      interestRate: 2,
      insuranceRate: 2,
      storageRate: 1,
      workRate: 4,
      labourCost: 14,
      fuelPrice: 53,
      fuelUse: 20,
      repairsPct: 2,
      contractorCharge: 76,
    }
    renderWithUnits(<CostPerHectare initialInputs={inputs} />)
    expect(screen.getByText(/Enter a value for/)).toBeInTheDocument()
  })

  it("shows zero-value warning when workRate is 0", () => {
    const inputs: CostPerHectareInputs = {
      purchasePrice: 126000,
      yearsOwned: 8,
      salePrice: 34000,
      hectaresPerYear: 1200,
      interestRate: 2,
      insuranceRate: 2,
      storageRate: 1,
      workRate: 0,
      labourCost: 14,
      fuelPrice: 53,
      fuelUse: 20,
      repairsPct: 2,
      contractorCharge: 76,
    }
    renderWithUnits(<CostPerHectare initialInputs={inputs} />)
    expect(screen.getByText(/work rate/)).toBeInTheDocument()
  })

  it("shows red banner when contractor is much cheaper", () => {
    const inputs: CostPerHectareInputs = {
      purchasePrice: 500000,
      yearsOwned: 5,
      salePrice: 100000,
      hectaresPerYear: 200,
      interestRate: 5,
      insuranceRate: 3,
      storageRate: 2,
      workRate: 2,
      labourCost: 20,
      fuelPrice: 75,
      fuelUse: 30,
      repairsPct: 5,
      contractorCharge: 50,
    }
    renderWithUnits(<CostPerHectare initialInputs={inputs} />)
    expect(screen.getByText(/save.*year using a contractor/i)).toBeInTheDocument()
  })

  it("shows amber banner when costs are roughly equal", () => {
    const inputs: CostPerHectareInputs = {
      purchasePrice: 126000,
      yearsOwned: 8,
      salePrice: 34000,
      hectaresPerYear: 1200,
      interestRate: 2,
      insuranceRate: 2,
      storageRate: 1,
      workRate: 4,
      labourCost: 14,
      fuelPrice: 53,
      fuelUse: 20,
      repairsPct: 2,
      contractorCharge: 30.27, // Matches AHDB example cost ~£30.27/ha
    }
    renderWithUnits(<CostPerHectare initialInputs={inputs} />)
    expect(screen.getAllByText(/break-even/).length).toBeGreaterThanOrEqual(1)
  })

  it("shows green banner when owning is much cheaper", () => {
    renderWithUnits(<CostPerHectare />) // defaults have contractorCharge: 76 vs ~30/ha
    expect(screen.getByText(/save.*year by owning/i)).toBeInTheDocument()
  })

  it("renders in acres mode with proper unit labels", () => {
    renderWithUnits(
      <CostPerHectare />,
      { area: "acres", speed: "km" }
    )
    expect(screen.getByText(/Acres/)).toBeInTheDocument()
  })

  // Note: saved machine loading and dirty-state tracking tests were removed.
  // Save/load/dirty-change functionality moved to MachinesTab (centralized architecture).
  // Those behaviors are now tested in machineProfileLoading.test.tsx and MachinesTab.test.tsx.

  it("shows combined zero warnings for multiple zero fields", () => {
    const inputs: CostPerHectareInputs = {
      purchasePrice: 126000, yearsOwned: 0, salePrice: 34000, hectaresPerYear: 0,
      interestRate: 2, insuranceRate: 2, storageRate: 1, workRate: 0,
      labourCost: 14, fuelPrice: 53, fuelUse: 20, repairsPct: 2, contractorCharge: 76,
    }
    renderWithUnits(<CostPerHectare initialInputs={inputs} />)
    expect(screen.getByText(/hectares worked per year/)).toBeInTheDocument()
    expect(screen.getByText(/work rate/)).toBeInTheDocument()
    expect(screen.getByText(/years owned/)).toBeInTheDocument()
  })

  it("clears source badge when user manually edits a field that had a source", async () => {
    const user = userEvent.setup()
    renderWithUnits(<CostPerHectare />)

    // Expand the AHDB Fuel Prices collapsible section first
    await user.click(screen.getByText(/AHDB Fuel Prices/))
    // Click "Use red diesel price" to set a source badge on fuelPrice
    await user.click(screen.getByRole("button", { name: /use red diesel/i }))
    // Source badge should now be visible
    expect(screen.getByText("AHDB fuel price")).toBeInTheDocument()

    // Find the fuel price input and manually edit it
    const fuelPriceInput = screen.getByDisplayValue(/74\.91/)
    await user.clear(fuelPriceInput)
    await user.type(fuelPriceInput, "80")

    // Source badge should be removed after manual edit
    expect(screen.queryByText("AHDB fuel price")).not.toBeInTheDocument()
  })

})
