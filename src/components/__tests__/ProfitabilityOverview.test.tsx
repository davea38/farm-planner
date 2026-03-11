import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfitabilityOverview } from "@/components/ProfitabilityOverview";
import { UnitContext } from "@/lib/UnitContext";
import type { AppState } from "@/lib/types";

function createTestState(overrides?: Partial<AppState>): AppState {
  return {
    version: 4,
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

function renderWithUnits(ui: React.ReactElement) {
  return render(
    <UnitContext.Provider value={{ units: { area: "ha", speed: "km" }, setUnits: () => {} }}>
      {ui}
    </UnitContext.Provider>
  );
}

describe("ProfitabilityOverview", () => {
  it("renders tab title", () => {
    renderWithUnits(<ProfitabilityOverview appState={createTestState()} />);
    expect(
      screen.getByText(/Is it all worth it/i),
    ).toBeInTheDocument();
  });

  it("shows farm income from replacement planner", () => {
    renderWithUnits(<ProfitabilityOverview appState={createTestState()} />);
    expect(screen.getAllByText(/£350,000/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no saved machines or services", () => {
    renderWithUnits(<ProfitabilityOverview appState={createTestState()} />);
    expect(screen.getByText(/save machines/i)).toBeInTheDocument();
  });

  it("shows income section", () => {
    renderWithUnits(<ProfitabilityOverview appState={createTestState()} />);
    expect(screen.getByRole("heading", { name: /^income$/i })).toBeInTheDocument();
  });

  it("shows costs section", () => {
    renderWithUnits(<ProfitabilityOverview appState={createTestState()} />);
    expect(screen.getByRole("heading", { name: /^costs$/i })).toBeInTheDocument();
  });

  it("shows net position", () => {
    renderWithUnits(<ProfitabilityOverview appState={createTestState()} />);
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
    renderWithUnits(<ProfitabilityOverview appState={state} />);
    expect(screen.getByRole("heading", { name: /farm only vs farm \+ contracting/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Farm Only/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Farm \+ Contracting/ })).toBeInTheDocument();
  });

  it("shows traffic-light banner based on machinery cost %", () => {
    const { container } = renderWithUnits(
      <ProfitabilityOverview appState={createTestState()} />,
    );
    // With 350k income and 0 costs, should be green (0% < 20%)
    expect(
      container.querySelector('[data-banner="green"]'),
    ).toBeInTheDocument();
  });

  it("shows both profitability percentages", () => {
    renderWithUnits(<ProfitabilityOverview appState={createTestState()} />);
    expect(screen.getByText(/Machinery costs as % of farm income/)).toBeInTheDocument();
    expect(screen.getByText(/All costs as % of total income/)).toBeInTheDocument();
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
    renderWithUnits(<ProfitabilityOverview appState={state} />);
    expect(screen.getByText(/offset/i)).toBeInTheDocument();
  });

  it("shows key/legend explaining traffic-light thresholds", () => {
    renderWithUnits(<ProfitabilityOverview appState={createTestState()} />);
    expect(screen.getByText(/under 20%/i)).toBeInTheDocument();
    expect(screen.getByText(/20.*35%/i)).toBeInTheDocument();
    expect(screen.getByText(/over 35%/i)).toBeInTheDocument();
  });

  // ---------- NEW TESTS ----------

  it("shows amber traffic light when machinery costs are 20-35% of farm income", () => {
    // Machine produces 22500/year in costs. With farmIncome=100000, that's 22.5% => amber.
    const state = createTestState({
      replacementPlanner: { machines: [], farmIncome: 100000 },
      costPerHectare: {
        current: {
          purchasePrice: 0, yearsOwned: 1, salePrice: 0, hectaresPerYear: 0,
          interestRate: 0, insuranceRate: 0, storageRate: 0, workRate: 0,
          labourCost: 0, fuelPrice: 0, fuelUse: 0, repairsPct: 0, contractorCharge: 0,
        },
        savedMachines: [{
          name: "Drill",
          machineType: "miscellaneous" as const,
          inputs: {
            purchasePrice: 50000, yearsOwned: 5, salePrice: 0, hectaresPerYear: 500,
            interestRate: 5, insuranceRate: 2, storageRate: 1, workRate: 4,
            labourCost: 14, fuelPrice: 70, fuelUse: 20, repairsPct: 2, contractorCharge: 76,
          },
        }],
      },
    });
    const { container } = renderWithUnits(
      <ProfitabilityOverview appState={state} />,
    );
    expect(
      container.querySelector('[data-banner="amber"]'),
    ).toBeInTheDocument();
  });

  it("shows red traffic light when machinery costs exceed 35% of farm income", () => {
    // farmIncome = 30000, machine costs ~15700 => ~52% => red
    const state = createTestState({
      replacementPlanner: { machines: [], farmIncome: 30000 },
      costPerHectare: {
        current: {
          purchasePrice: 0, yearsOwned: 1, salePrice: 0, hectaresPerYear: 0,
          interestRate: 0, insuranceRate: 0, storageRate: 0, workRate: 0,
          labourCost: 0, fuelPrice: 0, fuelUse: 0, repairsPct: 0, contractorCharge: 0,
        },
        savedMachines: [{
          name: "Drill",
          machineType: "miscellaneous" as const,
          inputs: {
            purchasePrice: 50000, yearsOwned: 5, salePrice: 0, hectaresPerYear: 500,
            interestRate: 5, insuranceRate: 2, storageRate: 1, workRate: 4,
            labourCost: 14, fuelPrice: 70, fuelUse: 20, repairsPct: 2, contractorCharge: 76,
          },
        }],
      },
    });
    const { container } = renderWithUnits(
      <ProfitabilityOverview appState={state} />,
    );
    expect(
      container.querySelector('[data-banner="red"]'),
    ).toBeInTheDocument();
    // Text appears both in banner and in the key/legend
    expect(screen.getAllByText(/eating your profits/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows running costs from saved per-ha machines", () => {
    const state = createTestState({
      costPerHectare: {
        current: {
          purchasePrice: 0, yearsOwned: 1, salePrice: 0, hectaresPerYear: 0,
          interestRate: 0, insuranceRate: 0, storageRate: 0, workRate: 0,
          labourCost: 0, fuelPrice: 0, fuelUse: 0, repairsPct: 0, contractorCharge: 0,
        },
        savedMachines: [{
          name: "6m Drill",
          machineType: "miscellaneous" as const,
          inputs: {
            purchasePrice: 126000, yearsOwned: 8, salePrice: 34000, hectaresPerYear: 1200,
            interestRate: 2, insuranceRate: 2, storageRate: 1, workRate: 4,
            labourCost: 14, fuelPrice: 53, fuelUse: 20, repairsPct: 2, contractorCharge: 76,
          },
        }],
      },
    });
    renderWithUnits(<ProfitabilityOverview appState={state} />);
    // Should show "1 saved machine" badge and non-zero running costs
    expect(screen.getByText(/1 saved machine(?!s)/)).toBeInTheDocument();
    // Running costs line should show the per-ha machine count
    expect(screen.getByText(/per-ha machines x 1/)).toBeInTheDocument();
  });

  it("shows running costs from saved per-hr machines", () => {
    const state = createTestState({
      costPerHour: {
        current: {
          purchasePrice: 0, yearsOwned: 1, salePrice: 0, hoursPerYear: 0,
          interestRate: 0, insuranceRate: 0, storageRate: 0,
          fuelConsumptionPerHr: 0, fuelPrice: 0, repairsPct: 0,
          labourCost: 0, contractorCharge: 0,
        },
        savedMachines: [{
          name: "Telehandler",
          machineType: "miscellaneous" as const,
          inputs: {
            purchasePrice: 80000, yearsOwned: 6, salePrice: 20000, hoursPerYear: 800,
            interestRate: 3, insuranceRate: 2, storageRate: 1,
            fuelConsumptionPerHr: 12, fuelPrice: 60, repairsPct: 2,
            labourCost: 14, contractorCharge: 50,
          },
        }],
      },
    });
    renderWithUnits(<ProfitabilityOverview appState={state} />);
    expect(screen.getByText(/1 saved machine(?!s)/)).toBeInTheDocument();
    expect(screen.getByText(/per-hr machines x 1/)).toBeInTheDocument();
  });

  it("shows current unsaved per-ha machine when hectaresPerYear > 0", () => {
    const state = createTestState({
      costPerHectare: {
        current: {
          purchasePrice: 100000, yearsOwned: 5, salePrice: 50000, hectaresPerYear: 500,
          interestRate: 2, insuranceRate: 2, storageRate: 1, workRate: 4,
          labourCost: 14, fuelPrice: 70, fuelUse: 20, repairsPct: 2, contractorCharge: 76,
        },
        savedMachines: [],
      },
    });
    renderWithUnits(<ProfitabilityOverview appState={state} />);
    expect(screen.getByText(/Current unsaved machine \(per-ha\)/)).toBeInTheDocument();
  });

  it("shows current unsaved per-hr machine when hoursPerYear > 0", () => {
    const state = createTestState({
      costPerHour: {
        current: {
          purchasePrice: 60000, yearsOwned: 5, salePrice: 15000, hoursPerYear: 600,
          interestRate: 3, insuranceRate: 2, storageRate: 1,
          fuelConsumptionPerHr: 10, fuelPrice: 60, repairsPct: 2,
          labourCost: 14, contractorCharge: 45,
        },
        savedMachines: [],
      },
    });
    renderWithUnits(<ProfitabilityOverview appState={state} />);
    expect(screen.getByText(/Current unsaved machine \(per-hr\)/)).toBeInTheDocument();
  });

  it("calls onFarmIncomeChange when farm income input changes", () => {
    const handleChange = vi.fn();
    renderWithUnits(
      <ProfitabilityOverview
        appState={createTestState()}
        onFarmIncomeChange={handleChange}
      />,
    );
    // InputField renders an input with type="number"; find the one showing farm income value
    const inputs = screen.getAllByRole("spinbutton");
    const farmIncomeInput = inputs.find(
      (input) => (input as HTMLInputElement).value === "350000",
    );
    expect(farmIncomeInput).toBeDefined();
    fireEvent.change(farmIncomeInput!, { target: { value: "500000" } });
    expect(handleChange).toHaveBeenCalledWith(500000);
  });

  it("renders charts when there are costs", () => {
    // Add saved machine to produce costs, which means totalCosts > 0
    const state = createTestState({
      costPerHectare: {
        current: {
          purchasePrice: 0, yearsOwned: 1, salePrice: 0, hectaresPerYear: 0,
          interestRate: 0, insuranceRate: 0, storageRate: 0, workRate: 0,
          labourCost: 0, fuelPrice: 0, fuelUse: 0, repairsPct: 0, contractorCharge: 0,
        },
        savedMachines: [{
          name: "Sprayer",
          machineType: "miscellaneous" as const,
          inputs: {
            purchasePrice: 100000, yearsOwned: 5, salePrice: 20000, hectaresPerYear: 800,
            interestRate: 3, insuranceRate: 2, storageRate: 1, workRate: 6,
            labourCost: 14, fuelPrice: 60, fuelUse: 15, repairsPct: 2, contractorCharge: 50,
          },
        }],
      },
    });
    renderWithUnits(<ProfitabilityOverview appState={state} />);
    // Donut chart heading should appear when totalCosts > 0
    expect(screen.getByText(/Where your costs go/)).toBeInTheDocument();
  });

  it("shows contracting net contribution text with services", () => {
    const state = createTestState({
      contractingIncome: {
        services: [
          {
            id: "svc-1",
            name: "Baling",
            chargeRate: 100,
            chargeUnit: "ha",
            annualVolume: 200,
            ownCostPerUnit: 60,
            additionalCosts: 1000,
            linkedMachineSource: null,
          },
        ],
      },
    });
    renderWithUnits(<ProfitabilityOverview appState={state} />);
    expect(screen.getByText(/Contracting adds/)).toBeInTheDocument();
    expect(screen.getByText(/to your bottom line/)).toBeInTheDocument();
  });

  it("shows positive net position with green styling when income exceeds costs", () => {
    // Default state: 350k income, 0 costs => positive net
    const { container } = renderWithUnits(
      <ProfitabilityOverview appState={createTestState()} />,
    );
    const positiveSpan = container.querySelector(".text-green-600");
    expect(positiveSpan).toBeInTheDocument();
  });

  it("shows negative net position with red styling when costs exceed income", () => {
    // farmIncome = 0 but with machine costs => negative net
    const state = createTestState({
      replacementPlanner: { machines: [], farmIncome: 0 },
      costPerHectare: {
        current: {
          purchasePrice: 0, yearsOwned: 1, salePrice: 0, hectaresPerYear: 0,
          interestRate: 0, insuranceRate: 0, storageRate: 0, workRate: 0,
          labourCost: 0, fuelPrice: 0, fuelUse: 0, repairsPct: 0, contractorCharge: 0,
        },
        savedMachines: [{
          name: "Combine",
          machineType: "miscellaneous" as const,
          inputs: {
            purchasePrice: 200000, yearsOwned: 10, salePrice: 50000, hectaresPerYear: 400,
            interestRate: 3, insuranceRate: 2, storageRate: 1, workRate: 4,
            labourCost: 14, fuelPrice: 70, fuelUse: 25, repairsPct: 2, contractorCharge: 100,
          },
        }],
      },
    });
    const { container } = renderWithUnits(
      <ProfitabilityOverview appState={state} />,
    );
    const negativeSpan = container.querySelector(".text-red-600");
    expect(negativeSpan).toBeInTheDocument();
  });

  it("does not show empty state message when saved machines exist", () => {
    const state = createTestState({
      costPerHectare: {
        current: {
          purchasePrice: 0, yearsOwned: 1, salePrice: 0, hectaresPerYear: 0,
          interestRate: 0, insuranceRate: 0, storageRate: 0, workRate: 0,
          labourCost: 0, fuelPrice: 0, fuelUse: 0, repairsPct: 0, contractorCharge: 0,
        },
        savedMachines: [{
          name: "Drill",
          machineType: "miscellaneous" as const,
          inputs: {
            purchasePrice: 50000, yearsOwned: 5, salePrice: 10000, hectaresPerYear: 300,
            interestRate: 2, insuranceRate: 2, storageRate: 1, workRate: 4,
            labourCost: 14, fuelPrice: 60, fuelUse: 15, repairsPct: 2, contractorCharge: 60,
          },
        }],
      },
    });
    renderWithUnits(<ProfitabilityOverview appState={state} />);
    expect(screen.queryByText(/No machines or services yet/)).not.toBeInTheDocument();
    expect(screen.queryByText(/save machines/i)).not.toBeInTheDocument();
  });

  it("shows contracting table details with income, costs, net, and machinery % rows", () => {
    const state = createTestState({
      contractingIncome: {
        services: [
          {
            id: "svc-2",
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
    renderWithUnits(<ProfitabilityOverview appState={state} />);
    // Table should contain specific rows - use getAllByRole to find table cells
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    // Check table row labels via role="cell"
    const cells = screen.getAllByRole("cell");
    const cellTexts = cells.map((c) => c.textContent);
    expect(cellTexts.some((t) => t?.includes("Income"))).toBe(true);
    expect(cellTexts.some((t) => t?.includes("Costs"))).toBe(true);
    expect(cellTexts.some((t) => t?.includes("Net"))).toBe(true);
    expect(cellTexts.some((t) => t?.includes("Machinery % income"))).toBe(true);
  });

  it("shows multiple saved per-ha machines count label", () => {
    const machineInputs = {
      purchasePrice: 50000, yearsOwned: 5, salePrice: 10000, hectaresPerYear: 300,
      interestRate: 2, insuranceRate: 2, storageRate: 1, workRate: 4,
      labourCost: 14, fuelPrice: 60, fuelUse: 15, repairsPct: 2, contractorCharge: 60,
    };
    const state = createTestState({
      costPerHectare: {
        current: {
          purchasePrice: 0, yearsOwned: 1, salePrice: 0, hectaresPerYear: 0,
          interestRate: 0, insuranceRate: 0, storageRate: 0, workRate: 0,
          labourCost: 0, fuelPrice: 0, fuelUse: 0, repairsPct: 0, contractorCharge: 0,
        },
        savedMachines: [
          { name: "Drill A", machineType: "miscellaneous", inputs: machineInputs },
          { name: "Drill B", machineType: "miscellaneous", inputs: machineInputs },
        ],
      },
    });
    renderWithUnits(<ProfitabilityOverview appState={state} />);
    // Should say "2 saved machines" (plural)
    expect(screen.getByText(/2 saved machines/)).toBeInTheDocument();
    expect(screen.getByText(/per-ha machines x 2/)).toBeInTheDocument();
  });

  it("shows both current unsaved ha and hr machines simultaneously", () => {
    const state = createTestState({
      costPerHectare: {
        current: {
          purchasePrice: 100000, yearsOwned: 5, salePrice: 50000, hectaresPerYear: 500,
          interestRate: 2, insuranceRate: 2, storageRate: 1, workRate: 4,
          labourCost: 14, fuelPrice: 70, fuelUse: 20, repairsPct: 2, contractorCharge: 76,
        },
        savedMachines: [],
      },
      costPerHour: {
        current: {
          purchasePrice: 60000, yearsOwned: 5, salePrice: 15000, hoursPerYear: 600,
          interestRate: 3, insuranceRate: 2, storageRate: 1,
          fuelConsumptionPerHr: 10, fuelPrice: 60, repairsPct: 2,
          labourCost: 14, contractorCharge: 45,
        },
        savedMachines: [],
      },
    });
    renderWithUnits(<ProfitabilityOverview appState={state} />);
    expect(screen.getByText(/Current unsaved machine \(per-ha\)/)).toBeInTheDocument();
    expect(screen.getByText(/Current unsaved machine \(per-hr\)/)).toBeInTheDocument();
  });

  it("does not render charts when there are zero costs and zero income", () => {
    const state = createTestState({
      replacementPlanner: { machines: [], farmIncome: 0 },
    });
    renderWithUnits(<ProfitabilityOverview appState={state} />);
    expect(screen.queryByText(/Where your costs go/)).not.toBeInTheDocument();
  });
});
