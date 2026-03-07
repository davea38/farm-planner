import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

interface InputFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  unit?: string
  tooltip?: string
  min?: number
  max?: number
  step?: number | "any"
}

export function InputField({
  label,
  value,
  onChange,
  unit,
  tooltip,
  min,
  max,
  step = "any",
}: InputFieldProps) {
  return (
    <div className="flex items-center gap-2 min-h-[44px]">
      <label className="flex-1 text-sm font-medium leading-tight">
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
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-28 text-right tabular-nums"
        />
        {unit && (
          <span className="text-sm text-muted-foreground w-12 shrink-0">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}
