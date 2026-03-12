import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputField } from "@/components/InputField";
import { ResultBanner } from "@/components/ResultBanner";
import { CostDonutChart } from "@/components/CostDonutChart";
import { IncomeVsCostsBar } from "@/components/IncomeVsCostsBar";
import { formatGBP, formatPct } from "@/lib/format";
import { ContractingComparisonBar } from "@/components/ContractingComparisonBar";
import { SourceBadge } from "@/components/SourceBadge";
import { navigateToTab } from "@/lib/tab-navigation";
import {
  calculateProfitability,
  calcCostPerHectare,
  calcCostPerHour,
  calcReplacementSummary,
  calculateContractingService,
} from "@/lib/calculations";
import type { AppState } from "@/lib/types";

interface ProfitabilityOverviewProps {
  appState: AppState;
  onFarmIncomeChange?: (value: number) => void;
}

function getTrafficLight(pct: number): {
  type: "green" | "amber" | "red";
  message: string;
} {
  if (pct < 20) {
    return {
      type: "green",
      message: "Comfortable — machinery costs are well controlled",
    };
  }
  if (pct <= 35) {
    return {
      type: "amber",
      message: "Keep an eye on it — machinery costs are significant",
    };
  }
  return {
    type: "red",
    message: "Machinery is eating your profits",
  };
}

