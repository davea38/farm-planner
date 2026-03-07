import { calculateProfitability } from "@/lib/calculations";
import type { ProfitabilityInputs } from "@/lib/calculations";

const baseInputs: ProfitabilityInputs = {
  farmIncome: 350000,
  contractingGrossIncome: 82500,
  contractingCosts: 61200,
  replacementAnnualCost: 87500,
  runningCostsHectare: 36324,
  runningCostsHour: 45892,
};

describe("calculateProfitability", () => {
  it("calculates total income", () => {
    const r = calculateProfitability(baseInputs);
    expect(r.totalIncome).toBe(432500);
  });

  it("calculates total costs", () => {
    const r = calculateProfitability(baseInputs);
    // 87500 + 36324 + 45892 + 61200 = 230916
    expect(r.totalCosts).toBe(230916);
  });

  it("calculates net position", () => {
    const r = calculateProfitability(baseInputs);
    expect(r.netPosition).toBe(432500 - 230916);
  });

  it("calculates machinery cost as % of income", () => {
    const r = calculateProfitability(baseInputs);
    expect(r.machineryCostPctOfIncome).toBeCloseTo(53.4, 0);
  });

  it("calculates contracting offset %", () => {
    const r = calculateProfitability(baseInputs);
    expect(r.contractingOffsetPct).toBeCloseTo(35.7, 0);
  });

  it("calculates net without contracting", () => {
    const r = calculateProfitability(baseInputs);
    // farmIncome - (replacement + running) = 350000 - (87500 + 36324 + 45892)
    expect(r.netWithoutContracting).toBe(350000 - 169716);
  });

  it("calculates net with contracting", () => {
    const r = calculateProfitability(baseInputs);
    expect(r.netWithContracting).toBe(r.netPosition);
  });

  it("calculates contracting net contribution", () => {
    const r = calculateProfitability(baseInputs);
    expect(r.contractingNetContribution).toBe(
      r.netWithContracting - r.netWithoutContracting,
    );
  });

  it("handles zero farm income", () => {
    const r = calculateProfitability({ ...baseInputs, farmIncome: 0 });
    expect(r.totalIncome).toBe(82500);
    expect(r.machineryCostPctOfIncome).toBeGreaterThan(0);
  });

  it("handles zero contracting", () => {
    const r = calculateProfitability({
      ...baseInputs,
      contractingGrossIncome: 0,
      contractingCosts: 0,
    });
    expect(r.contractingOffsetPct).toBe(0);
    expect(r.contractingNetContribution).toBe(0);
  });

  it("handles all zeros", () => {
    const r = calculateProfitability({
      farmIncome: 0,
      contractingGrossIncome: 0,
      contractingCosts: 0,
      replacementAnnualCost: 0,
      runningCostsHectare: 0,
      runningCostsHour: 0,
    });
    expect(r.totalIncome).toBe(0);
    expect(r.totalCosts).toBe(0);
    expect(r.netPosition).toBe(0);
    expect(r.machineryCostPctOfIncome).toBe(0);
  });
});
