# SPEC-10: Contracting Income Planner (Tab 6)

## Goal

Add a new tab that lets the farmer model income from offering contracting services to other farmers. For each service the farmer offers (e.g. combining, ploughing, spraying), the planner captures the charge rate, annual volume, and own cost, then calculates per-service profit and an overall contracting summary.

This answers a new question the app didn't address before:

> **"If I offer my machinery as a contracting service, will it actually make money?"**

## Data Model

### Per-Service Card

```typescript
// src/lib/types.ts (additions)

export type ChargeUnit = "ha" | "hr" | "bale" | "tonne" | "head" | "m"

export interface ContractingService {
  id: string
  name: string                    // e.g. "Combining cereals", "Ploughing"
  chargeRate: number              // what the farmer charges clients (£/unit)
  chargeUnit: ChargeUnit          // unit of the charge rate
  annualVolume: number            // how many units per year (ha, hrs, bales, etc.)
  ownCostPerUnit: number          // own cost to deliver this service (£/unit)
  additionalCosts: number         // annual overhead: insurance, transport, wear (£/year)
  linkedMachineSource: string | null  // "hectare:0" or "hour:2" — index into saved machines
}

export interface ContractingIncomeState {
  services: ContractingService[]
}
```

### Calculations

```
Per service:
  grossIncome       = chargeRate * annualVolume
  totalOwnCost      = (ownCostPerUnit * annualVolume) + additionalCosts
  profitPerUnit      = chargeRate - ownCostPerUnit - (additionalCosts / annualVolume)
  annualProfit       = grossIncome - totalOwnCost
  marginPct          = (annualProfit / grossIncome) * 100

Overall summary:
  totalGrossIncome   = SUM(grossIncome) across all services
  totalCosts         = SUM(totalOwnCost) across all services
  totalProfit        = totalGrossIncome - totalCosts
  overallMarginPct   = (totalProfit / totalGrossIncome) * 100
```

These calculations should be implemented as pure functions in `src/lib/calculations.ts`.

```typescript
// src/lib/calculations.ts (additions)

export interface ContractingServiceResults {
  grossIncome: number
  totalOwnCost: number
  profitPerUnit: number
  annualProfit: number
  marginPct: number
}

export interface ContractingSummary {
  totalGrossIncome: number
  totalCosts: number
  totalProfit: number
  overallMarginPct: number
  serviceCount: number
}

export function calculateContractingService(
  chargeRate: number,
  annualVolume: number,
  ownCostPerUnit: number,
  additionalCosts: number
): ContractingServiceResults {
  const grossIncome = chargeRate * annualVolume
  const totalOwnCost = (ownCostPerUnit * annualVolume) + additionalCosts
  const annualProfit = grossIncome - totalOwnCost
  const profitPerUnit = annualVolume > 0
    ? chargeRate - ownCostPerUnit - (additionalCosts / annualVolume)
    : 0
  const marginPct = grossIncome > 0 ? (annualProfit / grossIncome) * 100 : 0
  return { grossIncome, totalOwnCost, profitPerUnit, annualProfit, marginPct }
}

export function calculateContractingSummary(
  services: ContractingServiceResults[]
): ContractingSummary {
  const totalGrossIncome = services.reduce((sum, s) => sum + s.grossIncome, 0)
  const totalCosts = services.reduce((sum, s) => sum + s.totalOwnCost, 0)
  const totalProfit = totalGrossIncome - totalCosts
  const overallMarginPct = totalGrossIncome > 0
    ? (totalProfit / totalGrossIncome) * 100
    : 0
  return {
    totalGrossIncome,
    totalCosts,
    totalProfit,
    overallMarginPct,
    serviceCount: services.length,
  }
}
```

## "Pull from Saved Machine" Feature

Each service card has a **"Pull from saved machine"** dropdown that lists all saved machines from Tab 1 (Cost per Hectare) and Tab 2 (Cost per Hour). When selected:

1. Auto-fills `ownCostPerUnit` with the machine's calculated `totalCostPerHa` or `totalCostPerHr`
2. Auto-fills `chargeUnit` with `"ha"` or `"hr"` matching the source tab
3. Sets `linkedMachineSource` to e.g. `"hectare:0"` or `"hour:2"` for display purposes
4. Does **not** lock the field — the farmer can override the auto-filled value

