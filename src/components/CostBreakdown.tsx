import { formatGBP } from "@/lib/format"

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
  return (
    <div className="space-y-1">
      {rows.map((row) => (
        <div
          key={row.label}
          className={`flex items-baseline justify-between gap-2 sm:gap-4 ${
            row.bold ? "font-semibold text-base" : "text-sm text-muted-foreground pl-4"
          }`}
        >
          <span>{row.label}</span>
          <span className="tabular-nums whitespace-nowrap">
            {formatGBP(row.value)}/{row.unit}
          </span>
        </div>
      ))}
    </div>
  )
}
