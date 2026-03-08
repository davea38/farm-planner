# Farm Machinery Planner — Implementation Plan

> Updated: 2026-03-08
> Baseline: SPEC-01 through SPEC-11 fully implemented. SPEC-12 partially complete.
> Remaining: 24 pending tasks across correctness fixes, UX improvements, and design enhancements.

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
| 12 | UX & Logic Review | Partially done — see below |

---

## SPEC-12 Phase 1 — Completed Items

- [x] #1 Fuel formula is correct in SPECS.md
- [x] #2 Remove `haPerHr` from `types.ts`, `calculations.ts`, and `CostPerHour.tsx`
- [x] #3 Farm income is editable on Profitability tab
- [x] #4 Current unsaved machine costs included in Profitability
- [x] #6 Total annual cost shown on both cost tabs
- [x] #7 "Cost to replace" renamed to "Replacement price"
- [x] #8 "Contracting delivery costs" renamed to "Contracting operating costs"
- [x] #10 NAAC filter by charge unit in contracting cards
- [x] #11 Renamed to "Farm Only / Farm + Contracting"
- [x] #13 Machine type in Compare Machines for unit switching (sprayer uses L/litres)
- [x] #15 "View depreciation" button links replacement rows to depreciation
- [x] #16 `usePerYear`/`currentHours` tooltip says "For your reference"
- [x] #17 Profitability % breakdown shows two percentages
- [x] #19 6000 constant documented with inline comment
- [x] #21 AHDB methodology note added to insurance tooltip
- [x] #22 Friendly message for negative Cost to Budget
- [x] #23 Standalone Depreciation Tab 3 documented in SPECS.md

---

## Priority 1: Must-Fix Correctness

- [x] **1.1** Import `FUEL_PRICES` from `./fuel-data` in `src/lib/defaults.ts` and set `defaultCostPerHectare.fuelPrice` to `FUEL_PRICES.redDiesel.current / 100` (replacing hard-coded `0.53`).
  WHY: Stale default (0.53) is 30% below the current AHDB price (0.7491); misleads new users.

- [x] **1.2** Set `defaultCostPerHour.fuelPrice` to `FUEL_PRICES.redDiesel.current / 100` in `src/lib/defaults.ts` (replacing hard-coded `0.60`).
  WHY: Same stale-default problem as 1.1 but on Tab 2.

- [x] **1.3** Remove `haPerHr: 4` from `defaultCostPerHour` in `src/lib/defaults.ts` (line 33).
  WHY: Field was removed from the type and UI but the default object still ships it.

- [x] **1.4** Remove all `haPerHr` references from `CostPerHour.branch.test.tsx` and `calculations-full.test.ts`.
  WHY: Tests should not reference a removed field.

- [x] **1.5** Add a storage migration (v2 to v3) that strips `haPerHr` from persisted `CostPerHourInputs` when loading from localStorage.
  WHY: Existing users have the obsolete field in saved data; it should be cleaned on load.

- [x] **1.6** Unify replacement and depreciation category lists: either generate `MACHINE_CATEGORIES` in `src/lib/defaults.ts` from `category-mapping.ts`, or replace it with a single canonical list.
  WHY: Two diverging category arrays (`MACHINE_CATEGORIES` in defaults vs `DEPRECIATION_PROFILES` keys in depreciation-data) will drift apart over time. The mapping in `src/lib/category-mapping.ts` already bridges them but `MACHINE_CATEGORIES` is still independently maintained.

---

## Priority 2: Should-Fix UX

- [x] **2.1** Add a save-machine-feeds-profitability indicator: after saving a machine on Tab 1 or Tab 2, show a brief toast confirming the data now feeds the Profitability tab.
  WHY: Users cannot tell that saving on one tab updates another; the cross-tab data flow is invisible.

- [x] **2.2** Add an interest rate tooltip on `CostPerHectare.tsx` and `CostPerHour.tsx` explaining that this represents the opportunity cost of capital (or loan rate if financed).
  WHY: "Interest rate" is ambiguous — farmers may enter their savings rate (2%) or their loan rate (6-8%), which significantly changes results.

- [x] **2.3** Add a contracting cost-base warning on the Contracting Income tab when the same machine is used for own-farm work and contracting, noting that per-unit costs may be double-counted.
  WHY: Farmers using one machine for both purposes will overstate total costs without this context.

---

## Priority 3: High-Priority Design (SPEC-12 Phase 2)

- [x] **3.1** Move the results section above the inputs section on `CostPerHectare.tsx` — current order is `SaveLoadToolbar` then inputs then results; results should render immediately after `SaveLoadToolbar`, before inputs.
  WHY: Farmers care about the answer first; inputs are supporting detail.

- [x] **3.2** Move the results section above the inputs section on `CostPerHour.tsx` — same reorder as 3.1.
  WHY: Same results-first rationale; both cost tabs should be consistent.

