import type {
  CostPerHectareInputs,
  CostPerHectareResults,
  CostPerHourInputs,
  CostPerHourResults,
  ReplacementMachine,
  ReplacementSummary,
  WorkrateInputs,
  WorkrateResults,
} from "./types";

export interface ProfitabilityInputs {
  farmIncome: number;
  contractingGrossIncome: number;
  contractingCosts: number;
  replacementAnnualCost: number;
  runningCostsHectare: number;
  runningCostsHour: number;
}

export interface ProfitabilityResults {
  totalIncome: number;
  farmIncomeAmount: number;
  contractingIncomeAmount: number;
  totalCosts: number;
  replacementCosts: number;
  totalRunningCosts: number;
  contractingCosts: number;
  netPosition: number;
  machineryCostPctOfIncome: number;
  machineryCostPctOfFarmIncome: number;
  contractingOffsetPct: number;
  netWithoutContracting: number;
  netWithContracting: number;
  contractingNetContribution: number;
}

export function calculateProfitability(
  inputs: ProfitabilityInputs,
): ProfitabilityResults {
  const totalIncome = inputs.farmIncome + inputs.contractingGrossIncome;
  const totalRunningCosts = inputs.runningCostsHectare + inputs.runningCostsHour;
  const totalCosts =
    inputs.replacementAnnualCost + totalRunningCosts + inputs.contractingCosts;
  const netPosition = totalIncome - totalCosts;

  const machineryCostPctOfIncome =
    totalIncome > 0 ? (totalCosts / totalIncome) * 100 : 0;

  const contractingOffsetPct =
    totalCosts > 0 ? (inputs.contractingGrossIncome / totalCosts) * 100 : 0;

  const costsWithoutContracting =
    inputs.replacementAnnualCost + totalRunningCosts;
  const machineryCostPctOfFarmIncome =
    inputs.farmIncome > 0 ? (costsWithoutContracting / inputs.farmIncome) * 100 : 0;
  const netWithoutContracting = inputs.farmIncome - costsWithoutContracting;
  const netWithContracting = netPosition;
  const contractingNetContribution =
    netWithContracting - netWithoutContracting;

  return {
    totalIncome,
    farmIncomeAmount: inputs.farmIncome,
    contractingIncomeAmount: inputs.contractingGrossIncome,
    totalCosts,
    replacementCosts: inputs.replacementAnnualCost,
    totalRunningCosts,
    contractingCosts: inputs.contractingCosts,
    netPosition,
    machineryCostPctOfIncome,
    machineryCostPctOfFarmIncome,
    contractingOffsetPct,
    netWithoutContracting,
    netWithContracting,
    contractingNetContribution,
  };
}

export interface ContractingServiceResults {
  grossIncome: number;
  totalOwnCost: number;
  profitPerUnit: number;
  annualProfit: number;
  marginPct: number;
}

export interface ContractingSummary {
  totalGrossIncome: number;
  totalCosts: number;
  totalProfit: number;
  overallMarginPct: number;
  serviceCount: number;
}

export function calculateContractingService(
  chargeRate: number,
  annualVolume: number,
  ownCostPerUnit: number,
  additionalCosts: number,
): ContractingServiceResults {
  const grossIncome = chargeRate * annualVolume;
  const totalOwnCost = ownCostPerUnit * annualVolume + additionalCosts;
  const annualProfit = grossIncome - totalOwnCost;
  const profitPerUnit =
    annualVolume > 0
      ? chargeRate - ownCostPerUnit - additionalCosts / annualVolume
      : 0;
  const marginPct = grossIncome > 0 ? (annualProfit / grossIncome) * 100 : 0;
  return { grossIncome, totalOwnCost, profitPerUnit, annualProfit, marginPct };
}

export function calculateContractingSummary(
  services: ContractingServiceResults[],
): ContractingSummary {
  const totalGrossIncome = services.reduce((sum, s) => sum + s.grossIncome, 0);
  const totalCosts = services.reduce((sum, s) => sum + s.totalOwnCost, 0);
  const totalProfit = totalGrossIncome - totalCosts;
  const overallMarginPct =
    totalGrossIncome > 0 ? (totalProfit / totalGrossIncome) * 100 : 0;
  return {
    totalGrossIncome,
    totalCosts,
    totalProfit,
    overallMarginPct,
    serviceCount: services.length,
  };
}

export function calcCostPerHectare(inputs: CostPerHectareInputs): CostPerHectareResults {
  const {
    purchasePrice,
    yearsOwned,
    salePrice,
    hectaresPerYear,
    interestRate,
    insuranceRate,
    storageRate,
    workRate,
    labourCost,
    fuelPrice,
    fuelUse,
    repairsPct,
    contractorCharge,
  } = inputs;

  const averageValue = (purchasePrice + salePrice) / 2;
  const annualInterest = averageValue * interestRate / 100;
  const annualDepreciation = yearsOwned > 0 ? (purchasePrice - salePrice) / yearsOwned : 0;
  const annualInsurance = purchasePrice * insuranceRate / 100;
  const annualStorage = purchasePrice * storageRate / 100;

  const totalFixedCostPerYear = annualInterest + annualDepreciation + annualInsurance + annualStorage;
  const fixedCostPerHa = hectaresPerYear > 0 ? totalFixedCostPerYear / hectaresPerYear : 0;

  const labourPerHa = workRate > 0 ? labourCost / workRate : 0;
  const fuelPerHa = fuelUse * fuelPrice / 100;
  const repairsPerHa = hectaresPerYear > 0 ? (purchasePrice * repairsPct / 100) / hectaresPerYear : 0;

  const totalCostPerHa = fixedCostPerHa + labourPerHa + fuelPerHa + repairsPerHa;
  const totalAnnualCost = totalCostPerHa * hectaresPerYear;

  // Negative saving means owning is cheaper (farmer saves money by owning)
  const annualSaving = (totalCostPerHa - contractorCharge) * hectaresPerYear;

  return {
    averageValue,
    annualInterest,
    annualDepreciation,
    annualInsurance,
    annualStorage,
    totalFixedCostPerYear,
    fixedCostPerHa,
    labourPerHa,
    fuelPerHa,
    repairsPerHa,
    totalCostPerHa,
    totalAnnualCost,
    annualSaving,
  };
}

