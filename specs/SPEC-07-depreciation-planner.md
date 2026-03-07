# SPEC-07: Depreciation Curve Planner

## Goal

Add a visual depreciation planner that shows farmers **where on the depreciation curve** their machine sits after X years, how much of the purchase price has been lost, and what the estimated market value is at any point. The farmer selects a machine category, enters a purchase price, and sees an interactive graph of value over time with key milestones marked.

This complements the existing Replacement Planner (Tab 4) which plans *when* to replace — this new tool shows *how much value is lost* and *how fast*, helping farmers choose the optimal replacement window.

## Data Sources

### Primary: ASAE D497 / Mississippi State Extension (P3543)

Remaining value as a percentage of new list price, derived from US auction data and widely used in agricultural cost estimation. The Farmers Weekly UK article confirms these curves broadly apply to UK machinery markets, with age being the dominant depreciation factor.

### Secondary: Farmers Weekly UK — 175 HP Tractor

Trade-in values for a 175hp tractor as percentage of discounted new price, factoring in annual hours:

| Hours/Year | 2 yrs | 4 yrs | 6 yrs | 8 yrs | 10 yrs |
|---|---|---|---|---|---|
| 500 | 72.6% | 60.3% | 49.9% | 41.2% | 34.1% |
| 750 | 70.6% | 57.0% | 45.8% | 36.7% | 29.6% |
| 1,000 | 68.8% | 54.1% | 42.5% | 33.6% | 26.9% |

### Key Insight

"The key killer is age before hours" — machines become technically dated regardless of usage. Age dominates depreciation; hours are a secondary adjustment.

---

## Reference Data to Encode

