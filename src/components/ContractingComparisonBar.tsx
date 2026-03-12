import { formatGBP } from "@/lib/format"

interface ContractingComparisonBarProps {
  farmOnlyIncome: number
  farmOnlyCosts: number
  farmOnlyNet: number
  withContractingIncome: number
  withContractingCosts: number
  withContractingNet: number
  contractingContribution: number
}

export function ContractingComparisonBar({
  farmOnlyIncome,
  farmOnlyCosts,
  farmOnlyNet,
  withContractingIncome,
  withContractingCosts,
  withContractingNet,
  contractingContribution,
}: ContractingComparisonBarProps) {
  const maxIncome = Math.max(farmOnlyIncome, withContractingIncome, 1)
  const maxCosts = Math.max(farmOnlyCosts, withContractingCosts, 1)
  const maxNet = Math.max(Math.abs(farmOnlyNet), Math.abs(withContractingNet), 1)

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Farm Only vs Farm + Contracting
      </p>

      {/* Income comparison */}
      <BarPair
        label="Income"
        leftLabel="Farm Only"
        leftValue={farmOnlyIncome}
        leftColor="#2e7d32"
        rightLabel="+ Contracting"
        rightValue={withContractingIncome}
        rightColor="#66bb6a"
        max={maxIncome}
      />

      {/* Costs comparison */}
      <BarPair
        label="Costs"
        leftLabel="Farm Only"
        leftValue={farmOnlyCosts}
        leftColor="#c62828"
        rightLabel="+ Contracting"
        rightValue={withContractingCosts}
        rightColor="#e57373"
        max={maxCosts}
      />

      {/* Net comparison */}
      <BarPair
        label="Net position"
        leftLabel="Farm Only"
        leftValue={Math.abs(farmOnlyNet)}
        leftColor={farmOnlyNet >= 0 ? "#2e7d32" : "#c62828"}
        leftPrefix={farmOnlyNet >= 0 ? "+" : "-"}
        rightLabel="+ Contracting"
        rightValue={Math.abs(withContractingNet)}
        rightColor={withContractingNet >= 0 ? "#2e7d32" : "#c62828"}
        rightPrefix={withContractingNet >= 0 ? "+" : "-"}
        max={maxNet}
      />

      {/* Contribution highlight */}
      <div
        className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium"
        style={{
          backgroundColor: contractingContribution >= 0 ? "#2e7d3215" : "#C6282815",
          color: contractingContribution >= 0 ? "#2e7d32" : "#C62828",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          {contractingContribution >= 0 ? (
            <path d="M7 2v10M3 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M7 12V2M3 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
        Contracting adds {contractingContribution >= 0 ? "+" : ""}{formatGBP(contractingContribution)}/year
      </div>
    </div>
  )
}

interface BarPairProps {
  label: string
  leftLabel: string
  leftValue: number
  leftColor: string
  leftPrefix?: string
  rightLabel: string
  rightValue: number
  rightColor: string
  rightPrefix?: string
  max: number
}

function BarPair({
  label,
  leftLabel,
  leftValue,
  leftColor,
  leftPrefix,
  rightLabel,
  rightValue,
  rightColor,
  rightPrefix,
  max,
}: BarPairProps) {
  const leftPct = (leftValue / max) * 100
  const rightPct = (rightValue / max) * 100

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>

      <div className="space-y-0.5">
        <div className="flex items-center justify-between text-xs">
          <span>{leftLabel}</span>
          <span className="tabular-nums font-medium">
            {leftPrefix}{formatGBP(leftValue)}/year
          </span>
        </div>
        <div className="h-4 w-full rounded bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded transition-all duration-300"
            style={{
              width: `${Math.max(leftPct, 2)}%`,
              backgroundColor: leftColor,
            }}
          />
        </div>
      </div>

      <div className="space-y-0.5">
        <div className="flex items-center justify-between text-xs">
          <span>{rightLabel}</span>
          <span className="tabular-nums font-medium">
            {rightPrefix}{formatGBP(rightValue)}/year
          </span>
        </div>
        <div className="h-4 w-full rounded bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded transition-all duration-300"
            style={{
              width: `${Math.max(rightPct, 2)}%`,
              backgroundColor: rightColor,
            }}
          />
        </div>
      </div>
    </div>
  )
}
