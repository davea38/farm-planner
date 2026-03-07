# Farm Machinery Planner — Implementation Plan

> Generated: 2026-03-07
> Baseline: All SPEC-01 through SPEC-11 features fully implemented. SPEC-12 must-fix items done.
> Current state: 382 tests passing, storage version 3, 7 tabs operational.

---

## Spec Status Summary

| Spec | Title | Status |
|------|-------|--------|
| 01 | Test Infrastructure | [x] Done |
| 02 | Fuel Price Panel | [x] Done |
| 03 | Fuel Consumption Panel | [x] Done |
| 04 | Contractor Rates Panel | [x] Done |
| 05 | Integration & Polish | [x] Done |
| 06 | UK Units & Labels | [x] Done |
| 07 | Depreciation Planner | [x] Done |
| 08 | Machine Profile Loading | [x] Done |
| 09 | Complete NAAC Data | [x] Done |
| 10 | Contracting Income | [x] Done |
| 11 | Profitability Overview | [x] Done |
| 12 | UX & Logic Review | Partially done — must-fix complete, should-fix/nice-to-have remain |

---

## Tier 0: Fix Pre-existing TypeScript Errors

Root cause: helper functions in test files infer narrow literal types from default parameter values instead of using the `UnitPreferences` union type. Fixing this makes `npx tsc -b` clean.

- [x] **0.1** Add `: UnitPreferences` type annotation to `renderWithUnits()` `units` parameter in `InputField.test.tsx`, `CompareMachines.test.tsx`, and `CostPerHectare.branch.test.tsx`.

- [x] **0.2** Remove unused `within` import in `ReplacementPlanner.full.test.tsx`.

- [x] **0.3** Remove unused `MachineType` import in `repair-data.test.ts`.

- [x] **0.4** Remove unused `act` import in `storage.test.ts`.

---

## Tier 1: Must Fix — SPEC-12 Product Owner Approved (ALL DONE)