```typescript
// src/lib/depreciation-data.ts

export type MachineCategory =
  | "tractors_small"      // 80–149 HP
  | "tractors_large"      // 150+ HP
  | "combines"            // Combine harvesters, crop harvesting
  | "forage_harvesters"   // Forage harvesters, balers
  | "sprayers"            // SP and trailed sprayers
  | "tillage"             // Ploughs, cultivators, discs
  | "drills"              // Seed drills, planters
  | "miscellaneous"       // Loaders, telehandlers, other

export interface DepreciationProfile {
  label: string
  description: string
  /** Remaining value as % of list price at age 1, 2, ... 12+ years */
  remainingValueByAge: number[]
  /** Typical economic life in years */
  typicalLife: number
  /** The "steepest drop" year range, for highlighting on the graph */
  steepestDropYears: [number, number]
}

/**
 * Remaining value as % of new list price by age (years 1–12).
 * Source: ASAE D497 via Mississippi State Extension P3543.
 * Cross-referenced with Farmers Weekly UK tractor data.
 * Year 0 = 100% (purchase). Values plateau after year 12.
 */
export const DEPRECIATION_PROFILES: Record<MachineCategory, DepreciationProfile> = {
  tractors_small: {
    label: "Tractors (80–149 HP)",
    description: "Utility and mid-range tractors",
    remainingValueByAge: [
      // yr0   yr1   yr2   yr3   yr4   yr5   yr6   yr7   yr8   yr9  yr10  yr11  yr12+
        100,   68,   62,   57,   53,   49,   46,   44,   41,   39,   37,   35,   34
    ],
    typicalLife: 10,
    steepestDropYears: [0, 3],
  },
  tractors_large: {
    label: "Tractors (150+ HP)",
    description: "Large arable and heavy-duty tractors",
    remainingValueByAge: [
        100,   67,   59,   54,   49,   45,   42,   39,   36,   34,   32,   30,   28
    ],
    typicalLife: 8,
    steepestDropYears: [0, 3],
  },
  combines: {
    label: "Combine Harvesters",
    description: "Combine harvesters and crop harvesting equipment",
    remainingValueByAge: [
        100,   69,   58,   50,   44,   39,   35,   31,   28,   25,   22,   20,   18
    ],
    typicalLife: 8,
    steepestDropYears: [0, 4],
  },
  forage_harvesters: {
    label: "Forage Harvesters & Balers",
    description: "Self-propelled and trailed forage equipment, balers",
    remainingValueByAge: [
        100,   56,   50,   46,   42,   39,   37,   34,   32,   30,   28,   27,   25
    ],
    typicalLife: 10,
    steepestDropYears: [0, 2],
  },
  sprayers: {
    label: "Sprayers",
    description: "Self-propelled and trailed crop sprayers",
    remainingValueByAge: [
        100,   61,   54,   49,   45,   42,   39,   36,   34,   31,   30,   28,   26
    ],
    typicalLife: 8,
    steepestDropYears: [0, 3],
  },
  tillage: {
    label: "Tillage Equipment",
    description: "Ploughs, cultivators, disc harrows, power harrows",
    remainingValueByAge: [
        100,   61,   54,   49,   45,   42,   39,   36,   34,   31,   30,   28,   26
    ],
    typicalLife: 10,
    steepestDropYears: [0, 3],
  },
  drills: {
    label: "Drills & Planters",
    description: "Seed drills, precision planters, combination drills",
    remainingValueByAge: [
        100,   65,   60,   56,   53,   50,   48,   46,   44,   42,   40,   39,   38
    ],
    typicalLife: 10,
    steepestDropYears: [0, 3],
  },
  miscellaneous: {
    label: "Other Equipment",
    description: "Telehandlers, loaders, grain dryers, trailers, rollers",
    remainingValueByAge: [
        100,   61,   54,   49,   45,   42,   39,   36,   34,   31,   30,   28,   26
    ],
    typicalLife: 10,
    steepestDropYears: [0, 3],
  },
}

export const DATA_SOURCE = {
  name: "ASAE D497 / Mississippi State Extension",
  note: "Based on auction sale values. Actual value depends on condition, brand, and local market.",
}

/** Look up remaining value % for a given category and age */
export function getRemainingValuePct(category: MachineCategory, ageYears: number): number {
  const profile = DEPRECIATION_PROFILES[category]
  const clamped = Math.max(0, Math.min(Math.round(ageYears), 12))
  return profile.remainingValueByAge[clamped]
}

/** Calculate estimated market value */
export function getEstimatedValue(
  category: MachineCategory,
  purchasePrice: number,
  ageYears: number
): number {
  return purchasePrice * getRemainingValuePct(category, ageYears) / 100
}

/** Calculate total depreciation cost (£ lost) */
export function getDepreciationLoss(
  category: MachineCategory,
  purchasePrice: number,
  ageYears: number
): number {
  return purchasePrice - getEstimatedValue(category, purchasePrice, ageYears)
}

/** Annual depreciation cost between two years */
export function getAnnualDepreciation(
  category: MachineCategory,
  purchasePrice: number,
  fromYear: number,
  toYear: number
): number {
  const span = toYear - fromYear
  if (span <= 0) return 0
  const valueLost = getEstimatedValue(category, purchasePrice, fromYear)
    - getEstimatedValue(category, purchasePrice, toYear)
  return valueLost / span
}

/**
 * Find the "sweet spot" year — where annual depreciation cost
 * drops below a threshold (the curve flattens out).
 * Returns the year where keeping the machine another year
 * costs less than the average annual depreciation so far.
 */
export function findSweetSpot(category: MachineCategory): number {
  const profile = DEPRECIATION_PROFILES[category]
  const values = profile.remainingValueByAge
  for (let yr = 2; yr < values.length - 1; yr++) {
    const marginalLoss = values[yr - 1] - values[yr]       // loss this year
    const avgLossSoFar = (100 - values[yr]) / yr           // average annual loss
    if (marginalLoss < avgLossSoFar) return yr
  }
  return profile.typicalLife
}
```

---

## Visual Design

### Panel Placement

A new **CollapsibleSection** panel titled "Depreciation Curve" placed on:
- **Cost per Hectare tab** — below the "What Did You Pay" section (near purchase price / sell after / sale price inputs)
- **Cost per Hour tab** — same position
- **Replacement Planner tab** — as a standalone helper section at the bottom

### Main View

