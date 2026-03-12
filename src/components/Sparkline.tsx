interface SparklineProps {
  data: { label: string; value: number }[]
  width?: number
  height?: number
  color?: string
}

export function Sparkline({
  data,
  width = 300,
  height = 100,
  color = "#2e7d32",
}: SparklineProps) {
  if (data.length === 0) return null

  const padding = { top: 12, right: 20, bottom: 24, left: 20 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + (1 - (d.value - min) / range) * chartH,
    label: d.label,
    value: d.value,
  }))

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ")

  const gradientId = "sparkline-gradient"
  const fillPoints = [
    ...points.map((p) => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${padding.top + chartH}`,
    `${points[0].x},${padding.top + chartH}`,
  ].join(" ")

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Red diesel price trend 2022-2026"
      className="w-full h-auto"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
      </defs>

      <polygon points={fillPoints} fill={`url(#${gradientId})`} />

      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={color} />
          <text
            x={p.x}
            y={p.y - 8}
            textAnchor="middle"
            fontSize={10}
            fill="currentColor"
            className="text-muted-foreground"
          >
            {Math.round(p.value)}p
          </text>
          <text
            x={p.x}
            y={padding.top + chartH + 16}
            textAnchor="middle"
            fontSize={10}
            fill="currentColor"
            className="text-muted-foreground"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
