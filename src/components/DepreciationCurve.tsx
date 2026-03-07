import type { DepreciationProfile } from "@/lib/depreciation-data"

interface DepreciationCurveProps {
  profile: DepreciationProfile
  purchasePrice: number
  currentYear: number
  width?: number
  height?: number
}

export function DepreciationCurve({
  profile,
  purchasePrice,
  currentYear,
  width = 340,
  height = 200,
}: DepreciationCurveProps) {
  const padding = { top: 20, right: 16, bottom: 28, left: 48 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const values = profile.remainingValueByAge
  const maxVal = purchasePrice
  const [steepStart, steepEnd] = profile.steepestDropYears

  const toX = (yr: number) => padding.left + (yr / 12) * chartW
  const toY = (val: number) =>
    padding.top + (1 - val / maxVal) * chartH

  const points = values.map((pct, yr) => ({
    x: toX(yr),
    y: toY((pct / 100) * purchasePrice),
    yr,
    value: (pct / 100) * purchasePrice,
    pct,
  }))

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ")

  const fillPoints = [
    ...points.map((p) => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${padding.top + chartH}`,
    `${points[0].x},${padding.top + chartH}`,
  ].join(" ")

  const clampedYear = Math.max(0, Math.min(Math.round(currentYear), 12))
  const currentPoint = points[clampedYear]

  // Y-axis labels: 3 ticks
  const yTicks = [0, 0.5, 1].map((frac) => ({
    value: maxVal * frac,
    y: toY(maxVal * frac),
  }))

  // X-axis labels: every 2 years
  const xTicks = [0, 2, 4, 6, 8, 10, 12].map((yr) => ({
    yr,
    x: toX(yr),
  }))

  const formatValue = (v: number) => {
    if (v >= 1000) return `£${Math.round(v / 1000)}k`
    return `£${Math.round(v)}`
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Depreciation curve for ${profile.label}`}
      className="w-full h-auto"
    >
      <defs>
        <linearGradient id="depr-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.03} />
        </linearGradient>
      </defs>

      {/* Steep zone shading */}
      <rect
        x={toX(steepStart)}
        y={padding.top}
        width={toX(steepEnd) - toX(steepStart)}
        height={chartH}
        fill="#ef4444"
        opacity={0.06}
        rx={2}
      />

      {/* Grid lines */}
      {yTicks.map((t) => (
        <line
          key={t.value}
          x1={padding.left}
          y1={t.y}
          x2={padding.left + chartW}
          y2={t.y}
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeDasharray="3,3"
        />
      ))}

      {/* Fill area */}
      <polygon points={fillPoints} fill="url(#depr-fill)" />

      {/* Main curve line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke="#2563eb"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dot markers */}
      {points.map((p) => (
        <circle
          key={p.yr}
          cx={p.x}
          cy={p.y}
          r={p.yr === clampedYear ? 5 : 2.5}
          fill={p.yr === clampedYear ? "#2563eb" : "#2563eb"}
          opacity={p.yr === clampedYear ? 1 : 0.5}
        />
      ))}

      {/* "You are here" dashed line */}
      {currentPoint && (
        <>
          <line
            x1={currentPoint.x}
            y1={currentPoint.y}
            x2={currentPoint.x}
            y2={padding.top + chartH}
            stroke="#2563eb"
            strokeWidth={1}
            strokeDasharray="4,3"
            opacity={0.5}
          />
          <line
            x1={padding.left}
            y1={currentPoint.y}
            x2={currentPoint.x}
            y2={currentPoint.y}
            stroke="#2563eb"
            strokeWidth={1}
            strokeDasharray="4,3"
            opacity={0.5}
          />
          <text
            x={currentPoint.x}
            y={currentPoint.y - 10}
            textAnchor="middle"
            fontSize={9}
            fontWeight="bold"
            fill="#2563eb"
          >
            {formatValue(currentPoint.value)}
          </text>
        </>
      )}

      {/* Y-axis labels */}
      {yTicks.map((t) => (
        <text
          key={t.value}
          x={padding.left - 4}
          y={t.y + 3}
          textAnchor="end"
          fontSize={9}
          fill="currentColor"
          className="text-muted-foreground"
        >
          {formatValue(t.value)}
        </text>
      ))}

      {/* X-axis labels */}
      {xTicks.map((t) => (
        <text
          key={t.yr}
          x={t.x}
          y={padding.top + chartH + 16}
          textAnchor="middle"
          fontSize={9}
          fill="currentColor"
          className="text-muted-foreground"
        >
          {t.yr}yr
        </text>
      ))}
    </svg>
  )
}
