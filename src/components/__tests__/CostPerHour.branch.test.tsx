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
      fuelPrice: 0.6,
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
      fuelPrice: 0.6,
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
      fuelPrice: 0.75,
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

  it("loads a saved machine profile", async () => {
    const onLoad = vi.fn()
    const user = userEvent.setup()
    const savedInputs: CostPerHourInputs = {
      purchasePrice: 150000,
      yearsOwned: 6,
      salePrice: 60000,
      hoursPerYear: 800,
      interestRate: 3,
      insuranceRate: 2,
      storageRate: 1,

      fuelConsumptionPerHr: 18,
      fuelPrice: 0.7,
      repairsPct: 2,
      labourCost: 16,
      contractorCharge: 50,
    }
    renderWithUnits(
      <CostPerHour
        savedMachines={[{ name: "Big Loader", machineType: "miscellaneous", inputs: savedInputs }]}
        onLoadMachine={onLoad}
      />
    )

    await user.click(screen.getByText("Load a saved machine..."))
    await user.click(screen.getByText("Big Loader"))

    expect(onLoad).toHaveBeenCalledWith(0)
    expect(screen.getByDisplayValue("150000")).toBeInTheDocument()
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
    const fuelPriceInput = screen.getByDisplayValue(/0\.\d+/)
    await user.clear(fuelPriceInput)
    await user.type(fuelPriceInput, "0.99")

    // Source badge should be removed after manual edit
    expect(screen.queryByText("AHDB fuel price")).not.toBeInTheDocument()
  })

  it("sets source badges on all fields when loading a saved machine", async () => {
    const onLoad = vi.fn()
    const user = userEvent.setup()
    const savedInputs: CostPerHourInputs = {
      purchasePrice: 150000,
      yearsOwned: 6,
      salePrice: 60000,
      hoursPerYear: 800,
      interestRate: 3,
      insuranceRate: 2,
      storageRate: 1,
      fuelConsumptionPerHr: 18,
      fuelPrice: 0.7,
      repairsPct: 2,
      labourCost: 16,
      contractorCharge: 50,
    }
    renderWithUnits(
      <CostPerHour
        savedMachines={[{ name: "Test Loader", machineType: "miscellaneous", inputs: savedInputs }]}
        onLoadMachine={onLoad}
      />
    )

    await user.click(screen.getByText("Load a saved machine..."))
    await user.click(screen.getByText("Test Loader"))

    // handleLoad sets source badges on all fields
    expect(screen.getAllByText("Saved: Test Loader").length).toBeGreaterThan(0)
  })

  it("resets isDirty on save and calls onDirtyChange(false)", async () => {
    const onDirtyChange = vi.fn()
    const onSave = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(
      <CostPerHour onDirtyChange={onDirtyChange} onSaveMachine={onSave} />
    )

    // Make an edit to set isDirty = true
    const purchaseInput = screen.getByDisplayValue("92751")
    await user.clear(purchaseInput)
    await user.type(purchaseInput, "100000")

    // onDirtyChange should have been called with true
    expect(onDirtyChange).toHaveBeenCalledWith(true)
    onDirtyChange.mockClear()

    // Save the machine — select machine type first
    const machineTypeSelect = screen.getByDisplayValue("Please select...")
    await user.selectOptions(machineTypeSelect, "tractors_large")

    const nameInput = screen.getByPlaceholderText("Name this machine...")
    await user.type(nameInput, "Saved Machine")
    await user.click(screen.getByText("Save"))

    // handleSave should reset isDirty and call onDirtyChange(false)
    expect(onDirtyChange).toHaveBeenCalledWith(false)
    expect(onSave).toHaveBeenCalledWith("Saved Machine", "tractors_large", expect.any(Object))
  })

  it("calls onDirtyChange only once on first edit", async () => {
    const onDirtyChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(<CostPerHour onDirtyChange={onDirtyChange} />)

    // First edit
    const purchaseInput = screen.getByDisplayValue("92751")
    await user.clear(purchaseInput)
    await user.type(purchaseInput, "100000")

    // Second edit
    const saleInput = screen.getByDisplayValue("40000")
    await user.clear(saleInput)
    await user.type(saleInput, "50000")

    // onDirtyChange(true) should have been called exactly once
    const trueCalls = onDirtyChange.mock.calls.filter((c: [boolean]) => c[0] === true)
    expect(trueCalls).toHaveLength(1)
  })
})
