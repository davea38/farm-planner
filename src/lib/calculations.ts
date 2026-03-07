import type {
  CostPerHectareInputs,
  CostPerHectareResults,
  CostPerHourInputs,
  CostPerHourResults,
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
