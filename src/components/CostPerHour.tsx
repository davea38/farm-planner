import { useState, useMemo, useEffect, useRef } from "react"
import type { CostPerHourInputs } from "@/lib/types"
import { defaultCostPerHour } from "@/lib/defaults"
import { calcCostPerHour } from "@/lib/calculations"
import { formatGBP } from "@/lib/format"
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

export function CostPerHour({
  initialInputs,
  onChange,
}: {
  initialInputs?: CostPerHourInputs
  onChange?: (inputs: CostPerHourInputs) => void
}) {
  const [inputs, setInputs] = useState<CostPerHourInputs>(initialInputs ?? defaultCostPerHour)
  const [fieldSources, setFieldSources] = useState<Record<string, string>>({})

  const update = (field: keyof CostPerHourInputs) => (value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }))
    setFieldSources((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const applyFromSource = (field: keyof CostPerHourInputs, source: string) => (value: number) => {
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

  const results = useMemo(() => calcCostPerHour(inputs), [inputs])

  const runningCostPerHr = results.labourPerHr + results.fuelPerHr + results.repairsPerHr
  const contractorTotalCost = inputs.contractorCharge * inputs.hoursPerYear

  // Check for zero-value fields that would produce meaningless results
  const zeroWarnings: string[] = []
  if (inputs.hoursPerYear <= 0) zeroWarnings.push("hours worked per year")
  if (inputs.yearsOwned <= 0) zeroWarnings.push("years owned")
  const hasZeroWarning = zeroWarnings.length > 0

  // Determine banner type: negative saving = owning cheaper (green), positive = contractor cheaper (red)
  // Within 10% of contractor total annual cost = amber
  const savingAbs = Math.abs(results.annualSaving)
  const threshold = contractorTotalCost * 0.1
  let bannerType: "green" | "amber" | "red"
  let bannerText: string
  let bannerSub: string | undefined

  const perHourDiff = Math.abs(results.totalCostPerHr - inputs.contractorCharge)

  if (savingAbs <= threshold) {
    bannerType = "amber"
    bannerText = "It's roughly break-even — consider convenience"
  } else if (results.annualSaving < 0) {
    bannerType = "green"
    bannerText = `You save ${formatGBP(savingAbs)}/year by owning this machine`
    bannerSub = `${formatGBP(perHourDiff)}/hr cheaper than a contractor`
  } else {
    bannerType = "red"
    bannerText = `You'd save ${formatGBP(savingAbs)}/year using a contractor`
    bannerSub = `Contractor is ${formatGBP(perHourDiff)}/hr cheaper`
  }

  return (
    <div className="space-y-6">

      {/* Results — shown first so the answer is visible without scrolling */}
      <div className="rounded-lg bg-muted/50 p-4 space-y-4">
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
                { label: "Your cost", value: results.totalCostPerHr, unit: "hr", bold: true },
                { label: "Fixed costs", value: results.fixedCostPerHr, unit: "hr" },
                { label: "Running costs", value: runningCostPerHr, unit: "hr" },
              ]}
            />

            <CostComparisonBar
              ownCost={results.totalCostPerHr}
              contractorCost={inputs.contractorCharge}
              unit="hr"
            />

            <div className="space-y-0.5">
              <span className="text-sm text-muted-foreground">Total annual cost</span>
              <div className="text-4xl font-bold tabular-nums">
                {formatGBP(results.totalAnnualCost)}<span className="text-lg font-semibold text-muted-foreground">/year</span>
              </div>
            </div>

            <CostDonutChart
              segments={[
                { label: "Depreciation", value: results.annualDepreciation, color: "#2e7d32" },
                { label: "Interest", value: results.annualInterest, color: "#66bb6a" },
                { label: "Insurance", value: results.annualInsurance, color: "#a5d6a7" },
                { label: "Storage", value: results.annualStorage, color: "#c8e6c9" },
                { label: "Fuel", value: results.fuelPerHr * inputs.hoursPerYear, color: "#f9a825" },
                { label: "Labour", value: results.labourPerHr * inputs.hoursPerYear, color: "#ffcc80" },
                { label: "Repairs", value: results.repairsPerHr * inputs.hoursPerYear, color: "#ef6c00" },
              ]}
              centerLabel="Total/year"
              centerValue={results.totalAnnualCost}
            />
          </>
        )}
      </div>

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
              label="Expected sale price"
              value={inputs.salePrice}
              onChange={update("salePrice")}
              unit="£"
              tooltip="What you expect to get when you sell it"
              min={0}
            />
            <InputField
              label="Hours worked/year"
              value={inputs.hoursPerYear}
              onChange={update("hoursPerYear")}
              unit="hrs"
              tooltip="Total hours this machine runs in a year"
              min={0}
            />
          </div>
        </CollapsibleSection>
      </div>

      {/* Running Costs */}
      <div className="rounded-lg bg-card p-4 shadow-sm">
        <CollapsibleSection
          title="Running Costs"
          subtitle="Fuel, repairs, and labour"
          defaultOpen={true}
        >
          <div className="space-y-1 mt-2">
            <InputField
              label="Fuel consumption"
              value={inputs.fuelConsumptionPerHr}
              onChange={update("fuelConsumptionPerHr")}
              unit="L/hr"
              tooltip="Litres of fuel burned per hour of work"
              min={0}
              sourceBadge={fieldSources["fuelConsumptionPerHr"]}
            />
            <FuelConsumptionPanel
              onApply={applyFromSource("fuelConsumptionPerHr", "Fuel estimate")}
              mode="perHour"
            />
            <InputField
              label="Fuel price"
              value={inputs.fuelPrice}
              onChange={update("fuelPrice")}
              unit="p/litre"
              tooltip="Current red diesel price in pence per litre"
              min={0}
              sourceBadge={fieldSources["fuelPrice"]}
            />
            <FuelPricePanel onApply={applyFromSource("fuelPrice", "AHDB fuel price")} />
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
            <InputField
              label="Labour cost"
              value={inputs.labourCost}
              onChange={update("labourCost")}
              unit="£/hr"
              tooltip="Operator cost per hour (including yourself)"
              min={0}
            />
          </div>
        </CollapsibleSection>
      </div>

      {/* Overheads (collapsed by default) */}
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
      <div className="rounded-lg bg-card p-4 shadow-sm">
        <CollapsibleSection
          title="Contractor Comparison"
          subtitle="Compare owning vs hiring a contractor"
          defaultOpen={true}
        >
          <div className="space-y-1 mt-2">
            <InputField
              label="Contractor charges"
              value={inputs.contractorCharge}
              onChange={update("contractorCharge")}
              unit="£/hr"
              tooltip="What a contractor would charge you per hour for the same job"
              min={0}
              sourceBadge={fieldSources["contractorCharge"]}
            />
            <ContractorRatesPanel
              onApply={applyFromSource("contractorCharge", "NAAC rate")}
              currentRate={inputs.contractorCharge}
              unitFilter="hr"
              defaultCategory="Tractor Hire"
            />
          </div>
        </CollapsibleSection>
      </div>

    </div>
  )
}