The dropdown groups machines by source tab:

```
Pull from saved machine...
── Cost per Hectare ──
  6m Drill (£30.27/ha)
  Sprayer (£16.52/ha)
── Cost per Hour ──
  Telehandler (£65.56/hr)
```

This requires the component to receive the current `AppState` (or at minimum the saved machines from both cost tabs) as props.

## NAAC Rate Browser

The existing `ContractorRatesPanel` component (SPEC-04, extended in SPEC-09) is reused here in a **bidirectional** way:

- On Tabs 1 & 2, NAAC rates help the farmer understand what contractors charge **them**
- On Tab 6, the same NAAC rates help the farmer decide what to charge **their clients**

The panel is embedded in each service card with `onApply` wired to fill the `chargeRate` field instead of the `contractorCharge` field. No changes to the `ContractorRatesPanel` component are needed — the `onApply` callback is already generic.

## Visual Design

```
┌──────────────────────────────────────────────────────────┐
│  CONTRACTING INCOME PLANNER                    [?] Help  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Model income from offering your machinery to others.    │
│                                                          │
│  [+ Add Service]                                         │
│                                                          │
│  ┌─ Service 1 ──────────────────────────── [Delete] ──┐  │
│  │                                                     │  │
│  │  Service name:    [Combining cereals           ]    │  │
│  │                                                     │  │
│  │  Pull from saved machine: [Select...         ▼]    │  │
│  │                                                     │  │
│  │  Charge rate:     [£119.34 ] per [ha  ▼]           │  │
│  │  Annual volume:   [400     ] ha                     │  │
│  │  Own cost/unit:   [85.00   ] £/ha                   │  │
│  │  Additional costs:[2,000   ] £/year                 │  │
│  │                                                     │  │
│  │  ┌─ NAAC Rates (what others charge) ── [▼] ──────┐ │  │
│  │  │  (ContractorRatesPanel — collapsed by default)  │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │                                                     │  │
│  │  ── RESULTS ─────────────────────────────────────── │  │
│  │                                                     │  │
│  │  Gross income:     £47,736/year                     │  │
│  │  Total costs:      £36,000/year                     │  │
│  │  Profit/unit:      £29.34/ha                        │  │
│  │  Annual profit:    £11,736                          │  │
│  │  Margin:           24.6%                            │  │
│  │                                                     │  │
│  │  [GREEN BANNER]                                     │  │
│  │  Profitable service — 24.6% margin                  │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Service 2 ──────────────────────────── [Delete] ──┐  │
│  │  ...                                                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  [+ Add Service]                                         │
│                                                          │
│  ================================================================  │
│  OVERALL CONTRACTING SUMMARY                                       │
│  ================================================================  │
│                                                          │
│  Total services:       3                                 │
│  Total gross income:   £82,500/year                      │
│  Total costs:          £61,200/year                      │
│  Total profit:         £21,300/year                      │
│  Overall margin:       25.8%                             │
│                                                          │
│  [GREEN BANNER]                                          │
│  Contracting is profitable overall — 25.8% margin        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Traffic-Light Banners

Per-service and overall summary banners use these thresholds:

| Margin | Colour | Message |
|--------|--------|---------|
| > 20% | Green | "Profitable service — X% margin" |
| 0–20% | Amber | "Marginal — only X% margin, review your costs" |
| < 0% | Red | "Loss-making — you're spending more than you earn" |

### Service Card Defaults

When adding a new service, pre-fill with:

| Field | Default |
|-------|---------|
| name | "New Service" |
| chargeRate | 0 |
| chargeUnit | "ha" |
| annualVolume | 0 |
| ownCostPerUnit | 0 |
| additionalCosts | 0 |
| linkedMachineSource | null |

Each service gets a unique `id` via `crypto.randomUUID()`.

## Component Props

```typescript
interface ContractingIncomePlannerProps {
  initialState: ContractingIncomeState
  onChange: (state: ContractingIncomeState) => void
  /** Saved machines from Tabs 1 & 2, for the "Pull from saved machine" dropdown */
  savedHectareMachines: SavedMachine<CostPerHectareInputs>[]
  savedHourMachines: SavedMachine<CostPerHourInputs>[]
}
```

## localStorage Persistence

### AppState Extension

```typescript
// src/lib/types.ts — AppState gains a new field

