# Implementation Plan — Farm Machinery Planner

**Date:** 2026-03-07
**Current state:** 5 tabs, storage version 1, 39 NAAC rates across 6 categories
**Target state:** 7 tabs, 130+ NAAC rates across 12 categories, storage version 2

## Spec Status Summary

| Spec | Title | Status |
|------|-------|--------|
| 01 | Test Infrastructure | [x] Done |
| 02 | Fuel Price Panel | [x] Done |
| 03 | Fuel Consumption Panel | [x] Done |
| 04 | Contractor Rates Panel | [x] Done |
| 05 | Integration & Polish | [x] Done |
| 06 | UK Units & Labels | [x] Done |
| 07 | Depreciation Planner | **Partial** — panel exists on Tab 3 only; spec requires embedding on Tabs 1, 2, 5 with prop-driven mode |
| 08 | Machine Profile Loading | [x] Done |
| 09 | Complete NAAC Data | **Reverted** — code was implemented then reverted (commit 9f1d5dc); only 39 entries/6 categories remain |
| 10 | Contracting Income | **Not started** — Tab 6 does not exist |
| 11 | Profitability Overview | **Not started** — Tab 7 does not exist |

## Dependency Graph

```
SPEC-08 (bug fix)        ──── independent, do first
SPEC-07 (embed panels)   ──── independent, do first
SPEC-09 (NAAC data)      ──── blocks SPEC-10
SPEC-10 (Tab 6)          ──── blocks SPEC-11
SPEC-11 (Tab 7)          ──── final
```

---

## Phase A: SPEC-08 — SaveLoadToolbar Select Value Fix

- [x] Verify Select `value` prop edge case: select index 0, delete it, select new index 0 — confirmed `null` is correct for Base UI (keeps controlled mode, renders placeholder)
- [x] Fix: Use `value={null}` (not `""`) for no-selection state + `placeholder` prop on SelectValue instead of children — Base UI renders placeholder when value is null
- [x] Remove unused `selectedLabel` variable
- [x] Run `npm test` — all 320 tests pass, including re-selection after delete test

**Files:** `src/components/SaveLoadToolbar.tsx`

---

## Phase B: SPEC-07 — Embed DepreciationPanel on Tabs 1, 2, and 5

_Currently DepreciationPanel lives only on Tab 3 with zero props (fully internal state). Spec requires it embedded on Tabs 1, 2, and 5 with optional prop-driven mode._

### B1: Refactor DepreciationPanel to accept optional props

- [ ] Add optional props to DepreciationPanel: `purchasePrice?: number`, `yearsOwned?: number`, `onApplySalePrice?: (value: number) => void`, `onYearsChange?: (years: number) => void`
  - **Why:** When embedded in other tabs, the panel should read from and write to the parent form's state; when standalone on Tab 3, it continues using internal state
- [ ] When `purchasePrice` prop is provided, use it instead of internal state (controlled mode)
  - **Why:** On Tabs 1/2, the purchase price already exists on the form — the depreciation panel should reflect it
- [ ] When `yearsOwned` prop is provided, sync the year slider bidirectionally
  - **Why:** Changing the slider calls `onYearsChange`; changing yearsOwned on the parent form updates the slider
- [ ] Show "Use as sale price" button only when `onApplySalePrice` is provided
  - **Why:** Button fills the parent form's expected sale price with the depreciation-estimated value
- [ ] Add tests for prop-driven mode in `DepreciationPanel.test.tsx`: test `onApplySalePrice` callback, controlled `purchasePrice`, controlled `yearsOwned`, `onYearsChange` callback
  - **Why:** Both standalone (Tab 3) and embedded (Tabs 1/2/5) modes need test coverage

### B2: Embed in CostPerHectare (Tab 1)

- [ ] Add `<CollapsibleSection title="Depreciation Curve">` with `<DepreciationPanel>` below the purchase/sale section in `CostPerHectare.tsx`
  - **Why:** Helps farmers set a realistic expected sale price based on ASAE depreciation curves
- [ ] Wire `onApplySalePrice` to update `salePrice` input, pass `purchasePrice` and `yearsOwned` from form inputs
  - **Why:** Connects the embedded panel to the form's data flow

### B3: Embed in CostPerHour (Tab 2)

