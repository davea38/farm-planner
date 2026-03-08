import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { useUnits } from "@/lib/UnitContext"
import { toDisplay, fromDisplay, displayUnit } from "@/lib/units"

interface InputFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  unit?: string
  metricUnit?: string
  tooltip?: string
  min?: number
  max?: number
  step?: number | "any"
  sourceBadge?: string
}

export function InputField({
  label,
  value,
  onChange,
  unit,
  metricUnit,
  tooltip,
  min,
  max,
  step = "any",
  sourceBadge,
}: InputFieldProps) {
  const { units } = useUnits()

  const rawDisplay = metricUnit
    ? toDisplay(value, metricUnit, units)
    : value
  // Round to 10 significant decimal places to eliminate floating point noise
  // (e.g. 499.99999999999994 → 500)
  const displayValue = parseFloat(rawDisplay.toPrecision(10))

  const shownUnit = metricUnit
    ? displayUnit(metricUnit, units)
    : unit

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value)
    onChange(metricUnit ? fromDisplay(raw, metricUnit, units) : raw)
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-h-[44px]">
      <label className="flex-1 text-sm font-medium leading-tight whitespace-nowrap">
        {label}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger
              className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label={`Help: ${label}`}
            >
              ?
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </label>
      <div className="flex items-center gap-1.5 sm:ml-auto">
        <Input
          type="number"
          value={displayValue}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="w-20 sm:w-28 text-right tabular-nums"
        />
        {shownUnit && (
          <span className="text-sm text-muted-foreground w-12 shrink-0">
            {shownUnit}
          </span>
        )}
      </div>
      {sourceBadge && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary leading-tight">
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {sourceBadge}
        </span>
      )}
    </div>
  )
}