```
┌─ Depreciation Curve ──────────────────────────── [▼] ─┐
│                                                         │
│  Machine type:  [Tractors (150+ HP)        ▼]          │
│  Purchase price: £126,000  (from your input above)     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  £126k ●                                        │   │
│  │        \                                        │   │
│  │         \         YOUR MACHINE                  │   │
│  │  £84k    ·─·         ↓                          │   │
│  │              ·─·─────●─── 8 yrs: £36k (29%)    │   │
│  │                  ·─·─·─·─·─·                    │   │
│  │  £36k                          ·─·─·─·─·──     │   │
│  │                                                  │   │
│  │  Yr 0   2    4    6    8   10   12              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │  AFTER 8 YEARS                                │      │
│  │                                               │      │
│  │  Estimated value     £36,288                  │      │
│  │  Value lost          £89,712  (71%)           │      │
│  │  Avg depreciation    £11,214 / year           │      │
│  │                                               │      │
│  │  ██████████████████████████████░░░░░░░░░░░░   │      │
│  │  71% lost ─────────────────── 29% remaining   │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  Sweet spot: Year 5 — after this, annual               │
│  depreciation slows below average. Consider            │
│  keeping the machine longer past this point.           │
│                                                         │
│  [Use £36,288 as sale price] ← fills "Expected         │
│                                 sale price" input       │
│                                                         │
│  Source: ASAE D497 / Mississippi State Extension        │
│  Note: Based on auction values. Actual value varies.   │
└─────────────────────────────────────────────────────────┘
```

### Visual Elements

1. **SVG depreciation curve** — smooth line graph showing value (£ or %) over 12 years
   - Filled area below the line (gradient fade)
   - Dot markers at each year
   - Highlighted "steep zone" (years 0–3 typically) with a shaded background
   - "You are here" marker at the user's current `yearsOwned` value, pulled from the form
   - Horizontal dashed line at the current estimated value
   - Year labels on X axis, £ values on Y axis

2. **Summary card** — large text showing value remaining, value lost (£ and %), and average annual depreciation

3. **Percentage bar** — horizontal split bar: left side (coloured) = % lost, right side (grey) = % remaining

4. **Sweet spot callout** — a small badge on the graph and a text note explaining the optimal hold period

5. **Category comparison mini-chart** (optional, shown when expanded) — overlay 2–3 category curves to compare depreciation rates:
```
│  Tractors 150+ ─────
│  Combines ─ ─ ─ ─ ─
│  Drills · · · · · · ·
```

### Year Slider

Below the graph, a **year slider** (range input, 0–12) lets the farmer scrub through time and see the value update in real time. This is synced with the `yearsOwned` input on the parent form — changing either updates the other.

---

## Component Props

```typescript
interface DepreciationPanelProps {
  /** Fills the "Expected sale price" input on the parent form */
  onApplySalePrice: (value: number) => void
  /** Current purchase price from the form (drives the £ scale) */
  purchasePrice?: number
  /** Current years owned from the form (positions the "you are here" marker) */
  yearsOwned?: number
  /** Callback when the user changes years on the slider */
  onYearsChange?: (years: number) => void
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/depreciation-data.ts` | Depreciation profiles, lookup functions, sweet spot calculator |
| `src/lib/__tests__/depreciation-data.test.ts` | Data validation and function tests |
| `src/components/DepreciationPanel.tsx` | Visual panel with SVG graph, summary card, slider |
| `src/components/DepreciationCurve.tsx` | Pure SVG chart component (reusable) |
| `src/components/__tests__/DepreciationPanel.test.tsx` | Component tests |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/CostPerHectare.tsx` | Add `<DepreciationPanel>` below "What Did You Pay" section, wire `onApplySalePrice` to `update("salePrice")`, pass `purchasePrice` and `yearsOwned` |
| `src/components/CostPerHour.tsx` | Same integration as CostPerHectare |
| `src/components/ReplacementPlanner.tsx` | Add `<DepreciationPanel>` as a reference helper at the bottom |

---

## RED Tests

### Data tests (`depreciation-data.test.ts`)

```typescript
import {
  DEPRECIATION_PROFILES,
  getRemainingValuePct,
  getEstimatedValue,
  getDepreciationLoss,
  getAnnualDepreciation,
  findSweetSpot,
} from '@/lib/depreciation-data'

