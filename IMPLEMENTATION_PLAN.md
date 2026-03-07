# Implementation Plan — Farm Machinery Planner

**Date:** 2026-03-07
**Current state:** 7 tabs, storage version 2, 121 NAAC rates across 12 categories
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
| 07 | Depreciation Planner | [x] Done — prop-driven mode, embedded on Tabs 1, 2, 5 |
| 08 | Machine Profile Loading | [x] Done |
| 09 | Complete NAAC Data | [x] Done — 121 entries across 12 categories, 6 dual-rate ops, 3 new unit types |
| 10 | Contracting Income | [x] Done |
| 11 | Profitability Overview | [x] Done — read-only dashboard, income/costs/net, traffic-light, with/without contracting |

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

### B1–B5: All complete

- [x] Refactored DepreciationPanel to accept optional props: `purchasePrice`, `yearsOwned`, `onApplySalePrice`, `onYearsChange` — controlled mode when props provided, internal state when standalone
- [x] Purchase price input hidden when `purchasePrice` prop provided; "Use as sale price" button shown only when `onApplySalePrice` provided
- [x] Embedded in CostPerHectare (Tab 1) with CollapsibleSection, wired to form's `purchasePrice`, `yearsOwned`, and `salePrice`
- [x] Embedded in CostPerHour (Tab 2) with same integration
- [x] Embedded in ReplacementPlanner (Tab 5) as standalone reference helper
- [x] Added 16 tests (10 standalone + 6 prop-driven); all 356 tests pass, `vite build` succeeds

**Files:** `src/components/DepreciationPanel.tsx`, `src/components/__tests__/DepreciationPanel.test.tsx`, `src/components/CostPerHectare.tsx`, `src/components/CostPerHour.tsx`, `src/components/ReplacementPlanner.tsx`

---

## Phase C: SPEC-09 — Complete NAAC 2025 Contractor Rates Data

_Was implemented then reverted (commit 9f1d5dc). Must be re-implemented per spec. Blocks SPEC-10._

### C1–C8: All complete

- [x] Extended `ContractorRate.unit` to include `"tonne" | "head" | "m"` — new categories need these units
- [x] Fixed slug pelleting (11.42→11.35) and lime spreading (19.85 £/ha → 9.53 £/tonne) — data errors from original entry
- [x] Added ~82 operations to existing categories (Soil Prep +7, Drilling +4, Application +6 + 1 dual, Harvesting +15 + 3 dual, Baling +2, Tractor Hire +6)
- [x] Added 6 new categories: Bale Wrapping (9), Slurry & Manure (13), Hedges & Boundaries (9), Mobile Feed (2), Livestock Services (4), Specialist (3)
- [x] 6 dual-rate operations stored as separate entries with different units
- [x] Updated ContractorRatesPanel: 12 category pills, per-unit-type traffic-light thresholds, new unit labels, composite row keys
- [x] Updated tests: 121+ rates, 12 categories, 6 unit types, corrected values, new UI assertions
- [x] All 328 tests pass, `vite build` succeeds (pre-existing TS errors in unrelated test files are known)

**Files:** `src/lib/contractor-data.ts`, `src/components/ContractorRatesPanel.tsx`, `src/lib/__tests__/contractor-data.test.ts`, `src/components/__tests__/ContractorRatesPanel.test.tsx`

---

## Phase D: SPEC-10 — Contracting Income Planner (Tab 6)

_Depends on SPEC-09 for extended unit types and 12-category NAAC data. Blocks SPEC-11._

### D1–D7: All complete

- [x] Added `ChargeUnit`, `ContractingService`, `ContractingIncomeState` types and extended `AppState` in `types.ts`
- [x] Added `calculateContractingService()` and `calculateContractingSummary()` pure functions in `calculations.ts`
- [x] Bumped `CURRENT_VERSION` to 2, added v1→v2 migration, updated `createDefaultState` in `storage.ts`
- [x] Built `ContractingIncomePlanner.tsx` with service cards, pull-from-saved-machine dropdown, NAAC rates panel, results display, traffic-light banners, and overall summary
- [x] Wired Tab 6 ("Contracting Income") into `App.tsx` with state callbacks and saved machine props
- [x] Created calculation tests (10 tests) and component tests (9 tests)
- [x] Updated storage tests for version 2; all 348 tests pass, `vite build` succeeds

**Files:** `src/lib/types.ts`, `src/lib/calculations.ts`, `src/lib/storage.ts`, `src/components/ContractingIncomePlanner.tsx`, `src/components/__tests__/ContractingIncomePlanner.test.tsx`, `src/lib/__tests__/contracting-calculations.test.ts`, `src/App.tsx`

---

## Phase E: SPEC-11 — Profitability Overview (Tab 7)

_Depends on SPEC-10 for contracting income data in AppState._

### E1–E5: All complete

- [x] Added `ProfitabilityInputs`, `ProfitabilityResults` interfaces and `calculateProfitability()` pure function to `calculations.ts`
- [x] Created 11 calculation tests (total income, costs, net position, machinery %, contracting offset %, with/without contracting, zero/edge cases)
- [x] Built `ProfitabilityOverview.tsx` — read-only dashboard with Income section, Costs section, Net Position card, traffic-light banner, With vs Without Contracting comparison table, key/legend, empty state
- [x] Component assembles data from all tabs: replacement planner farm income, saved per-ha/per-hr machines, contracting services
- [x] Wired Tab 7 ("Profitability") into `App.tsx` with `appState` prop
- [x] Created 10 component tests (renders, sections, traffic-light, comparison table, offset, key/legend, empty state)
- [x] All 377 tests pass, `vite build` succeeds

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
