import type {
  CostPerHectareInputs,
  CostPerHourInputs,
  WorkrateInputs,
  ReplacementMachine,
  ReplacementPlannerState,
  MachineProfile,
} from "./types";
import type { MachineCategory as DepreciationCategory } from "./depreciation-data";
import { FUEL_PRICES } from "./fuel-data";
import { CATEGORY_LABELS } from "./category-mapping";
import { generateId } from "./uuid";

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
  fuelPrice: FUEL_PRICES.redDiesel.current,
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
  fuelConsumptionPerHr: 14,
  fuelPrice: FUEL_PRICES.redDiesel.current,
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

function makeReplacementMachine(name: string, category: ReplacementMachine["category"] = "other"): ReplacementMachine {
  return {
    id: generateId(),
    name,
    category,
    condition: "used",
    yearOfManufacture: null,
    purchaseDate: null,
    usePerYear: 0,
    timeToChange: 0,
    currentHours: 0,
    priceToChange: 0,
    currentValue: 0,
  };
}

const defaultReplacementMachines: { name: string; category: ReplacementMachine["category"] }[] = [
  { name: "Tractor 1", category: "tractor" },
  { name: "Tractor 2", category: "tractor" },
  { name: "Tractor 3", category: "tractor" },
  { name: "Tractor 4", category: "tractor" },
  { name: "Combine", category: "combine" },
  { name: "SP Sprayer", category: "sprayer" },
  { name: "Seed drill", category: "drill" },
  { name: "Cultivator", category: "cultivator" },
  { name: "Cultivator", category: "cultivator" },
  { name: "Other", category: "other" },
];

export function createDefaultReplacementMachines(): ReplacementMachine[] {
  return defaultReplacementMachines.map((m) => makeReplacementMachine(m.name, m.category));
}

// Derived from CATEGORY_LABELS (the single source of truth in category-mapping.ts)
// so that replacement categories and depreciation mappings can never drift apart.
export const MACHINE_CATEGORIES: { value: ReplacementMachine["category"]; label: string }[] =
  (Object.entries(CATEGORY_LABELS) as [ReplacementMachine["category"], string][]).map(
    ([value, label]) => ({ value, label })
  );

export const defaultReplacementPlanner: ReplacementPlannerState = {
  machines: createDefaultReplacementMachines(),
  farmIncome: 350000,
};

export function createDefaultMachineProfile(name: string, machineType: DepreciationCategory): MachineProfile {
  return {
    name,
    machineType,
    costMode: "hectare",
    costPerHectare: { ...defaultCostPerHectare },
    costPerHour: { ...defaultCostPerHour },
    compareMachines: {
      machineA: { ...defaultMachineA },
      machineB: { ...defaultMachineB },
    },
  };
}
