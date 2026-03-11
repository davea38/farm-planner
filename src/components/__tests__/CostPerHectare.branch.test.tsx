import { describe, it, expect, vi } from "vitest"
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

  it("handles onSaveMachine callback", async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(
      <CostPerHectare onSaveMachine={onSave} />
    )

    // Select a machine type first
    const machineTypeSelect = screen.getByDisplayValue("Please select...")
    await user.selectOptions(machineTypeSelect, "tractors_large")

    const nameInput = screen.getByPlaceholderText("Name this machine...")
    await user.type(nameInput, "Test Machine")
    await user.click(screen.getByText("Save"))

    expect(onSave).toHaveBeenCalledWith("Test Machine", "tractors_large", expect.any(Object))
  })

  it("loads a saved machine profile", async () => {
    const onLoad = vi.fn()
    const user = userEvent.setup()
    const savedInputs: CostPerHectareInputs = {
      purchasePrice: 200000,
      yearsOwned: 5,
      salePrice: 80000,
      hectaresPerYear: 800,
      interestRate: 3,
      insuranceRate: 2,
      storageRate: 1,
      workRate: 5,
      labourCost: 16,
      fuelPrice: 65,
      fuelUse: 25,
      repairsPct: 3,
      contractorCharge: 90,
    }
    renderWithUnits(
      <CostPerHectare
        savedMachines={[{ name: "Saved Tractor", machineType: "miscellaneous", inputs: savedInputs }]}
        onLoadMachine={onLoad}
      />
    )

    await user.click(screen.getByText("Load a saved machine..."))
    await user.click(screen.getByText("Saved Tractor"))

    expect(onLoad).toHaveBeenCalledWith(0)
    // Input should have updated to the saved value
    expect(screen.getByDisplayValue("200000")).toBeInTheDocument()
  })

  it("calls onDeleteMachine when delete is triggered", async () => {
    const onDelete = vi.fn()
    const onLoad = vi.fn()
    const user = userEvent.setup()
    const savedInputs: CostPerHectareInputs = {
      purchasePrice: 200000, yearsOwned: 5, salePrice: 80000, hectaresPerYear: 800,
      interestRate: 3, insuranceRate: 2, storageRate: 1, workRate: 5,
      labourCost: 16, fuelPrice: 65, fuelUse: 25, repairsPct: 3, contractorCharge: 90,
    }
    renderWithUnits(
      <CostPerHectare
        savedMachines={[{ name: "Old Tractor", machineType: "miscellaneous", inputs: savedInputs }]}
        onLoadMachine={onLoad}
        onDeleteMachine={onDelete}
      />
    )

    await user.click(screen.getByText("Load a saved machine..."))
    await user.click(screen.getByText("Old Tractor"))
    await user.click(screen.getByText("Delete"))
    expect(onDelete).toHaveBeenCalledWith(0)
  })

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

  it("calls onDirtyChange only once on first edit", async () => {
    const onDirtyChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(<CostPerHectare onDirtyChange={onDirtyChange} />)

    // First edit — should trigger onDirtyChange(true)
    const purchaseInput = screen.getByDisplayValue("126000")
    await user.clear(purchaseInput)
    await user.type(purchaseInput, "200000")

    // Second edit — should NOT trigger onDirtyChange again
    const saleInput = screen.getByDisplayValue("34000")
    await user.clear(saleInput)
    await user.type(saleInput, "50000")

    // onDirtyChange should have been called exactly once with true
    const trueCalls = onDirtyChange.mock.calls.filter((c: [boolean]) => c[0] === true)
    expect(trueCalls).toHaveLength(1)
  })
})
