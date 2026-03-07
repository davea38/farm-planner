import { FUEL_PRICES } from "@/lib/fuel-data"
import { CollapsibleSection } from "./CollapsibleSection"
import { Sparkline } from "./Sparkline"

interface FuelPricePanelProps {
  onApply: (priceInPounds: number) => void
}

export function FuelPricePanel({ onApply }: FuelPricePanelProps) {
  const { redDiesel, pumpDiesel, historical } = FUEL_PRICES

  // Year-on-year percentage change
  const prevYear = historical[historical.length - 2]
  const redChange = ((redDiesel.current - prevYear.redDiesel) / prevYear.redDiesel) * 100
  const pumpChange = ((pumpDiesel.current - prevYear.pumpDiesel) / prevYear.pumpDiesel) * 100

  const sparklineData = historical.map((h) => ({
    label: String(h.year),
    value: h.redDiesel,
  }))

  const redDieselPounds = +(redDiesel.current / 100).toFixed(4)

  return (
    <div className="rounded-lg border border-border bg-muted/30">
      <CollapsibleSection
        title={`AHDB Fuel Prices (${FUEL_PRICES.updated})`}
        defaultOpen={false}
      >
        <div className="space-y-4 pt-2">
          {/* Price cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-card p-3 text-center shadow-sm border border-green-200 dark:border-green-900">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Red Diesel
              </div>
              <div className="text-lg font-bold mt-1">{redDiesel.current}p/L</div>
              <div className={`text-xs mt-0.5 ${redChange <= 0 ? "text-green-600" : "text-red-600"}`}>
                {redChange <= 0 ? "▼" : "▲"} {Math.abs(redChange).toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg bg-card p-3 text-center shadow-sm">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Pump Diesel
              </div>
              <div className="text-lg font-bold mt-1">{pumpDiesel.current}p/L</div>
              <div className={`text-xs mt-0.5 ${pumpChange <= 0 ? "text-green-600" : "text-red-600"}`}>
                {pumpChange <= 0 ? "▼" : "▲"} {Math.abs(pumpChange).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Sparkline */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">
              5-Year Trend (Red Diesel)
            </div>
            <Sparkline data={sparklineData} />
          </div>

          {/* Apply button */}
          <button
            type="button"
            onClick={() => onApply(redDieselPounds)}
            className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors cursor-pointer"
          >
            Use red diesel price ({redDiesel.current}p)
          </button>

          {/* Source footer */}
          <div className="text-xs text-muted-foreground text-center">
            Source: AHDB &bull; Data: {FUEL_PRICES.updated}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  )
}
