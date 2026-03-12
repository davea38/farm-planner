import { useState, useMemo } from "react"
import type { CostPerHectareInputs, CostPerHourInputs, CostMode } from "@/lib/types"
import { calcCostPerHectare, calcCostPerHour } from "@/lib/calculations"
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
import { CostDonutChart } from "./CostDonutChart"
import { ConnectedTabsFooter } from "./ConnectedTabsFooter"
import { CostComparisonBar } from "./CostComparisonBar"

export type { CostMode }

export function CostCalculator({
  mode,
  onModeChange,
  hectareInputs,
  hourInputs,
  onHectareFieldChange,
  onHourFieldChange,
}: {
  mode: CostMode
  onModeChange: (mode: CostMode) => void
  hectareInputs: CostPerHectareInputs
  hourInputs: CostPerHourInputs
  onHectareFieldChange: (field: keyof CostPerHectareInputs, value: number) => void
  onHourFieldChange: (field: keyof CostPerHourInputs, value: number) => void
}) {
  const [fieldSources, setFieldSources] = useState<Record<string, string>>({})

  const { units } = useUnits()

  // Hectare update helpers
  const updateHa = (field: keyof CostPerHectareInputs) => (value: number) => {
    onHectareFieldChange(field, value)
    setFieldSources((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const applyHaFromSource = (field: keyof CostPerHectareInputs, source: string) => (value: number) => {
    onHectareFieldChange(field, value)
    setFieldSources((prev) => ({ ...prev, [field]: source }))
  }

  // Hour update helpers
  const updateHr = (field: keyof CostPerHourInputs) => (value: number) => {
    onHourFieldChange(field, value)
    setFieldSources((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const applyHrFromSource = (field: keyof CostPerHourInputs, source: string) => (value: number) => {
    onHourFieldChange(field, value)
    setFieldSources((prev) => ({ ...prev, [field]: source }))
  }

  // Current mode inputs/results — computed directly from props
  const inputs = mode === "hectare" ? hectareInputs : hourInputs
  const haResults = useMemo(() => calcCostPerHectare(hectareInputs), [hectareInputs])
  const hrResults = useMemo(() => calcCostPerHour(hourInputs), [hourInputs])

  // Shared update helpers that delegate to the right mode
  const update = mode === "hectare"
    ? (field: string) => updateHa(field as keyof CostPerHectareInputs)
    : (field: string) => updateHr(field as keyof CostPerHourInputs)

  // Results & derived values based on mode
  const areaUnit = displayUnit("ha", units)

  let totalCostPerUnit: number
  let fixedCostPerUnit: number
  let runningCostPerUnit: number
  let contractorTotalCost: number
  let fuelAnnual: number
  let labourAnnual: number
  let repairsAnnual: number
  let totalAnnualCost: number
  let annualSaving: number
  let contractorCharge: number
  let unitLabel: string
  let perUnitDiff: number
  let annualDepreciation: number
  let annualInterest: number
  let annualInsurance: number
  let annualStorage: number

  if (mode === "hectare") {
    const r = haResults
    totalCostPerUnit = r.totalCostPerHa
    fixedCostPerUnit = r.fixedCostPerHa
    runningCostPerUnit = r.labourPerHa + r.fuelPerHa + r.repairsPerHa
    contractorTotalCost = hectareInputs.contractorCharge * hectareInputs.hectaresPerYear
    fuelAnnual = r.fuelPerHa * hectareInputs.hectaresPerYear
    labourAnnual = r.labourPerHa * hectareInputs.hectaresPerYear
    repairsAnnual = r.repairsPerHa * hectareInputs.hectaresPerYear
    totalAnnualCost = r.totalAnnualCost
    annualSaving = r.annualSaving
    contractorCharge = hectareInputs.contractorCharge
    unitLabel = areaUnit
    perUnitDiff = toDisplay(Math.abs(r.totalCostPerHa - hectareInputs.contractorCharge), "£/ha", units)
    annualDepreciation = r.annualDepreciation
    annualInterest = r.annualInterest
    annualInsurance = r.annualInsurance
    annualStorage = r.annualStorage
  } else {
    const r = hrResults
    totalCostPerUnit = r.totalCostPerHr
    fixedCostPerUnit = r.fixedCostPerHr
    runningCostPerUnit = r.labourPerHr + r.fuelPerHr + r.repairsPerHr
    contractorTotalCost = hourInputs.contractorCharge * hourInputs.hoursPerYear
    fuelAnnual = r.fuelPerHr * hourInputs.hoursPerYear
    labourAnnual = r.labourPerHr * hourInputs.hoursPerYear
    repairsAnnual = r.repairsPerHr * hourInputs.hoursPerYear
    totalAnnualCost = r.totalAnnualCost
    annualSaving = r.annualSaving
    contractorCharge = hourInputs.contractorCharge
    unitLabel = "hr"
    perUnitDiff = Math.abs(r.totalCostPerHr - hourInputs.contractorCharge)
    annualDepreciation = r.annualDepreciation
    annualInterest = r.annualInterest
    annualInsurance = r.annualInsurance
    annualStorage = r.annualStorage
  }

  // Zero warnings
  const zeroWarnings: string[] = []
  if (mode === "hectare") {
    if (hectareInputs.hectaresPerYear <= 0) zeroWarnings.push(units.area === "acres" ? "acres worked per year" : "hectares worked per year")
    if (hectareInputs.workRate <= 0) zeroWarnings.push("ground covered")
    if (hectareInputs.yearsOwned <= 0) zeroWarnings.push("years owned")
  } else {
    if (hourInputs.hoursPerYear <= 0) zeroWarnings.push("hours worked per year")
    if (hourInputs.yearsOwned <= 0) zeroWarnings.push("years owned")
  }
  const hasZeroWarning = zeroWarnings.length > 0

  // Banner
  const savingAbs = Math.abs(annualSaving)
  const threshold = contractorTotalCost * 0.1
  let bannerType: "green" | "amber" | "red"
  let bannerText: string
  let bannerSub: string | undefined

  if (savingAbs <= threshold) {
    bannerType = "amber"
    bannerText = "It's roughly break-even — consider convenience"
  } else if (annualSaving < 0) {
    bannerType = "green"
    bannerText = `You save ${formatGBP(savingAbs)}/year by owning this machine`
    bannerSub = `${formatGBP(perUnitDiff)}/${unitLabel} cheaper than a contractor`
  } else {
    bannerType = "red"
    bannerText = `You'd save ${formatGBP(savingAbs)}/year using a contractor`
    bannerSub = `Contractor is ${formatGBP(perUnitDiff)}/${unitLabel} cheaper`
  }

  return (
    <div className="space-y-8">

      {/* Purchase & Ownership */}
      <div className="rounded-lg bg-card p-4 shadow-sm">
        <CollapsibleSection
          title="Purchase & Ownership"
          subtitle="What you paid and how long you'll keep it"
          defaultOpen={true}
        >
          <div className="space-y-1 mt-2">
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
              label="What you'll get when you sell"
              value={inputs.salePrice}
              onChange={update("salePrice")}
              unit="£"
              tooltip="What you expect to get when you sell it"
              min={0}
            />
            {mode === "hectare" ? (
              <InputField
                label={`${areaUnit === "acres" ? "Acres" : "Hectares"} worked/year`}
                value={hectareInputs.hectaresPerYear}
                onChange={updateHa("hectaresPerYear")}
                metricUnit="ha"
                tooltip="Total hectares this machine covers in a year"
                min={0}
              />
            ) : (
              <InputField
                label="Hours worked/year"
                value={hourInputs.hoursPerYear}
                onChange={updateHr("hoursPerYear")}
                unit="hrs"
                tooltip="Total hours this machine runs in a year"
                min={0}
              />
            )}
          </div>
        </CollapsibleSection>
      </div>

      {/* Running Costs — with mode toggle */}
      <div className="rounded-lg bg-card p-4 shadow-sm">
        <CollapsibleSection
          title="Running costs"
          subtitle="Fuel, labour, and repairs"
          defaultOpen={true}
          headerRight={
            <ModeToggle mode={mode} onModeChange={onModeChange} areaUnit={areaUnit} />
          }
        >
          <div className="space-y-1 mt-2">
            {mode === "hectare" ? (
              <>
                <InputField
                  label="Ground covered"
                  value={hectareInputs.workRate}
                  onChange={updateHa("workRate")}
                  metricUnit="ha/hr"
                  tooltip="How many hectares this machine gets through in an hour of actual work"
                  min={0}
                />
                <InputField
                  label="Labour cost"
                  value={hectareInputs.labourCost}
                  onChange={updateHa("labourCost")}
                  unit="£/hr"
                  tooltip="What you pay the operator per hour (including yourself)"
                  min={0}
                />
                <InputField
                  label="Fuel price"
                  value={hectareInputs.fuelPrice}
                  onChange={updateHa("fuelPrice")}
                  unit="p/litre"
                  tooltip="Current red diesel price in pence per litre"
                  min={0}
                  sourceBadge={fieldSources["fuelPrice"]}
                />
                <FuelPricePanel onApply={applyHaFromSource("fuelPrice", "AHDB fuel price")} />
                <InputField
                  label="Fuel use"
                  value={hectareInputs.fuelUse}
                  onChange={updateHa("fuelUse")}
                  metricUnit="L/ha"
                  tooltip="Litres of fuel burned per hectare"
                  min={0}
                  sourceBadge={fieldSources["fuelUse"]}
                />
                <FuelConsumptionPanel
                  onApply={applyHaFromSource("fuelUse", "Fuel estimate")}
                  mode="perHectare"
                  workRate={hectareInputs.workRate}
                />
                <InputField
                  label="Repairs (% of price)"
                  value={hectareInputs.repairsPct}
                  onChange={updateHa("repairsPct")}
                  unit="%"
                  tooltip="Your annual repair bill as a percentage of purchase price"
                  min={0}
                  sourceBadge={fieldSources["repairsPct"]}
                />
                <div className="flex justify-end">
                  <RepairEstimator onApply={applyHaFromSource("repairsPct", "Repair estimate")} />
                </div>
              </>
            ) : (
              <>
                <InputField
                  label="Fuel consumption"
                  value={hourInputs.fuelConsumptionPerHr}
                  onChange={updateHr("fuelConsumptionPerHr")}
                  unit="L/hr"
                  tooltip="Litres of fuel burned per hour of work"
                  min={0}
                  sourceBadge={fieldSources["fuelConsumptionPerHr"]}
                />
                <FuelConsumptionPanel
                  onApply={applyHrFromSource("fuelConsumptionPerHr", "Fuel estimate")}
                  mode="perHour"
                />
                <InputField
                  label="Fuel price"
                  value={hourInputs.fuelPrice}
                  onChange={updateHr("fuelPrice")}
                  unit="p/litre"
                  tooltip="Current red diesel price in pence per litre"
                  min={0}
                  sourceBadge={fieldSources["fuelPrice"]}
                />
                <FuelPricePanel onApply={applyHrFromSource("fuelPrice", "AHDB fuel price")} />
                <InputField
                  label="Repairs (% of price)"
                  value={hourInputs.repairsPct}
                  onChange={updateHr("repairsPct")}
                  unit="%"
                  tooltip="Your annual repair bill as a percentage of purchase price"
                  min={0}
                  sourceBadge={fieldSources["repairsPct"]}
                />
                <div className="flex justify-end">
                  <RepairEstimator onApply={applyHrFromSource("repairsPct", "Repair estimate")} />
                </div>
                <InputField
                  label="Labour cost"
                  value={hourInputs.labourCost}
                  onChange={updateHr("labourCost")}
                  unit="£/hr"
                  tooltip="Operator cost per hour (including yourself)"
                  min={0}
                />
              </>
            )}
          </div>
        </CollapsibleSection>
      </div>

      {/* Overheads */}
      <div className="rounded-lg bg-card p-4 shadow-sm">
        <CollapsibleSection
          title="Overheads (most farmers leave these as-is)"
          subtitle="Adjust these to see how they affect your costs"
          defaultOpen={false}
        >
          <div className="space-y-1 mt-2">
            <InputField
              label="Money tied up"
              value={inputs.interestRate}
              onChange={update("interestRate")}
              unit="%"
              tooltip="If you didn't buy this machine, you could invest that money elsewhere. 2–4% is typical for savings, 6–8% for a loan."
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
              label="Shed costs (% of price)"
              value={inputs.storageRate}
              onChange={update("storageRate")}
              unit="%"
              tooltip="The cost of keeping it under cover — usually about 1% of what you paid"
              min={0}
            />
          </div>
        </CollapsibleSection>
      </div>

      {/* Contractor Comparison */}
      <div className="rounded-lg bg-card p-4 shadow-sm">
        <CollapsibleSection
          title="Compare with a contractor"
          subtitle={mode === "hectare" ? "What a contractor would charge for the same job" : "Compare owning vs hiring a contractor"}
          defaultOpen={true}
        >
          <div className="space-y-1 mt-2">
            {mode === "hectare" ? (
              <>
                <InputField
                  label="Contractor quote"
                  value={hectareInputs.contractorCharge}
                  onChange={updateHa("contractorCharge")}
                  metricUnit="£/ha"
                  tooltip="What a local contractor would charge you per hectare for the same job"
                  min={0}
                  sourceBadge={fieldSources["contractorCharge"]}
                />
                <ContractorRatesPanel
                  onApply={applyHaFromSource("contractorCharge", "NAAC rate")}
                  currentRate={hectareInputs.contractorCharge}
                  unitFilter="ha"
                />
              </>
            ) : (
              <>
                <InputField
                  label="Contractor quote"
                  value={hourInputs.contractorCharge}
                  onChange={updateHr("contractorCharge")}
                  unit="£/hr"
                  tooltip="What a contractor would charge you per hour for the same job"
                  min={0}
                  sourceBadge={fieldSources["contractorCharge"]}
                />
                <ContractorRatesPanel
                  onApply={applyHrFromSource("contractorCharge", "NAAC rate")}
                  currentRate={hourInputs.contractorCharge}
                  unitFilter="hr"
                  defaultCategory="Tractor Hire"
                />
              </>
            )}
          </div>
        </CollapsibleSection>
      </div>

      {/* Results */}
      <div className="rounded-lg bg-muted/50 p-6 space-y-4">
        <h2 className="text-sm font-semibold">Your answer</h2>

        {hasZeroWarning ? (
          <div className="rounded-lg border border-farm-amber/50 bg-farm-amber/10 px-4 py-3 text-sm text-muted-foreground">
            Enter a value for {zeroWarnings.join(" and ")} to see results.
          </div>
        ) : (
          <>
            <ResultBanner type={bannerType} mainText={bannerText} subText={bannerSub} />

            <CostBreakdown
              rows={[
                { label: "Your cost", value: totalCostPerUnit, unit: mode === "hectare" ? "ha" : "hr", bold: true },
                { label: "Fixed costs", value: fixedCostPerUnit, unit: mode === "hectare" ? "ha" : "hr" },
                { label: "Running costs", value: runningCostPerUnit, unit: mode === "hectare" ? "ha" : "hr" },
              ]}
            />

            <CostComparisonBar
              ownCost={totalCostPerUnit}
              contractorCost={contractorCharge}
              unit={unitLabel}
            />

            <div className="space-y-0.5 rounded-lg bg-farm-green/10 px-4 py-3">
              <span className="text-sm text-muted-foreground">Total annual cost</span>
              <div className="text-4xl font-bold tabular-nums text-farm-green">
                {formatGBP(totalAnnualCost)}<span className="text-lg font-semibold text-muted-foreground">/year</span>
              </div>
            </div>

            <CostDonutChart
              segments={[
                { label: "Depreciation", value: annualDepreciation, color: "#2e7d32" },
                { label: "Interest", value: annualInterest, color: "#66bb6a" },
                { label: "Insurance", value: annualInsurance, color: "#a5d6a7" },
                { label: "Shed costs", value: annualStorage, color: "#c8e6c9" },
                { label: "Fuel", value: fuelAnnual, color: "#f9a825" },
                { label: "Labour", value: labourAnnual, color: "#ffcc80" },
                { label: "Repairs", value: repairsAnnual, color: "#ef6c00" },
              ]}
              centerLabel="Total/year"
              centerValue={totalAnnualCost}
            />
          </>
        )}
      </div>

      <ConnectedTabsFooter tabs={["profitability"]} />
    </div>
  )
}

function ModeToggle({
  mode,
  onModeChange,
  areaUnit,
}: {
  mode: CostMode
  onModeChange: (mode: CostMode) => void
  areaUnit: string
}) {
  return (
    <div
      className="inline-flex items-center rounded-full border border-border bg-muted/60 p-0.5 text-xs"
      role="radiogroup"
      aria-label="Cost calculation mode"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === "hectare"}
        onClick={() => onModeChange("hectare")}
        className={`rounded-full px-2.5 py-1 font-medium transition-all duration-150 cursor-pointer ${
          mode === "hectare"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Per {areaUnit === "acres" ? "acre" : areaUnit}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === "hour"}
        onClick={() => onModeChange("hour")}
        className={`rounded-full px-2.5 py-1 font-medium transition-all duration-150 cursor-pointer ${
          mode === "hour"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Per hour
      </button>
    </div>
  )
}
