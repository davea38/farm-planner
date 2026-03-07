# SPEC-03: Fuel Consumption Estimator Panel

## Goal

Provide a visual HP → litres/hour fuel consumption estimator near the fuel consumption input on Tabs 1 and 2. The farmer enters their tractor HP and sees the estimated fuel burn rate, with a "Use this estimate" button.

## Data Source

EU Efficient20 Trainer Handbook rule of thumb (referenced in AHDB spreadsheet):
- **Formula:** `litres/hour = 0.244 × max PTO horsepower`
- Original PDF link is dead but formula is well-established in agricultural engineering

## Reference Data to Encode

```typescript
// src/lib/fuel-consumption-data.ts
export const FUEL_CONSUMPTION_FACTOR = 0.244  // L/hr per HP

export function estimateFuelConsumption(hp: number): number {
  return FUEL_CONSUMPTION_FACTOR * hp
}

// Quick reference table for visual display
export const HP_REFERENCE_POINTS = [
  { hp: 75,  lPerHr: 18.3, label: "Small" },
  { hp: 100, lPerHr: 24.4, label: "Medium" },
  { hp: 150, lPerHr: 36.6, label: "Large" },
  { hp: 200, lPerHr: 48.8, label: "Large+" },
  { hp: 250, lPerHr: 61.0, label: "V. Large" },
  { hp: 300, lPerHr: 73.2, label: "Heavy" },
]
```

## Visual Design

```
┌─ Estimate Fuel Consumption ────────────────── [▼] ─┐
│                                                      │
│  Tractor HP:  [====●===============] 150             │
│               75                  400                │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Estimated:  36.6 L/hr                       │   │
│  │  ████████████████░░░░░░░░░░░░  (50% of max)  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Quick Reference:                                   │
│  ┌─────┬─────┬──────┬──────┬───────┬──────┐        │
│  │ 75  │ 100 │ 150  │ 200  │  250  │ 300  │  HP    │
│  │18.3 │24.4 │ 36.6 │ 48.8 │ 61.0  │ 73.2 │  L/hr │
│  │ ░░  │ ██  │ ███  │ ████ │ █████ │██████│  gauge │
│  └─────┴─────┴──────┴──────┴───────┴──────┘        │
│                                                      │
│  [Use this estimate (36.6 L/hr)]                    │
│                                                      │
│  Source: Rule of thumb — 0.244 × HP = L/hr          │
└──────────────────────────────────────────────────────┘
```

### Visual Elements

1. **HP slider** — range input 75–400, with numeric input beside it for precision
2. **Estimated result** — large bold text with a horizontal fill-bar gauge showing consumption relative to max (400 HP = ~98 L/hr)
3. **Reference table** — 6 HP breakpoints as columns with mini bar graphs in each cell, colour intensity increases with consumption
4. **CostPerHectare variant** — when used on Tab 1, also shows L/ha conversion: `"At {workRate} ha/hr, that is {lPerHr / workRate} L/ha"`

## Component Props

```typescript
interface FuelConsumptionPanelProps {
  onApply: (value: number) => void   // L/hr for Tab 2, L/ha for Tab 1
  mode: "perHour" | "perHectare"
  workRate?: number                   // ha/hr — only needed for perHectare mode
}
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/fuel-consumption-data.ts` | Pure data + estimation function |
| `src/lib/__tests__/fuel-consumption-data.test.ts` | Function tests |
| `src/components/FuelConsumptionPanel.tsx` | Visual panel with slider + gauge |
| `src/components/__tests__/FuelConsumptionPanel.test.tsx` | Component tests |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/CostPerHectare.tsx` | Add `<FuelConsumptionPanel mode="perHectare" workRate={inputs.workRate}>` below fuel use input |
| `src/components/CostPerHour.tsx` | Add `<FuelConsumptionPanel mode="perHour">` below fuel consumption input |

## RED Tests

### Data tests (`fuel-consumption-data.test.ts`)
```typescript
import { estimateFuelConsumption, HP_REFERENCE_POINTS } from '@/lib/fuel-consumption-data'

it('100 HP → 24.4 L/hr', () => {
  expect(estimateFuelConsumption(100)).toBeCloseTo(24.4)
})

it('200 HP → 48.8 L/hr', () => {
  expect(estimateFuelConsumption(200)).toBeCloseTo(48.8)
})

it('0 HP → 0 L/hr', () => {
  expect(estimateFuelConsumption(0)).toBe(0)
})

it('reference table has 6 entries', () => {
  expect(HP_REFERENCE_POINTS).toHaveLength(6)
})
```

### Component tests (`FuelConsumptionPanel.test.tsx`)
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { FuelConsumptionPanel } from '@/components/FuelConsumptionPanel'

it('renders panel title', () => {
  render(<FuelConsumptionPanel onApply={vi.fn()} mode="perHour" />)
  expect(screen.getByText(/Estimate Fuel Consumption/i)).toBeInTheDocument()
})

it('shows estimated consumption for default HP', () => {
  render(<FuelConsumptionPanel onApply={vi.fn()} mode="perHour" />)
  // Default HP is 150 → 36.6 L/hr
  expect(screen.getByText(/36.6/)).toBeInTheDocument()
})

it('calls onApply with L/hr in perHour mode', () => {
  const onApply = vi.fn()
  render(<FuelConsumptionPanel onApply={onApply} mode="perHour" />)
  fireEvent.click(screen.getByRole('button', { name: /use this estimate/i }))
  expect(onApply).toHaveBeenCalledWith(expect.closeTo(36.6, 0))
})

it('shows L/ha conversion in perHectare mode', () => {
  render(<FuelConsumptionPanel onApply={vi.fn()} mode="perHectare" workRate={4} />)
  // 150 HP = 36.6 L/hr ÷ 4 ha/hr = 9.15 L/ha
  expect(screen.getByText(/L\/ha/)).toBeInTheDocument()
})

it('calls onApply with L/ha in perHectare mode', () => {
  const onApply = vi.fn()
  render(<FuelConsumptionPanel onApply={onApply} mode="perHectare" workRate={4} />)
  fireEvent.click(screen.getByRole('button', { name: /use this estimate/i }))
  // 36.6 / 4 = 9.15
  expect(onApply).toHaveBeenCalledWith(expect.closeTo(9.15, 0))
})
```

## GREEN Tests

All tests above pass.

## Acceptance Criteria

- [ ] Panel visible on both cost tabs below fuel consumption/use input
- [ ] Collapsed by default
- [ ] HP slider updates estimated consumption in real time
- [ ] Horizontal gauge bar fills proportionally
- [ ] Reference table shows 6 HP breakpoints with visual bars
- [ ] Tab 1 shows L/ha conversion using current work rate
- [ ] Tab 2 shows L/hr directly
- [ ] "Use this estimate" fills correct value for the tab's unit
- [ ] Source attribution footer
- [ ] All tests pass
