import type { MachineCategory as DepreciationCategory } from "./depreciation-data";

export interface CostPerHectareInputs {
  purchasePrice: number;
  yearsOwned: number;
  salePrice: number;
  hectaresPerYear: number;
  interestRate: number;
  insuranceRate: number;
  storageRate: number;
  workRate: number;
  labourCost: number;
  fuelPrice: number;
  fuelUse: number;
  repairsPct: number;
  contractorCharge: number;
}

export interface CostPerHectareResults {
  averageValue: number;
  annualInterest: number;
  annualDepreciation: number;
  annualInsurance: number;
  annualStorage: number;
  totalFixedCostPerYear: number;
  fixedCostPerHa: number;
  labourPerHa: number;
  fuelPerHa: number;
  repairsPerHa: number;
  totalCostPerHa: number;
  totalAnnualCost: number;
  annualSaving: number;
}

export interface CostPerHourInputs {
  purchasePrice: number;
  yearsOwned: number;
  salePrice: number;
  hoursPerYear: number;
  interestRate: number;
  insuranceRate: number;
  storageRate: number;
  fuelConsumptionPerHr: number;
  fuelPrice: number;
  repairsPct: number;
  labourCost: number;
  contractorCharge: number;
}

export interface CostPerHourResults {
  averageValue: number;
  annualInterest: number;
  annualDepreciation: number;
  annualInsurance: number;
  annualStorage: number;
  totalFixedCostPerYear: number;
  fixedCostPerHr: number;
  labourPerHr: number;
  fuelPerHr: number;
  repairsPerHr: number;
  totalCostPerHr: number;
  totalAnnualCost: number;
  annualSaving: number;
}

export interface WorkrateInputs {
  name: string;
  width: number;
  capacity: number;
  speed: number;
  applicationRate: number;
  transportTime: number;
  fillingTime: number;
  fieldEfficiency: number;
}

export interface WorkrateResults {
  areaPerLoad: number;
  fillingRate: number;
  spotRate: number;
  applicationTime: number;
  totalTimePerLoad: number;
  overallWorkRate: number;
  overallEfficiency: number;
  applicationPct: number;
  fillingPct: number;
  transportPct: number;
}

export type MachineCategory =
  | "tractor"
  | "combine"
  | "sprayer"
  | "drill"
  | "cultivator"
  | "trailer"
  | "handler"
  | "other";

export type MachineCondition = "new" | "used";

export interface ReplacementMachine {
  id: string;
  name: string;
  category: MachineCategory;
  condition: MachineCondition;
  yearOfManufacture: number | null;
  purchaseDate: string | null; // ISO date string or null if not yet purchased
  usePerYear: number;
  timeToChange: number;
  currentHours: number;
  priceToChange: number;
  currentValue: number;
}

export interface ReplacementPlannerState {
  machines: ReplacementMachine[];
  farmIncome: number;
}

export interface ReplacementSummary {
  annualCosts: { year: number; cost: number }[];
  totalSpend: number;
  averageAnnualCost: number;
  pctOfIncome: number;
}

export type { DepreciationCategory };

export type CostMode = "hectare" | "hour";

/**
 * A unified machine profile. Each machine owns ALL its tab data.
 * Both cost modes are always present; costMode is a UI preference.
 */
export interface MachineProfile {
  name: string;
  machineType: DepreciationCategory;
  costMode: CostMode;
  costPerHectare: CostPerHectareInputs;
  costPerHour: CostPerHourInputs;
  compareMachines: {
    machineA: WorkrateInputs;
    machineB: WorkrateInputs;
  };
}

export interface SavedMachine<T> {
  name: string;
  machineType: DepreciationCategory;
  inputs: T;
}

export type ChargeUnit = "ha" | "hr" | "bale" | "tonne" | "head" | "m";

export interface ContractingService {
  id: string;
  name: string;
  chargeRate: number;
  chargeUnit: ChargeUnit;
  annualVolume: number;
  ownCostPerUnit: number;
  additionalCosts: number;
  linkedMachineSource: string | null;
}

export interface ContractingIncomeState {
  services: ContractingService[];
}

// v5 AppState — retained until all consumers are migrated to v6
export interface AppState {
  version: number;
  lastSaved: string;
  costPerHectare: {
    savedMachines: SavedMachine<CostPerHectareInputs>[];
  };
  costPerHour: {
    savedMachines: SavedMachine<CostPerHourInputs>[];
  };
  compareMachines: {
    machineA: WorkrateInputs;
    machineB: WorkrateInputs;
  };
  replacementPlanner: ReplacementPlannerState;
  contractingIncome: ContractingIncomeState;
}

// v6 AppState — unified machine data model (SPEC-13)
export interface AppStateV6 {
  version: number;
  lastSaved: string;
  savedMachines: MachineProfile[];
  replacementPlanner: ReplacementPlannerState;
  contractingIncome: ContractingIncomeState;
}
