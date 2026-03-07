# SPEC-06: UK Unit Toggle & Label Layout Fixes

## Goal

1. Add a global **hectares/acres** and **km/miles** toggle so traditional UK farmers can work in familiar imperial units.
2. Fix label widths so that label text + the `[?]` help icon never wrap onto a second line.

## Why

Many UK farmers think in acres and miles, not hectares and kilometres. The AHDB spreadsheet uses metric, but the app should let farmers choose. The unit toggle applies globally — every tab, every input, every result — so it lives at the top of the page beside the title.

Separately, several labels ("Hectares worked/year", "5-year average farm income", etc.) can wrap on narrow viewports, pushing the `[?]` icon to a second line and making the form look broken.

---

## Part A: Unit Toggle

### Placement

In `App.tsx`, add a segmented toggle in the header row, next to the Export/Import buttons:

```
┌──────────────────────────────────────────────────────────┐
│  Farm Machinery Planner          [ha│acres] [km│miles]   │
│                                  [Export] [Import]       │
│  ┌─────────┬──────────┬──────────┬────────────────┐     │
│  │Cost / ha│Cost / hr │ Compare  │ Replacement    │     │
│  └─────────┴──────────┴──────────┴────────────────┘     │
```

- Two small pill toggles, side by side: `[ha | acres]` and `[km | miles]`
- Default: `ha` + `km` (metric, matching current behaviour)
- Selection persisted in `localStorage` alongside existing app state

### Conversion Factors

```typescript
// src/lib/units.ts
export const CONVERSIONS = {
  haToAcres: 2.47105,
  kmToMiles: 0.621371,
} as const

export type AreaUnit = "ha" | "acres"
export type SpeedUnit = "km" | "miles"

export interface UnitPreferences {
  area: AreaUnit
  speed: SpeedUnit
}

export const DEFAULT_UNITS: UnitPreferences = { area: "ha", speed: "km" }
```

### What Changes Per Unit Setting

#### Area toggle (`ha` ↔ `acres`)

| Metric label | Metric unit | Imperial label | Imperial unit | Conversion |
|---|---|---|---|---|
| Hectares worked/year | ha | Acres worked/year | acres | × 2.47105 |
| Work rate | ha/hr | Work rate | acres/hr | × 2.47105 |
| Fuel use | L/ha | Fuel use | L/acre | ÷ 2.47105 |
| Application rate | kg/ha | Application rate | kg/acre | ÷ 2.47105 |
| Contractor charges (Tab 1) | £/ha | Contractor charges | £/acre | ÷ 2.47105 |
| Ha covered per hour | ha/hr | Acres covered per hour | acres/hr | × 2.47105 |
| Results: cost per ha | £/ha | Results: cost per acre | £/acre | ÷ 2.47105 |
| Results: spot/true rate | ha/hr | Results: spot/true rate | acres/hr | × 2.47105 |
| NAAC rates (SPEC-04) | £/ha | NAAC rates | £/acre | ÷ 2.47105 |

#### Speed toggle (`km` ↔ `miles`)

| Metric label | Metric unit | Imperial label | Imperial unit | Conversion |
|---|---|---|---|---|
| Speed | km/hr | Speed | mph | × 0.621371 |

**Not converted** (already standard in UK):
- Implement width stays in **metres** (farmers measure in metres even imperially)
- Fuel volume stays in **litres** (UK fuel is sold in litres)
- Weight stays in **kg** (fertiliser bags are in kg)
- Currency stays in **£**
- Time stays in hours/minutes/years

### How It Works

**Display-layer conversion only.** All internal state and calculations remain metric (hectares, km). The conversion happens at two boundaries:

1. **Input → state**: when the user types `1000` in "Acres worked/year", the app stores `1000 / 2.47105 = 404.7 ha`
2. **State → display**: when rendering, the stored `404.7 ha` is shown as `1000 acres`

This means:
- `calculations.ts` does not change — all formulas stay metric
- `defaults.ts` does not change — defaults stay metric
- `localStorage` always stores metric values
- Only `InputField` and result display components apply conversions

### Implementation Approach

```typescript
// src/lib/units.ts
export function toDisplay(value: number, fromUnit: string, prefs: UnitPreferences): number
export function fromDisplay(value: number, toUnit: string, prefs: UnitPreferences): number
export function displayUnit(metricUnit: string, prefs: UnitPreferences): string
```

Examples:
```typescript
toDisplay(1200, "ha", { area: "acres" })     // → 2965.3
fromDisplay(2965, "ha", { area: "acres" })   // → 1200.0
displayUnit("ha/hr", { area: "acres" })      // → "acres/hr"
displayUnit("L/ha", { area: "acres" })       // → "L/acre"
displayUnit("£/ha", { area: "acres" })       // → "£/acre"
displayUnit("km/hr", { speed: "miles" })     // → "mph"
```

### State Management

- `UnitPreferences` stored via React context (`UnitContext`) so all components can read it
- Toggle component updates context + persists to `localStorage`
- No prop drilling — components call `useUnits()` hook

### Tab Label Update

When area is set to "acres", the first tab label changes from "Cost per Hectare" to "Cost per Acre".