export interface AppState {
  version: number
  lastSaved: string
  costPerHectare: { ... }
  costPerHour: { ... }
  compareMachines: { ... }
  replacementPlanner: ReplacementPlannerState
  contractingIncome: ContractingIncomeState    // NEW
}
```

### Version Migration

Bump `CURRENT_VERSION` from `1` to `2` in `src/lib/storage.ts`.

Add migration v1 -> v2:

```typescript
// v1 -> v2: Add contractingIncome field
(state) => ({
  ...state,
  version: 2,
  contractingIncome: { services: [] },
}),
```

Update `hasValidStructure` to accept states with or without `contractingIncome` (the migration adds it if missing).

Update `createDefaultState` to include:
```typescript
contractingIncome: {
  services: [],
},
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/ContractingIncomePlanner.tsx` | Tab 6 — service cards, NAAC reuse, summary |
| `src/components/__tests__/ContractingIncomePlanner.test.tsx` | Component tests |
| `src/lib/__tests__/contracting-calculations.test.ts` | Pure calculation function tests |

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `ChargeUnit`, `ContractingService`, `ContractingIncomeState` types; extend `AppState` |
| `src/lib/calculations.ts` | Add `calculateContractingService()`, `calculateContractingSummary()` |
| `src/lib/storage.ts` | Bump version to 2, add v1->v2 migration, update `createDefaultState` and `hasValidStructure` |
| `src/App.tsx` | Add Tab 6 trigger + content, wire state callbacks, pass saved machines as props |

## RED Tests

### Calculation tests (`contracting-calculations.test.ts`)

```typescript
import {
  calculateContractingService,
  calculateContractingSummary,
} from '@/lib/calculations'

describe('calculateContractingService', () => {
  it('calculates gross income', () => {
    const r = calculateContractingService(119.34, 400, 85, 2000)
    expect(r.grossIncome).toBeCloseTo(47736, 0)
  })

  it('calculates total own cost', () => {
    const r = calculateContractingService(119.34, 400, 85, 2000)
    expect(r.totalOwnCost).toBeCloseTo(36000, 0)
  })

  it('calculates profit per unit', () => {
    const r = calculateContractingService(119.34, 400, 85, 2000)
    // 119.34 - 85 - (2000/400) = 119.34 - 85 - 5 = 29.34
    expect(r.profitPerUnit).toBeCloseTo(29.34, 2)
  })

  it('calculates annual profit', () => {
    const r = calculateContractingService(119.34, 400, 85, 2000)
    expect(r.annualProfit).toBeCloseTo(11736, 0)
  })

  it('calculates margin percentage', () => {
    const r = calculateContractingService(119.34, 400, 85, 2000)
    // 11736 / 47736 * 100 = 24.58%
    expect(r.marginPct).toBeCloseTo(24.58, 0)
  })

  it('handles zero volume gracefully', () => {
    const r = calculateContractingService(100, 0, 50, 1000)
    expect(r.grossIncome).toBe(0)
    expect(r.profitPerUnit).toBe(0)
    expect(r.marginPct).toBe(0)
  })

  it('returns negative margin for loss-making service', () => {
    const r = calculateContractingService(50, 100, 60, 500)
    // gross = 5000, cost = 6500, profit = -1500
    expect(r.annualProfit).toBeLessThan(0)
    expect(r.marginPct).toBeLessThan(0)
  })
})

