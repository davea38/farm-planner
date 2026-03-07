# SPEC-11: Profitability Overview (Tab 7)

## Goal

Add a new tab that combines **all income** with **all costs** from across the app into a single profitability dashboard. The farmer can see at a glance whether their machinery operation is profitable or loss-making, and how much contracting income offsets ownership costs.

This answers the final question the app didn't address before:

> **"Overall, is owning all this machinery realistically profitable or am I losing money?"**

## Data Sources (Cross-Tab)

The Profitability Overview pulls data from other tabs — it does not have its own inputs (except one toggle). All figures are read-only on this tab.

### Income Sources

| Source | Where it comes from | Field |
|--------|-------------------|-------|
| Farm income | Replacement Planner (Tab 5) | `replacementPlanner.farmIncome` |
| Contracting income | Contracting Income Planner (Tab 6, SPEC-10) | `contractingIncome.services` — sum of all `grossIncome` |

### Cost Sources

| Source | Where it comes from | Calculation |
|--------|-------------------|-------------|
| Replacement costs | Replacement Planner (Tab 5) | `replacementPlanner` — `averageAnnualCost` from the replacement summary |
| Running costs (per-ha machines) | Cost per Hectare (Tab 1) | Sum of `totalCostPerHa * hectaresPerYear` for all saved machines |
| Running costs (per-hr machines) | Cost per Hour (Tab 2) | Sum of `totalCostPerHr * hoursPerYear` for all saved machines |
| Contracting costs | Contracting Income Planner (Tab 6, SPEC-10) | Sum of all service `totalOwnCost` values |

## Calculations

```typescript
// src/lib/calculations.ts (additions)

export interface ProfitabilityInputs {
  farmIncome: number
  contractingGrossIncome: number
  contractingCosts: number
  replacementAnnualCost: number
  runningCostsHectare: number       // total annual running cost from all per-ha machines
  runningCostsHour: number          // total annual running cost from all per-hr machines
}

export interface ProfitabilityResults {
  // Income
  totalIncome: number               // farmIncome + contractingGrossIncome
  farmIncomeAmount: number
  contractingIncomeAmount: number

  // Costs
  totalCosts: number                // replacement + running + contracting costs
  replacementCosts: number
  totalRunningCosts: number         // runningCostsHectare + runningCostsHour
  contractingCosts: number

  // Net position
  netPosition: number               // totalIncome - totalCosts
  machineryCostPctOfIncome: number   // (totalCosts / totalIncome) * 100
  contractingOffsetPct: number       // (contractingGrossIncome / totalCosts) * 100

  // "With vs Without Contracting" comparison
  netWithoutContracting: number      // farmIncome - (totalCosts - contractingCosts)
  netWithContracting: number         // totalIncome - totalCosts (same as netPosition)
  contractingNetContribution: number // netWithContracting - netWithoutContracting
}

export function calculateProfitability(
  inputs: ProfitabilityInputs
): ProfitabilityResults {
  const totalIncome = inputs.farmIncome + inputs.contractingGrossIncome
  const totalRunningCosts = inputs.runningCostsHectare + inputs.runningCostsHour
  const totalCosts = inputs.replacementAnnualCost + totalRunningCosts + inputs.contractingCosts
  const netPosition = totalIncome - totalCosts

  const machineryCostPctOfIncome = totalIncome > 0
    ? (totalCosts / totalIncome) * 100
    : 0

  const contractingOffsetPct = totalCosts > 0
    ? (inputs.contractingGrossIncome / totalCosts) * 100
    : 0

  // Costs without contracting = total costs minus contracting-specific costs
  const costsWithoutContracting = inputs.replacementAnnualCost + totalRunningCosts
  const netWithoutContracting = inputs.farmIncome - costsWithoutContracting
  const netWithContracting = netPosition
  const contractingNetContribution = netWithContracting - netWithoutContracting

  return {
    totalIncome,
    farmIncomeAmount: inputs.farmIncome,
    contractingIncomeAmount: inputs.contractingGrossIncome,
    totalCosts,
    replacementCosts: inputs.replacementAnnualCost,
    totalRunningCosts,
    contractingCosts: inputs.contractingCosts,
    netPosition,
    machineryCostPctOfIncome,
    contractingOffsetPct,
    netWithoutContracting,
    netWithContracting,
    contractingNetContribution,
  }
}
```

## Visual Design

