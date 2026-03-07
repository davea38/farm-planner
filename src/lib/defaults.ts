import type {
  CostPerHectareInputs,
  CostPerHourInputs,
  WorkrateInputs,
  ReplacementMachine,
  ReplacementPlannerState,
} from "./types";

export const defaultCostPerHectare: CostPerHectareInputs = {
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
};

export const defaultCostPerHour: CostPerHourInputs = {
  purchasePrice: 92751,
  yearsOwned: 7,
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
};

export const defaultMachineA: WorkrateInputs = {
  name: "Machine A",
  width: 4,
  capacity: 800,
  speed: 6,
  applicationRate: 180,
  transportTime: 5,
  fillingTime: 10,
  fieldEfficiency: 65,
};

export const defaultMachineB: WorkrateInputs = {
  name: "Machine B",
  width: 30,
  capacity: 2000,
  speed: 12,
  applicationRate: 250,
  transportTime: 5,
  fillingTime: 10,
  fieldEfficiency: 75,
};

function makeReplacementMachine(name: string): ReplacementMachine {
  return {
    id: crypto.randomUUID(),
    name,
    usePerYear: 0,
    timeToChange: 0,
    currentHours: 0,
    priceToChange: 0,
    currentValue: 0,
  };
}

const defaultReplacementMachineNames = [
  "Tractor 1",
  "Tractor 2",
  "Tractor 3",
  "Tractor 4",
  "Combine",
  "SP Sprayer",
  "Seed drill",
  "Cultivator",
  "Cultivator",
  "Other",
];

export function createDefaultReplacementMachines(): ReplacementMachine[] {
  return defaultReplacementMachineNames.map(makeReplacementMachine);
}

export const defaultReplacementPlanner: ReplacementPlannerState = {
  machines: createDefaultReplacementMachines(),
  farmIncome: 350000,
};
