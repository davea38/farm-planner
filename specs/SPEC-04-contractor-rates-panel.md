# SPEC-04: NAAC Contractor Rates Reference Panel

## Goal

Show NAAC 2025-26 contractor charging rates in a colour-coded, categorised table near the "Contractor charges" input on Tabs 1 and 2. Each rate has a "Use this rate" button that auto-fills the input.

## Data Source

NAAC Contracting Prices Survey 2025-26 via Farmers Weekly.
Rates based on red diesel at 70p/L, excluding AdBlue.

## Reference Data to Encode

```typescript
// src/lib/contractor-data.ts
export interface ContractorRate {
  category: string
  operation: string
  rate: number
  unit: "ha" | "bale" | "hr"
}

export const NAAC_SOURCE = {
  name: "NAAC / Farmers Weekly",
  year: "2025-26",
  note: "Based on red diesel at 70p/L excl. AdBlue",
}

export const NAAC_RATES: ContractorRate[] = [
  // Soil Preparation (£/ha)
  { category: "Soil Prep", operation: "Ploughing (light)", rate: 79.21, unit: "ha" },
  { category: "Soil Prep", operation: "Ploughing (heavy)", rate: 87.22, unit: "ha" },
  { category: "Soil Prep", operation: "Deep ploughing (30cm+)", rate: 96.57, unit: "ha" },
  { category: "Soil Prep", operation: "Subsoiling", rate: 79.47, unit: "ha" },
  { category: "Soil Prep", operation: "Disc harrowing", rate: 63.06, unit: "ha" },
  { category: "Soil Prep", operation: "Power harrowing (shallow)", rate: 71.04, unit: "ha" },
  { category: "Soil Prep", operation: "Power harrowing (deep)", rate: 82.00, unit: "ha" },
  { category: "Soil Prep", operation: "Spring-tine harrowing", rate: 47.39, unit: "ha" },
  { category: "Soil Prep", operation: "One-pass tillage", rate: 83.63, unit: "ha" },
  { category: "Soil Prep", operation: "Rolling (flat)", rate: 35.11, unit: "ha" },
  { category: "Soil Prep", operation: "Rolling (ring)", rate: 25.83, unit: "ha" },

  // Drilling (£/ha)
  { category: "Drilling", operation: "Cereals (conventional)", rate: 65.57, unit: "ha" },
  { category: "Drilling", operation: "Cereals (combination)", rate: 84.72, unit: "ha" },
  { category: "Drilling", operation: "Cereals (direct)", rate: 77.63, unit: "ha" },
  { category: "Drilling", operation: "OSR (subsoiler)", rate: 94.80, unit: "ha" },
  { category: "Drilling", operation: "Sugar beet", rate: 75.28, unit: "ha" },
  { category: "Drilling", operation: "Maize (precision)", rate: 60.63, unit: "ha" },
  { category: "Drilling", operation: "Grass seed (broadcast)", rate: 34.59, unit: "ha" },
  { category: "Drilling", operation: "Grass seed (harrow)", rate: 52.14, unit: "ha" },

  // Application (£/ha)
  { category: "Application", operation: "Fertiliser (granular)", rate: 15.93, unit: "ha" },
  { category: "Application", operation: "Fertiliser (liquid)", rate: 16.48, unit: "ha" },
  { category: "Application", operation: "Spraying (arable)", rate: 16.52, unit: "ha" },
  { category: "Application", operation: "Spraying (grassland)", rate: 24.24, unit: "ha" },

  // Harvesting (£/ha)
  { category: "Harvesting", operation: "Combining cereals", rate: 119.34, unit: "ha" },
  { category: "Harvesting", operation: "Combining OSR", rate: 119.44, unit: "ha" },
  { category: "Harvesting", operation: "Combining peas/beans", rate: 123.44, unit: "ha" },
  { category: "Harvesting", operation: "Grain maize", rate: 162.10, unit: "ha" },
  { category: "Harvesting", operation: "Forage harvesting", rate: 84.31, unit: "ha" },

  // Baling (£/bale)
  { category: "Baling", operation: "Small conventional", rate: 1.14, unit: "bale" },
  { category: "Baling", operation: "Round 1.2m", rate: 4.16, unit: "bale" },
  { category: "Baling", operation: "Round 1.5m", rate: 4.75, unit: "bale" },
  { category: "Baling", operation: "Square 80×90cm", rate: 4.72, unit: "bale" },
  { category: "Baling", operation: "Square 120×90cm", rate: 7.52, unit: "bale" },

  // Tractor Hire (£/hr)
  { category: "Tractor Hire", operation: "100–150 HP", rate: 50.75, unit: "hr" },
  { category: "Tractor Hire", operation: "150–220 HP", rate: 58.17, unit: "hr" },
  { category: "Tractor Hire", operation: "220–300 HP", rate: 70.25, unit: "hr" },
  { category: "Tractor Hire", operation: "300+ HP", rate: 91.00, unit: "hr" },
]

export function getRatesByCategory(category: string): ContractorRate[] {
  return NAAC_RATES.filter(r => r.category === category)
}

export function getRatesByUnit(unit: "ha" | "hr" | "bale"): ContractorRate[] {
  return NAAC_RATES.filter(r => r.unit === unit)
}
```