```
┌──────────────────────────────────────────────────────────────┐
│  PROFITABILITY OVERVIEW                            [?] Help  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  All figures are pulled from your other tabs.                │
│  Change your inputs there to update the numbers here.        │
│                                                              │
│  ════════════════════════════════════════════════════════     │
│  INCOME                                                      │
│  ════════════════════════════════════════════════════════     │
│                                                              │
│  Farm income (from Replacement Planner):    £350,000/year    │
│  Contracting income (from Tab 6):           £82,500/year     │
│                                                   ──────     │
│  TOTAL INCOME:                              £432,500/year    │
│                                                              │
│  ════════════════════════════════════════════════════════     │
│  COSTS                                                       │
│  ════════════════════════════════════════════════════════     │
│                                                              │
│  Replacement costs (avg annual):            £87,500/year     │
│  Running costs (per-ha machines × 2):       £36,324/year     │
│  Running costs (per-hr machines × 1):       £45,892/year     │
│  Contracting delivery costs:                £61,200/year     │
│                                                   ──────     │
│  TOTAL COSTS:                               £230,916/year    │
│                                                              │
│  ════════════════════════════════════════════════════════     │
│  NET POSITION                                                │
│  ════════════════════════════════════════════════════════     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │  NET POSITION:  +£201,584/year                         │  │
│  │                                                        │  │
│  │  Machinery cost as % of total income:   53.4%          │  │
│  │  Contracting income offsets:            35.7% of costs  │  │
│  │                                                        │  │
│  │  [AMBER BANNER]                                        │  │
│  │  Machinery costs are 53% of income — keep an eye on it │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ════════════════════════════════════════════════════════     │
│  WITH vs WITHOUT CONTRACTING                                 │
│  ════════════════════════════════════════════════════════     │
│                                                              │
│  ┌─────────────────────┬──────────────────────────────────┐  │
│  │                     │  Without        │  With           │  │
│  │                     │  Contracting    │  Contracting    │  │
│  ├─────────────────────┼─────────────────┼─────────────────┤  │
│  │  Income             │  £350,000       │  £432,500       │  │
│  │  Costs              │  £169,716       │  £230,916       │  │
│  │  Net                │  £180,284       │  £201,584       │  │
│  │  Machinery % income │  48.5%          │  53.4%          │  │
│  └─────────────────────┴─────────────────┴─────────────────┘  │
│                                                              │
│  Contracting adds £21,300/year to your bottom line.          │
│                                                              │
│  ┌── KEY ───────────────────────────────────────────────┐    │
│  │  Machinery cost as % of income:                      │    │
│  │  ● Under 20% — comfortable                          │    │
│  │  ● 20–35% — keep an eye on it                       │    │
│  │  ● Over 35% — machinery is eating your profits       │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ── NO SAVED MACHINES? ────────────────────────────────      │
│  Running costs show £0 because you haven't saved any         │
│  machines on the Cost per Hectare or Cost per Hour tabs.     │
│  Save machines there, and the numbers will appear here.      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Traffic-Light Thresholds

Same thresholds as the Replacement Planner (SPECS.md), applied to `machineryCostPctOfIncome`:

| Machinery % of income | Colour | Message |
|----------------------|--------|---------|
| < 20% | Green | "Comfortable — machinery costs are well controlled" |
| 20–35% | Amber | "Keep an eye on it — machinery costs are significant" |
| > 35% | Red | "Machinery is eating your profits" |

### Empty State

If no saved machines exist on Tabs 1/2 and no contracting services on Tab 6, show a helpful message:

> "Save machines on the Cost per Hectare and Cost per Hour tabs, and add services on the Contracting Income tab, to see your full profitability picture here."

### Data Assembly

The component receives the full `AppState` and computes all derived values internally. It needs:

1. `appState.replacementPlanner.farmIncome` — direct read
2. `appState.replacementPlanner.machines` — run through `calculateReplacementSummary()` to get `averageAnnualCost`
3. `appState.costPerHectare.savedMachines` — run each through `calculateCostPerHectare()` to get `totalCostPerHa * hectaresPerYear`
4. `appState.costPerHour.savedMachines` — run each through `calculateCostPerHour()` to get `totalCostPerHr * hoursPerYear`
5. `appState.contractingIncome.services` — run each through `calculateContractingService()` to get gross income and costs

## Component Props

```typescript
interface ProfitabilityOverviewProps {
  appState: AppState
}
```

This component is **read-only** — it has no `onChange` callback. It simply reads from the existing app state and shows computed results. Any changes the farmer wants to make happen on the source tabs.

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/ProfitabilityOverview.tsx` | Tab 7 — read-only profitability dashboard |
| `src/components/__tests__/ProfitabilityOverview.test.tsx` | Component tests |
| `src/lib/__tests__/profitability-calculations.test.ts` | Pure calculation function tests |

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/calculations.ts` | Add `ProfitabilityInputs`, `ProfitabilityResults`, `calculateProfitability()` |
| `src/App.tsx` | Add Tab 7 trigger + content, pass `appState` as prop |

Note: No changes to `src/lib/types.ts` or `src/lib/storage.ts` — this tab reads existing state only. The storage changes needed are covered by SPEC-10.

## RED Tests

### Calculation tests (`profitability-calculations.test.ts`)

```typescript
import { calculateProfitability } from '@/lib/calculations'
import type { ProfitabilityInputs } from '@/lib/calculations'

