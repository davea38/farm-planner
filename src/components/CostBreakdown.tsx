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

        return (
          <div
            key={row.label}
            className={`flex items-baseline justify-between gap-2 sm:gap-4 ${
              row.bold ? "font-semibold text-base" : "text-sm text-muted-foreground pl-4"
            }`}
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
