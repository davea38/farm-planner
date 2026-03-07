import { useState, useMemo } from "react"
import { NAAC_RATES, NAAC_SOURCE, getRatesByUnit } from "@/lib/contractor-data"
import { useUnits } from "@/lib/UnitContext"
import { toDisplay, displayUnit } from "@/lib/units"
import { CollapsibleSection } from "./CollapsibleSection"

interface ContractorRatesPanelProps {
  onApply: (rate: number) => void
  currentRate?: number
  defaultCategory?: string
  unitFilter?: "ha" | "hr"
}

const CATEGORIES = [
  "Soil Prep",
  "Drilling",
  "Application",
  "Harvesting",
  "Baling",
  "Tractor Hire",
]

function rateTier(rate: number): "low" | "mid" | "high" {
  if (rate < 40) return "low"
  if (rate <= 100) return "mid"
  return "high"
}

const tierStyles = {
  low: "bg-green-50 dark:bg-green-950/30",
  mid: "bg-amber-50 dark:bg-amber-950/30",
  high: "bg-red-50 dark:bg-red-950/30",
}

function formatRateValue(displayRate: number, unitLabel: string): string {
  const prefix = "\u00a3"
  if (displayRate < 10) return `${prefix}${displayRate.toFixed(2)}${unitLabel}`
  return `${prefix}${Math.round(displayRate)}${unitLabel}`
}

export function ContractorRatesPanel({
  onApply,
  currentRate,
  defaultCategory,
  unitFilter,
}: ContractorRatesPanelProps) {
  const { units } = useUnits()

  const availableCategories = useMemo(() => {
    if (!unitFilter) return CATEGORIES
    const filtered = getRatesByUnit(unitFilter)
    const cats = new Set(filtered.map(r => r.category))
    return CATEGORIES.filter(c => cats.has(c))
  }, [unitFilter])

  const initialCategory = defaultCategory && availableCategories.includes(defaultCategory)
    ? defaultCategory
    : availableCategories[0]

  const [activeCategory, setActiveCategory] = useState(initialCategory)

  const visibleRates = useMemo(() => {
    let rates = NAAC_RATES.filter(r => r.category === activeCategory)
    if (unitFilter) {
      rates = rates.filter(r => r.unit === unitFilter)
    }
    return rates
  }, [activeCategory, unitFilter])

  // Convert rate for display based on unit preferences (£/ha → £/acre)
  const convertRate = (rate: number, rateUnit: string): number => {
    if (rateUnit === "ha") return toDisplay(rate, "£/ha", units)
    return rate
  }

  const getUnitLabel = (rateUnit: string): string => {
    if (rateUnit === "ha") return "/" + displayUnit("ha", units)
    if (rateUnit === "hr") return "/hr"
    return "/bale"
  }

  const rangeMin = visibleRates.length > 0 ? Math.min(...visibleRates.map(r => convertRate(r.rate, r.unit))) : 0
  const rangeMax = visibleRates.length > 0 ? Math.max(...visibleRates.map(r => convertRate(r.rate, r.unit))) : 100

  const displayCurrentRate = currentRate !== undefined && unitFilter === "ha"
    ? toDisplay(currentRate, "£/ha", units)
    : currentRate

  const rangeIndicatorPct = displayCurrentRate !== undefined && rangeMax > rangeMin
    ? Math.min(100, Math.max(0, ((displayCurrentRate - rangeMin) / (rangeMax - rangeMin)) * 100))
    : null

  return (
    <div className="rounded-lg border border-border bg-muted/30">
      <CollapsibleSection
        title={`NAAC Contractor Rates ${NAAC_SOURCE.year}`}
        defaultOpen={false}
      >
        <div className="space-y-4 pt-2">
          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5">
            {availableCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? "bg-green-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Rate table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Operation</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Rate</th>
                  <th className="px-3 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {visibleRates.map(r => {
                  const tier = rateTier(r.rate)
                  const displayRate = convertRate(r.rate, r.unit)
                  const unitLabel = getUnitLabel(r.unit)
                  return (
                    <tr
                      key={r.operation}
                      className={`border-b border-border last:border-0 ${tierStyles[tier]}`}
                      data-rate-tier={tier}
                    >
                      <td className="px-3 py-2">{r.operation}</td>
                      <td className="px-3 py-2 text-right font-medium whitespace-nowrap">
                        {formatRateValue(displayRate, unitLabel)}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => onApply(r.rate)}
                          className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 transition-colors cursor-pointer"
                          aria-label={`Use ${r.operation} rate`}
                        >
                          Use
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Range indicator */}
          {rangeIndicatorPct !== null && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Your current rate: {"\u00a3"}{displayCurrentRate !== undefined && displayCurrentRate < 10 ? displayCurrentRate.toFixed(2) : displayCurrentRate !== undefined ? Math.round(displayCurrentRate) : currentRate}/
                {unitFilter === "hr" ? "hr" : visibleRates[0]?.unit === "bale" ? "bale" : displayUnit("ha", units)}
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500"
                  style={{ width: "100%" }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-green-700"
                  style={{ left: `calc(${rangeIndicatorPct}% - 6px)` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{"\u00a3"}{rangeMin < 10 ? rangeMin.toFixed(2) : Math.round(rangeMin)}</span>
                <span>{"\u00a3"}{rangeMax < 10 ? rangeMax.toFixed(2) : Math.round(rangeMax)}</span>
              </div>
            </div>
          )}

          {/* Source footer */}
          <div className="text-xs text-muted-foreground text-center">
            Source: {NAAC_SOURCE.name} {NAAC_SOURCE.year} &bull; {NAAC_SOURCE.note}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  )
}