## Visual Design

```
┌─ NAAC Contractor Rates 2025-26 ───────────── [▼] ─┐
│                                                      │
│  [Soil Prep] [Drilling] [Application] [Harvesting]  │
│  [Baling] [Tractor Hire]    ← category pills/tabs   │
│                                                      │
│  ┌────────────────────────────┬────────┬──────────┐ │
│  │ Operation                  │ Rate   │          │ │
│  ├────────────────────────────┼────────┼──────────┤ │
│  │ Ploughing (light)          │ £79/ha │ [Use ▶]  │ │  ← amber bg
│  │ Ploughing (heavy)          │ £87/ha │ [Use ▶]  │ │  ← amber bg
│  │ Deep ploughing (30cm+)     │ £97/ha │ [Use ▶]  │ │  ← amber bg
│  │ Disc harrowing             │ £63/ha │ [Use ▶]  │ │  ← amber bg
│  │ Spring-tine harrowing      │ £47/ha │ [Use ▶]  │ │  ← green bg
│  │ Rolling (flat)             │ £35/ha │ [Use ▶]  │ │  ← green bg
│  │ Rolling (ring)             │ £26/ha │ [Use ▶]  │ │  ← green bg
│  └────────────────────────────┴────────┴──────────┘ │
│                                                      │
│  Your current rate: £76/ha                          │
│  ────────────────●─────────────── range bar          │
│  £16          £76              £162                  │
│  (cheapest)       (yours)      (most expensive)     │
│                                                      │
│  Source: NAAC / Farmers Weekly 2025-26              │
│  Based on red diesel at 70p/L excl. AdBlue          │
└──────────────────────────────────────────────────────┘
```

### Visual Elements

1. **Category pills/tabs** — 6 categories, click to filter the table
2. **Traffic-light rows** — background color based on rate magnitude:
   - Green: under £40/ha (cheap operations)
   - Amber: £40–100/ha (mid-range)
   - Red: over £100/ha (expensive operations)
3. **"Use" button** on each row — calls `onApply(rate)` to fill contractor charge input
4. **Range indicator** — horizontal bar showing where the user's current contractor charge sits relative to the NAAC range (min to max of visible rates)
5. **Tab-aware filtering** — on Cost per Hour (Tab 2), default to "Tractor Hire" category showing £/hr rates

## Component Props

```typescript
interface ContractorRatesPanelProps {
  onApply: (rate: number) => void
  currentRate?: number              // user's current contractor charge, for comparison
  defaultCategory?: string          // "Tractor Hire" for Tab 2
  unitFilter?: "ha" | "hr"          // filter rates by unit
}
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/contractor-data.ts` | Rate constants + filter functions |
| `src/lib/__tests__/contractor-data.test.ts` | Data and filter tests |
| `src/components/ContractorRatesPanel.tsx` | Visual panel with categorised table |
| `src/components/__tests__/ContractorRatesPanel.test.tsx` | Component tests |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/CostPerHectare.tsx` | Add `<ContractorRatesPanel unitFilter="ha">` below contractor charge input |
| `src/components/CostPerHour.tsx` | Add `<ContractorRatesPanel unitFilter="hr" defaultCategory="Tractor Hire">` below contractor charge input |

## RED Tests

### Data tests (`contractor-data.test.ts`)
```typescript
import { NAAC_RATES, getRatesByCategory, getRatesByUnit } from '@/lib/contractor-data'

