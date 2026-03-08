import { formatGBP } from "@/lib/format"
import { useUnits } from "@/lib/UnitContext"
import { toDisplay, displayUnit } from "@/lib/units"

interface CostRow {
  label: string
  value: number
  unit: string
  bold?: boolean
}

interface CostBreakdownProps {
  rows: CostRow[]
}

export function CostBreakdown({ rows }: CostBreakdownProps) {
  const { units } = useUnits()

  return (
    <div className="space-y-1">
      {rows.map((row) => {
        const metricUnit = `£/${row.unit}`
        const convertedValue = toDisplay(row.value, metricUnit, units)
        const convertedUnitLabel = displayUnit(metricUnit, units).replace("£/", "")

        return row.bold ? (
          <div key={row.label} className="space-y-0.5">
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <div className="text-4xl font-bold tabular-nums">
              {formatGBP(convertedValue)}<span className="text-lg font-semibold text-muted-foreground">/{convertedUnitLabel}</span>
            </div>
          </div>
        ) : (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-2 sm:gap-4 text-sm text-muted-foreground pl-4"
          >
            <span>{row.label}</span>
            <span className="tabular-nums whitespace-nowrap">
              {formatGBP(convertedValue)}/{convertedUnitLabel}
            </span>
          </div>
        )
      })}
    </div>
  )
}