- [ ] Add same CollapsibleSection + DepreciationPanel integration as Tab 1 in `CostPerHour.tsx`
  - **Why:** Tab 2 has the same purchase/sale price inputs and benefits from the same depreciation helper

### B4: Embed in ReplacementPlanner (Tab 5)

- [ ] Add `<CollapsibleSection title="Depreciation Curve">` with standalone `<DepreciationPanel>` (no form wiring) in `ReplacementPlanner.tsx`
  - **Why:** Reference helper for replacement timing decisions; no need to wire to individual machine rows

### B5: Verify

- [ ] Run `npm test` and `npm run build`
  - **Why:** Regression check after refactoring a shared component used across 4 tabs

**Files:** `src/components/DepreciationPanel.tsx`, `src/components/__tests__/DepreciationPanel.test.tsx`, `src/components/CostPerHectare.tsx`, `src/components/CostPerHour.tsx`, `src/components/ReplacementPlanner.tsx`

---

## Phase C: SPEC-09 — Complete NAAC 2025 Contractor Rates Data

_Was implemented then reverted (commit 9f1d5dc). Must be re-implemented per spec. Blocks SPEC-10._

### C1: Extend data types

- [ ] Extend `ContractorRate.unit` type from `"ha" | "bale" | "hr"` to `"ha" | "bale" | "hr" | "tonne" | "head" | "m"` in `contractor-data.ts`
  - **Why:** New categories (Slurry & Manure, Livestock Services, Hedges & Boundaries) use tonne, head, and metre units

### C2: Apply data corrections

- [ ] Fix slug pelleting rate: `11.42` → `11.35` in NAAC_RATES
  - **Why:** Data error in original entry per NAAC PDF
- [ ] Fix lime spreading: change from `19.85 £/ha` to `9.53 £/tonne` (both rate and unit wrong)
  - **Why:** Wrong rate AND wrong unit in original data per NAAC PDF

### C3: Add ~95 missing operations to existing categories

- [ ] Add ~8 operations to Soil Prep (furrow press, rotovating, mole-ploughing, stubble raking, pressing, bed tilling, chain harrowing)
  - **Why:** Completing the full NAAC Soil Prep section
- [ ] Add ~4 operations to Drilling (potato planting, carrot/parsnip/onion, maize under plastic, grass cross drilling)
  - **Why:** Completing the full NAAC Drilling section
- [ ] Add ~6 operations + 1 dual-rate to Application (variable rate, drone spreading, Avadex, ATV spraying, weed wiping, grassland spraying /hr)
  - **Why:** Completing the full NAAC Application section
- [ ] Add ~19 operations + 3 dual-rate entries to Harvesting (straw chopper, OSR windrow, swathing, grain carting, potato/sugar beet/grass ops, forage /hr, whole crop, maize, extra trailer, forage wagon)
  - **Why:** Harvesting section was heavily incomplete
- [ ] Add ~2 operations to Baling (Square 120x70cm, Square 120x130cm)
  - **Why:** Two bale sizes missing from original data
- [ ] Add ~6 operations to Tractor Hire (post knocker, ditching 180/360, drain jetting, trailer charge, forklift)
  - **Why:** Tractor Hire had only 4 entries, should have ~10

### C4: Add 6 new categories

- [ ] Add "Bale Wrapping" category (9 entries: round/square wrapping, combi baling, bale chasing)
  - **Why:** Common contracting area not previously covered
- [ ] Add "Slurry & Manure" category (13 entries: FYM, chicken litter, compost, digestate, slurry ops)
  - **Why:** Significant contracting area, uses tonne and hr units
- [ ] Add "Hedges & Boundaries" category (9 entries: hedge cutting/laying, verge mowing, fence erection)
  - **Why:** Common contracting services using metre units
- [ ] Add "Mobile Feed" category (2 entries: feed mixing, crimping)
  - **Why:** Livestock-related contracting services
- [ ] Add "Livestock Services" category (4 entries: sheep shearing, dipping)
  - **Why:** Head-based pricing for livestock work
- [ ] Add "Specialist" category (3 entries: snow ploughing, labour only, chainsawing)
  - **Why:** Miscellaneous hourly-rate services

### C5: Handle dual-rate operations