const baseInputs: ProfitabilityInputs = {
  farmIncome: 350000,
  contractingGrossIncome: 82500,
  contractingCosts: 61200,
  replacementAnnualCost: 87500,
  runningCostsHectare: 36324,
  runningCostsHour: 45892,
}

describe('calculateProfitability', () => {
  it('calculates total income', () => {
    const r = calculateProfitability(baseInputs)
    expect(r.totalIncome).toBe(432500)
  })

  it('calculates total costs', () => {
    const r = calculateProfitability(baseInputs)
    // 87500 + 36324 + 45892 + 61200 = 230916
    expect(r.totalCosts).toBe(230916)
  })

  it('calculates net position', () => {
    const r = calculateProfitability(baseInputs)
    expect(r.netPosition).toBe(432500 - 230916)
  })

  it('calculates machinery cost as % of income', () => {
    const r = calculateProfitability(baseInputs)
    // 230916 / 432500 * 100 = 53.4%
    expect(r.machineryCostPctOfIncome).toBeCloseTo(53.4, 0)
  })

  it('calculates contracting offset %', () => {
    const r = calculateProfitability(baseInputs)
    // 82500 / 230916 * 100 = 35.7%
    expect(r.contractingOffsetPct).toBeCloseTo(35.7, 0)
  })

  it('calculates net without contracting', () => {
    const r = calculateProfitability(baseInputs)
    // farmIncome - (replacement + running) = 350000 - (87500 + 36324 + 45892)
    expect(r.netWithoutContracting).toBe(350000 - 169716)
  })

  it('calculates net with contracting', () => {
    const r = calculateProfitability(baseInputs)
    expect(r.netWithContracting).toBe(r.netPosition)
  })

  it('calculates contracting net contribution', () => {
    const r = calculateProfitability(baseInputs)
    // net with - net without
    expect(r.contractingNetContribution).toBe(
      r.netWithContracting - r.netWithoutContracting
    )
  })

  it('handles zero farm income', () => {
    const r = calculateProfitability({ ...baseInputs, farmIncome: 0 })
    expect(r.totalIncome).toBe(82500)
    expect(r.machineryCostPctOfIncome).toBeGreaterThan(0)
  })

  it('handles zero contracting', () => {
    const r = calculateProfitability({
      ...baseInputs,
      contractingGrossIncome: 0,
      contractingCosts: 0,
    })
    expect(r.contractingOffsetPct).toBe(0)
    expect(r.contractingNetContribution).toBe(0)
  })

  it('handles all zeros', () => {
    const r = calculateProfitability({
      farmIncome: 0,
      contractingGrossIncome: 0,
      contractingCosts: 0,
      replacementAnnualCost: 0,
      runningCostsHectare: 0,
      runningCostsHour: 0,
    })
    expect(r.totalIncome).toBe(0)
    expect(r.totalCosts).toBe(0)
    expect(r.netPosition).toBe(0)
    expect(r.machineryCostPctOfIncome).toBe(0)
  })
})
```

### Component tests (`ProfitabilityOverview.test.tsx`)

```typescript
import { render, screen } from '@testing-library/react'
import { ProfitabilityOverview } from '@/components/ProfitabilityOverview'
import type { AppState } from '@/lib/types'

function createTestState(overrides?: Partial<AppState>): AppState {
  return {
    version: 2,
    lastSaved: new Date().toISOString(),
    costPerHectare: {
      current: {} as any,
      savedMachines: [],
    },
    costPerHour: {
      current: {} as any,
      savedMachines: [],
    },
    compareMachines: {
      machineA: {} as any,
      machineB: {} as any,
    },
    replacementPlanner: {
      machines: [],
      farmIncome: 350000,
    },
    contractingIncome: {
      services: [],
    },
    ...overrides,
  }
}

