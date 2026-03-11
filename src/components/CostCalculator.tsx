import { useState, useMemo, useEffect, useRef } from "react"
import type { CostPerHectareInputs, CostPerHourInputs } from "@/lib/types"
import { defaultCostPerHectare, defaultCostPerHour } from "@/lib/defaults"
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
import { CostComparisonBar } from "./CostComparisonBar"

export type CostMode = "hectare" | "hour"

export function CostCalculator({
  mode,
  onModeChange,
  initialHectareInputs,
  initialHourInputs,
  onHectareChange,
  onHourChange,
}: {
  mode: CostMode
  onModeChange: (mode: CostMode) => void
  initialHectareInputs?: CostPerHectareInputs
  initialHourInputs?: CostPerHourInputs
  onHectareChange?: (inputs: CostPerHectareInputs) => void
  onHourChange?: (inputs: CostPerHourInputs) => void
}) {
  const [haInputs, setHaInputs] = useState<CostPerHectareInputs>(initialHectareInputs ?? defaultCostPerHectare)
  const [hrInputs, setHrInputs] = useState<CostPerHourInputs>(initialHourInputs ?? defaultCostPerHour)
  const [fieldSources, setFieldSources] = useState<Record<string, string>>({})

  const { units } = useUnits()

  // Hectare update helpers
  const updateHa = (field: keyof CostPerHectareInputs) => (value: number) => {
    setHaInputs((prev) => ({ ...prev, [field]: value }))
    setFieldSources((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const applyHaFromSource = (field: keyof CostPerHectareInputs, source: string) => (value: number) => {
    setHaInputs((prev) => ({ ...prev, [field]: value }))
    setFieldSources((prev) => ({ ...prev, [field]: source }))
  }

  // Hour update helpers
  const updateHr = (field: keyof CostPerHourInputs) => (value: number) => {
    setHrInputs((prev) => ({ ...prev, [field]: value }))
    setFieldSources((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const applyHrFromSource = (field: keyof CostPerHourInputs, source: string) => (value: number) => {
    setHrInputs((prev) => ({ ...prev, [field]: value }))
    setFieldSources((prev) => ({ ...prev, [field]: source }))
  }

  // Propagate changes to parent
  const isFirstRenderHa = useRef(true)
  useEffect(() => {
    if (isFirstRenderHa.current) {
      isFirstRenderHa.current = false
      return
    }
    onHectareChange?.(haInputs)
  }, [haInputs, onHectareChange])

  const isFirstRenderHr = useRef(true)
  useEffect(() => {
    if (isFirstRenderHr.current) {
      isFirstRenderHr.current = false
      return
    }
    onHourChange?.(hrInputs)
  }, [hrInputs, onHourChange])

  // Current mode inputs/results
  const inputs = mode === "hectare" ? haInputs : hrInputs
  const haResults = useMemo(() => calcCostPerHectare(haInputs), [haInputs])
  const hrResults = useMemo(() => calcCostPerHour(hrInputs), [hrInputs])

  // Shared update helpers that delegate to the right mode
  const update = mode === "hectare"
    ? (field: string) => updateHa(field as keyof CostPerHectareInputs)
    : (field: string) => updateHr(field as keyof CostPerHourInputs)

  const applyFromSource = mode === "hectare"
    ? (field: string, source: string) => applyHaFromSource(field as keyof CostPerHectareInputs, source)
    : (field: string, source: string) => applyHrFromSource(field as keyof CostPerHourInputs, source)

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
    contractorTotalCost = haInputs.contractorCharge * haInputs.hectaresPerYear
    fuelAnnual = r.fuelPerHa * haInputs.hectaresPerYear
    labourAnnual = r.labourPerHa * haInputs.hectaresPerYear
    repairsAnnual = r.repairsPerHa * haInputs.hectaresPerYear
    totalAnnualCost = r.totalAnnualCost
    annualSaving = r.annualSaving
    contractorCharge = haInputs.contractorCharge
    unitLabel = areaUnit
    perUnitDiff = toDisplay(Math.abs(r.totalCostPerHa - haInputs.contractorCharge), "£/ha", units)
    annualDepreciation = r.annualDepreciation
    annualInterest = r.annualInterest
    annualInsurance = r.annualInsurance
    annualStorage = r.annualStorage
  } else {
    const r = hrResults
    totalCostPerUnit = r.totalCostPerHr
    fixedCostPerUnit = r.fixedCostPerHr
    runningCostPerUnit = r.labourPerHr + r.fuelPerHr + r.repairsPerHr
    contractorTotalCost = hrInputs.contractorCharge * hrInputs.hoursPerYear
    fuelAnnual = r.fuelPerHr * hrInputs.hoursPerYear
    labourAnnual = r.labourPerHr * hrInputs.hoursPerYear
    repairsAnnual = r.repairsPerHr * hrInputs.hoursPerYear
    totalAnnualCost = r.totalAnnualCost
    annualSaving = r.annualSaving
    contractorCharge = hrInputs.contractorCharge
    unitLabel = "hr"
    perUnitDiff = Math.abs(r.totalCostPerHr - hrInputs.contractorCharge)
    annualDepreciation = r.annualDepreciation
    annualInterest = r.annualInterest
    annualInsurance = r.annualInsurance
    annualStorage = r.annualStorage
  }

  // Zero warnings
  const zeroWarnings: string[] = []
  if (mode === "hectare") {
    if (haInputs.hectaresPerYear <= 0) zeroWarnings.push(units.area === "acres" ? "acres worked per year" : "hectares worked per year")
    if (haInputs.workRate <= 0) zeroWarnings.push("work rate")
    if (haInputs.yearsOwned <= 0) zeroWarnings.push("years owned")
  } else {
    if (hrInputs.hoursPerYear <= 0) zeroWarnings.push("hours worked per year")
    if (hrInputs.yearsOwned <= 0) zeroWarnings.push("years owned")
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
                value={haInputs.hectaresPerYear}
                onChange={updateHa("hectaresPerYear")}
                metricUnit="ha"
                tooltip="Total hectares this machine covers in a year"
                min={0}
              />
            ) : (
              <InputField
                label="Hours worked/year"
                value={hrInputs.hoursPerYear}
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
          title="Running Costs"
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
                  label="Coverage speed"
                  value={haInputs.workRate}
                  onChange={updateHa("workRate")}
                  metricUnit="ha/hr"
                  tooltip="How many hectares (or acres) this machine covers per hour of field work"
                  min={0}
                />
                <InputField
                  label="Labour cost"
                  value={haInputs.labourCost}
                  onChange={updateHa("labourCost")}
                  unit="£/hr"
                  tooltip="What you pay the operator per hour (including yourself)"
                  min={0}
                />
                <InputField
                  label="Fuel price"
                  value={haInputs.fuelPrice}
                  onChange={updateHa("fuelPrice")}
                  unit="p/litre"
                  tooltip="Current red diesel price in pence per litre"
                  min={0}
                  sourceBadge={fieldSources["fuelPrice"]}
                />
                <FuelPricePanel onApply={applyHaFromSource("fuelPrice", "AHDB fuel price")} />
                <InputField
                  label="Fuel use"
                  value={haInputs.fuelUse}
                  onChange={updateHa("fuelUse")}
                  metricUnit="L/ha"
                  tooltip="Litres of fuel burned per hectare"
                  min={0}
                  sourceBadge={fieldSources["fuelUse"]}
                />
                <FuelConsumptionPanel
                  onApply={applyHaFromSource("fuelUse", "Fuel estimate")}
                  mode="perHectare"
                  workRate={haInputs.workRate}
                />
                <InputField
                  label="Spares & repairs"
                  value={haInputs.repairsPct}
                  onChange={updateHa("repairsPct")}
                  unit="%"
                  tooltip="Annual repair bill as a percentage of what you paid"
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
                  value={hrInputs.fuelConsumptionPerHr}
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
                  value={hrInputs.fuelPrice}
                  onChange={updateHr("fuelPrice")}
                  unit="p/litre"
                  tooltip="Current red diesel price in pence per litre"
                  min={0}
                  sourceBadge={fieldSources["fuelPrice"]}
                />
                <FuelPricePanel onApply={applyHrFromSource("fuelPrice", "AHDB fuel price")} />
                <InputField
                  label="Spares & repairs"
                  value={hrInputs.repairsPct}
                  onChange={updateHr("repairsPct")}
                  unit="%"
                  tooltip="Annual repair bill as a percentage of what you paid"
                  min={0}
                  sourceBadge={fieldSources["repairsPct"]}
                />
                <div className="flex justify-end">
                  <RepairEstimator onApply={applyHrFromSource("repairsPct", "Repair estimate")} />
                </div>
                <InputField
                  label="Labour cost"
                  value={hrInputs.labourCost}
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
          title="Overheads"
          subtitle="Change interest rate and insurance rate to see how they affect your costs"
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
              label="Shed costs"
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
      <div className="rounded-lg bg-card p-4 shadow-sm">
        <CollapsibleSection
          title="Contractor Comparison"
          subtitle={mode === "hectare" ? "What a contractor would charge for the same job" : "Compare owning vs hiring a contractor"}
          defaultOpen={true}
        >
          <div className="space-y-1 mt-2">
            {mode === "hectare" ? (
              <>
                <InputField
                  label="Contractor charges"
                  value={haInputs.contractorCharge}
                  onChange={updateHa("contractorCharge")}
                  metricUnit="£/ha"
                  tooltip="What a contractor would charge you per hectare for the same job"
                  min={0}
                  sourceBadge={fieldSources["contractorCharge"]}
                />
                <ContractorRatesPanel
                  onApply={applyHaFromSource("contractorCharge", "NAAC rate")}
                  currentRate={haInputs.contractorCharge}
                  unitFilter="ha"
                />
              </>
            ) : (
              <>
                <InputField
                  label="Contractor charges"
                  value={hrInputs.contractorCharge}
                  onChange={updateHr("contractorCharge")}
                  unit="£/hr"
                  tooltip="What a contractor would charge you per hour for the same job"
                  min={0}
                  sourceBadge={fieldSources["contractorCharge"]}
                />
                <ContractorRatesPanel
                  onApply={applyHrFromSource("contractorCharge", "NAAC rate")}
                  currentRate={hrInputs.contractorCharge}
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
        <h2 className="text-sm font-semibold">Results</h2>

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
        Per {areaUnit}
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
