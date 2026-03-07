import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfitabilityOverview } from "@/components/ProfitabilityOverview";
import type { AppState } from "@/lib/types";

function createTestState(overrides?: Partial<AppState>): AppState {
  return {
    version: 2,
    lastSaved: new Date().toISOString(),
    costPerHectare: {
      current: {
        purchasePrice: 0,
        yearsOwned: 1,
        salePrice: 0,
        hectaresPerYear: 0,
        interestRate: 0,
        insuranceRate: 0,
        storageRate: 0,
        workRate: 0,
        labourCost: 0,
        fuelPrice: 0,
        fuelUse: 0,
        repairsPct: 0,
        contractorCharge: 0,
      },
      savedMachines: [],
    },
    costPerHour: {
      current: {
        purchasePrice: 0,
        yearsOwned: 1,
        salePrice: 0,
        hoursPerYear: 0,
        interestRate: 0,
        insuranceRate: 0,
        storageRate: 0,
        haPerHr: 0,
        fuelConsumptionPerHr: 0,
        fuelPrice: 0,
        repairsPct: 0,
        labourCost: 0,
        contractorCharge: 0,
      },
      savedMachines: [],
    },
    compareMachines: {
      machineA: {
        name: "A",
        width: 0,
        capacity: 0,
        speed: 0,
        applicationRate: 0,
        transportTime: 0,
        fillingTime: 0,
        fieldEfficiency: 0,
      },
      machineB: {
        name: "B",
        width: 0,
        capacity: 0,
        speed: 0,
        applicationRate: 0,
        transportTime: 0,
        fillingTime: 0,
        fieldEfficiency: 0,
      },
    },
    replacementPlanner: {
      machines: [],
      farmIncome: 350000,
    },
    contractingIncome: {
      services: [],
    },
    ...overrides,
  };
}

describe("ProfitabilityOverview", () => {
  it("renders tab title", () => {
    render(<ProfitabilityOverview appState={createTestState()} />);
    expect(
      screen.getByText(/Profitability Overview/i),
    ).toBeInTheDocument();
  });

  it("shows farm income from replacement planner", () => {
    render(<ProfitabilityOverview appState={createTestState()} />);
    expect(screen.getAllByText(/£350,000/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no saved machines or services", () => {
    render(<ProfitabilityOverview appState={createTestState()} />);
    expect(screen.getByText(/save machines/i)).toBeInTheDocument();
  });

  it("shows income section", () => {
    render(<ProfitabilityOverview appState={createTestState()} />);
    expect(screen.getByRole("heading", { name: /^income$/i })).toBeInTheDocument();
  });

  it("shows costs section", () => {
    render(<ProfitabilityOverview appState={createTestState()} />);
    expect(screen.getByRole("heading", { name: /^costs$/i })).toBeInTheDocument();
  });

  it("shows net position", () => {
    render(<ProfitabilityOverview appState={createTestState()} />);
    expect(screen.getByRole("heading", { name: /^net position$/i })).toBeInTheDocument();
  });

  it("shows with vs without contracting comparison", () => {
    const state = createTestState({
      contractingIncome: {
        services: [
          {
            id: "test-1",
            name: "Combining",
            chargeRate: 119.34,
            chargeUnit: "ha",
            annualVolume: 400,
            ownCostPerUnit: 85,
            additionalCosts: 2000,
            linkedMachineSource: null,
          },
        ],
      },
    });
    render(<ProfitabilityOverview appState={state} />);
    expect(screen.getByRole("heading", { name: /without contracting/i })).toBeInTheDocument();
    expect(screen.getAllByText(/with contracting/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows traffic-light banner based on machinery cost %", () => {
    const { container } = render(
      <ProfitabilityOverview appState={createTestState()} />,
    );
    // With 350k income and 0 costs, should be green (0% < 20%)
    expect(
      container.querySelector('[data-banner="green"]'),
    ).toBeInTheDocument();
  });

  it("shows contracting offset percentage when contracting exists", () => {
    const state = createTestState({
      contractingIncome: {
        services: [
          {
            id: "test-1",
            name: "Combining",
            chargeRate: 100,
            chargeUnit: "ha",
            annualVolume: 100,
            ownCostPerUnit: 70,
            additionalCosts: 0,
            linkedMachineSource: null,
          },
        ],
      },
    });
    render(<ProfitabilityOverview appState={state} />);
    expect(screen.getByText(/offset/i)).toBeInTheDocument();
  });

  it("shows key/legend explaining traffic-light thresholds", () => {
    render(<ProfitabilityOverview appState={createTestState()} />);
    expect(screen.getByText(/under 20%/i)).toBeInTheDocument();
    expect(screen.getByText(/20.*35%/i)).toBeInTheDocument();
    expect(screen.getByText(/over 35%/i)).toBeInTheDocument();
  });
});
