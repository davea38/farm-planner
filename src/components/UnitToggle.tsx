import type { UnitPreferences, AreaUnit, SpeedUnit } from '@/lib/units'

interface UnitToggleProps {
  units: UnitPreferences
  onChange: (units: UnitPreferences) => void
}

function PillToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, T]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="inline-flex rounded-md border border-border overflow-hidden">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="button"
          aria-pressed={value === option}
          className={`px-2.5 py-1 text-xs font-medium transition-colors ${
            value === option
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:bg-muted'
          }`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

export function UnitToggle({ units, onChange }: UnitToggleProps) {
  return (
    <div className="flex gap-2">
      <PillToggle<AreaUnit>
        options={['ha', 'acres']}
        value={units.area}
        onChange={(area) => onChange({ ...units, area })}
      />
      <PillToggle<SpeedUnit>
        options={['km', 'miles']}
        value={units.speed}
        onChange={(speed) => onChange({ ...units, speed })}
      />
    </div>
  )
}
