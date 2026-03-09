import { useState, useMemo, useEffect, useRef } from "react"
import type { CostPerHectareInputs } from "@/lib/types"
import { defaultCostPerHectare } from "@/lib/defaults"
import { calcCostPerHectare } from "@/lib/calculations"
import { formatGBP } from "@/lib/format"
import { useUnits } from "@/lib/UnitContext"
import { displayUnit, toDisplay } from "@/lib/units"
import { InputField } from "./InputField"
import { CollapsibleSection } from "./CollapsibleSection"
import { CostBreakdown } from "./CostBreakdown"
import { ResultBanner } from "./ResultBanner"
import { RepairEstimator } from "./RepairEstimator"
import { FuelPricePanel } from "./FuelPricePanel"
import { FuelConsumptionPanel } from "./FuelConsumptionPanel"
import { ContractorRatesPanel } from "./ContractorRatesPanel"
import { DepreciationPanel } from "./DepreciationPanel"
import { CostDonutChart } from "./CostDonutChart"
import { CostComparisonBar } from "./CostComparisonBar"

export function CostPerHectare({
  initialInputs,
  onChange,
}: {
  initialInputs?: CostPerHectareInputs
  onChange?: (inputs: CostPerHectareInputs) => void
}) {
  const [inputs, setInputs] = useState<CostPerHectareInputs>(initialInputs ?? defaultCostPerHectare)
  const [fieldSources, setFieldSources] = useState<Record<string, string>>({})

  const update = (field: keyof CostPerHectareInputs) => (value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }))
    setFieldSources((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const applyFromSource = (field: keyof CostPerHectareInputs, source: string) => (value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }))
    setFieldSources((prev) => ({ ...prev, [field]: source }))
  }

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    onChange?.(inputs)
  }, [inputs, onChange])

  const { units } = useUnits()

  const results = useMemo(() => calcCostPerHectare(inputs), [inputs])

  const runningCostPerHa = results.labourPerHa + results.fuelPerHa + results.repairsPerHa
  const contractorTotalCost = inputs.contractorCharge * inputs.hectaresPerYear

  // Check for zero-value fields that would produce meaningless results
  const zeroWarnings: string[] = []
  if (inputs.hectaresPerYear <= 0) zeroWarnings.push(units.area === "acres" ? "acres worked per year" : "hectares worked per year")
  if (inputs.workRate <= 0) zeroWarnings.push("work rate")
  if (inputs.yearsOwned <= 0) zeroWarnings.push("years owned")
  const hasZeroWarning = zeroWarnings.length > 0

  // Determine banner type: negative saving = owning cheaper (green), positive = contractor cheaper (red)
  // Within 10% of contractor charge = amber
  const savingAbs = Math.abs(results.annualSaving)
  const threshold = contractorTotalCost * 0.1
  let bannerType: "green" | "amber" | "red"
  let bannerText: string
  let bannerSub: string | undefined

  const areaUnit = displayUnit("ha", units)
  const perUnitDiff = toDisplay(Math.abs(results.totalCostPerHa - inputs.contractorCharge), "£/ha", units)

  if (savingAbs <= threshold) {
    bannerType = "amber"
    bannerText = "It's roughly break-even — consider convenience"
  } else if (results.annualSaving < 0) {
    bannerType = "green"
    bannerText = `You save ${formatGBP(savingAbs)}/year by owning this machine`
    bannerSub = `${formatGBP(perUnitDiff)}/${areaUnit} cheaper than a contractor`
  } else {
    bannerType = "red"
    bannerText = `You'd save ${formatGBP(savingAbs)}/year using a contractor`
    bannerSub = `Contractor is ${formatGBP(perUnitDiff)}/${areaUnit} cheaper`
  }

  return (
    <div className="space-y-6">

      {/* What Did You Pay? */}
      <div className="rounded-lg bg-card p-4 shadow-sm space-y-1">
        <h2 className="text-sm font-semibold mb-3">What Did You Pay / What Will You Get?</h2>
        <InputField
          label="Purchase price"
          value={inputs.purchasePrice}
          onChange={update("purchasePrice")}
          unit="£"
          tooltip="What you paid (or would pay) for this machine"
          min={0}
        />
        <InputField
          label="Sell after"
          value={inputs.yearsOwned}
          onChange={update("yearsOwned")}
          unit="years"
          tooltip="How many years before you plan to sell or trade in"
          min={0}
        />
        <InputField
          label="Expected sale price"
          value={inputs.salePrice}
          onChange={update("salePrice")}
          unit="£"
          tooltip="What you expect to get when you sell it"
          min={0}
        />
        <InputField
          label={`${displayUnit("ha", units) === "acres" ? "Acres" : "Hectares"} worked/year`}
          value={inputs.hectaresPerYear}
          onChange={update("hectaresPerYear")}
          metricUnit="ha"
          tooltip="Total hectares this machine covers in a year"
          min={0}
        />
      </div>

      {/* Running Costs */}
      <div className="rounded-lg bg-card p-4 shadow-sm space-y-1">
        <h2 className="text-sm font-semibold mb-3">Running Costs</h2>
        <InputField
          label="Coverage speed"
          value={inputs.workRate}
          onChange={update("workRate")}
          metricUnit="ha/hr"
          tooltip="How many hectares (or acres) this machine covers per hour of field work"
          min={0}
        />
        <InputField
          label="Labour cost"
          value={inputs.labourCost}
          onChange={update("labourCost")}
          unit="£/hr"
          tooltip="What you pay the operator per hour (including yourself)"
          min={0}
        />
        <InputField
          label="Fuel price"
          value={inputs.fuelPrice}
          onChange={update("fuelPrice")}
          unit="£/litre"
          tooltip="Current red diesel price per litre"
          min={0}
          sourceBadge={fieldSources["fuelPrice"]}
        />
        <FuelPricePanel onApply={applyFromSource("fuelPrice", "AHDB fuel price")} />
        <InputField
          label="Fuel use"
          value={inputs.fuelUse}
          onChange={update("fuelUse")}
          metricUnit="L/ha"
          tooltip="Litres of fuel burned per hectare"
          min={0}
          sourceBadge={fieldSources["fuelUse"]}
        />
        <FuelConsumptionPanel
          onApply={applyFromSource("fuelUse", "Fuel estimate")}
          mode="perHectare"
          workRate={inputs.workRate}
        />
        <InputField
          label="Spares & repairs"
          value={inputs.repairsPct}
          onChange={update("repairsPct")}
          unit="%"
          tooltip="Annual repair bill as a percentage of what you paid"
          min={0}
          sourceBadge={fieldSources["repairsPct"]}
        />
        <div className="flex justify-end">
          <RepairEstimator onApply={applyFromSource("repairsPct", "Repair estimate")} />
        </div>
      </div>

      {/* Overheads (collapsed by default) */}
      <div className="rounded-lg bg-card p-4 shadow-sm">
        <CollapsibleSection
          title="Overheads"
          subtitle="Most farmers leave these as they are"
          defaultOpen={false}
        >
          <div className="space-y-1 mt-2">
            <InputField
              label="Finance / opportunity cost"
              value={inputs.interestRate}
              onChange={update("interestRate")}
              unit="%"
              tooltip="If you borrowed to buy this machine, enter your loan rate. If you paid cash, enter what that money could earn elsewhere (usually 2–4%)."
              min={0}
            />
            <InputField
              label="Insurance"
              value={inputs.insuranceRate}
              onChange={update("insuranceRate")}
              unit="%"
              tooltip="Annual insurance as a percentage of what you paid. In practice you may insure based on current market value, which could be lower."
              min={0}
            />
            <InputField
              label="Storage"
              value={inputs.storageRate}
              onChange={update("storageRate")}
              unit="%"
              tooltip="Cost of keeping it under cover, as a percentage of what you paid"
              min={0}
            />
          </div>
        </CollapsibleSection>
      </div>

      {/* Contractor Comparison */}
      <div className="rounded-lg bg-card p-4 shadow-sm space-y-1">
        <h2 className="text-sm font-semibold mb-3">Contractor Comparison</h2>
        <InputField
          label="Contractor charges"
          value={inputs.contractorCharge}
          onChange={update("contractorCharge")}
          metricUnit="£/ha"
          tooltip="What a contractor would charge you per hectare for the same job"
          min={0}
          sourceBadge={fieldSources["contractorCharge"]}
        />
        <ContractorRatesPanel
          onApply={applyFromSource("contractorCharge", "NAAC rate")}
          currentRate={inputs.contractorCharge}
          unitFilter="ha"
        />
      </div>

      {/* Depreciation Curve */}
      <div className="rounded-lg bg-card p-4 shadow-sm space-y-1">
        <h2 className="text-sm font-semibold mb-3">Depreciation Curve</h2>
        <DepreciationPanel
          purchasePrice={inputs.purchasePrice}
          yearsOwned={inputs.yearsOwned}
          onApplySalePrice={update("salePrice")}
          onYearsChange={update("yearsOwned")}
        />
      </div>

      {/* Results */}
      <div className="rounded-lg bg-muted/50 p-4 space-y-4">
        <h2 className="text-sm font-semibold">Results</h2>

        {hasZeroWarning ? (
          <div className="rounded-lg border border-farm-amber/50 bg-farm-amber/10 px-4 py-3 text-sm text-muted-foreground">
            Enter a value for {zeroWarnings.join(" and ")} to see results.
          </div>
        ) : (
          <>
            <CostBreakdown
              rows={[
                { label: "Your cost", value: results.totalCostPerHa, unit: "ha", bold: true },
                { label: "Fixed costs", value: results.fixedCostPerHa, unit: "ha" },
                { label: "Running costs", value: runningCostPerHa, unit: "ha" },
              ]}
            />

            <CostDonutChart
              segments={[
                { label: "Depreciation", value: results.annualDepreciation, color: "#2e7d32" },
                { label: "Interest", value: results.annualInterest, color: "#66bb6a" },
                { label: "Insurance", value: results.annualInsurance, color: "#a5d6a7" },
                { label: "Storage", value: results.annualStorage, color: "#c8e6c9" },
                { label: "Fuel", value: results.fuelPerHa * inputs.hectaresPerYear, color: "#f9a825" },
                { label: "Labour", value: results.labourPerHa * inputs.hectaresPerYear, color: "#ffcc80" },
                { label: "Repairs", value: results.repairsPerHa * inputs.hectaresPerYear, color: "#ef6c00" },
              ]}
              centerLabel="Total/year"
              centerValue={results.totalAnnualCost}
            />

            <div className="space-y-0.5">
              <span className="text-sm text-muted-foreground">Total annual cost</span>
              <div className="text-4xl font-bold tabular-nums">
                {formatGBP(results.totalAnnualCost)}<span className="text-lg font-semibold text-muted-foreground">/year</span>
              </div>
            </div>

            <CostComparisonBar
              ownCost={results.totalCostPerHa}
              contractorCost={inputs.contractorCharge}
              unit={areaUnit}
            />

            <ResultBanner type={bannerType} mainText={bannerText} subText={bannerSub} />
          </>
        )}
      </div>

    </div>
  )
}