---

## Part B: Label Width Fixes

### Problem

`InputField` uses `flex-1` for the label, which lets it shrink. On narrow viewports (320px), long labels wrap, and the `[?]` tooltip icon drops to a second line. The label + icon should always stay on one line.

### Labels That Wrap

| Component | Label | Characters |
|---|---|---|
| CostPerHectare | Hectares worked/year | 20 |
| CostPerHectare | Expected sale price | 19 |
| CostPerHour | Ha covered per hour | 19 |
| CostPerHour | Fuel consumption | 16 |
| ReplacementPlanner | 5-year average farm income | 26 |
| CompareMachines | Application rate | 16 |
| CompareMachines | Field efficiency | 16 |

With imperial units these get longer: "Acres worked/year" (17), "Acres covered per hour" (22).

### Fix

Two changes to `InputField.tsx`:

1. **Add `whitespace-nowrap`** to the label+icon wrapper so they never break across lines
2. **Allow the row to wrap** at the flex level — on very narrow screens the input slides below the label rather than squeezing it

```
Before (current):
┌──────────────────────────────────────┐
│ Hectares  [?]  [____1200__] ha      │  ← label wraps, icon orphaned
│ worked/year                          │
└──────────────────────────────────────┘

After (fixed):
┌──────────────────────────────────────┐
│ Hectares worked/year [?]             │  ← label+icon stay together
│                      [____1200__] ha │  ← input wraps below on narrow
└──────────────────────────────────────┘

On wider screens (≥640px), everything stays on one line:
┌──────────────────────────────────────────────────────┐
│ Hectares worked/year [?]       [____1200__] ha       │
└──────────────────────────────────────────────────────┘
```

Changes to `InputField.tsx`:
- Outer div: change `flex items-center gap-2` → `flex flex-wrap items-center gap-x-2 gap-y-1`
- Label span: add `whitespace-nowrap`
- Input wrapper: add `sm:ml-auto` so it right-aligns when on the same line

### Tooltip Text Shortening

For the longest tooltip on `ReplacementPlanner`:
- Current: `"Your average annual farm income over the last 5 years"`
- Shorten label to: `"5-yr avg. farm income"` (keeps tooltip as-is for full explanation)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/units.ts` | Conversion factors, types, `toDisplay`/`fromDisplay`/`displayUnit` functions |
| `src/lib/__tests__/units.test.ts` | Unit conversion tests |
| `src/components/UnitToggle.tsx` | Segmented pill toggle for ha/acres and km/miles |
| `src/components/__tests__/UnitToggle.test.tsx` | Toggle component tests |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `UnitContext.Provider`, render `<UnitToggle>` in header |
| `src/components/InputField.tsx` | Fix flex-wrap, whitespace-nowrap, `sm:ml-auto` on input wrapper |
| `src/components/CostPerHectare.tsx` | Read `useUnits()`, pass unit keys to `InputField`, convert on input/display |
| `src/components/CostPerHour.tsx` | Same as CostPerHectare |
| `src/components/CompareMachines.tsx` | Convert speed (km/hr ↔ mph), area units in results |
| `src/components/CostBreakdown.tsx` | Display converted units in results |
| `src/components/ResultBanner.tsx` | Use converted unit in saving text (e.g., "per acre") |
| `src/components/ReplacementPlanner.tsx` | Shorten "5-year average farm income" label |
| `src/components/ContractorRatesPanel.tsx` (SPEC-04) | Convert £/ha rates to £/acre when in acres mode |
| `src/components/FuelConsumptionPanel.tsx` (SPEC-03) | Show L/acre conversion in perHectare mode when in acres |
| `src/lib/storage.ts` | Persist `UnitPreferences` in localStorage |

---

## RED Tests

### Unit conversion tests (`units.test.ts`)

```typescript
import { toDisplay, fromDisplay, displayUnit, CONVERSIONS } from '@/lib/units'

describe('toDisplay', () => {
  it('converts ha to acres', () => {
    expect(toDisplay(100, 'ha', { area: 'acres', speed: 'km' }))
      .toBeCloseTo(247.105, 1)
  })

  it('converts ha/hr to acres/hr', () => {
    expect(toDisplay(4, 'ha/hr', { area: 'acres', speed: 'km' }))
      .toBeCloseTo(9.884, 1)
  })

  it('converts L/ha to L/acre (inverse)', () => {
    expect(toDisplay(20, 'L/ha', { area: 'acres', speed: 'km' }))
      .toBeCloseTo(8.094, 1)
  })

  it('converts £/ha to £/acre (inverse)', () => {
    expect(toDisplay(76, '£/ha', { area: 'acres', speed: 'km' }))
      .toBeCloseTo(30.76, 0)
  })

  it('converts km/hr to mph', () => {
    expect(toDisplay(12, 'km/hr', { area: 'ha', speed: 'miles' }))
      .toBeCloseTo(7.456, 1)
  })

  it('returns unchanged value when units match metric', () => {
    expect(toDisplay(100, 'ha', { area: 'ha', speed: 'km' })).toBe(100)
  })

  it('does not convert non-area/speed units', () => {
    expect(toDisplay(14, '£/hr', { area: 'acres', speed: 'miles' })).toBe(14)
  })
})