export function ProfitabilityOverview({ appState, onFarmIncomeChange }: ProfitabilityOverviewProps) {
  const hasMachines = appState.savedMachines.length > 0;
  const hasServices = appState.contractingIncome.services.length > 0;

  const { results, runningCostsHa, runningCostsHr } = useMemo(() => {
    const replacementSummary = calcReplacementSummary(
      appState.replacementPlanner.machines,
      appState.replacementPlanner.farmIncome,
      new Date().getFullYear(),
      6,
    );

    let haRunning = 0;
    let hrRunning = 0;
    for (const m of appState.savedMachines) {
      if (m.costMode === "hectare") {
        const r = calcCostPerHectare(m.costPerHectare);
        haRunning += r.totalCostPerHa * m.costPerHectare.hectaresPerYear;
      } else {
        const r = calcCostPerHour(m.costPerHour);
        hrRunning += r.totalCostPerHr * m.costPerHour.hoursPerYear;
      }
    }

    let contractingGrossIncome = 0;
    let contractingCosts = 0;
    for (const s of appState.contractingIncome.services) {
      const sr = calculateContractingService(
        s.chargeRate,
        s.annualVolume,
        s.ownCostPerUnit,
        s.additionalCosts,
      );
      contractingGrossIncome += sr.grossIncome;
      contractingCosts += sr.totalOwnCost;
    }

    const profResults = calculateProfitability({
      farmIncome: appState.replacementPlanner.farmIncome,
      contractingGrossIncome,
      contractingCosts,
      replacementAnnualCost: replacementSummary.averageAnnualCost,
      runningCostsHectare: haRunning,
      runningCostsHour: hrRunning,
    });

    return {
      results: profResults,
      runningCostsHa: haRunning,
      runningCostsHr: hrRunning,
    };
  }, [appState]);

  const trafficLight = getTrafficLight(results.machineryCostPctOfFarmIncome);
  const haCountLabel = appState.savedMachines.filter(m => m.costMode === "hectare").length;
  const hrCountLabel = appState.savedMachines.filter(m => m.costMode === "hour").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">
          Is it all worth it?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          All figures are pulled from your other tabs. Change your inputs there
          to update the numbers here.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Income Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm border-b pb-1">
            Income
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <InputField
              label="Your farm income"
              value={appState.replacementPlanner.farmIncome}
              onChange={(v) => onFarmIncomeChange?.(v)}
              unit="£/year"
              tooltip="Your total annual farm income (excluding contracting)"
              min={0}
            />
            <span className="text-muted-foreground flex items-center gap-1.5 flex-wrap">
              Contracting income:
              {results.contractingIncomeAmount > 0 && <SourceBadge label="Contracting tab" navigateTo="contracting-income" />}
            </span>
            <span className="font-medium text-right">
              {formatGBP(results.contractingIncomeAmount)}/year
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm border-t pt-1 font-semibold">
            <span>Total Income:</span>
            <span className="text-right">
              {formatGBP(results.totalIncome)}/year
            </span>
          </div>
        </div>

        {/* Costs Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm border-b pb-1">
            Costs
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5 flex-wrap">
              Replacement costs (avg annual):
              <SourceBadge label="Replacement Planner" navigateTo="replacement-planner" />
            </span>
            <span className="font-medium text-right">
              {formatGBP(results.replacementCosts)}/year
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5 flex-wrap">
              Running costs (per-ha machines x {haCountLabel}):
              {haCountLabel > 0 && <SourceBadge label={`${haCountLabel} saved machine${haCountLabel !== 1 ? "s" : ""}`} navigateTo="cost-calculator" />}
            </span>
            <span className="font-medium text-right">
              {formatGBP(runningCostsHa)}/year
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5 flex-wrap">
              Running costs (per-hr machines x {hrCountLabel}):
              {hrCountLabel > 0 && <SourceBadge label={`${hrCountLabel} saved machine${hrCountLabel !== 1 ? "s" : ""}`} navigateTo="cost-calculator" />}
            </span>
            <span className="font-medium text-right">
              {formatGBP(runningCostsHr)}/year
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5 flex-wrap">
              Contracting operating costs:
              {results.contractingCosts > 0 && <SourceBadge label="Contracting tab" navigateTo="contracting-income" />}
            </span>
            <span className="font-medium text-right">
              {formatGBP(results.contractingCosts)}/year
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm border-t pt-1 font-semibold">
            <span>Total Costs:</span>
            <span className="text-right">
              {formatGBP(results.totalCosts)}/year
            </span>
          </div>
        </div>

        {/* Net Position */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm border-b pb-1">
            Net Position
          </h3>
          <Card className="border-2">
            <CardContent className="py-4 space-y-3 text-center">
              <p className="text-sm text-muted-foreground">Net Position</p>
              <p className="text-4xl sm:text-[40px] font-bold">
                <span
                  className={
                    results.netPosition >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {results.netPosition >= 0 ? "+" : ""}
                  {formatGBP(results.netPosition)}
                </span>
                <span className="text-lg font-semibold text-muted-foreground">/year</span>
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm max-w-md mx-auto">
                <span className="text-muted-foreground text-right">
                  Machinery costs as % of farm income:
                </span>
                <span className="font-medium text-left">
                  {formatPct(results.machineryCostPctOfFarmIncome)}
                </span>
                <span className="text-muted-foreground text-right">
                  All costs as % of total income:
                </span>
                <span className="font-medium text-left">
                  {formatPct(results.machineryCostPctOfIncome)}
                </span>
                <span className="text-muted-foreground text-right">
                  Contracting income offsets:
                </span>
                <span className="font-medium text-left">
                  {formatPct(results.contractingOffsetPct)} of costs
                </span>
              </div>
              <div data-banner={trafficLight.type}>
                <ResultBanner
                  type={trafficLight.type}
                  mainText={trafficLight.message}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {(results.totalIncome > 0 || results.totalCosts > 0) && (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Stacked bar: income vs costs */}
              <div>
                <IncomeVsCostsBar
                  incomeSegments={[
                    { label: "Your farm income", value: results.farmIncomeAmount, color: "#2e7d32" },
                    { label: "Contracting income", value: results.contractingIncomeAmount, color: "#66bb6a" },
                  ]}
                  costSegments={[
                    { label: "Replacements", value: results.replacementCosts, color: "#c62828" },
                    { label: "Running costs", value: results.totalRunningCosts, color: "#e57373" },
                    { label: "Contracting costs", value: results.contractingCosts, color: "#ef9a9a" },
                  ]}
                  netPosition={results.netPosition}
                />
              </div>

              {/* Donut: cost category split */}
              {results.totalCosts > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Where your costs go
                  </p>
                  <CostDonutChart
                    segments={[
                      { label: "Replacements", value: results.replacementCosts, color: "#c62828" },
                      { label: "Running costs", value: results.totalRunningCosts, color: "#e57373" },
                      { label: "Contracting costs", value: results.contractingCosts, color: "#ef9a9a" },
                    ]}
                    centerLabel="Total costs"
                    centerValue={results.totalCosts}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* With vs Without Contracting */}
        {hasServices && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm border-b pb-1">
              Farm Only vs Farm + Contracting
            </h3>
            <ContractingComparisonBar
              farmOnlyIncome={results.farmIncomeAmount}
              farmOnlyCosts={results.totalCosts - results.contractingCosts}
              farmOnlyNet={results.netWithoutContracting}
              withContractingIncome={results.totalIncome}
              withContractingCosts={results.totalCosts}
              withContractingNet={results.netWithContracting}
              contractingContribution={results.contractingNetContribution}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4"></th>
                    <th className="text-right py-2 px-4">
                      Farm Only
                    </th>
                    <th className="text-right py-2 pl-4">Farm + Contracting</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 pr-4 text-muted-foreground">Income</td>
                    <td className="text-right py-2 px-4">
                      {formatGBP(results.farmIncomeAmount)}
                    </td>
                    <td className="text-right py-2 pl-4">
                      {formatGBP(results.totalIncome)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 text-muted-foreground">Costs</td>
                    <td className="text-right py-2 px-4">
                      {formatGBP(
                        results.totalCosts - results.contractingCosts,
                      )}
                    </td>
                    <td className="text-right py-2 pl-4">
                      {formatGBP(results.totalCosts)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-semibold">Net</td>
                    <td className="text-right py-2 px-4 font-semibold">
                      {formatGBP(results.netWithoutContracting)}
                    </td>
                    <td className="text-right py-2 pl-4 font-semibold">
                      {formatGBP(results.netWithContracting)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">
                      Machinery % income
                    </td>
                    <td className="text-right py-2 px-4">
                      {formatPct(results.machineryCostPctOfFarmIncome)}
                    </td>
                    <td className="text-right py-2 pl-4">
                      {formatPct(results.machineryCostPctOfIncome)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Key / Legend */}
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <h4 className="font-semibold">Key</h4>
          <p className="text-muted-foreground">
            Machinery cost as % of income:
          </p>
          <ul className="space-y-1 ml-2">
            <li>
              <span className="inline-block w-3 h-3 rounded-full bg-farm-green mr-2 align-middle" />
              Under 20% — comfortable
            </li>
            <li>
              <span className="inline-block w-3 h-3 rounded-full bg-farm-amber mr-2 align-middle" />
              20–35% — keep an eye on it
            </li>
            <li>
              <span className="inline-block w-3 h-3 rounded-full bg-farm-red mr-2 align-middle" />
              Over 35% — machinery is eating your profits
            </li>
          </ul>
        </div>

        {/* Empty state message */}
        {!hasMachines && !hasServices && (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center space-y-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground/40"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
            <h3 className="text-sm font-semibold text-foreground">Let's see if your machines are earning their keep</h3>
            <p className="text-sm text-muted-foreground/70 max-w-xs mx-auto">
              Add machines on the <strong>Machines</strong> tab and work out their costs.
              This tab will pull everything together to show your full profitability picture.
            </p>
            <button
              type="button"
              onClick={() => navigateToTab("machines")}
              className="inline-flex items-center gap-1.5 mt-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors min-h-[44px] cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add a machine
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