describe('calculateContractingSummary', () => {
  it('aggregates multiple services', () => {
    const services = [
      calculateContractingService(119.34, 400, 85, 2000),
      calculateContractingService(50, 200, 30, 500),
    ]
    const summary = calculateContractingSummary(services)
    expect(summary.serviceCount).toBe(2)
    expect(summary.totalGrossIncome).toBeCloseTo(47736 + 10000, 0)
    expect(summary.totalProfit).toBeCloseTo(11736 + 3500, 0)
  })

  it('handles empty services array', () => {
    const summary = calculateContractingSummary([])
    expect(summary.totalGrossIncome).toBe(0)
    expect(summary.totalProfit).toBe(0)
    expect(summary.overallMarginPct).toBe(0)
    expect(summary.serviceCount).toBe(0)
  })

  it('calculates overall margin', () => {
    const services = [
      calculateContractingService(100, 100, 70, 0),
      calculateContractingService(100, 100, 90, 0),
    ]
    const summary = calculateContractingSummary(services)
    // total income = 20000, total cost = 16000, profit = 4000
    expect(summary.overallMarginPct).toBeCloseTo(20, 0)
  })
})
```

### Component tests (`ContractingIncomePlanner.test.tsx`)

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ContractingIncomePlanner } from '@/components/ContractingIncomePlanner'

const emptyState = { services: [] }

it('renders tab title', () => {
  render(
    <ContractingIncomePlanner
      initialState={emptyState}
      onChange={vi.fn()}
      savedHectareMachines={[]}
      savedHourMachines={[]}
    />
  )
  expect(screen.getByText(/Contracting Income/i)).toBeInTheDocument()
})

it('shows "Add Service" button', () => {
  render(
    <ContractingIncomePlanner
      initialState={emptyState}
      onChange={vi.fn()}
      savedHectareMachines={[]}
      savedHourMachines={[]}
    />
  )
  expect(screen.getByRole('button', { name: /add service/i })).toBeInTheDocument()
})

it('adds a service card when button clicked', () => {
  const onChange = vi.fn()
  render(
    <ContractingIncomePlanner
      initialState={emptyState}
      onChange={onChange}
      savedHectareMachines={[]}
      savedHourMachines={[]}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: /add service/i }))
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      services: expect.arrayContaining([
        expect.objectContaining({ name: 'New Service' }),
      ]),
    })
  )
})

it('shows service results when inputs are filled', () => {
  const service = {
    id: 'test-1',
    name: 'Combining',
    chargeRate: 119.34,
    chargeUnit: 'ha' as const,
    annualVolume: 400,
    ownCostPerUnit: 85,
    additionalCosts: 2000,
    linkedMachineSource: null,
  }
  render(
    <ContractingIncomePlanner
      initialState={{ services: [service] }}
      onChange={vi.fn()}
      savedHectareMachines={[]}
      savedHourMachines={[]}
    />
  )
  expect(screen.getByText(/gross income/i)).toBeInTheDocument()
  expect(screen.getByText(/£47,736/)).toBeInTheDocument()
})

it('shows traffic-light banner based on margin', () => {
  const profitableService = {
    id: 'test-1',
    name: 'Combining',
    chargeRate: 119.34,
    chargeUnit: 'ha' as const,
    annualVolume: 400,
    ownCostPerUnit: 85,
    additionalCosts: 2000,
    linkedMachineSource: null,
  }
  const { container } = render(
    <ContractingIncomePlanner
      initialState={{ services: [profitableService] }}
      onChange={vi.fn()}
      savedHectareMachines={[]}
      savedHourMachines={[]}
    />
  )
  // 24.6% margin = green banner
  expect(container.querySelector('[data-banner="green"]')).toBeInTheDocument()
})

it('shows loss-making banner for unprofitable service', () => {
  const lossService = {
    id: 'test-2',
    name: 'Ploughing',
    chargeRate: 50,
    chargeUnit: 'ha' as const,
    annualVolume: 100,
    ownCostPerUnit: 60,
    additionalCosts: 500,
    linkedMachineSource: null,
  }
  const { container } = render(
    <ContractingIncomePlanner
      initialState={{ services: [lossService] }}
      onChange={vi.fn()}
      savedHectareMachines={[]}
      savedHourMachines={[]}
    />
  )
  expect(container.querySelector('[data-banner="red"]')).toBeInTheDocument()
})

it('shows overall summary when multiple services exist', () => {
  const services = [
    {
      id: 'test-1', name: 'Combining', chargeRate: 119.34, chargeUnit: 'ha' as const,
      annualVolume: 400, ownCostPerUnit: 85, additionalCosts: 2000, linkedMachineSource: null,
    },
    {
      id: 'test-2', name: 'Spraying', chargeRate: 16.52, chargeUnit: 'ha' as const,
      annualVolume: 800, ownCostPerUnit: 10, additionalCosts: 500, linkedMachineSource: null,
    },
  ]
  render(
    <ContractingIncomePlanner
      initialState={{ services }}
      onChange={vi.fn()}
      savedHectareMachines={[]}
      savedHourMachines={[]}
    />
  )
  expect(screen.getByText(/overall/i)).toBeInTheDocument()
  expect(screen.getByText(/total.*profit/i)).toBeInTheDocument()
})

it('shows "Pull from saved machine" dropdown with machines from both tabs', () => {
  const hectareMachines = [
    { name: '6m Drill', inputs: { purchasePrice: 126000, yearsOwned: 8, salePrice: 34000, hectaresPerYear: 1200, interestRate: 2, insuranceRate: 2, storageRate: 1, workRate: 4, labourCost: 14, fuelPrice: 0.53, fuelUse: 20, repairsPct: 2, contractorCharge: 76 } },
  ]
  const hourMachines = [
    { name: 'Telehandler', inputs: { purchasePrice: 92751, yearsOwned: 7, salePrice: 40000, hoursPerYear: 700, interestRate: 2, insuranceRate: 2, storageRate: 1, haPerHr: 4, fuelConsumptionPerHr: 14, fuelPrice: 0.60, repairsPct: 1, labourCost: 14, contractorCharge: 45 } },
  ]
  const service = {
    id: 'test-1', name: 'New Service', chargeRate: 0, chargeUnit: 'ha' as const,
    annualVolume: 0, ownCostPerUnit: 0, additionalCosts: 0, linkedMachineSource: null,
  }
  render(
    <ContractingIncomePlanner
      initialState={{ services: [service] }}
      onChange={vi.fn()}
      savedHectareMachines={hectareMachines}
      savedHourMachines={hourMachines}
    />
  )
  expect(screen.getByText(/pull from saved machine/i)).toBeInTheDocument()
})

it('deletes a service when delete button clicked', () => {
  const onChange = vi.fn()
  const services = [
    {
      id: 'test-1', name: 'Combining', chargeRate: 100, chargeUnit: 'ha' as const,
      annualVolume: 400, ownCostPerUnit: 85, additionalCosts: 0, linkedMachineSource: null,
    },
  ]
  render(
    <ContractingIncomePlanner
      initialState={{ services }}
      onChange={onChange}
      savedHectareMachines={[]}
      savedHourMachines={[]}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: /delete/i }))
  expect(onChange).toHaveBeenCalledWith({ services: [] })
})
```

