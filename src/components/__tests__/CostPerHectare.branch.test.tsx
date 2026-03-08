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
      fuelPrice: 0.53,
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
      fuelPrice: 0.53,
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
      fuelPrice: 0.75,
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
      fuelPrice: 0.53,
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

    const nameInput = screen.getByPlaceholderText("Name this machine...")
    await user.type(nameInput, "Test Machine")
    await user.click(screen.getByText("Save"))

    expect(onSave).toHaveBeenCalledWith("Test Machine", expect.any(Object))
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
      fuelPrice: 0.65,
      fuelUse: 25,
      repairsPct: 3,
      contractorCharge: 90,
    }
    renderWithUnits(
      <CostPerHectare
        savedMachines={[{ name: "Saved Tractor", inputs: savedInputs }]}
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
      labourCost: 16, fuelPrice: 0.65, fuelUse: 25, repairsPct: 3, contractorCharge: 90,
    }
    renderWithUnits(
      <CostPerHectare
        savedMachines={[{ name: "Old Tractor", inputs: savedInputs }]}
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
      labourCost: 14, fuelPrice: 0.53, fuelUse: 20, repairsPct: 2, contractorCharge: 76,
    }
    renderWithUnits(<CostPerHectare initialInputs={inputs} />)
    expect(screen.getByText(/hectares worked per year/)).toBeInTheDocument()
    expect(screen.getByText(/work rate/)).toBeInTheDocument()
    expect(screen.getByText(/years owned/)).toBeInTheDocument()
  })
})
