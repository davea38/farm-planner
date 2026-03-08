import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ContractingIncomePlanner } from "@/components/ContractingIncomePlanner"

const emptyState = { services: [] }

describe("ContractingIncomePlanner", () => {
  it("renders tab title", () => {
    render(
      <ContractingIncomePlanner
        initialState={emptyState}
        onChange={vi.fn()}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    expect(screen.getByText(/Will contracting pay/i)).toBeInTheDocument()
  })

  it('shows "Add Service" button', () => {
    render(
      <ContractingIncomePlanner
        initialState={emptyState}
        onChange={vi.fn()}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    expect(
      screen.getByRole("button", { name: /add.*service/i }),
    ).toBeInTheDocument()
  })

  it("adds a service card when button clicked", () => {
    const onChange = vi.fn()
    render(
      <ContractingIncomePlanner
        initialState={emptyState}
        onChange={onChange}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: /add.*service/i }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        services: expect.arrayContaining([
          expect.objectContaining({ name: "New Service" }),
        ]),
      }),
    )
  })

  it("shows service results when inputs are filled", () => {
    const service = {
      id: "test-1",
      name: "Combining",
      chargeRate: 119.34,
      chargeUnit: "ha" as const,
      annualVolume: 400,
      ownCostPerUnit: 85,
      additionalCosts: 2000,
      linkedMachineSource: null,
    }
    render(
      <ContractingIncomePlanner
        initialState={{ services: [service] }}
        onChange={vi.fn()}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    expect(screen.getAllByText(/gross income/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/£47,736/).length).toBeGreaterThan(0)
  })

  it("shows traffic-light banner based on margin", () => {
    const profitableService = {
      id: "test-1",
      name: "Combining",
      chargeRate: 119.34,
      chargeUnit: "ha" as const,
      annualVolume: 400,
      ownCostPerUnit: 85,
      additionalCosts: 2000,
      linkedMachineSource: null,
    }
    const { container } = render(
      <ContractingIncomePlanner
        initialState={{ services: [profitableService] }}
        onChange={vi.fn()}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    // 24.6% margin = green banner
    expect(
      container.querySelector('[data-banner="green"]'),
    ).toBeInTheDocument()
  })

  it("shows loss-making banner for unprofitable service", () => {
    const lossService = {
      id: "test-2",
      name: "Ploughing",
      chargeRate: 50,
      chargeUnit: "ha" as const,
      annualVolume: 100,
      ownCostPerUnit: 60,
      additionalCosts: 500,
      linkedMachineSource: null,
    }
    const { container } = render(
      <ContractingIncomePlanner
        initialState={{ services: [lossService] }}
        onChange={vi.fn()}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    expect(container.querySelector('[data-banner="red"]')).toBeInTheDocument()
  })

  it("shows overall summary when multiple services exist", () => {
    const services = [
      {
        id: "test-1",
        name: "Combining",
        chargeRate: 119.34,
        chargeUnit: "ha" as const,
        annualVolume: 400,
        ownCostPerUnit: 85,
        additionalCosts: 2000,
        linkedMachineSource: null,
      },
      {
        id: "test-2",
        name: "Spraying",
        chargeRate: 16.52,
        chargeUnit: "ha" as const,
        annualVolume: 800,
        ownCostPerUnit: 10,
        additionalCosts: 500,
        linkedMachineSource: null,
      },
    ]
    render(
      <ContractingIncomePlanner
        initialState={{ services }}
        onChange={vi.fn()}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    expect(screen.getByText(/overall contracting summary/i)).toBeInTheDocument()
    expect(screen.getAllByText(/total.*profit/i).length).toBeGreaterThan(0)
  })

  it('shows "Pull from saved machine" dropdown with machines from both tabs', () => {
    const hectareMachines = [
      {
        name: "6m Drill",
        inputs: {
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
      },
    ]
    const hourMachines = [
      {
        name: "Telehandler",
        inputs: {
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
      },
    ]
    const service = {
      id: "test-1",
      name: "New Service",
      chargeRate: 0,
      chargeUnit: "ha" as const,
      annualVolume: 0,
      ownCostPerUnit: 0,
      additionalCosts: 0,
      linkedMachineSource: null,
    }
    render(
      <ContractingIncomePlanner
        initialState={{ services: [service] }}
        onChange={vi.fn()}
        savedHectareMachines={hectareMachines}
        savedHourMachines={hourMachines}
      />,
    )
    expect(screen.getByText(/pull from saved machine/i)).toBeInTheDocument()
  })

  it("deletes a service when delete button clicked", () => {
    const onChange = vi.fn()
    const services = [
      {
        id: "test-1",
        name: "Combining",
        chargeRate: 100,
        chargeUnit: "ha" as const,
        annualVolume: 400,
        ownCostPerUnit: 85,
        additionalCosts: 0,
        linkedMachineSource: null,
      },
    ]
    render(
      <ContractingIncomePlanner
        initialState={{ services }}
        onChange={onChange}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: /delete/i }))
    expect(onChange).toHaveBeenCalledWith({ services: [] })
  })

  it("filters NAAC rates panel by service charge unit", () => {
    const service = {
      id: "test-bale",
      name: "Baling",
      chargeRate: 5,
      chargeUnit: "bale" as const,
      annualVolume: 2000,
      ownCostPerUnit: 3,
      additionalCosts: 0,
      linkedMachineSource: null,
    }
    render(
      <ContractingIncomePlanner
        initialState={{ services: [service] }}
        onChange={vi.fn()}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    // Expand the outer collapsible, then the inner NAAC panel
    fireEvent.click(screen.getByText(/NAAC Rates/))
    fireEvent.click(screen.getByText(/NAAC Contractor Rates/))
    // Only bale-related categories should be visible — Soil Prep (per-ha) should not
    expect(screen.queryByText("Soil Prep")).not.toBeInTheDocument()
    expect(screen.getByText("Baling")).toBeInTheDocument()
  })

  it("shows summary even with a single service", () => {
    const services = [
      {
        id: "test-1",
        name: "Combining",
        chargeRate: 100,
        chargeUnit: "ha" as const,
        annualVolume: 100,
        ownCostPerUnit: 70,
        additionalCosts: 0,
        linkedMachineSource: null,
      },
    ]
    render(
      <ContractingIncomePlanner
        initialState={{ services }}
        onChange={vi.fn()}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    expect(screen.getByText(/overall contracting summary/i)).toBeInTheDocument()
  })
})
