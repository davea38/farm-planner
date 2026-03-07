import { useState, useMemo, useEffect, useRef } from "react"
import type { ReplacementMachine, ReplacementPlannerState, MachineCategory } from "@/lib/types"
import { defaultReplacementPlanner, createDefaultReplacementMachines, MACHINE_CATEGORIES } from "@/lib/defaults"
import { calcReplacementSummary } from "@/lib/calculations"
import { formatGBP, formatPct } from "@/lib/format"
import { InputField } from "./InputField"
import { ResultBanner } from "./ResultBanner"
import { CollapsibleSection } from "./CollapsibleSection"
import { DepreciationPanel } from "./DepreciationPanel"

const CURRENT_YEAR = new Date().getFullYear()

function MachineRow({
  machine,
  onChange,
  onRemove,
}: {
  machine: ReplacementMachine
  onChange: (updated: ReplacementMachine) => void
  onRemove: () => void
}) {
  const update = (field: keyof ReplacementMachine) => (value: number | string | null) => {
    onChange({ ...machine, [field]: value })
  }

  const costToBudget = machine.priceToChange - machine.currentValue

  return (
    <div className="rounded-lg bg-card p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          value={machine.name}
          onChange={(e) => update("name")(e.target.value)}
          className="text-sm font-semibold bg-transparent border-b border-muted-foreground/30 focus:border-primary focus:outline-none min-h-[44px] flex-1 min-w-0"
          placeholder="Machine name"
        />
        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive text-xs min-h-[44px] px-2 shrink-0"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {/* Category */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-h-[44px]">
          <label className="flex-1 text-sm font-medium leading-tight whitespace-nowrap">Category</label>
          <select
            value={machine.category}
            onChange={(e) => update("category")(e.target.value as MachineCategory)}
            className="w-20 sm:w-28 text-sm rounded border border-input bg-transparent px-2 py-1 text-right"
          >
            {MACHINE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-h-[44px]">
          <span className="flex-1 text-sm font-medium leading-tight whitespace-nowrap">Condition</span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input
                type="radio"
                name={`condition-${machine.id}`}
                value="new"
                checked={machine.condition === "new"}
                onChange={() => update("condition")("new")}
                className="accent-primary"
              />
              New
            </label>
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input
                type="radio"
                name={`condition-${machine.id}`}
                value="used"
                checked={machine.condition === "used"}
                onChange={() => update("condition")("used")}
                className="accent-primary"
              />
              Used
            </label>
          </div>
        </div>

        {/* Year of manufacture */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-h-[44px]">
          <label className="flex-1 text-sm font-medium leading-tight whitespace-nowrap">Year of manufacture</label>
          <input
            type="number"
            value={machine.yearOfManufacture ?? ""}
            onChange={(e) => {
              const val = e.target.value
              update("yearOfManufacture")(val === "" ? null : Number(val))
            }}
            min={1900}
            max={new Date().getFullYear() + 2}
            className="w-20 sm:w-28 text-right tabular-nums text-sm rounded border border-input bg-transparent px-2 py-1"
            placeholder="Year"
          />
        </div>

        {/* Purchase date */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-h-[44px]">
          <label className="flex-1 text-sm font-medium leading-tight whitespace-nowrap">Purchase date</label>
          <input
            type="date"
            aria-label="Purchase date"
            value={machine.purchaseDate ?? ""}
            onChange={(e) => {
              const val = e.target.value
              update("purchaseDate")(val === "" ? null : val)
            }}
            className="w-20 sm:w-28 text-right text-sm rounded border border-input bg-transparent px-2 py-1"
          />
        </div>

        <InputField
          label="Use/year"
          value={machine.usePerYear}
          onChange={(v) => update("usePerYear")(v)}
          unit="hrs"
          tooltip="How much you use it each year"
          min={0}
        />
        <InputField
          label="Replace in"
          value={machine.timeToChange}
          onChange={(v) => update("timeToChange")(v)}
          unit="yrs"
          tooltip="How many years until you plan to replace it"
          min={0}
        />
        <InputField
          label="Current hours"
          value={machine.currentHours}
          onChange={(v) => update("currentHours")(v)}
          unit="hrs"
          tooltip="Hours on the clock right now"
          min={0}
        />
        <InputField
          label="Replacement price"
          value={machine.priceToChange}
          onChange={(v) => update("priceToChange")(v)}
          unit="£"
          tooltip="What the replacement machine will cost to buy (before deducting trade-in value)"
          min={0}
        />
        <InputField
          label="Current value"
          value={machine.currentValue}
          onChange={(v) => update("currentValue")(v)}
          unit="£"
          tooltip="What this one is worth today"
          min={0}
        />
        <div className="flex items-center justify-between min-h-[44px] px-1">
          <span className="text-sm text-muted-foreground">Cost to budget</span>
          <span className={`text-sm font-medium tabular-nums ${costToBudget > 0 ? "" : "text-muted-foreground"}`}>
            {formatGBP(costToBudget)}
          </span>
        </div>
      </div>
    </div>
  )
}

function TimelineChart({
  machines,
  annualCosts,
}: {
  machines: ReplacementMachine[]
  annualCosts: { year: number; cost: number }[]
}) {
  const activeMachines = machines.filter((m) => m.timeToChange > 0)

  if (annualCosts.length === 0 || activeMachines.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Set replacement years to see the timeline.
      </p>
    )
  }

  const years = annualCosts.map((ac) => ac.year)
  const maxCost = Math.max(1, ...annualCosts.map((ac) => ac.cost))

  return (
    <div className="space-y-4 overflow-x-auto">
      {/* Year headers */}
      <div className="min-w-[320px]">
        <div className="grid gap-0" style={{ gridTemplateColumns: `80px repeat(${years.length}, 1fr)` }}>
          <div />
          {years.map((year) => (
            <div key={year} className="text-xs text-center text-muted-foreground font-medium">
              {year}
            </div>
          ))}
        </div>

        {/* Machine rows - Gantt bars */}
        {activeMachines.map((machine) => {
          const replacementYear = CURRENT_YEAR + machine.timeToChange
          return (
            <div
              key={machine.id}
              className="grid gap-0 items-center border-b border-muted/50"
              style={{ gridTemplateColumns: `80px repeat(${years.length}, 1fr)` }}
            >
              <div className="text-xs truncate pr-2 py-1">{machine.name}</div>
              {years.map((year) => (
                <div key={year} className="flex items-center justify-center py-1 px-0.5">
                  {year === replacementYear ? (
                    <div
                      className="h-6 w-full rounded bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-medium"
                      title={`${machine.name}: ${formatGBP(machine.priceToChange - machine.currentValue)}`}
                    >
                      {formatGBP(machine.priceToChange - machine.currentValue)}
                    </div>
                  ) : (
                    <div className="h-6 w-full" />
                  )}
                </div>
              ))}
            </div>
          )
        })}

        {/* Annual cost bar chart */}
        <div
          className="grid gap-0 items-end pt-2 border-t border-muted"
          style={{ gridTemplateColumns: `80px repeat(${years.length}, 1fr)` }}
        >
          <div className="text-xs font-medium pr-2">Annual cost</div>
          {annualCosts.map(({ year, cost }) => (
            <div key={year} className="flex flex-col items-center px-0.5">
              <div className="w-full flex flex-col items-center" style={{ height: "60px" }}>
                <div
                  className={`w-full rounded-t ${cost > 0 ? "bg-primary/70" : ""}`}
                  style={{
                    height: `${Math.max(cost > 0 ? 4 : 0, (cost / maxCost) * 56)}px`,
                    marginTop: "auto",
                  }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground text-center mt-0.5">
                {cost > 0 ? formatGBP(cost) : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ReplacementPlanner({
  initialState,
  onChange,
}: {
  initialState?: ReplacementPlannerState
  onChange?: (state: ReplacementPlannerState) => void
}) {
  const [state, setState] = useState<ReplacementPlannerState>(() =>
    initialState ?? {
      ...defaultReplacementPlanner,
      machines: createDefaultReplacementMachines(),
    }
  )

  const updateMachine = (id: string, updated: ReplacementMachine) => {
    setState((prev) => ({
      ...prev,
      machines: prev.machines.map((m) => (m.id === id ? updated : m)),
    }))
  }

  const removeMachine = (id: string) => {
    setState((prev) => ({
      ...prev,
      machines: prev.machines.filter((m) => m.id !== id),
    }))
  }

  const addMachine = () => {
    const newMachine: ReplacementMachine = {
      id: crypto.randomUUID(),
      name: "New machine",
      category: "other",
      condition: "used",
      yearOfManufacture: null,
      purchaseDate: null,
      usePerYear: 0,
      timeToChange: 0,
      currentHours: 0,
      priceToChange: 0,
      currentValue: 0,
    }
    setState((prev) => ({
      ...prev,
      machines: [...prev.machines, newMachine],
    }))
  }

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    onChange?.(state)
  }, [state, onChange])

  const summary = useMemo(
    () => calcReplacementSummary(state.machines, state.farmIncome, CURRENT_YEAR, 6),
    [state],
  )

  // Traffic-light: green <20%, amber 20-35%, red >35%
  const hasZeroIncome = state.farmIncome <= 0
  let bannerType: "green" | "amber" | "red"
  let bannerText: string
  let bannerSub: string | undefined

  if (hasZeroIncome) {
    bannerType = "amber"
    bannerText = "Enter farm income to see cost as % of income"
    bannerSub = undefined
  } else if (summary.pctOfIncome < 20) {
    bannerType = "green"
    bannerText = `${formatPct(summary.pctOfIncome)} of income — comfortable`
    bannerSub = "Machinery costs are well within a healthy range"
  } else if (summary.pctOfIncome <= 35) {
    bannerType = "amber"
    bannerText = `${formatPct(summary.pctOfIncome)} of income — keep an eye on it`
    bannerSub = "Consider spreading replacements to avoid lumpy years"
  } else {
    bannerType = "red"
    bannerText = `${formatPct(summary.pctOfIncome)} of income — machinery is eating your profits`
    bannerSub = "Look at extending machine life or buying used"
  }

  return (
    <div className="space-y-6">
      {/* Machine list */}
      <div className="space-y-3">
        {state.machines.map((machine) => (
          <MachineRow
            key={machine.id}
            machine={machine}
            onChange={(updated) => updateMachine(machine.id, updated)}
            onRemove={() => removeMachine(machine.id)}
          />
        ))}
      </div>

      <button
        onClick={addMachine}
        className="w-full rounded-lg border-2 border-dashed border-muted-foreground/30 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary min-h-[44px]"
      >
        + Add Machine
      </button>

      {/* Timeline */}
      <div className="rounded-lg bg-muted/50 p-4 space-y-4">
        <h2 className="text-sm font-semibold">Timeline</h2>
        <TimelineChart machines={state.machines} annualCosts={summary.annualCosts} />
      </div>

      {/* Budget Summary */}
      <div className="rounded-lg bg-muted/50 p-4 space-y-4">
        <h2 className="text-sm font-semibold">Budget Summary</h2>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total replacement spend</span>
            <span className="font-medium tabular-nums">{formatGBP(summary.totalSpend)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Average annual cost</span>
            <span className="font-medium tabular-nums">{formatGBP(summary.averageAnnualCost)}</span>
          </div>
        </div>

        <div className="rounded-lg bg-card p-4 shadow-sm">
          <InputField
            label="5-yr avg. farm income"
            value={state.farmIncome}
            onChange={(v) => setState((prev) => ({ ...prev, farmIncome: v }))}
            unit="£"
            tooltip="Your average annual farm income over the last 5 years"
            min={0}
          />
          <div className="flex justify-between text-sm mt-2">
            <span>Machinery cost as % of income</span>
            <span className="font-medium tabular-nums">{formatPct(summary.pctOfIncome)}</span>
          </div>
        </div>

        <ResultBanner type={bannerType} mainText={bannerText} subText={bannerSub} />
      </div>

      {/* Depreciation Curve — standalone reference helper */}
      <div className="rounded-lg bg-card p-4 shadow-sm">
        <CollapsibleSection title="Depreciation Curve" defaultOpen={false}>
          <DepreciationPanel />
        </CollapsibleSection>
      </div>
    </div>
  )
}