describe('DEPRECIATION_PROFILES', () => {
  it('has 8 machine categories', () => {
    expect(Object.keys(DEPRECIATION_PROFILES)).toHaveLength(8)
  })

  it('every profile starts at 100% for year 0', () => {
    for (const profile of Object.values(DEPRECIATION_PROFILES)) {
      expect(profile.remainingValueByAge[0]).toBe(100)
    }
  })

  it('every profile has 13 entries (years 0–12)', () => {
    for (const profile of Object.values(DEPRECIATION_PROFILES)) {
      expect(profile.remainingValueByAge).toHaveLength(13)
    }
  })

  it('values are monotonically decreasing', () => {
    for (const [key, profile] of Object.entries(DEPRECIATION_PROFILES)) {
      for (let i = 1; i < profile.remainingValueByAge.length; i++) {
        expect(profile.remainingValueByAge[i])
          .toBeLessThanOrEqual(profile.remainingValueByAge[i - 1])
      }
    }
  })

  it('all values are between 0 and 100', () => {
    for (const profile of Object.values(DEPRECIATION_PROFILES)) {
      profile.remainingValueByAge.forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(100)
      })
    }
  })
})

describe('getRemainingValuePct', () => {
  it('tractors_large year 0 = 100%', () => {
    expect(getRemainingValuePct('tractors_large', 0)).toBe(100)
  })

  it('tractors_large year 1 = 67%', () => {
    expect(getRemainingValuePct('tractors_large', 1)).toBe(67)
  })

  it('combines year 5 = 39%', () => {
    expect(getRemainingValuePct('combines', 5)).toBe(39)
  })

  it('clamps to year 12 for age > 12', () => {
    expect(getRemainingValuePct('combines', 20)).toBe(18)
  })

  it('clamps to year 0 for negative age', () => {
    expect(getRemainingValuePct('combines', -5)).toBe(100)
  })
})

describe('getEstimatedValue', () => {
  it('£126k tractor at 8 years', () => {
    // 150+ HP tractor, year 8 = 36% remaining
    expect(getEstimatedValue('tractors_large', 126000, 8))
      .toBeCloseTo(45360, -2)
  })

  it('£300k combine at 5 years', () => {
    // Combine, year 5 = 39%
    expect(getEstimatedValue('combines', 300000, 5))
      .toBeCloseTo(117000, -2)
  })
})

describe('getDepreciationLoss', () => {
  it('£126k tractor at 8 years loses ~£80k', () => {
    const loss = getDepreciationLoss('tractors_large', 126000, 8)
    expect(loss).toBeCloseTo(80640, -2)
  })
})

describe('getAnnualDepreciation', () => {
  it('£126k tractor years 0–8 = ~£10k/year', () => {
    const annual = getAnnualDepreciation('tractors_large', 126000, 0, 8)
    expect(annual).toBeCloseTo(10080, -2)
  })

  it('returns 0 for zero span', () => {
    expect(getAnnualDepreciation('combines', 300000, 5, 5)).toBe(0)
  })
})

describe('findSweetSpot', () => {
  it('returns a year between 2 and 12', () => {
    for (const key of Object.keys(DEPRECIATION_PROFILES)) {
      const yr = findSweetSpot(key as any)
      expect(yr).toBeGreaterThanOrEqual(2)
      expect(yr).toBeLessThanOrEqual(12)
    }
  })

  it('combines sweet spot is around year 4–6', () => {
    const yr = findSweetSpot('combines')
    expect(yr).toBeGreaterThanOrEqual(3)
    expect(yr).toBeLessThanOrEqual(7)
  })
})
```

### Component tests (`DepreciationPanel.test.tsx`)

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { DepreciationPanel } from '@/components/DepreciationPanel'

it('renders panel title', () => {
  render(<DepreciationPanel onApplySalePrice={vi.fn()} />)
  expect(screen.getByText(/Depreciation Curve/i)).toBeInTheDocument()
})

it('renders machine category dropdown', () => {
  render(<DepreciationPanel onApplySalePrice={vi.fn()} />)
  expect(screen.getByRole('combobox')).toBeInTheDocument()
})

it('renders SVG chart', () => {
  const { container } = render(
    <DepreciationPanel onApplySalePrice={vi.fn()} purchasePrice={126000} />
  )
  expect(container.querySelector('svg')).toBeInTheDocument()
})

it('shows estimated value for given years', () => {
  render(
    <DepreciationPanel
      onApplySalePrice={vi.fn()}
      purchasePrice={126000}
      yearsOwned={8}
    />
  )
  // Should show the estimated value somewhere
  expect(screen.getByText(/£/)).toBeInTheDocument()
})

it('shows percentage lost', () => {
  render(
    <DepreciationPanel
      onApplySalePrice={vi.fn()}
      purchasePrice={100000}
      yearsOwned={5}
    />
  )
  expect(screen.getByText(/%/)).toBeInTheDocument()
})

it('shows sweet spot callout', () => {
  render(
    <DepreciationPanel onApplySalePrice={vi.fn()} purchasePrice={126000} />
  )
  expect(screen.getByText(/sweet spot/i)).toBeInTheDocument()
})

it('calls onApplySalePrice when button clicked', () => {
  const onApply = vi.fn()
  render(
    <DepreciationPanel
      onApplySalePrice={onApply}
      purchasePrice={126000}
      yearsOwned={8}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: /use.*sale price/i }))
  expect(onApply).toHaveBeenCalledWith(expect.any(Number))
})

it('shows source attribution', () => {
  render(<DepreciationPanel onApplySalePrice={vi.fn()} />)
  expect(screen.getByText(/ASAE/i)).toBeInTheDocument()
})

it('has year slider', () => {
  render(
    <DepreciationPanel onApplySalePrice={vi.fn()} purchasePrice={126000} />
  )
  expect(screen.getByRole('slider')).toBeInTheDocument()
})

it('updates estimated value when slider changes', () => {
  const onYearsChange = vi.fn()
  render(
    <DepreciationPanel
      onApplySalePrice={vi.fn()}
      purchasePrice={100000}
      yearsOwned={2}
      onYearsChange={onYearsChange}
    />
  )
  const slider = screen.getByRole('slider')
  fireEvent.change(slider, { target: { value: '6' } })
  expect(onYearsChange).toHaveBeenCalledWith(6)
})
```