- [ ] Store operations with both £/ha and £/hr (or £/tonne and £/hr) rates as two separate entries in NAAC_RATES
  - **Why:** 6 operations in the NAAC PDF have dual rates; each gets its own entry for independent selection

### C6: Update ContractorRatesPanel UI

- [ ] Add 6 new category pills to CATEGORIES array in `ContractorRatesPanel.tsx`
  - **Why:** UI must show all 12 categories
- [ ] Update `getUnitLabel()` to handle tonne (`/tonne`), head (`/head`), m (`/m`)
  - **Why:** New units need display labels
- [ ] Update `rateTier()` with per-unit-type thresholds (ha/hr: 40/100, bale/head: 5/10, tonne: 6/15, m: 12/20)
  - **Why:** Traffic-light thresholds must be unit-appropriate — a £5/bale rate is "mid" but £5/ha is "low"
- [ ] Change table row keys to `${operation}-${unit}-${idx}` for dual-rate entries
  - **Why:** React needs unique keys when same operation appears twice with different units

### C7: Update tests

- [ ] Update `contractor-data.test.ts` assertions for 130+ rates, 12 categories, new unit types, corrected values (slug pelleting 11.35, lime spreading 9.53/tonne)
  - **Why:** Data integrity tests must match the expanded dataset
- [ ] Update `ContractorRatesPanel.test.tsx` for 12 category tabs and new unit display (tonne, head, m)
  - **Why:** UI tests must cover the expanded category set

### C8: Verify

- [ ] Run `npm test` and `npm run build`
  - **Why:** Regression check after major data expansion

**Files:** `src/lib/contractor-data.ts`, `src/components/ContractorRatesPanel.tsx`, `src/lib/__tests__/contractor-data.test.ts`, `src/components/__tests__/ContractorRatesPanel.test.tsx`

---

## Phase D: SPEC-10 — Contracting Income Planner (Tab 6)

_Depends on SPEC-09 for extended unit types and 12-category NAAC data. Blocks SPEC-11._

### D1: Add types

- [ ] Add `ChargeUnit` type to `types.ts`: `"ha" | "hr" | "bale" | "tonne" | "head" | "m"`
  - **Why:** Contracting services can charge in any NAAC unit
- [ ] Add `ContractingService` interface to `types.ts`: id, name, chargeRate, chargeUnit, annualVolume, ownCostPerUnit, additionalCosts, linkedMachineSource
  - **Why:** Core data model for each contracting service the farmer offers
- [ ] Add `ContractingIncomeState` interface: `{ services: ContractingService[] }`
  - **Why:** Top-level state container for the tab
- [ ] Extend `AppState` with `contractingIncome: ContractingIncomeState`
  - **Why:** Tab 6 state must persist with the rest of the app state

### D2: Add calculation functions

- [ ] Implement `calculateContractingService(chargeRate, annualVolume, ownCostPerUnit, additionalCosts)` in `calculations.ts` returning grossIncome, totalOwnCost, profitPerUnit, annualProfit, marginPct
  - **Why:** Per-service profit calculation — pure function for testability
- [ ] Implement `calculateContractingSummary(services[])` in `calculations.ts` returning totalGrossIncome, totalCosts, totalProfit, overallMarginPct
  - **Why:** Aggregates across all services for the summary section
- [ ] Create `src/lib/__tests__/contracting-calculations.test.ts` with tests for: gross income, costs, profit, margin %, zero volume, negative margin, summary aggregation, empty array
  - **Why:** Pure functions need thorough test coverage before building UI

### D3: Storage migration v1 → v2

- [ ] Bump `CURRENT_VERSION` from 1 to 2 in `storage.ts`
  - **Why:** New AppState field requires a version bump
- [ ] Add migration function: v1→v2 adds `contractingIncome: { services: [] }` to existing state
  - **Why:** Existing users' localStorage must gain the new field automatically
- [ ] Update default state creation to include `contractingIncome: { services: [] }`
  - **Why:** New installs get the correct default state
- [ ] Add storage migration tests: verify v1 data migrates to v2 with empty contractingIncome
  - **Why:** Migration correctness is critical for not losing existing users' data

### D4: Build ContractingIncomePlanner component

