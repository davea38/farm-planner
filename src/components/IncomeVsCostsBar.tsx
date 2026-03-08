import { formatGBP } from "@/lib/format"

interface BarSegment {
  label: string
  value: number
  color: string
}

interface IncomeVsCostsBarProps {
  incomeSegments: BarSegment[]
  costSegments: BarSegment[]
  netPosition: number
}

export function IncomeVsCostsBar({ incomeSegments, costSegments, netPosition }: IncomeVsCostsBarProps) {
  const totalIncome = incomeSegments.reduce((sum, s) => sum + s.value, 0)
  const totalCosts = costSegments.reduce((sum, s) => sum + s.value, 0)
  const maxTotal = Math.max(totalIncome, totalCosts, 1)

  if (totalIncome <= 0 && totalCosts <= 0) return null

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Income vs Costs
      </p>

      {/* Income bar */}
      <div className="space-y-0.5">
        <div className="flex items-center justify-between text-xs">
          <span>Income</span>
          <span className="tabular-nums font-medium">{formatGBP(totalIncome)}/year</span>
        </div>
        <div className="h-6 w-full rounded bg-muted/60 overflow-hidden flex">
          {incomeSegments
            .filter((s) => s.value > 0)
            .map((seg) => (
              <div
                key={seg.label}
                className="h-full first:rounded-l last:rounded-r transition-all duration-300"
                style={{
                  width: `${(seg.value / maxTotal) * 100}%`,
                  backgroundColor: seg.color,
                }}
                title={`${seg.label}: ${formatGBP(seg.value)}`}
              />
            ))}
        </div>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          {incomeSegments
            .filter((s) => s.value > 0)
            .map((seg) => (
              <div key={seg.label} className="flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                {seg.label}
              </div>
            ))}
        </div>
      </div>

      {/* Costs bar */}
      <div className="space-y-0.5">
        <div className="flex items-center justify-between text-xs">
          <span>Costs</span>
          <span className="tabular-nums font-medium">{formatGBP(totalCosts)}/year</span>
        </div>
        <div className="h-6 w-full rounded bg-muted/60 overflow-hidden flex">
          {costSegments
            .filter((s) => s.value > 0)
            .map((seg) => (
              <div
                key={seg.label}
                className="h-full first:rounded-l last:rounded-r transition-all duration-300"
                style={{
                  width: `${(seg.value / maxTotal) * 100}%`,
                  backgroundColor: seg.color,
                }}
                title={`${seg.label}: ${formatGBP(seg.value)}`}
              />
            ))}
        </div>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          {costSegments
            .filter((s) => s.value > 0)
            .map((seg) => (
              <div key={seg.label} className="flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                {seg.label}
              </div>
            ))}
        </div>
      </div>

      {/* Net difference */}
      <div
        className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium"
        style={{
          backgroundColor: netPosition >= 0 ? "#2e7d3215" : "#C6282815",
          color: netPosition >= 0 ? "#2e7d32" : "#C62828",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          {netPosition >= 0 ? (
            <path d="M7 2v10M3 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M7 12V2M3 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
        Net: {netPosition >= 0 ? "+" : ""}{formatGBP(netPosition)}/year
      </div>
    </div>
  )
}