it('renders tab title', () => {
  render(<ProfitabilityOverview appState={createTestState()} />)
  expect(screen.getByText(/Profitability Overview/i)).toBeInTheDocument()
})

it('shows farm income from replacement planner', () => {
  render(<ProfitabilityOverview appState={createTestState()} />)
  expect(screen.getByText(/£350,000/)).toBeInTheDocument()
})

it('shows empty state when no saved machines or services', () => {
  render(<ProfitabilityOverview appState={createTestState()} />)
  expect(screen.getByText(/save machines/i)).toBeInTheDocument()
})

it('shows income section', () => {
  render(<ProfitabilityOverview appState={createTestState()} />)
  expect(screen.getByText(/income/i)).toBeInTheDocument()
})

it('shows costs section', () => {
  render(<ProfitabilityOverview appState={createTestState()} />)
  expect(screen.getByText(/costs/i)).toBeInTheDocument()
})

it('shows net position', () => {
  render(<ProfitabilityOverview appState={createTestState()} />)
  expect(screen.getByText(/net position/i)).toBeInTheDocument()
})

it('shows with vs without contracting comparison', () => {
  const state = createTestState({
    contractingIncome: {
      services: [
        {
          id: 'test-1',
          name: 'Combining',
          chargeRate: 119.34,
          chargeUnit: 'ha',
          annualVolume: 400,
          ownCostPerUnit: 85,
          additionalCosts: 2000,
          linkedMachineSource: null,
        },
      ],
    },
  })
  render(<ProfitabilityOverview appState={state} />)
  expect(screen.getByText(/without contracting/i)).toBeInTheDocument()
  expect(screen.getByText(/with contracting/i)).toBeInTheDocument()
})

it('shows traffic-light banner based on machinery cost %', () => {
  const { container } = render(
    <ProfitabilityOverview appState={createTestState()} />
  )
  // With 350k income and 0 costs, should be green (0% < 20%)
  expect(container.querySelector('[data-banner="green"]')).toBeInTheDocument()
})

it('shows contracting offset percentage when contracting exists', () => {
  const state = createTestState({
    contractingIncome: {
      services: [
        {
          id: 'test-1',
          name: 'Combining',
          chargeRate: 100,
          chargeUnit: 'ha',
          annualVolume: 100,
          ownCostPerUnit: 70,
          additionalCosts: 0,
          linkedMachineSource: null,
        },
      ],
    },
  })
  render(<ProfitabilityOverview appState={state} />)
  expect(screen.getByText(/offset/i)).toBeInTheDocument()
})

it('shows key/legend explaining traffic-light thresholds', () => {
  render(<ProfitabilityOverview appState={createTestState()} />)
  expect(screen.getByText(/under 20%/i)).toBeInTheDocument()
  expect(screen.getByText(/20.*35%/i)).toBeInTheDocument()
  expect(screen.getByText(/over 35%/i)).toBeInTheDocument()
})
```

## GREEN Tests

All tests above pass. Dashboard renders with income/cost sections, net position, comparison table, and traffic-light indicators.

## Cross-References

- **SPEC-10**: Contracting income data feeds into the income and cost sections
- **SPECS.md**: Replacement Planner provides `farmIncome` and replacement cost data
- **SPECS.md Tab 1**: Saved per-hectare machines provide running cost data
- **SPECS.md Tab 2**: Saved per-hour machines provide running cost data
- Uses existing `calculateCostPerHectare()`, `calculateCostPerHour()`, `calculateReplacementSummary()` functions from `calculations.ts`
- Uses existing `calculateContractingService()` from SPEC-10

## Acceptance Criteria

- [ ] New "Profitability" tab visible in the tab bar
- [ ] Income section shows farm income (from Replacement Planner) and contracting income (from Tab 6)
- [ ] Costs section shows replacement costs, running costs (per-ha and per-hr), and contracting delivery costs
- [ ] Running costs calculated from all saved machines on Tabs 1 & 2
- [ ] Net position displayed prominently
- [ ] Machinery cost as % of income calculated and shown
- [ ] Contracting offset % calculated and shown
- [ ] Traffic-light banner: green (<20%), amber (20–35%), red (>35%) based on machinery cost % of income
- [ ] "With vs Without Contracting" comparison table
- [ ] Contracting net contribution displayed (difference between with/without)
- [ ] Empty state message when no saved machines or services exist
- [ ] Key/legend explaining the traffic-light thresholds
- [ ] All values update reactively when source tab data changes
- [ ] Tab is read-only — no editable inputs
- [ ] All tests pass
- [ ] `npm run build` succeeds with no TypeScript errors