describe('fromDisplay', () => {
  it('converts acres input back to ha for storage', () => {
    expect(fromDisplay(247.105, 'ha', { area: 'acres', speed: 'km' }))
      .toBeCloseTo(100, 1)
  })

  it('round-trips correctly', () => {
    const prefs = { area: 'acres' as const, speed: 'miles' as const }
    const original = 1200
    const displayed = toDisplay(original, 'ha', prefs)
    const roundTripped = fromDisplay(displayed, 'ha', prefs)
    expect(roundTripped).toBeCloseTo(original, 2)
  })
})

describe('displayUnit', () => {
  it('ha → acres', () => {
    expect(displayUnit('ha', { area: 'acres', speed: 'km' })).toBe('acres')
  })

  it('ha/hr → acres/hr', () => {
    expect(displayUnit('ha/hr', { area: 'acres', speed: 'km' })).toBe('acres/hr')
  })

  it('L/ha → L/acre', () => {
    expect(displayUnit('L/ha', { area: 'acres', speed: 'km' })).toBe('L/acre')
  })

  it('£/ha → £/acre', () => {
    expect(displayUnit('£/ha', { area: 'acres', speed: 'km' })).toBe('£/acre')
  })

  it('km/hr → mph', () => {
    expect(displayUnit('km/hr', { area: 'ha', speed: 'miles' })).toBe('mph')
  })

  it('unchanged when metric selected', () => {
    expect(displayUnit('ha', { area: 'ha', speed: 'km' })).toBe('ha')
  })
})
```

### Toggle component tests (`UnitToggle.test.tsx`)

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { UnitToggle } from '@/components/UnitToggle'

it('renders ha/acres toggle', () => {
  render(<UnitToggle units={{ area: 'ha', speed: 'km' }} onChange={vi.fn()} />)
  expect(screen.getByRole('button', { name: /ha/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /acres/i })).toBeInTheDocument()
})

it('renders km/miles toggle', () => {
  render(<UnitToggle units={{ area: 'ha', speed: 'km' }} onChange={vi.fn()} />)
  expect(screen.getByRole('button', { name: /km/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /miles/i })).toBeInTheDocument()
})

it('highlights active unit', () => {
  render(<UnitToggle units={{ area: 'acres', speed: 'km' }} onChange={vi.fn()} />)
  const acresBtn = screen.getByRole('button', { name: /acres/i })
  expect(acresBtn).toHaveAttribute('aria-pressed', 'true')
})

it('calls onChange when toggled', () => {
  const onChange = vi.fn()
  render(<UnitToggle units={{ area: 'ha', speed: 'km' }} onChange={onChange} />)
  fireEvent.click(screen.getByRole('button', { name: /acres/i }))
  expect(onChange).toHaveBeenCalledWith({ area: 'acres', speed: 'km' })
})
```

### Label layout tests

```typescript
import { render } from '@testing-library/react'
import { InputField } from '@/components/InputField'

it('label wrapper has whitespace-nowrap', () => {
  const { container } = render(
    <InputField
      label="Hectares worked/year"
      value={1200}
      onChange={vi.fn()}
      unit="ha"
      tooltip="Total hectares"
    />
  )
  const label = container.querySelector('label, [class*="label"]')
  expect(label?.className).toMatch(/whitespace-nowrap/)
})
```

### Integration: tab label changes with unit toggle

```typescript
it('tab label says "Cost per Acre" when area unit is acres', () => {
  render(<App />) // with UnitContext set to acres
  expect(screen.getByRole('tab', { name: /Cost per Acre/i })).toBeInTheDocument()
})

it('tab label says "Cost per Hectare" when area unit is ha', () => {
  render(<App />)
  expect(screen.getByRole('tab', { name: /Cost per Hectare/i })).toBeInTheDocument()
})
```

---

## GREEN Tests

All tests above pass. Toggle switches units globally, labels never wrap, conversions are accurate.

---

## Acceptance Criteria

- [ ] Two pill toggles visible in the page header: `[ha | acres]` and `[km | miles]`
- [ ] Default is metric (ha + km), matching current behaviour
- [ ] Toggling to acres converts all ha-based inputs, units, and results across all tabs
- [ ] Toggling to miles converts km/hr to mph on the Compare Machines tab
- [ ] Internal state and calculations remain metric — conversion is display-layer only
- [ ] Unit preference persists in localStorage across page reloads
- [ ] Tab 1 label changes between "Cost per Hectare" and "Cost per Acre"
- [ ] NAAC contractor rates (SPEC-04) show £/acre when in acres mode
- [ ] Fuel consumption panel (SPEC-03) shows L/acre in perHectare mode when in acres mode
- [ ] Label + `[?]` icon never wrap onto separate lines at any viewport width
- [ ] On narrow viewports (320px), input wraps below the label rather than squeezing it
- [ ] "5-year average farm income" label shortened to "5-yr avg. farm income"
- [ ] All tests pass
- [ ] `npm run build` succeeds with no TypeScript errors
