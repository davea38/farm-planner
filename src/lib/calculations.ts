import type {
  CostPerHectareInputs,
  CostPerHectareResults,
  CostPerHourInputs,
  CostPerHourResults,
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
