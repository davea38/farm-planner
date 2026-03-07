# Implementation Plan — Farm Machinery Planner

**Priority order:** SPEC-01 → SPEC-02 → SPEC-03 → SPEC-04 → SPEC-07 → SPEC-06 → SPEC-05

## Gap Analysis Summary

The core application is fully built: all 4 tabs, calculations, persistence, save/load, export/import, responsive layout, and repair estimator. What remains are 7 new feature specs — all currently **not started**.

---

## Phase A: SPEC-01 — Test Infrastructure Bootstrap

_Blocks all other specs. No tests can run until this is done._

- [x] Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom` as devDependencies
  - **Why:** Test runner, DOM utilities, custom matchers, and browser environment needed for all future tests
- [x] Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts to `package.json`
  - **Why:** CLI entry points for running tests in CI and during development
- [x] Create `vitest.config.ts` with jsdom environment and `@/` path alias matching `vite.config.ts`
  - **Why:** Vitest needs its own config to resolve the `@/` alias and use jsdom for DOM APIs
- [x] Create `src/setupTests.ts` that imports `@testing-library/jest-dom/vitest`
  - **Why:** Adds `.toBeInTheDocument()` and other DOM matchers to every test file automatically
- [x] Add `"vitest/globals"` to `types` array in `tsconfig.app.json`
  - **Why:** Gives TypeScript awareness of `describe`, `it`, `expect` globals
- [x] Create `src/lib/__tests__/calculations.test.ts` — test `calcCostPerHectare` with defaults produces ~£30.27/ha and ~-£54,880 annual saving
  - **Why:** First pure-function smoke test validates the test pipeline end-to-end
- [x] Create `src/components/__tests__/ResultBanner.test.tsx` — render `ResultBanner` and assert text appears in DOM
  - **Why:** First component render test validates jsdom + React Testing Library integration
- [x] Verify `npm test` runs and passes with 0 failures
  - **Why:** Gate check before any other spec begins

---

## Phase B: SPEC-02 — Fuel Price Reference Panel

_Depends on: SPEC-01_

- [x] Create `src/lib/fuel-data.ts` with `FUEL_PRICES` constant (red diesel 74.91 ppl, pump diesel 141.22 ppl, 5-year historical array 2022–2026)
  - **Why:** Pure data module consumed by the panel and tests; no UI logic
- [x] Create `src/lib/__tests__/fuel-data.test.ts` — validate current price, historical array length, chronological order
  - **Why:** Data integrity guards; RED tests first
- [x] Create `src/components/Sparkline.tsx` — pure SVG `<polyline>` with gradient fill, dot markers, x-axis labels
  - **Why:** Reusable charting primitive; no external dependencies
- [x] Create `src/components/FuelPricePanel.tsx` — collapsible panel with two price cards, year-on-year % change, Sparkline, "Use red diesel price" button (calls `onApply(0.7491)`), source footer
  - **Why:** Converts ppl to £/L; gives farmers AHDB reference data inline
- [x] Create `src/components/__tests__/FuelPricePanel.test.tsx` — test price rendering, SVG presence, onApply callback with 0.7491, source attribution
  - **Why:** Component behavior tests per spec
- [x] Modify `src/components/CostPerHectare.tsx` — add `<FuelPricePanel>` below "Fuel price" input
  - **Why:** Clicking "Use red diesel price" fills the fuel price input on Tab 1
- [x] Modify `src/components/CostPerHour.tsx` — add `<FuelPricePanel>` below "Fuel price" input
  - **Why:** Same integration on Tab 2

---

## Phase C: SPEC-03 — Fuel Consumption Estimator Panel

_Depends on: SPEC-01_

- [ ] Create `src/lib/fuel-consumption-data.ts` with `FUEL_CONSUMPTION_FACTOR` (0.244), `estimateFuelConsumption(hp)`, and `HP_REFERENCE_POINTS` (6 entries, 75–300 HP)
  - **Why:** Pure estimation logic; formula 0.244 × HP = L/hr
- [ ] Create `src/lib/__tests__/fuel-consumption-data.test.ts` — test 100 HP → 24.4, 200 HP → 48.8, 0 HP → 0, reference table has 6 entries
  - **Why:** RED tests for estimation function and data constants
- [ ] Create `src/components/FuelConsumptionPanel.tsx` — collapsible panel with HP slider (75–400), gauge bar, 6-column reference table, "Use this estimate" button, source footer; `mode` prop switches L/hr vs L/ha
  - **Why:** Interactive panel; perHectare mode divides L/hr by workRate to get L/ha
- [ ] Create `src/components/__tests__/FuelConsumptionPanel.test.tsx` — test title, default estimate (36.6), onApply in both modes, L/ha display with workRate
  - **Why:** Component behavior tests for both mode variants
- [ ] Modify `src/components/CostPerHectare.tsx` — add `<FuelConsumptionPanel mode="perHectare">` below "Fuel use" input
  - **Why:** Tab 1 needs L/ha output, derived from L/hr ÷ work rate
- [ ] Modify `src/components/CostPerHour.tsx` — add `<FuelConsumptionPanel mode="perHour">` below fuel consumption input
  - **Why:** Tab 2 needs raw L/hr output

---

## Phase D: SPEC-04 — Contractor Rates Reference Panel

_Depends on: SPEC-01_

- [ ] Create `src/lib/contractor-data.ts` with `NAAC_SOURCE`, `NAAC_RATES` (35+ rates, 6 categories), `getRatesByCategory()`, `getRatesByUnit()`
  - **Why:** Static NAAC 2025-26 rate data across Soil Prep, Drilling, Application, Harvesting, Baling, Tractor Hire
- [ ] Create `src/lib/__tests__/contractor-data.test.ts` — test rate count ≥ 30, specific values, category/unit filter functions, all rates > 0
  - **Why:** Data integrity and filter function tests
- [ ] Create `src/components/ContractorRatesPanel.tsx` — collapsible panel with 6 category pill tabs, traffic-light table (green < £40, amber £40–100, red > £100), "Use" button per row, range indicator, source footer
  - **Why:** Most complex reference panel; `unitFilter` and `defaultCategory` props tailor it per tab
- [ ] Create `src/components/__tests__/ContractorRatesPanel.test.tsx` — test title, category tabs, rate rows, onApply, traffic-light attributes, unit filtering, source
  - **Why:** Component tests for navigation, selection, and visual classification
- [ ] Modify `src/components/CostPerHectare.tsx` — add `<ContractorRatesPanel unitFilter="ha">` below "Contractor charges" input
  - **Why:** Tab 1 shows per-hectare contractor rates
- [ ] Modify `src/components/CostPerHour.tsx` — add `<ContractorRatesPanel unitFilter="hr" defaultCategory="Tractor Hire">` below contractor charges input
  - **Why:** Tab 2 defaults to hourly Tractor Hire rates

---

## Phase E: SPEC-07 — Depreciation Curve Planner

_Depends on: SPEC-01. Before SPEC-06 so unit support can be applied in one pass._

- [ ] Create `src/lib/depreciation-data.ts` with 8 `DEPRECIATION_PROFILES`, `getRemainingValuePct()`, `getEstimatedValue()`, `getDepreciationLoss()`, `getAnnualDepreciation()`, `findSweetSpot()`
  - **Why:** Core ASAE D497 depreciation data; 8 machine categories with 13-entry curves (years 0–12)
- [ ] Create `src/lib/__tests__/depreciation-data.test.ts` — test 8 categories, all start at 100%, 13 entries, monotonically decreasing, specific lookups, clamping, estimated values, loss, annual depreciation, sweet spot range
  - **Why:** Extensive data integrity and calculation function tests
- [ ] Create `src/components/DepreciationCurve.tsx` — pure SVG line chart with gradient fill, dot markers, steep-zone shading, "you are here" marker, dashed value line, axis labels
  - **Why:** Reusable SVG chart; separated from panel logic
- [ ] Create `src/components/DepreciationPanel.tsx` — collapsible panel with category dropdown, DepreciationCurve SVG, summary card, percentage bar, sweet spot callout, year slider (0–12), "Use as sale price" button, source footer
  - **Why:** Interactive panel; year slider syncs bidirectionally with parent form
- [ ] Create `src/components/__tests__/DepreciationPanel.test.tsx` — test title, dropdown, SVG, values, percentage, sweet spot, onApplySalePrice, source, slider, slider change
  - **Why:** Component interaction and display tests
- [ ] Modify `src/components/CostPerHectare.tsx` — add `<DepreciationPanel>` below "What Did You Pay" section
  - **Why:** Helps farmers set a realistic expected sale price
- [ ] Modify `src/components/CostPerHour.tsx` — same DepreciationPanel integration
  - **Why:** Tab 2 has the same purchase/sale inputs
- [ ] Modify `src/components/ReplacementPlanner.tsx` — add `<DepreciationPanel>` as a reference helper at the bottom
  - **Why:** Complements "when to replace" with "how much value is lost" data

---

## Phase F: SPEC-06 — UK Unit Toggle & Label Fixes

_After SPEC-02/03/04/07 so all new panels get unit support in one pass._

### Part A: Unit Conversion System

- [ ] Create `src/lib/units.ts` with `CONVERSIONS`, types (`AreaUnit`, `SpeedUnit`, `UnitPreferences`), `DEFAULT_UNITS`, `toDisplay()`/`fromDisplay()`/`displayUnit()`
  - **Why:** Display-layer-only conversion; internal state stays metric
- [ ] Create `src/lib/__tests__/units.test.ts` — test ha↔acres, ha/hr↔acres/hr, L/ha↔L/acre, £/ha↔£/acre, km/hr↔mph, passthrough, round-trip, displayUnit strings
  - **Why:** Conversion correctness is critical; errors silently produce wrong cost numbers
- [ ] Create `UnitContext` (React context + `useUnits()` hook)
  - **Why:** Avoids prop drilling; all components read preferences via hook
- [ ] Create `src/components/UnitToggle.tsx` — two segmented pill toggles: [ha | acres] and [km | miles], with `aria-pressed`
  - **Why:** Global toggle; compact pill design
- [ ] Create `src/components/__tests__/UnitToggle.test.tsx` — test both toggles render, active state, onChange callback
  - **Why:** Accessibility and callback verification

### Part B: Apply Unit Conversion & Fix Labels

- [ ] Modify `src/App.tsx` — wrap in `UnitContext.Provider`, add `<UnitToggle>` in header, store+persist `UnitPreferences`
  - **Why:** Global provider; preference survives reload
- [ ] Modify `src/lib/storage.ts` — persist `UnitPreferences` in localStorage
  - **Why:** Unit preference must survive reloads without affecting saved metric data
- [ ] Modify `src/components/InputField.tsx` — accept `metricUnit` prop; apply `toDisplay()`/`fromDisplay()`; use `displayUnit()`; add `whitespace-nowrap` to label+icon; change outer to `flex flex-wrap`; add `sm:ml-auto` to input wrapper
  - **Why:** Central fix point — all inputs flow through InputField; label fix prevents icon orphaning
- [ ] Modify `src/components/CostPerHectare.tsx` — pass `metricUnit` to each InputField; update tab label via `displayUnit()`
  - **Why:** Enables unit conversion for Tab 1 inputs and results
- [ ] Modify `src/components/CostPerHour.tsx` — same `metricUnit` additions
  - **Why:** Tab 2 has the same area-based fields
- [ ] Modify `src/components/CostBreakdown.tsx` — use `displayUnit()` for result row unit labels
  - **Why:** Results must show £/acre when in acres mode
- [ ] Modify `src/components/ResultBanner.tsx` — use converted unit text in saving messages
  - **Why:** Banner text should match chosen unit system
- [ ] Modify `src/components/CompareMachines.tsx` — convert speed (km/hr ↔ mph) and area units
  - **Why:** Compare tab has speed and work rate fields affected by both toggles
- [ ] Modify `src/components/ReplacementPlanner.tsx` — shorten "5-year average farm income" to "5-yr avg. farm income"
  - **Why:** Fixes label wrapping on narrow viewports
- [ ] Modify `src/components/ContractorRatesPanel.tsx` — convert NAAC rates £/ha ↔ £/acre
  - **Why:** Reference rates must match user's chosen unit
- [ ] Modify `src/components/FuelConsumptionPanel.tsx` — show L/acre in perHectare mode when acres selected
  - **Why:** Fuel consumption per area unit must match preference
- [ ] Update Tab 1 label in `src/App.tsx` — "Cost per Hectare" ↔ "Cost per Acre"
  - **Why:** Most visible indicator that unit conversion is active

---

## Phase G: SPEC-05 — Integration Tests & Visual Polish

_Must be last. Depends on SPEC-01 through SPEC-04 (and ideally SPEC-06/07)._

### Integration Tests

- [ ] Create `src/components/__tests__/CostPerHectare.integration.test.tsx` — test fuel price → input fill, contractor rates → input fill, panel presence, source attributions
  - **Why:** End-to-end flows validate reference panels wire through to form inputs
- [ ] Create `src/components/__tests__/CostPerHour.integration.test.tsx` — test fuel consumption slider → input fill, tractor hire rate → input fill, L/hr mode, default category
  - **Why:** Tab 2 integration flows; validates mode-specific behavior
- [ ] Add accessibility tests — sparkline `role="img"` + `aria-label`, "Use" buttons with descriptive `aria-label`, HP slider `aria-label`, CollapsibleSection `aria-expanded`
  - **Why:** Screen reader and keyboard navigation compliance

### Visual Polish

- [ ] Ensure all reference panels use same `CollapsibleSection` wrapper with consistent padding, font sizes, button styles
  - **Why:** Visual consistency; users should perceive them as one design system
- [ ] Add `aria-expanded` to `CollapsibleSection` trigger in `src/components/CollapsibleSection.tsx`
  - **Why:** Accessibility requirement; may be missing from existing Radix/Base UI component
- [ ] Verify responsive layout at 320px, 768px, 1280px
  - **Why:** Three breakpoints that must not show visual breakage
- [ ] Verify `npm run build` succeeds with zero TypeScript errors
  - **Why:** Final type-safety gate check
- [ ] Verify all tests pass (unit + integration) with `npm test`
  - **Why:** Complete regression check

---

## New Files (28)

| File | Spec | Type |
|------|------|------|
| `vitest.config.ts` | 01 | Config |
| `src/setupTests.ts` | 01 | Config |
| `src/lib/__tests__/calculations.test.ts` | 01 | Test |
| `src/components/__tests__/ResultBanner.test.tsx` | 01 | Test |
| `src/lib/fuel-data.ts` | 02 | Data |
| `src/lib/__tests__/fuel-data.test.ts` | 02 | Test |
| `src/components/Sparkline.tsx` | 02 | Component |
| `src/components/FuelPricePanel.tsx` | 02 | Component |
| `src/components/__tests__/FuelPricePanel.test.tsx` | 02 | Test |
| `src/lib/fuel-consumption-data.ts` | 03 | Data |
| `src/lib/__tests__/fuel-consumption-data.test.ts` | 03 | Test |
| `src/components/FuelConsumptionPanel.tsx` | 03 | Component |
| `src/components/__tests__/FuelConsumptionPanel.test.tsx` | 03 | Test |
| `src/lib/contractor-data.ts` | 04 | Data |
| `src/lib/__tests__/contractor-data.test.ts` | 04 | Test |
| `src/components/ContractorRatesPanel.tsx` | 04 | Component |
| `src/components/__tests__/ContractorRatesPanel.test.tsx` | 04 | Test |
| `src/lib/depreciation-data.ts` | 07 | Data |
| `src/lib/__tests__/depreciation-data.test.ts` | 07 | Test |
| `src/components/DepreciationCurve.tsx` | 07 | Component |
| `src/components/DepreciationPanel.tsx` | 07 | Component |
| `src/components/__tests__/DepreciationPanel.test.tsx` | 07 | Test |
| `src/lib/units.ts` | 06 | Lib |
| `src/lib/__tests__/units.test.ts` | 06 | Test |
| `src/components/UnitToggle.tsx` | 06 | Component |
| `src/components/__tests__/UnitToggle.test.tsx` | 06 | Test |
| `src/components/__tests__/CostPerHectare.integration.test.tsx` | 05 | Test |
| `src/components/__tests__/CostPerHour.integration.test.tsx` | 05 | Test |

## Modified Files (12)

| File | Modified By Specs |
|------|-------------------|
| `package.json` | 01 |
| `tsconfig.app.json` | 01 |
| `src/App.tsx` | 06 |
| `src/components/CostPerHectare.tsx` | 02, 03, 04, 06, 07 |
| `src/components/CostPerHour.tsx` | 02, 03, 04, 06, 07 |
| `src/components/InputField.tsx` | 06 |
| `src/components/CostBreakdown.tsx` | 06 |
| `src/components/ResultBanner.tsx` | 06 |
| `src/components/CompareMachines.tsx` | 06 |
| `src/components/ReplacementPlanner.tsx` | 06, 07 |
| `src/components/CollapsibleSection.tsx` | 05 |
| `src/lib/storage.ts` | 06 |