- [ ] Create `src/components/ContractingIncomePlanner.tsx` with: intro text, "Add Service" button, per-service cards (name, charge rate, charge unit dropdown, annual volume, own cost/unit, additional costs), delete button per service
  - **Why:** Core Tab 6 UI structure per SPEC-10
- [ ] Add "Pull from saved machine" dropdown per service card (grouped by Tab 1/Tab 2 machines, auto-fills ownCostPerUnit and chargeUnit)
  - **Why:** Lets farmer link contracting costs to their actual machinery ownership costs calculated on Tabs 1/2
- [ ] Embed `ContractorRatesPanel` per card (collapsed, onApply wires to chargeRate)
  - **Why:** Reuses NAAC reference data so farmers can set competitive charge rates
- [ ] Add per-service results display: gross income, total costs, profit/unit, annual profit, margin %
  - **Why:** Immediate feedback on whether each service is profitable
- [ ] Add traffic-light banners per service: green (>20% margin), amber (0-20%), red (<0%)
  - **Why:** Visual decision aid for service viability
- [ ] Add overall contracting summary section (when ≥1 service exists)
  - **Why:** Aggregate view of total contracting income and profitability

### D5: Wire into App.tsx

- [ ] Add Tab 6 trigger ("Contracting Income") to TabsList in `App.tsx`
  - **Why:** New tab must be visible in navigation
- [ ] Add TabsContent rendering `<ContractingIncomePlanner>` with props: initialState, onChange, savedHectareMachines, savedHourMachines
  - **Why:** Tab content wired to app state and saved machine data from Tabs 1/2
- [ ] Update TabsList layout (grid-cols) to accommodate 7 tabs
  - **Why:** Navigation must fit additional tabs without overflow

### D6: Component tests

- [ ] Create `src/components/__tests__/ContractingIncomePlanner.test.tsx` testing: renders, add/delete service, inputs, pull from saved machine, results display, traffic-light banners, summary
  - **Why:** Component behavior coverage per SPEC-10

### D7: Verify

- [ ] Run `npm test` and `npm run build`
  - **Why:** Regression check after adding a major new tab

**Files:** `src/lib/types.ts`, `src/lib/calculations.ts`, `src/lib/storage.ts`, `src/components/ContractingIncomePlanner.tsx`, `src/components/__tests__/ContractingIncomePlanner.test.tsx`, `src/lib/__tests__/contracting-calculations.test.ts`, `src/App.tsx`

---

## Phase E: SPEC-11 — Profitability Overview (Tab 7)

_Depends on SPEC-10 for contracting income data in AppState._

### E1: Add calculation function

- [ ] Add `ProfitabilityResults` interface to `calculations.ts` with: totalIncome, farmIncomeAmount, contractingIncomeAmount, totalCosts, replacementCosts, totalRunningCosts, contractingCosts, netPosition, machineryCostPctOfIncome, contractingOffsetPct, netWithoutContracting, netWithContracting, contractingNetContribution
  - **Why:** Comprehensive output type for the read-only profitability dashboard
- [ ] Implement `calculateProfitability(appState)` pure function that aggregates income/costs from all tabs
  - **Why:** Core aggregation logic — derives running costs from saved machines (calcCostPerHectare/Hour), contracting from services (calculateContractingService), replacement from planner (calcReplacementSummary)
- [ ] Create `src/lib/__tests__/profitability-calculations.test.ts` testing: total income, total costs, net position, machinery cost %, contracting offset %, with/without contracting comparison, zero/edge cases
  - **Why:** Pure function tests before building UI

### E2: Build ProfitabilityOverview component

- [ ] Create `src/components/ProfitabilityOverview.tsx` (read-only, prop: `appState: AppState`) with Income section (farm + contracting = total) and Costs section (replacement + running per-ha + running per-hr + contracting = total)
  - **Why:** Consolidated view of all income and cost streams across the app
- [ ] Add Net Position card with large display, machinery cost as % of income, contracting offset %
  - **Why:** The key "bottom line" metric the farmer needs to see prominently
- [ ] Add traffic-light banner: green (<20%), amber (20-35%), red (>35%) based on machinery cost % of income
  - **Why:** Quick visual indicator of whether machinery costs are sustainable relative to farm income
- [ ] Add "With vs Without Contracting" comparison table and contracting net contribution callout
  - **Why:** Shows the financial impact of offering contracting services — the key insight of the tool
