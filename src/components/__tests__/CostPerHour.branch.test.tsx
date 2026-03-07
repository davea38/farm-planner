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
      haPerHr: 4,
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
      haPerHr: 4,
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
      haPerHr: 2,
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
      haPerHr: 0,
      fuelConsumptionPerHr: 0,
      fuelPrice: 0,
      repairsPct: 0,
      labourCost: 14,
      contractorCharge: 23,
    }
    renderWithUnits(<CostPerHour initialInputs={inputs} />)
    expect(screen.getByText(/break-even/)).toBeInTheDocument()
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
      haPerHr: 0,
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
      haPerHr: 5,
      fuelConsumptionPerHr: 18,
      fuelPrice: 0.7,
      repairsPct: 2,
      labourCost: 16,
      contractorCharge: 50,
    }
    renderWithUnits(
      <CostPerHour
        savedMachines={[{ name: "Big Loader", inputs: savedInputs }]}
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
})
