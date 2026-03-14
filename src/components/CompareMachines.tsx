import { useState, useMemo, useEffect, useRef } from "react"
import type { WorkrateInputs, CompareUnitType } from "@/lib/types"
import { defaultMachineA, defaultMachineB } from "@/lib/defaults"
import { calcWorkrate } from "@/lib/calculations"
import { InputField } from "./InputField"
import { Input } from "@/components/ui/input"
import { formatNumber, formatPct } from "@/lib/format"
import { useUnits } from "@/lib/UnitContext"
import { toDisplay, displayUnit } from "@/lib/units"

function getZeroWorkrateFields(inputs: WorkrateInputs): string[] {
  const fields: string[] = []
  if (inputs.applicationRate <= 0) fields.push("application rate")
  if (inputs.width <= 0) fields.push("width")
  if (inputs.speed <= 0) fields.push("speed")
  if (inputs.fieldEfficiency <= 0) fields.push("time actually working")
  return fields
}

export function CompareMachines({
  initialMachineA,
  initialMachineB,
  onChange,
}: {
  initialMachineA?: WorkrateInputs
  initialMachineB?: WorkrateInputs
  onChange?: (machineA: WorkrateInputs, machineB: WorkrateInputs) => void
}) {
  const { units } = useUnits()
  const [machineA, setMachineA] = useState<WorkrateInputs>(initialMachineA ?? defaultMachineA)
  const [machineB, setMachineB] = useState<WorkrateInputs>(initialMachineB ?? defaultMachineB)

  const updateA = (field: keyof WorkrateInputs) => (value: number) => {
    setMachineA((prev) => ({ ...prev, [field]: value }))
  }
  const updateB = (field: keyof WorkrateInputs) => (value: number) => {
    setMachineB((prev) => ({ ...prev, [field]: value }))
  }

  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })
  const prevA = useRef(machineA)
  const prevB = useRef(machineB)
  useEffect(() => {
    if (prevA.current === machineA && prevB.current === machineB) return
    prevA.current = machineA
    prevB.current = machineB
    onChangeRef.current?.(machineA, machineB)
  }, [machineA, machineB])

  const resultsA = useMemo(() => calcWorkrate(machineA), [machineA])
  const resultsB = useMemo(() => calcWorkrate(machineB), [machineB])

  // Check for zero-value fields that produce meaningless results
  const zeroFieldsA = getZeroWorkrateFields(machineA)
  const zeroFieldsB = getZeroWorkrateFields(machineB)
  const hasZeroWarning = zeroFieldsA.length > 0 || zeroFieldsB.length > 0

  const speedRatio =
    resultsA.overallWorkRate > 0 && resultsB.overallWorkRate > 0
      ? resultsB.overallWorkRate / resultsA.overallWorkRate
      : 0

  const winner =
    resultsA.overallWorkRate > resultsB.overallWorkRate
      ? "A"
      : resultsB.overallWorkRate > resultsA.overallWorkRate
        ? "B"
        : null

  return (
    <div className="space-y-6">
      {/* Side-by-side inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MachineInputs
          title={machineA.name || "Machine A"}
          inputs={machineA}
          onUnitTypeChange={(unitType) => setMachineA((prev) => ({ ...prev, unitType }))}
          onNameChange={(name) => setMachineA((prev) => ({ ...prev, name }))}
          onUpdate={updateA}
        />
        <MachineInputs
          title={machineB.name || "Machine B"}
          inputs={machineB}
          onUnitTypeChange={(unitType) => setMachineB((prev) => ({ ...prev, unitType }))}
          onNameChange={(name) => setMachineB((prev) => ({ ...prev, name }))}
          onUpdate={updateB}
        />
      </div>

      {/* Results */}
      <div className="rounded-lg bg-muted/50 p-4 space-y-4">
        <h2 className="text-sm font-semibold">Your answer</h2>

        {hasZeroWarning && (
          <div className="rounded-lg border border-farm-amber/50 bg-farm-amber/10 px-4 py-3 text-sm text-muted-foreground space-y-1">
            {zeroFieldsA.length > 0 && (
              <p>Enter a value for {zeroFieldsA.join(" and ")} on {machineA.name || "Machine A"} to see results.</p>
            )}
            {zeroFieldsB.length > 0 && (
              <p>Enter a value for {zeroFieldsB.join(" and ")} on {machineB.name || "Machine B"} to see results.</p>
            )}
          </div>
        )}

        {!hasZeroWarning && <>
        {/* Side-by-side results table */}
        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 sm:gap-x-4 gap-y-1 text-sm">
          <div />
          <div className="font-semibold text-center">{machineA.name || "Machine A"}</div>
          <div className="font-semibold text-center">{machineB.name || "Machine B"}</div>

          <div className="text-muted-foreground">Spot rate</div>
          <div className="text-center tabular-nums">{formatNumber(toDisplay(resultsA.spotRate, "ha/hr", units), 1)} {displayUnit("ha/hr", units)}</div>
          <div className="text-center tabular-nums">{formatNumber(toDisplay(resultsB.spotRate, "ha/hr", units), 1)} {displayUnit("ha/hr", units)}</div>

          <div className="font-medium">TRUE rate</div>
          <div className={`text-center tabular-nums font-bold ${winner === "A" ? "text-primary" : ""}`}>
            {formatNumber(toDisplay(resultsA.overallWorkRate, "ha/hr", units), 2)} {displayUnit("ha/hr", units)}
          </div>
          <div className={`text-center tabular-nums font-bold ${winner === "B" ? "text-primary" : ""}`}>
            {formatNumber(toDisplay(resultsB.overallWorkRate, "ha/hr", units), 2)} {displayUnit("ha/hr", units)}
          </div>

          <div className="text-muted-foreground text-xs col-span-3">(includes filling & travel)</div>
        </div>

        {/* Time breakdown bars */}
        <div className="space-y-3 mt-4">
          <h3 className="text-sm font-semibold">Time breakdown per load</h3>
          <WorkrateBar
            label={machineA.name || "Machine A"}
            applicationPct={resultsA.applicationPct}
            fillingPct={resultsA.fillingPct}
            transportPct={resultsA.transportPct}
          />
          <WorkrateBar
            label={machineB.name || "Machine B"}
            applicationPct={resultsB.applicationPct}
            fillingPct={resultsB.fillingPct}
            transportPct={resultsB.transportPct}
          />
          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-primary" /> Working
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-[#1565C0]" /> Filling
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-farm-amber" /> Transport
            </span>
          </div>
        </div>

        {/* Speed comparison */}
        {winner && speedRatio > 0 && (
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <p className="text-lg sm:text-2xl font-bold text-primary">
              {winner === "B"
                ? `${machineB.name || "Machine B"} is ${formatNumber(speedRatio, 1)}x faster in practice`
                : `${machineA.name || "Machine A"} is ${formatNumber(1 / speedRatio, 1)}x faster in practice`}
            </p>
          </div>
        )}
        </>}
      </div>
    </div>
  )
}

