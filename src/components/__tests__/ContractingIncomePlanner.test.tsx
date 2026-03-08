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

  /* ───────────────────── additional coverage tests ───────────────────── */

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

  const baseService = {
    id: "test-edit",
    name: "Combining",
    chargeRate: 100,
    chargeUnit: "ha" as const,
    annualVolume: 400,
    ownCostPerUnit: 60,
    additionalCosts: 500,
    linkedMachineSource: null,
  }

  it("updates service name on input change", () => {
    const onChange = vi.fn()
    render(
      <ContractingIncomePlanner
        initialState={{ services: [baseService] }}
        onChange={onChange}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    const nameInput = screen.getByDisplayValue("Combining")
    fireEvent.change(nameInput, { target: { value: "Spraying" } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        services: [expect.objectContaining({ name: "Spraying" })],
      }),
    )
  })

  it("updates charge rate on input change", () => {
    const onChange = vi.fn()
    render(
      <ContractingIncomePlanner
        initialState={{ services: [baseService] }}
        onChange={onChange}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    const rateInput = screen.getByDisplayValue("100")
    fireEvent.change(rateInput, { target: { value: "150" } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        services: [expect.objectContaining({ chargeRate: 150 })],
      }),
    )
  })

  it("updates charge unit via select dropdown", () => {
    const onChange = vi.fn()
    const { container } = render(
      <ContractingIncomePlanner
        initialState={{ services: [baseService] }}
        onChange={onChange}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    // The charge-unit select is the one whose current value is "ha" and has
    // options like hr, bale, etc. It's the second <select> (first would be
    // "pull from machine" if present, but here there are no saved machines).
    const selects = container.querySelectorAll("select")
    const unitSelect = selects[0] // only select present when no saved machines
    fireEvent.change(unitSelect, { target: { value: "hr" } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        services: [expect.objectContaining({ chargeUnit: "hr" })],
      }),
    )
  })

  it("updates annual volume on input change", () => {
    const onChange = vi.fn()
    render(
      <ContractingIncomePlanner
        initialState={{ services: [baseService] }}
        onChange={onChange}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    const volumeInput = screen.getByDisplayValue("400")
    fireEvent.change(volumeInput, { target: { value: "600" } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        services: [expect.objectContaining({ annualVolume: 600 })],
      }),
    )
  })

  it("updates own cost per unit on input change", () => {
    const onChange = vi.fn()
    render(
      <ContractingIncomePlanner
        initialState={{ services: [baseService] }}
        onChange={onChange}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    const costInput = screen.getByDisplayValue("60")
    fireEvent.change(costInput, { target: { value: "75" } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        services: [expect.objectContaining({ ownCostPerUnit: 75 })],
      }),
    )
  })

  it("updates additional costs on input change", () => {
    const onChange = vi.fn()
    render(
      <ContractingIncomePlanner
        initialState={{ services: [baseService] }}
        onChange={onChange}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    const addCostsInput = screen.getByDisplayValue("500")
    fireEvent.change(addCostsInput, { target: { value: "1000" } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        services: [expect.objectContaining({ additionalCosts: 1000 })],
      }),
    )
  })

  it("pulls cost from a hectare machine and sets chargeUnit to ha", () => {
    const onChange = vi.fn()
    const service = { ...baseService, ownCostPerUnit: 0, chargeUnit: "hr" as const }
    const { container } = render(
      <ContractingIncomePlanner
        initialState={{ services: [service] }}
        onChange={onChange}
        savedHectareMachines={hectareMachines}
        savedHourMachines={[]}
      />,
    )
    const machineSelect = container.querySelectorAll("select")[0]
    fireEvent.change(machineSelect, { target: { value: "hectare:0" } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        services: [
          expect.objectContaining({
            ownCostPerUnit: 30.27,
            chargeUnit: "ha",
            linkedMachineSource: "hectare:0",
          }),
        ],
      }),
    )
  })

  it("pulls cost from an hour machine and sets chargeUnit to hr", () => {
    const onChange = vi.fn()
    const service = { ...baseService, ownCostPerUnit: 0 }
    const { container } = render(
      <ContractingIncomePlanner
        initialState={{ services: [service] }}
        onChange={onChange}
        savedHectareMachines={[]}
        savedHourMachines={hourMachines}
      />,
    )
    const machineSelect = container.querySelectorAll("select")[0]
    fireEvent.change(machineSelect, { target: { value: "hour:0" } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        services: [
          expect.objectContaining({
            ownCostPerUnit: 40.36,
            chargeUnit: "hr",
            linkedMachineSource: "hour:0",
          }),
        ],
      }),
    )
  })

  it("shows toast message after pulling from a machine", async () => {
    const onChange = vi.fn()
    const service = { ...baseService, ownCostPerUnit: 0 }
    const { container } = render(
      <ContractingIncomePlanner
        initialState={{ services: [service] }}
        onChange={onChange}
        savedHectareMachines={hectareMachines}
        savedHourMachines={[]}
      />,
    )
    const machineSelect = container.querySelectorAll("select")[0]
    fireEvent.change(machineSelect, { target: { value: "hectare:0" } })
    expect(screen.getByText(/Pulled costs from "6m Drill"/)).toBeInTheDocument()
  })

  it("shows source badge when linkedMachineSource is set", () => {
    const linkedService = {
      id: "test-linked",
      name: "Drilling",
      chargeRate: 80,
      chargeUnit: "ha" as const,
      annualVolume: 400,
      ownCostPerUnit: 30.27,
      additionalCosts: 0,
      linkedMachineSource: "hectare:0",
    }
    render(
      <ContractingIncomePlanner
        initialState={{ services: [linkedService] }}
        onChange={vi.fn()}
        savedHectareMachines={hectareMachines}
        savedHourMachines={[]}
      />,
    )
    expect(screen.getByText(/Saved: 6m Drill/)).toBeInTheDocument()
  })

  it("shows warning text when linkedMachineSource is set and ownCostPerUnit > 0", () => {
    const linkedService = {
      id: "test-linked",
      name: "Drilling",
      chargeRate: 80,
      chargeUnit: "ha" as const,
      annualVolume: 400,
      ownCostPerUnit: 30.27,
      additionalCosts: 0,
      linkedMachineSource: "hectare:0",
    }
    render(
      <ContractingIncomePlanner
        initialState={{ services: [linkedService] }}
        onChange={vi.fn()}
        savedHectareMachines={hectareMachines}
        savedHourMachines={[]}
      />,
    )
    expect(
      screen.getByText(/This cost is based on your farm's usage alone/),
    ).toBeInTheDocument()
  })

  it("shows amber margin banner for marginal service", () => {
    const marginalService = {
      id: "test-marginal",
      name: "Light cultivation",
      chargeRate: 100,
      chargeUnit: "ha" as const,
      annualVolume: 100,
      ownCostPerUnit: 90,
      additionalCosts: 500,
      linkedMachineSource: null,
    }
    const { container } = render(
      <ContractingIncomePlanner
        initialState={{ services: [marginalService] }}
        onChange={vi.fn()}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    // margin = (10000 - 9500) / 10000 * 100 = 5% → amber
    expect(
      container.querySelector('[data-banner="amber"]'),
    ).toBeInTheDocument()
  })

  it("shows amber summary banner when overall margin is between 0 and 20%", () => {
    const marginalService = {
      id: "test-marginal",
      name: "Light cultivation",
      chargeRate: 100,
      chargeUnit: "ha" as const,
      annualVolume: 100,
      ownCostPerUnit: 90,
      additionalCosts: 500,
      linkedMachineSource: null,
    }
    const { container } = render(
      <ContractingIncomePlanner
        initialState={{ services: [marginalService] }}
        onChange={vi.fn()}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    // There are two data-banner elements: one per-service, one summary.
    // Both should be amber for this single marginal service.
    const amberBanners = container.querySelectorAll('[data-banner="amber"]')
    expect(amberBanners.length).toBe(2)
  })

  it("shows red summary banner when overall is loss-making", () => {
    const lossService = {
      id: "test-loss",
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
    const redBanners = container.querySelectorAll('[data-banner="red"]')
    expect(redBanners.length).toBe(2)
    expect(
      screen.getByText(/Contracting is loss-making overall/),
    ).toBeInTheDocument()
  })

  it("shows green summary banner when overall margin is above 20%", () => {
    const profitableService = {
      id: "test-profit",
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
    const greenBanners = container.querySelectorAll('[data-banner="green"]')
    expect(greenBanners.length).toBe(2)
    expect(
      screen.getByText(/Contracting is profitable overall/),
    ).toBeInTheDocument()
  })

  it("does not show results section when chargeRate is 0", () => {
    const service = {
      ...baseService,
      chargeRate: 0,
    }
    render(
      <ContractingIncomePlanner
        initialState={{ services: [service] }}
        onChange={vi.fn()}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    // The per-service "Results" heading should not appear
    expect(screen.queryByText("Results")).not.toBeInTheDocument()
  })

  it("does not show results section when annualVolume is 0", () => {
    const service = {
      ...baseService,
      annualVolume: 0,
    }
    render(
      <ContractingIncomePlanner
        initialState={{ services: [service] }}
        onChange={vi.fn()}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    expect(screen.queryByText("Results")).not.toBeInTheDocument()
  })

  it("shows '+ Add Service' button when services exist", () => {
    render(
      <ContractingIncomePlanner
        initialState={{ services: [baseService] }}
        onChange={vi.fn()}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    const addButtons = screen.getAllByRole("button", { name: /add.*service/i })
    expect(addButtons.length).toBeGreaterThanOrEqual(1)
    // At least one should contain the "+" prefix text
    const plusButton = addButtons.find((b) => b.textContent?.includes("+"))
    expect(plusButton).toBeTruthy()
  })

  it("shows empty state layout when no services exist", () => {
    render(
      <ContractingIncomePlanner
        initialState={{ services: [] }}
        onChange={vi.fn()}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    expect(
      screen.getByText(/No contracting services yet/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Add your first service/i }),
    ).toBeInTheDocument()
  })

  it("does not show source badge when linkedMachineSource machine is missing", () => {
    const linkedService = {
      id: "test-linked",
      name: "Drilling",
      chargeRate: 80,
      chargeUnit: "ha" as const,
      annualVolume: 400,
      ownCostPerUnit: 30.27,
      additionalCosts: 0,
      linkedMachineSource: "hectare:5", // out of range
    }
    render(
      <ContractingIncomePlanner
        initialState={{ services: [linkedService] }}
        onChange={vi.fn()}
        savedHectareMachines={hectareMachines}
        savedHourMachines={[]}
      />,
    )
    expect(screen.queryByText(/Saved:/)).not.toBeInTheDocument()
  })

  it("does not pull from machine when select is set to empty value", () => {
    const onChange = vi.fn()
    const { container } = render(
      <ContractingIncomePlanner
        initialState={{ services: [baseService] }}
        onChange={onChange}
        savedHectareMachines={hectareMachines}
        savedHourMachines={[]}
      />,
    )
    const machineSelect = container.querySelectorAll("select")[0]
    fireEvent.change(machineSelect, { target: { value: "" } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it("shows NAAC Rates collapsible section for a service", () => {
    render(
      <ContractingIncomePlanner
        initialState={{ services: [baseService] }}
        onChange={vi.fn()}
        savedHectareMachines={[]}
        savedHourMachines={[]}
      />,
    )
    expect(screen.getByText(/NAAC Rates/)).toBeInTheDocument()
  })
})