- [x] **1.1** Fix SPECS.md fuel per hour formula (findings #1, #17).
- [x] **1.2** Remove orphaned `haPerHr` field + storage migration v2→v3 (finding #2).
- [x] **1.3** Make farm income editable on Profitability tab with bidirectional sync (finding #3).
- [x] **1.4** Include current (unsaved) machine in Profitability running costs (finding #4).
- [x] **1.5** Auto-sync default fuel prices from AHDB `FUEL_PRICES` constant (findings #8, #19).

---

## Tier 2: Should Fix — Significant UX Improvements

- [x] **2.1** Change "Cost to replace" label to "Replacement price" with tooltip "What the replacement machine will cost to buy (before deducting trade-in value)" in `ReplacementPlanner.tsx` line 147 (finding #6).
  **WHY:** "Cost to replace" is ambiguous — a farmer might enter the net cost instead of the gross purchase price.
  **Files:** `src/components/ReplacementPlanner.tsx`, `src/components/__tests__/ReplacementPlanner.full.test.tsx`.

- [x] **2.2** Rename "Without Contracting" / "With Contracting" to "Farm Only" / "Farm + Contracting" in the comparison table on ProfitabilityOverview (finding #18).
  **WHY:** "Without Contracting" can be misread as "without hiring a contractor" — the opposite meaning.
  **Files:** `src/components/ProfitabilityOverview.tsx`, `src/components/__tests__/ProfitabilityOverview.test.tsx`.

- [x] **2.3** Pass `unitFilter={service.chargeUnit}` to the embedded `ContractorRatesPanel` inside each contracting service card (finding #12).
  **WHY:** Without filtering, a farmer charging per bale sees 130+ irrelevant per-ha and per-hr rates.
  **Files:** `src/components/ContractingIncomePlanner.tsx`, `src/components/__tests__/ContractingIncomePlanner.test.tsx`.

- [x] **2.4** Add "Total annual cost: £X/year" line to the results section on both CostPerHectare and CostPerHour tabs (finding #9).
  **WHY:** Farmers think in annual budgets. Only showing per-unit cost forces mental arithmetic.
  **Files:** `src/lib/types.ts` (add `totalAnnualCost` to result interfaces), `src/lib/calculations.ts`, `src/components/CostPerHectare.tsx`, `src/components/CostPerHour.tsx`, related test files.

- [x] **2.5** Add a transient "Saved! This machine's costs now appear on the Profitability tab" notification after saving a machine profile (finding #16).
  **WHY:** Farmers don't understand the save-then-view-profitability workflow.
  **Files:** `src/components/SaveLoadToolbar.tsx`.

- [x] **2.6** Change "Contracting delivery costs" to "Contracting operating costs" (finding #10). Already done.

---

## Tier 3: Nice to Have — Polish

- [x] **3.1** Add comment documenting the `6000` constant in the workrate formula: `// 6000 = 60 min/hr × 100 (efficiency is %, not decimal)` (finding #24).
  **WHY:** Unexplained magic number makes the formula unauditable.
  **Files:** `src/lib/calculations.ts`.

- [x] **3.2** Improve interest rate tooltip: "The return you could earn if you invested the money instead. Usually 2-4%. If you borrowed, use your loan rate instead." (finding #14).
  **WHY:** Conflating savings rate (2-4%) with loan rate (6-8%) significantly changes results.

- [x] **3.3** Add a note on the Contracting Income tab about shared machine cost-base (finding #5).
  **WHY:** Per-unit cost is overstated when a machine is shared between own-use and contracting.
  **Files:** `src/components/ContractingIncomePlanner.tsx`.

- [x] **3.4** Create a mapping between replacement planner categories and depreciation categories (finding #7).
  **WHY:** "Cultivator" doesn't auto-map to "Tillage Equipment" depreciation curve.
  **Files:** `src/lib/category-mapping.ts` (new), `src/lib/__tests__/category-mapping.test.ts` (new).

- [x] **3.5** Add machine type selector (spreader/sprayer) to Compare Machines for switching units between kg and L (finding #13).
  **WHY:** Sprayers use litres, not kg. Showing "800 kg" for a sprayer tank is wrong.
  **Files:** `src/components/CompareMachines.tsx`.

- [x] **3.6** Link replacement machine rows to depreciation curves — "View depreciation" button per row (finding #15). Depends on 3.4.
  **WHY:** Manually selecting matching depreciation categories for 10 machines is tedious.
  **Files:** `src/components/ReplacementPlanner.tsx`, `src/components/DepreciationPanel.tsx`, `src/components/CollapsibleSection.tsx`.

- [ ] **3.7** Make `usePerYear` and `currentHours` fields in Replacement Planner either functional or labelled "(for your reference)" (finding #20).
  **WHY:** Editable fields that affect nothing feel broken to a farmer.
  **Files:** `src/components/ReplacementPlanner.tsx`.

- [ ] **3.8** Show two profitability percentages: "Machinery costs as % of farm income" and "All costs as % of total income" (finding #11).
  **WHY:** Same thresholds but different income bases cause confusing discrepancies between tabs.
  **Files:** `src/components/ProfitabilityOverview.tsx`.

---

## Tier 4: Additional Observations

- [ ] **4.1** Add a note that insurance is calculated on purchase price, not current value, per AHDB methodology (finding #21).
  **WHY:** Known simplification that could mislead farmers with older machines.

- [ ] **4.2** When "Cost to Budget" is negative, show "You'll receive £X when you swap" instead of a confusing negative number (finding #22).
  **WHY:** Negative values look like errors without explanation.
  **Files:** `src/components/ReplacementPlanner.tsx`.

- [ ] **4.3** Update SPECS.md to document the standalone Depreciation Tab 3 (finding #23).
  **WHY:** Spec should reflect what was built.
  **Files:** `specs/SPECS.md`.

---

## Recommended Execution Order

1. **Tier 0** (0.1–0.4) — Clean TS baseline. One pass, all independent.
2. **Tier 2.1** — Label + tooltip change in ReplacementPlanner.
3. **Tier 2.2** — Label change in ProfitabilityOverview.
4. **Tier 2.3** — Single prop addition for NAAC filtering.
5. **Tier 2.4** — Types + calculations + UI for total annual cost.
6. **Tier 2.5** — Save notification UX.
7. **Tier 3.1** — One-line comment.
8. **Tier 3.2** — Tooltip text.
9. **Tier 3.3** — Informational note.
10. **Tier 3.4** → **3.6** — Category mapping, then depreciation linking.
11. Remaining Tier 3 + Tier 4 as time permits.

---

## Summary

| Tier | Total | Done | Remaining |
|------|-------|------|-----------|
| 0 — Tech Debt | 4 | 4 | 0 |
| 1 — Must Fix | 5 | 5 | 0 |
| 2 — Should Fix | 6 | 6 | 0 |
| 3 — Nice to Have | 8 | 6 | 2 |
| 4 — Observations | 3 | 0 | 3 |
| **Total** | **26** | **21** | **5** |
