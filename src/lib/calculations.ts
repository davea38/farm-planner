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
  const fuelPerHa = fuelUse * fuelPrice;
  const repairsPerHa = hectaresPerYear > 0 ? (purchasePrice * repairsPct / 100) / hectaresPerYear : 0;

  const totalCostPerHa = fixedCostPerHa + labourPerHa + fuelPerHa + repairsPerHa;

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
    haPerHr,
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
  const fuelPerHr = fuelConsumptionPerHr * haPerHr * fuelPrice;
  const repairsPerHr = hoursPerYear > 0 ? (purchasePrice * repairsPct / 100) / hoursPerYear : 0;

  const totalCostPerHr = fixedCostPerHr + labourPerHr + fuelPerHr + repairsPerHr;

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
    ? (6000 * areaPerLoad) / spotTimesEff
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
  const numYears = annualCosts.length > 0 ? annualCosts.length : 1;
  const averageAnnualCost = totalSpend / numYears;
  const pctOfIncome = farmIncome > 0 ? (averageAnnualCost / farmIncome) * 100 : 0;

  return {
    annualCosts,
    totalSpend,
    averageAnnualCost,
    pctOfIncome,
  };
}
