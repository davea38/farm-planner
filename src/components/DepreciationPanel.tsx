import { useState, useMemo } from "react"
import type { MachineCategory } from "@/lib/depreciation-data"
import {
  DEPRECIATION_PROFILES,
  DATA_SOURCE,
  getRemainingValuePct,
  getEstimatedValue,
  getDepreciationLoss,
  getAnnualDepreciation,
  findSweetSpot,
} from "@/lib/depreciation-data"
import { formatGBP } from "@/lib/format"
import { CollapsibleSection } from "./CollapsibleSection"
import { DepreciationCurve } from "./DepreciationCurve"

interface DepreciationPanelProps {
  onApplySalePrice: (value: number) => void
  purchasePrice?: number
  yearsOwned?: number
  onYearsChange?: (years: number) => void
}

const CATEGORIES = Object.entries(DEPRECIATION_PROFILES) as [MachineCategory, typeof DEPRECIATION_PROFILES[MachineCategory]][]

export function DepreciationPanel({
  onApplySalePrice,
  purchasePrice = 100000,
  yearsOwned = 5,
  onYearsChange,
}: DepreciationPanelProps) {
  const [category, setCategory] = useState<MachineCategory>("tractors_large")
  const [localYears, setLocalYears] = useState(yearsOwned)

  const years = onYearsChange ? yearsOwned : localYears

  const profile = DEPRECIATION_PROFILES[category]
  const sweetSpot = useMemo(() => findSweetSpot(category), [category])

  const pctRemaining = getRemainingValuePct(category, years)
  const pctLost = 100 - pctRemaining
  const estimatedValue = getEstimatedValue(category, purchasePrice, years)
  const valueLost = getDepreciationLoss(category, purchasePrice, years)
  const annualDepr = getAnnualDepreciation(category, purchasePrice, 0, years)

  const handleSliderChange = (value: number) => {
    if (onYearsChange) {
      onYearsChange(value)
    } else {
      setLocalYears(value)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30">
      <CollapsibleSection title="Depreciation Curve" defaultOpen={false}>
        <div className="space-y-4 pt-2">
          {/* Category dropdown */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Machine type:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MachineCategory)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm min-h-[44px]"
            >
              {CATEGORIES.map(([key, p]) => (
                <option key={key} value={key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* SVG Depreciation Curve */}
          <DepreciationCurve
            profile={profile}
            purchasePrice={purchasePrice}
            currentYear={years}
          />

          {/* Year slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">
                Age (years):
              </label>
              <span className="text-sm font-semibold">{years}</span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              value={years}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full accent-green-600"
              aria-label="Machine age in years"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>12</span>
            </div>
          </div>

          {/* Summary card */}
          <div className="rounded-lg bg-card p-3 shadow-sm border border-border space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              After {years} year{years !== 1 ? "s" : ""}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-muted-foreground">Estimated value</div>
                <div className="text-base font-bold">{formatGBP(estimatedValue)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Value lost</div>
                <div className="text-base font-bold">
                  {formatGBP(valueLost)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    ({pctLost}%)
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Avg depreciation</div>
              <div className="text-sm font-semibold">{formatGBP(annualDepr)} / year</div>
            </div>

            {/* Percentage bar */}
            <div className="mt-1">
              <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                <div
                  className="h-full bg-red-500/70 transition-all duration-200"
                  style={{ width: `${pctLost}%` }}
                />
                <div
                  className="h-full bg-green-500/40 transition-all duration-200"
                  style={{ width: `${pctRemaining}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>{pctLost}% lost</span>
                <span>{pctRemaining}% remaining</span>
              </div>
            </div>
          </div>

          {/* Sweet spot callout */}
          <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-2 text-xs">
            <span className="font-semibold text-green-700 dark:text-green-300">
              Sweet spot: Year {sweetSpot}
            </span>
            <span className="text-green-600 dark:text-green-400">
              {" "}— after this, annual depreciation slows below average. Consider keeping
              the machine longer past this point.
            </span>
          </div>

          {/* Apply button */}
          <button
            type="button"
            onClick={() => onApplySalePrice(Math.round(estimatedValue))}
            className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors cursor-pointer"
            aria-label={`Use ${formatGBP(Math.round(estimatedValue))} as sale price`}
          >
            Use {formatGBP(Math.round(estimatedValue))} as sale price
          </button>

          {/* Source footer */}
          <div className="text-xs text-muted-foreground text-center">
            Source: {DATA_SOURCE.name} &bull; {DATA_SOURCE.note}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  )
}