export function calcCostPerHour(inputs: CostPerHourInputs): CostPerHourResults {
  const {
    purchasePrice,
    yearsOwned,
    salePrice,
    hoursPerYear,
    interestRate,
    insuranceRate,
    storageRate,
    fuelConsumptionPerHr,
    fuelPrice,
    repairsPct,
    labourCost,
    contractorCharge,
  } = inputs;

  const averageValue = (purchasePrice + salePrice) / 2;
  const annualInterest = averageValue * interestRate / 100;
  const annualDepreciation = yearsOwned > 0 ? (purchasePrice - salePrice) / yearsOwned : 0;
  const annualInsurance = purchasePrice * insuranceRate / 100;
  const annualStorage = purchasePrice * storageRate / 100;

  const totalFixedCostPerYear = annualInterest + annualDepreciation + annualInsurance + annualStorage;
  const fixedCostPerHr = hoursPerYear > 0 ? totalFixedCostPerYear / hoursPerYear : 0;

  const labourPerHr = labourCost;
  const fuelPerHr = fuelConsumptionPerHr * fuelPrice / 100;
  const repairsPerHr = hoursPerYear > 0 ? (purchasePrice * repairsPct / 100) / hoursPerYear : 0;

  const totalCostPerHr = fixedCostPerHr + labourPerHr + fuelPerHr + repairsPerHr;
  const totalAnnualCost = totalCostPerHr * hoursPerYear;

  // Positive saving means contractor is cheaper (farmer saves by using contractor)
  const annualSaving = (totalCostPerHr - contractorCharge) * hoursPerYear;

  return {
    averageValue,
    annualInterest,
    annualDepreciation,
    annualInsurance,
    annualStorage,
    totalFixedCostPerYear,
    fixedCostPerHr,
    labourPerHr,
    fuelPerHr,
    repairsPerHr,
    totalCostPerHr,
    totalAnnualCost,
    annualSaving,
  };
}

export function calcWorkrate(inputs: WorkrateInputs): WorkrateResults {
  const {
    width,
    capacity,
    speed,
    applicationRate,
    transportTime,
    fillingTime,
    fieldEfficiency,
  } = inputs;

  const areaPerLoad = applicationRate > 0 ? capacity / applicationRate : 0;
  const fillingRate = fillingTime > 0 ? capacity / fillingTime : 0;
  const spotRate = (width * speed) / 10;

  const spotTimesEff = spotRate * fieldEfficiency;
  const applicationTime = spotTimesEff > 0
    ? (6000 * areaPerLoad) / spotTimesEff // 6000 = 60 min/hr × 100 (efficiency is %, not decimal)
    : 0;

  const totalTimePerLoad = fillingTime + (2 * transportTime) + applicationTime;

  const overallWorkRate = totalTimePerLoad > 0
    ? (60 * areaPerLoad) / totalTimePerLoad
    : 0;

  const overallEfficiency = spotRate > 0
    ? 100 * overallWorkRate / spotRate
    : 0;

  const applicationPct = totalTimePerLoad > 0
    ? 100 * applicationTime / totalTimePerLoad
    : 0;
  const fillingPct = totalTimePerLoad > 0
    ? 100 * fillingTime / totalTimePerLoad
    : 0;
  const transportPct = totalTimePerLoad > 0
    ? 100 * (2 * transportTime) / totalTimePerLoad
    : 0;

  return {
    areaPerLoad,
    fillingRate,
    spotRate,
    applicationTime,
    totalTimePerLoad,
    overallWorkRate,
    overallEfficiency,
    applicationPct,
    fillingPct,
    transportPct,
  };
}

export function calcReplacementSummary(
  machines: ReplacementMachine[],
  farmIncome: number,
  startYear: number,
  yearSpan: number,
): ReplacementSummary {
  // Ensure minimum 6-year span, or extend to latest replacement year
  const latestTimeToChange = Math.max(0, ...machines.map((m) => m.timeToChange));
  const effectiveSpan = Math.max(yearSpan, latestTimeToChange, 6);

  // Build per-year cost array
  const annualCosts: { year: number; cost: number }[] = [];
  for (let i = 0; i <= effectiveSpan; i++) {
    annualCosts.push({ year: startYear + i, cost: 0 });
  }

  // Place each machine's net cost in its replacement year
  for (const machine of machines) {
    if (machine.timeToChange <= 0) continue;
    const costToBudget = machine.priceToChange - machine.currentValue;
    const yearIndex = machine.timeToChange;
    if (yearIndex >= 0 && yearIndex < annualCosts.length) {
      annualCosts[yearIndex].cost += costToBudget;
    }
  }

  const totalSpend = annualCosts.reduce((sum, entry) => sum + entry.cost, 0);
  const averageAnnualCost = totalSpend / effectiveSpan;
  const pctOfIncome = farmIncome > 0 ? (averageAnnualCost / farmIncome) * 100 : 0;

  return {
    annualCosts,
    totalSpend,
    averageAnnualCost,
    pctOfIncome,
  };
}