- [x] **3.3** Rename tabs from technical labels to question-based names (e.g. "Cost per Hectare" becomes "What does it cost per hectare?", "Depreciation" becomes "How fast does it lose value?").
  WHY: Question framing tells users what each tab answers, reducing the learning curve.

- [x] **3.4** Add a donut chart to the cost breakdown on both cost tabs (CostPerHectare, CostPerHour) showing the split of depreciation, interest, insurance, storage, fuel, labour, and repairs.
  WHY: A visual breakdown is faster to parse than a table of numbers.

- [x] **3.5** Add a comparison bar (own cost vs contractor cost) on both cost tabs — two side-by-side horizontal bars with the difference highlighted.
  WHY: The own-vs-contractor comparison is the key decision; a visual bar makes the gap obvious.

- [x] **3.6** Add a stacked bar chart and donut chart to the Profitability tab: stacked bar showing income vs costs, donut showing cost category split (replacements, running costs, contracting).
  WHY: Charts make the profitability picture obvious without reading every number.

- [x] **3.7** Add inline sparklines per machine on the Replacement Planner (Tab 5) showing depreciation trajectory.
  WHY: Visual depreciation context directly in the replacement table saves farmers switching tabs.

---

## Priority 4: Medium-Priority Design (SPEC-12 Phase 2)

- [x] **4.1** Audit and replace technical input labels with farmer-friendly text across all tabs (e.g. "Field efficiency" becomes "Time actually working in the field (%)", add explanatory tooltips to "Average value").
  WHY: Farmers are not accountants; plain language reduces confusion and errors.

- [x] **4.2** Add save/load toast notifications across all tabs — when a machine profile is saved or loaded, show a brief toast confirming the action and noting which other tabs are affected.
  WHY: Cross-tab data flow is invisible without explicit feedback.

- [x] **4.3** Add data-source badges to inputs populated from other tabs or NAAC data (e.g. a small "From saved profile" or "NAAC rate" badge next to the field).
  WHY: Users need to know where a pre-filled number came from.

- [x] **4.4** Add an unsaved-changes indicator (dot or asterisk) on tab headers when inputs have been modified but not yet saved.
  WHY: Prevents users from navigating away and losing work unknowingly.

- [x] **4.5** Improve empty states with icons and action buttons — replace plain-text empty states (e.g. "No machines saved") with an icon plus a primary action button (e.g. "Add your first machine").
  WHY: Empty states are the first thing new users see; they should guide the next step.

---

## Priority 5: Low-Priority Polish (SPEC-12 Phase 2)

- [x] **5.1** Add a welcome/orientation panel for first-time users (no saved data in localStorage) explaining the tool's purpose and suggesting where to start.
  WHY: New users currently land on a form with no context or guidance.

- [x] **5.2** Apply the warm colour palette: page background `#F5F0E8`, card background `#FFFDF7`, gold accent `#8B6914`, border colour `#D4C5A9` — keep existing `farm-green` and `farm-amber` as secondary accents.
  WHY: Warm tones feel more approachable and appropriate for a farming tool.

- [x] **5.3** Increase primary result-number font sizes to 36-40px on cost tabs and profitability (total cost per hectare, cost per hour, profit margin).
  WHY: Large numbers draw the eye and reinforce the results-first layout established in 3.1/3.2.

---

## Dependency Order

Tasks should be executed in roughly this order, respecting dependencies:

1. **1.1, 1.2** — Fuel price defaults (independent, do together)
2. **1.3, 1.4** — Remove `haPerHr` from defaults and tests (independent)
3. **1.5** — Storage migration (depends on 1.3 being done so the default is clean)
4. **1.6** — Category unification (independent)
5. **2.1** — Save indicator (independent)
6. **2.2** — Interest rate tooltip (independent)
7. **2.3** — Contracting cost-base note (independent)
8. **3.1, 3.2** — Results-first layout (independent, do together)
9. **3.3** — Question-based tab names (independent, but do after 3.1/3.2 so layout is settled)
10. **3.4, 3.5, 3.6, 3.7** — Charts (independent of each other, but do after 3.1/3.2 since charts go in the results section)
11. **4.1 through 4.5** — Medium-priority design (independent of each other)
12. **5.1, 5.2, 5.3** — Polish (5.3 benefits from 3.1/3.2 being done first)

---

## Summary

| Group | Done | Pending |
|-------|------|---------|
| SPEC-01 – SPEC-11 | 11 | 0 |
| SPEC-12 Phase 1 — Completed | 17 | 0 |
| Priority 1 — Must-Fix Correctness | 6 | 0 |
| Priority 2 — Should-Fix UX | 3 | 0 |
| Priority 3 — High-Priority Design | 7 | 0 |
| Priority 4 — Medium-Priority Design | 5 | 0 |
| Priority 5 — Low-Priority Polish | 3 | 0 |
| **Total** | **52** | **0** |
