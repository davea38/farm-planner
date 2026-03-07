# SPEC-02: Fuel Price Reference Panel

## Goal

Show AHDB fuel price data (current + historical trend) as a visual collapsible panel near the "Fuel price" input on Tabs 1 and 2. Include a "Use red diesel price" button that auto-fills the input.

## Data Source

AHDB Fuel Prices (https://ahdb.org.uk/fuel-prices), fetched March 2026.

## Reference Data to Encode

```typescript
// src/lib/fuel-data.ts
export const FUEL_PRICES = {
  source: "AHDB",
  updated: "Feb 2026",
  redDiesel: { current: 74.91, unit: "ppl" },    // pence per litre
  pumpDiesel: { current: 141.22, unit: "ppl" },
  historical: [
    { year: 2022, redDiesel: 104.27, pumpDiesel: 177.66 },
    { year: 2023, redDiesel: 89.05, pumpDiesel: 158.19 },
    { year: 2024, redDiesel: 80.84, pumpDiesel: 148.33 },
    { year: 2025, redDiesel: 76.02, pumpDiesel: 142.55 },
    { year: 2026, redDiesel: 74.91, pumpDiesel: 141.22 },
  ],
}
```

## Visual Design

```
┌─ AHDB Fuel Prices (Feb 2026) ──────────────── [▼] ─┐
│                                                      │
│  ┌──────────────┐  ┌───────────────┐                │
│  │  RED DIESEL   │  │  PUMP DIESEL  │                │
│  │   74.91p/L   │  │  141.22p/L    │                │
│  │   ▼ -5.5%    │  │  ▼ -3.6%     │                │
│  └──────────────┘  └───────────────┘                │
│                                                      │
│  5-Year Trend (Red Diesel)                          │
│  104p ─╮                                            │
│        ╰─── 89p                                     │
│              ╰─── 81p                               │
│                    ╰── 76p ── 75p                   │
│  2022  2023  2024  2025  2026                       │
│                                                      │
│  [Use red diesel price (74.91p)] ←── fills input    │
│                                                      │
│  Source: AHDB  •  Data: Feb 2026                    │
└──────────────────────────────────────────────────────┘
```

### Visual Elements

1. **Two price cards** — red diesel (primary highlight) + pump diesel (secondary)
2. **Year-on-year change** — green down arrow (price falling = good for farmer)
3. **SVG sparkline** — pure `<svg>` with `<polyline>`, gradient fill below line, dots at each year, year labels on x-axis
4. **"Use red diesel price" button** — converts ppl to £/L (0.7491) and calls `onApply(0.7491)`

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/fuel-data.ts` | Pure data constants |
| `src/lib/__tests__/fuel-data.test.ts` | Data validation tests |
| `src/components/FuelPricePanel.tsx` | Visual panel component |
| `src/components/Sparkline.tsx` | Reusable SVG sparkline (pure, no dependencies) |
| `src/components/__tests__/FuelPricePanel.test.tsx` | Component tests |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/CostPerHectare.tsx` | Add `<FuelPricePanel>` below fuel price input |
| `src/components/CostPerHour.tsx` | Add `<FuelPricePanel>` below fuel price input |

## Component Props

```typescript
interface FuelPricePanelProps {
  onApply: (priceInPounds: number) => void  // e.g. 0.7491
}
```

## RED Tests

### Data tests (`fuel-data.test.ts`)
```typescript
import { FUEL_PRICES } from '@/lib/fuel-data'

it('exports current red diesel price', () => {
  expect(FUEL_PRICES.redDiesel.current).toBe(74.91)
})

it('has 5 years of historical data', () => {
  expect(FUEL_PRICES.historical).toHaveLength(5)
})

it('historical data is in chronological order', () => {
  const years = FUEL_PRICES.historical.map(h => h.year)
  expect(years).toEqual([2022, 2023, 2024, 2025, 2026])
})
```

### Component tests (`FuelPricePanel.test.tsx`)
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { FuelPricePanel } from '@/components/FuelPricePanel'

it('renders current red diesel price', () => {
  render(<FuelPricePanel onApply={vi.fn()} />)
  expect(screen.getByText(/74.91/)).toBeInTheDocument()
})

it('renders SVG sparkline', () => {
  const { container } = render(<FuelPricePanel onApply={vi.fn()} />)
  expect(container.querySelector('svg')).toBeInTheDocument()
})

it('calls onApply with £/L when button clicked', () => {
  const onApply = vi.fn()
  render(<FuelPricePanel onApply={onApply} />)
  fireEvent.click(screen.getByRole('button', { name: /use red diesel/i }))
  expect(onApply).toHaveBeenCalledWith(0.7491)
})

it('shows source attribution', () => {
  render(<FuelPricePanel onApply={vi.fn()} />)
  expect(screen.getByText(/AHDB/)).toBeInTheDocument()
})
```

## GREEN Tests

All tests above pass. Panel renders with price cards, sparkline, and working button.

## Acceptance Criteria

- [ ] Panel visible on both Cost per Hectare and Cost per Hour tabs
- [ ] Collapsed by default (uses `CollapsibleSection`)
- [ ] Current prices shown in two styled cards
- [ ] SVG sparkline shows 5-year downward trend
- [ ] "Use red diesel price" button fills fuel price input with 0.7491
- [ ] Source and date attribution footer
- [ ] All tests pass