it('has at least 30 rates', () => {
  expect(NAAC_RATES.length).toBeGreaterThanOrEqual(30)
})

it('ploughing light = £79.21/ha', () => {
  const r = NAAC_RATES.find(r => r.operation === 'Ploughing (light)')
  expect(r?.rate).toBe(79.21)
})

it('getRatesByCategory returns correct subset', () => {
  const soil = getRatesByCategory('Soil Prep')
  expect(soil.length).toBeGreaterThan(5)
  expect(soil.every(r => r.category === 'Soil Prep')).toBe(true)
})

it('getRatesByUnit("hr") returns tractor hire rates', () => {
  const hourly = getRatesByUnit('hr')
  expect(hourly.length).toBe(4)
  expect(hourly.every(r => r.unit === 'hr')).toBe(true)
})

it('all rates are positive numbers', () => {
  NAAC_RATES.forEach(r => {
    expect(r.rate).toBeGreaterThan(0)
  })
})
```

### Component tests (`ContractorRatesPanel.test.tsx`)
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ContractorRatesPanel } from '@/components/ContractorRatesPanel'

it('renders panel title', () => {
  render(<ContractorRatesPanel onApply={vi.fn()} />)
  expect(screen.getByText(/NAAC Contractor Rates/i)).toBeInTheDocument()
})

it('shows category tabs', () => {
  render(<ContractorRatesPanel onApply={vi.fn()} />)
  expect(screen.getByText('Soil Prep')).toBeInTheDocument()
  expect(screen.getByText('Drilling')).toBeInTheDocument()
})

it('shows operation rates', () => {
  render(<ContractorRatesPanel onApply={vi.fn()} />)
  expect(screen.getByText(/Ploughing/)).toBeInTheDocument()
})

it('calls onApply when Use button clicked', () => {
  const onApply = vi.fn()
  render(<ContractorRatesPanel onApply={onApply} />)
  // Click first "Use" button
  const useButtons = screen.getAllByRole('button', { name: /use/i })
  fireEvent.click(useButtons[0])
  expect(onApply).toHaveBeenCalledWith(expect.any(Number))
})

it('applies traffic-light colors to rows', () => {
  const { container } = render(<ContractorRatesPanel onApply={vi.fn()} />)
  // Rows with rates > £100 should have red-tinted background
  // Rows with rates < £40 should have green-tinted background
  // This tests the CSS class application
  expect(container.querySelector('[data-rate-tier="low"]')).toBeInTheDocument()
  expect(container.querySelector('[data-rate-tier="high"]')).toBeInTheDocument()
})

it('filters by unit when unitFilter provided', () => {
  render(<ContractorRatesPanel onApply={vi.fn()} unitFilter="hr" />)
  // Should only show Tractor Hire rates (£/hr)
  expect(screen.getByText(/100–150 HP/)).toBeInTheDocument()
})

it('shows source attribution', () => {
  render(<ContractorRatesPanel onApply={vi.fn()} />)
  expect(screen.getByText(/NAAC/)).toBeInTheDocument()
})
```

## GREEN Tests

All tests above pass.

## Acceptance Criteria

- [ ] Panel visible on both cost tabs below contractor charges input
- [ ] Collapsed by default
- [ ] 6 category tabs filter the rate table
- [ ] Traffic-light row colours: green (<£40), amber (£40–100), red (>£100)
- [ ] "Use" button fills contractor charge input with selected rate
- [ ] Range indicator shows user's current rate vs NAAC range
- [ ] Tab 2 defaults to "Tractor Hire" category with £/hr rates
- [ ] Source and year attribution footer
- [ ] All tests pass