- [ ] Add key/legend explaining traffic-light thresholds
  - **Why:** Context for the color coding so farmers understand the benchmarks
- [ ] Add empty state message when no saved machines or services exist
  - **Why:** Guide user to populate other tabs first rather than showing zeros

### E3: Wire into App.tsx

- [ ] Add Tab 7 trigger ("Profitability") to TabsList in `App.tsx`
  - **Why:** New tab must be visible in navigation
- [ ] Add TabsContent rendering `<ProfitabilityOverview appState={appState} />`
  - **Why:** Pass entire appState since this tab reads from all other tabs (farm income, saved machines, contracting services, replacement planner)

### E4: Component tests

- [ ] Create `src/components/__tests__/ProfitabilityOverview.test.tsx` testing: renders, income/costs/net sections, traffic-light banner, with/without contracting comparison, empty state, contracting offset
  - **Why:** Component display and state-driven rendering tests

### E5: Final verification

- [ ] Run `npm test` — all tests pass
  - **Why:** Full regression check across all 7 tabs
- [ ] Run `npm run build` — no TypeScript errors
  - **Why:** Final type-safety gate

**Files:** `src/lib/calculations.ts`, `src/components/ProfitabilityOverview.tsx`, `src/components/__tests__/ProfitabilityOverview.test.tsx`, `src/lib/__tests__/profitability-calculations.test.ts`, `src/App.tsx`

---

## File Change Summary

### New Files (6)

| File | Spec |
|------|------|
| `src/components/ContractingIncomePlanner.tsx` | 10 |
| `src/components/__tests__/ContractingIncomePlanner.test.tsx` | 10 |
| `src/lib/__tests__/contracting-calculations.test.ts` | 10 |
| `src/components/ProfitabilityOverview.tsx` | 11 |
| `src/components/__tests__/ProfitabilityOverview.test.tsx` | 11 |
| `src/lib/__tests__/profitability-calculations.test.ts` | 11 |

### Modified Files (14)

| File | Specs |
|------|-------|
| `src/components/SaveLoadToolbar.tsx` | 08 |
| `src/components/CostPerHectare.tsx` | 02, 03, 04, 06, 07 |
| `src/components/CostPerHour.tsx` | 02, 03, 04, 06, 07 |
| `src/components/InputField.tsx` | 06 |
| `src/components/CostBreakdown.tsx` | 06 |
| `src/components/ResultBanner.tsx` | 06 |
| `src/components/CompareMachines.tsx` | 06 |
| `src/components/ReplacementPlanner.tsx` | 06, 07 |
| `src/components/CollapsibleSection.tsx` | 05 |
| `src/components/DepreciationPanel.tsx` | 07 |
| `src/components/__tests__/DepreciationPanel.test.tsx` | 07 |
| `src/lib/contractor-data.ts` | 09 |
| `src/components/ContractorRatesPanel.tsx` | 09 |
| `src/lib/__tests__/contractor-data.test.ts` | 09 |
| `src/components/__tests__/ContractorRatesPanel.test.tsx` | 09 |
| `src/lib/types.ts` | 10 |
| `src/lib/calculations.ts` | 10, 11 |
| `src/lib/storage.ts` | 06, 10 |
| `src/App.tsx` | 10, 11 |

---

## Remaining Tasks (Priority Order)

_No remaining tasks._

### Already Complete

- [x] SPEC-01: Test infrastructure bootstrap (vitest + testing-library + jsdom)
- [x] SPEC-02: Fuel price reference panel (AHDB data, sparkline, "Use red diesel" button)
- [x] SPEC-03: Fuel consumption estimator (HP slider, 0.244 × HP formula, reference table)
- [x] SPEC-04: Contractor rates panel (6 categories, traffic-light rows, "Use" buttons) — 40 rates across 6 categories
- [x] SPEC-05: Integration tests & visual polish (4 e2e flows, accessibility, responsive)
- [x] SPEC-06: UK unit toggle & label fixes (ha/acres, km/miles, whitespace-nowrap)
- [x] SPEC-07: Depreciation curve planner (8 categories, SVG chart, sweet spot, slider)
- [x] SPEC-08: Machine profile loading bug fix (parent state callbacks, controlled Select)