---

## GREEN Tests

All tests above pass. Panel renders with interactive graph, slider syncs with form, "Use as sale price" button fills the expected sale price input.

---

## Depreciation Profile Summary Table

For quick reference — what a £100,000 machine is worth at each age:

| Age | Tractors (small) | Tractors (large) | Combines | Forage | Sprayers | Tillage | Drills | Other |
|-----|---|---|---|---|---|---|---|---|
| 0 | £100k | £100k | £100k | £100k | £100k | £100k | £100k | £100k |
| 1 | £68k | £67k | £69k | £56k | £61k | £61k | £65k | £61k |
| 2 | £62k | £59k | £58k | £50k | £54k | £54k | £60k | £54k |
| 3 | £57k | £54k | £50k | £46k | £49k | £49k | £56k | £49k |
| 4 | £53k | £49k | £44k | £42k | £45k | £45k | £53k | £45k |
| 5 | £49k | £45k | £39k | £39k | £42k | £42k | £50k | £42k |
| 6 | £46k | £42k | £35k | £37k | £39k | £39k | £48k | £39k |
| 7 | £44k | £39k | £31k | £34k | £36k | £36k | £46k | £36k |
| 8 | £41k | £36k | £28k | £32k | £34k | £34k | £44k | £34k |
| 10 | £37k | £32k | £22k | £28k | £30k | £30k | £40k | £30k |
| 12+ | £34k | £28k | £18k | £25k | £26k | £26k | £38k | £26k |

Key observations:
- **Combines** depreciate fastest — 50% gone by year 3, 82% gone by year 12
- **Drills & planters** hold value best — only 35% lost after 5 years
- **Forage harvesters** have the steepest year-1 drop (44% lost immediately)
- **All categories** lose 30–45% in the first 3 years — the "cliff"

---

## Acceptance Criteria

- [ ] Panel visible on Cost per Hectare, Cost per Hour, and Replacement Planner tabs
- [ ] Collapsed by default (uses `CollapsibleSection`)
- [ ] 8 machine categories selectable via dropdown
- [ ] SVG depreciation curve renders with filled area, dot markers, and axis labels
- [ ] "You are here" marker shows at the current `yearsOwned` position
- [ ] Summary card shows estimated value (£), value lost (£ and %), and average annual depreciation
- [ ] Percentage bar visualises proportion lost vs remaining
- [ ] Sweet spot year calculated and shown as a callout
- [ ] Year slider (0–12) scrubs through the curve in real time
- [ ] Slider syncs with `yearsOwned` form input (bidirectional)
- [ ] "Use as sale price" button fills the Expected sale price input
- [ ] Source and caveat attribution footer
- [ ] All values update when purchase price or category changes
- [ ] All tests pass
- [ ] `npm run build` succeeds with no TypeScript errors
