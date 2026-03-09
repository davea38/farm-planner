import { formatGBP } from "@/lib/format"

export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface CostDonutChartProps {
  segments: DonutSegment[]
  centerLabel?: string
  centerValue?: number
}

const RADIUS = 40
const STROKE = 12
const CENTER = 50
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function CostDonutChart({ segments, centerLabel, centerValue }: CostDonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  if (total <= 0) return null

  // Filter out zero-value segments for rendering
  const activeSegments = segments.filter((s) => s.value > 0)

  // Build stroke-dasharray offsets
  let offset = 0
  const arcs = activeSegments.map((seg) => {
    const fraction = seg.value / total
    const dashLength = fraction * CIRCUMFERENCE
    const gapLength = CIRCUMFERENCE - dashLength
    const arc = {
      ...seg,
      fraction,
      dashArray: `${dashLength} ${gapLength}`,
      dashOffset: -offset,
    }
    offset += dashLength
    return arc
  })

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-6">
      {/* Donut SVG */}
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.dashOffset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        {centerValue !== undefined && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerLabel && (
              <span className="text-[10px] text-muted-foreground leading-tight">{centerLabel}</span>
            )}
            <span className="text-sm font-semibold leading-tight">{formatGBP(centerValue)}</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1 text-xs">
        {activeSegments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-muted-foreground whitespace-nowrap">
              {seg.label}{" "}
              <span className="tabular-nums font-medium text-foreground">
                {Math.round((seg.value / total) * 100)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
