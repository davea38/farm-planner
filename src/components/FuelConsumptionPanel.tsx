import { useState } from "react"
import {
  estimateFuelConsumption,
  HP_REFERENCE_POINTS,
} from "@/lib/fuel-consumption-data"
import { useUnits } from "@/lib/UnitContext"
import { toDisplay, displayUnit } from "@/lib/units"
import { CollapsibleSection } from "./CollapsibleSection"

interface FuelConsumptionPanelProps {
  onApply: (value: number) => void
  mode: "perHour" | "perHectare"
  workRate?: number
}

const MIN_HP = 75
const MAX_HP = 1000
const MAX_CONSUMPTION = estimateFuelConsumption(MAX_HP) // ~97.6

export function FuelConsumptionPanel({
  onApply,
  mode,
  workRate,
}: FuelConsumptionPanelProps) {
  const [hp, setHp] = useState(150)
  const { units } = useUnits()

  const lPerHr = estimateFuelConsumption(hp)
  const lPerHa =
    mode === "perHectare" && workRate && workRate > 0
      ? lPerHr / workRate
      : null
  const gaugePct = (lPerHr / MAX_CONSUMPTION) * 100
  const applyValue = lPerHa !== null ? lPerHa : lPerHr

  const areaRateUnit = displayUnit("L/ha", units)
  const workRateDisplayUnit = displayUnit("ha/hr", units)
  const displayLPerHa = lPerHa !== null ? toDisplay(lPerHa, "L/ha", units) : null
  const displayWorkRate = workRate ? toDisplay(workRate, "ha/hr", units) : undefined

  const displayValue =
    displayLPerHa !== null
      ? `${displayLPerHa.toFixed(1)} ${areaRateUnit}`
      : `${lPerHr.toFixed(1)} L/hr`

  return (
    <div className="rounded-lg border border-border bg-muted/30">
      <CollapsibleSection
        title="Estimate Fuel Consumption"
        defaultOpen={false}
      >
        <div className="space-y-4 pt-2">
          {/* HP slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">
                Tractor HP:
              </label>
              <span className="text-sm font-semibold">{hp}</span>
            </div>
            <input
              type="range"
              min={MIN_HP}
              max={MAX_HP}
              value={hp}
              onChange={(e) => setHp(Number(e.target.value))}
              className="w-full accent-green-600"
              aria-label="Tractor horsepower"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{MIN_HP}</span>
              <span>{MAX_HP}</span>
            </div>
          </div>

          {/* Estimated result with gauge */}
          <div className="rounded-lg bg-card p-3 shadow-sm border border-border">
            <div className="text-sm font-medium text-muted-foreground">
              Estimated:
            </div>
            <div className="text-lg font-bold mt-1">
              {lPerHr.toFixed(1)} L/hr
            </div>
            {displayLPerHa !== null && displayWorkRate !== undefined && (
              <div className="text-sm text-muted-foreground mt-0.5">
                At {displayWorkRate.toFixed(1)} {workRateDisplayUnit}, that is {displayLPerHa.toFixed(1)} {areaRateUnit}
              </div>
            )}
            <div className="mt-2 h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-green-600 transition-all duration-200"
                style={{ width: `${Math.min(gaugePct, 100)}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 text-right">
              {Math.round(gaugePct)}% of max
            </div>
          </div>

          {/* Reference table */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Quick Reference:
            </div>
            <div className="grid grid-cols-6 gap-1 text-center">
              {HP_REFERENCE_POINTS.map((ref) => {
                const refPct = (ref.lPerHr / MAX_CONSUMPTION) * 100
                return (
                  <div
                    key={ref.hp}
                    className="rounded bg-card p-1.5 shadow-sm border border-border"
                  >
                    <div className="text-xs font-semibold">{ref.hp}</div>
                    <div className="text-[10px] text-muted-foreground">HP</div>
                    <div className="mt-1 h-8 flex items-end justify-center">
                      <div
                        className="w-3 rounded-t bg-green-600"
                        style={{
                          height: `${Math.max(refPct, 10)}%`,
                          opacity: 0.4 + refPct * 0.006,
                        }}
                      />
                    </div>
                    <div className="text-[10px] font-medium mt-0.5">
                      {ref.lPerHr}
                    </div>
                    <div className="text-[9px] text-muted-foreground">L/hr</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Apply button */}
          <button
            type="button"
            onClick={() => onApply(Number(applyValue.toFixed(1)))}
            className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors cursor-pointer"
            aria-label={`Use fuel consumption estimate ${displayValue}`}
          >
            Use this estimate ({displayValue})
          </button>

          {/* Source footer */}
          <div className="text-xs text-muted-foreground text-center">
            Source: Rule of thumb &mdash; 0.244 &times; HP = L/hr
          </div>
        </div>
      </CollapsibleSection>
    </div>
  )
}
