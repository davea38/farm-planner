import { useState, useMemo, useEffect, useRef } from "react"
import type { CostPerHectareInputs, SavedMachine } from "@/lib/types"
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
import { SaveLoadToolbar } from "./SaveLoadToolbar"

export function CostPerHectare({
  initialInputs,
  onChange,
  savedMachines = [],
  onSaveMachine,
  onLoadMachine,
  onDeleteMachine,
}: {
  initialInputs?: CostPerHectareInputs
  onChange?: (inputs: CostPerHectareInputs) => void
  savedMachines?: SavedMachine<CostPerHectareInputs>[]
  onSaveMachine?: (name: string, inputs: CostPerHectareInputs) => void
  onLoadMachine?: (index: number) => void
  onDeleteMachine?: (index: number) => void
}) {
  const [inputs, setInputs] = useState<CostPerHectareInputs>(initialInputs ?? defaultCostPerHectare)

  const update = (field: keyof CostPerHectareInputs) => (value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }))
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

  const handleLoad = (index: number) => {
    const machine = savedMachines[index]
    if (machine) {
      setInputs(machine.inputs)
    }
    onLoadMachine?.(index)
  }

  return (
    <div className="space-y-6">
      {/* Save / Load Toolbar */}
      <SaveLoadToolbar
        savedMachines={savedMachines}
        onSave={(name) => onSaveMachine?.(name, inputs)}
        onLoad={handleLoad}
        onDelete={(index) => onDeleteMachine?.(index)}
      />

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
          label="Work rate"
          value={inputs.workRate}
          onChange={update("workRate")}
          metricUnit="ha/hr"
          tooltip="How many hectares per hour this machine covers"
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
        />
        <FuelPricePanel onApply={update("fuelPrice")} />
        <InputField
          label="Fuel use"
          value={inputs.fuelUse}
          onChange={update("fuelUse")}
          metricUnit="L/ha"
          tooltip="Litres of fuel burned per hectare"
          min={0}
        />
        <FuelConsumptionPanel
          onApply={update("fuelUse")}
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
        />
        <div className="flex justify-end">
          <RepairEstimator onApply={update("repairsPct")} />
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
              label="Interest rate"
              value={inputs.interestRate}
              onChange={update("interestRate")}
              unit="%"
              tooltip="The rate you'd earn if the money was in the bank (or your loan rate)"
              min={0}
            />
            <InputField
              label="Insurance"
              value={inputs.insuranceRate}
              onChange={update("insuranceRate")}
              unit="%"
              tooltip="Annual insurance as a percentage of what you paid"
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
        />
        <ContractorRatesPanel
          onApply={update("contractorCharge")}
          currentRate={inputs.contractorCharge}
          unitFilter="ha"
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

            <CostBreakdown
              rows={[
                { label: "Contractor cost", value: inputs.contractorCharge, unit: "ha", bold: true },
              ]}
            />

            <ResultBanner type={bannerType} mainText={bannerText} subText={bannerSub} />
          </>
        )}
      </div>
    </div>
  )
}
