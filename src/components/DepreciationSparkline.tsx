import { DEPRECIATION_PROFILES } from "@/lib/depreciation-data"
import type { MachineCategory as DepreciationCategory } from "@/lib/depreciation-data"

interface DepreciationSparklineProps {
  category: DepreciationCategory
  /** Machine age in years (highlights current position on curve) */
  ageYears?: number | null
  width?: number
  height?: number
}

/**
 * Compact inline sparkline showing the depreciation trajectory for a machine category.
 * Optionally highlights the machine's current age on the curve.
 */
export function DepreciationSparkline({
  category,
  ageYears,
  width = 120,
  height = 32,
}: DepreciationSparklineProps) {
  const profile = DEPRECIATION_PROFILES[category] ?? DEPRECIATION_PROFILES["miscellaneous"]
  const values = profile.remainingValueByAge
  const pad = { top: 3, right: 3, bottom: 3, left: 3 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom

  const toX = (yr: number) => pad.left + (yr / 12) * chartW
  const toY = (pct: number) => pad.top + (1 - pct / 100) * chartH

  const points = values.map((pct, yr) => `${toX(yr)},${toY(pct)}`).join(" ")

  const fillPoints = [
    ...values.map((pct, yr) => `${toX(yr)},${toY(pct)}`),
    `${toX(12)},${pad.top + chartH}`,
    `${toX(0)},${pad.top + chartH}`,
  ].join(" ")

  const clampedAge =
    ageYears != null ? Math.max(0, Math.min(Math.round(ageYears), 12)) : null
  const currentPct = clampedAge != null ? values[clampedAge] : null

  const [steepStart, steepEnd] = profile.steepestDropYears

  const label = clampedAge != null && currentPct != null
    ? `${profile.label}: ${currentPct}% value remaining at ${clampedAge} years`
    : `${profile.label}: depreciation curve over 12 years`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className="inline-block align-middle"
    >
      {/* Steep drop zone */}
      <rect
        x={toX(steepStart)}
        y={pad.top}
        width={toX(steepEnd) - toX(steepStart)}
        height={chartH}
        fill="#ef4444"
        opacity={0.08}
        rx={1}
      />

      {/* Fill area */}
      <polygon points={fillPoints} fill="#2563eb" opacity={0.1} />

      {/* Curve line */}
      <polyline
        points={points}
        fill="none"
        stroke="#2563eb"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Current age marker */}
      {clampedAge != null && currentPct != null && (
        <>
          <circle
            cx={toX(clampedAge)}
            cy={toY(currentPct)}
            r={3}
            fill="#2563eb"
          />
          <text
            x={toX(clampedAge)}
            y={toY(currentPct) - 5}
            textAnchor="middle"
            fontSize={7}
            fontWeight="bold"
            fill="#2563eb"
          >
            {currentPct}%
          </text>
        </>
      )}
    </svg>
  )
}