## GREEN Tests

All tests above pass. Service cards render with live results, NAAC panel reused, "Pull from saved machine" auto-fills own cost, traffic-light banners display correctly.

## Cross-References

- **SPEC-04** / **SPEC-09**: NAAC `ContractorRatesPanel` reused with `onApply` wired to `chargeRate` field
- **SPECS.md**: Tab count updated to 7, localStorage schema updated, file structure updated
- **SPEC-11**: This tab's data feeds into the Profitability Overview

## Acceptance Criteria

- [ ] New "Contracting Income" tab visible in the tab bar
- [ ] "Add Service" creates a new service card with default values
- [ ] Service card has inputs: name, charge rate, charge unit dropdown, annual volume, own cost/unit, additional costs
- [ ] "Pull from saved machine" dropdown lists machines from Tab 1 and Tab 2
- [ ] Selecting a saved machine auto-fills own cost/unit and charge unit
- [ ] NAAC rates panel embedded in each service card, collapsed by default
- [ ] NAAC "Use" button fills the charge rate (not contractor charge)
- [ ] Per-service results: gross income, total costs, profit/unit, annual profit, margin %
- [ ] Traffic-light banners: green (>20% margin), amber (0–20%), red (<0%)
- [ ] Overall contracting summary shown when at least one service exists
- [ ] Delete button removes a service card
- [ ] All inputs auto-save to localStorage (debounced, via existing `useAutoSave`)
- [ ] Version migration v1->v2 adds empty `contractingIncome` to existing data
- [ ] All tests pass
- [ ] `npm run build` succeeds with no TypeScript errors
