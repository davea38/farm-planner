import { formatGBP } from "@/lib/format"

interface CostComparisonBarProps {
  ownCost: number
  contractorCost: number
  unit: string // "ha" or "hr"
}

export function CostComparisonBar({ ownCost, contractorCost, unit }: CostComparisonBarProps) {
  const maxCost = Math.max(ownCost, contractorCost, 1)
  const ownPct = (ownCost / maxCost) * 100
  const contractorPct = (contractorCost / maxCost) * 100

  const diff = contractorCost - ownCost
  const diffAbs = Math.abs(diff)
  const threshold = contractorCost * 0.1

  let diffColor: string
  let diffLabel: string
  if (diffAbs <= threshold) {
    diffColor = "#F9A825" // amber
    diffLabel = "Roughly break-even"
  } else if (diff > 0) {
    diffColor = "#2e7d32" // green — owning is cheaper
    diffLabel = `You save ${formatGBP(diffAbs)}/${unit}`
  } else {
    diffColor = "#C62828" // red — contractor is cheaper
    diffLabel = `Contractor saves ${formatGBP(diffAbs)}/${unit}`
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground tracking-wide">
        Own vs Contractor
      </p>

      {/* Own cost bar */}
      <div className="space-y-0.5">
        <div className="flex items-center justify-between text-xs">
          <span>Your cost</span>
          <span className="tabular-nums font-medium">
            {formatGBP(ownCost)}/{unit}
          </span>
        </div>
        <div className="h-5 w-full rounded bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded transition-all duration-300"
            style={{
              width: `${Math.max(ownPct, 2)}%`,
              backgroundColor: "#2e7d32",
            }}
          />
        </div>
      </div>

      {/* Contractor cost bar */}
      <div className="space-y-0.5">
        <div className="flex items-center justify-between text-xs">
          <span>Contractor</span>
          <span className="tabular-nums font-medium">
            {formatGBP(contractorCost)}/{unit}
          </span>
        </div>
        <div className="h-5 w-full rounded bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded transition-all duration-300"
            style={{
              width: `${Math.max(contractorPct, 2)}%`,
              backgroundColor: "#6b7280",
            }}
          />
        </div>
      </div>

      {/* Difference highlight */}
      <div
        className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium"
        style={{ backgroundColor: `${diffColor}15`, color: diffColor }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          {diff > 0 && diffAbs > threshold ? (
            // Down arrow (you save)
            <path d="M7 2v10M3 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : diff < 0 && diffAbs > threshold ? (
            // Up arrow (contractor saves)
            <path d="M7 12V2M3 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            // Equals (break-even)
            <>
              <line x1="3" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="3" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}
        </svg>
        {diffLabel}
      </div>
    </div>
  )
}