function MachineInputs({
  title,
  inputs,
  onUnitTypeChange,
  onNameChange,
  onUpdate,
}: {
  title: string
  inputs: WorkrateInputs
  onUnitTypeChange: (type: CompareUnitType) => void
  onNameChange: (name: string) => void
  onUpdate: (field: keyof WorkrateInputs) => (value: number) => void
}) {
  const unitType = inputs.unitType ?? "spreader"
  const capacityUnit = unitType === "sprayer" ? "L" : "kg"
  const rateUnit = unitType === "sprayer" ? "L/ha" : "kg/ha"

  return (
    <div className="rounded-lg bg-card p-4 shadow-sm space-y-1">
      <h2 className="text-sm font-semibold mb-3">{title}</h2>

      {/* Name text input */}
      <div className="flex items-center gap-2 min-h-[44px]">
        <label className="flex-1 text-sm font-medium leading-tight">Name</label>
        <Input
          type="text"
          value={inputs.name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-20 sm:w-28 text-right"
          placeholder="Name"
        />
      </div>

      {/* Machine type selector */}
      <div className="flex items-center gap-2 min-h-[44px]">
        <label className="flex-1 text-sm font-medium leading-tight">Type</label>
        <select
          value={unitType}
          onChange={(e) => onUnitTypeChange(e.target.value as CompareUnitType)}
          className="w-20 sm:w-28 text-right text-sm rounded-md border border-input bg-background px-2 py-1"
        >
          <option value="spreader">Spreader</option>
          <option value="sprayer">Sprayer</option>
        </select>
      </div>

      <InputField
        label="Width"
        value={inputs.width}
        onChange={onUpdate("width")}
        unit="m"
        tooltip="Working width of the implement"
        min={0}
      />
      <InputField
        label="Tank / hopper"
        value={inputs.capacity}
        onChange={onUpdate("capacity")}
        unit={capacityUnit}
        tooltip={`How much the tank or hopper holds (in ${capacityUnit === "L" ? "litres" : "kilograms"})`}
        min={0}
      />
      <InputField
        label="Speed"
        value={inputs.speed}
        onChange={onUpdate("speed")}
        metricUnit="km/hr"
        tooltip="Speed when working in the field"
        min={0}
      />
      <InputField
        label="Application rate"
        value={inputs.applicationRate}
        onChange={onUpdate("applicationRate")}
        metricUnit={rateUnit}
        tooltip={`How much product per hectare (in ${capacityUnit === "L" ? "litres" : "kilograms"})`}
        min={0}
      />
      <InputField
        label="Travel time"
        value={inputs.transportTime}
        onChange={onUpdate("transportTime")}
        unit="min"
        tooltip="Time to drive from yard to field (one way)"
        min={0}
      />
      <InputField
        label="Fill time"
        value={inputs.fillingTime}
        onChange={onUpdate("fillingTime")}
        unit="min"
        tooltip="Time to refill the tank or hopper"
        min={0}
      />
      <InputField
        label="Time actually working"
        value={inputs.fieldEfficiency}
        onChange={onUpdate("fieldEfficiency")}
        unit="%"
        tooltip="What percentage of field time is actual work, not turning or overlapping. 65–80% is normal for most operations."
        min={0}
        max={100}
      />
    </div>
  )
}

function WorkrateBar({
  label,
  applicationPct,
  fillingPct,
  transportPct,
}: {
  label: string
  applicationPct: number
  fillingPct: number
  transportPct: number
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium">{label}</div>
      <div className="flex h-8 w-full rounded-md overflow-hidden">
        {applicationPct > 0 && (
          <div
            className="bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-medium overflow-hidden"
            style={{ width: `${applicationPct}%` }}
          >
            {applicationPct >= 15 && `${formatPct(applicationPct)}`}
          </div>
        )}
        {fillingPct > 0 && (
          <div
            className="bg-[#1565C0] flex items-center justify-center text-[10px] text-white font-medium overflow-hidden"
            style={{ width: `${fillingPct}%` }}
          >
            {fillingPct >= 15 && `${formatPct(fillingPct)}`}
          </div>
        )}
        {transportPct > 0 && (
          <div
            className="bg-farm-amber flex items-center justify-center text-[10px] text-foreground font-medium overflow-hidden"
            style={{ width: `${transportPct}%` }}
          >
            {transportPct >= 15 && `${formatPct(transportPct)}`}
          </div>
        )}
      </div>
    </div>
  )
}
