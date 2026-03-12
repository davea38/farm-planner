# Implementation Plan

Status as of 2026-03-12. Items marked `[x]` are complete; `[ ]` are pending.

---

## Priority 1 — Fix Broken Tests (SPEC-13 v6 migration)

Production code is updated to the v6 unified machine model but 6 test files
(~144 failures) still assert the old v5 state shape and callback signatures.
The app works; CI is red.

- [x] **Update `App.test.tsx`:** Replaced v5 callbacks with v6 unified callbacks (`onSaveMachine`, `onDeleteMachine`) and `selectedMachineIndex` state.

- [x] **Update `MachinesTab.test.tsx`:** Changed props to `(machines, selectedMachineIndex, onSelectMachine, onSaveMachine, onDeleteMachine)`.

- [x] **Update `ContractingIncomePlanner.test.tsx`:** Replaced `savedHectareMachines`/`savedHourMachines` with single `savedMachines: MachineProfile[]`.

- [x] **Update `ProfitabilityOverview.test.tsx`:** Constructed `appState` with `savedMachines: MachineProfile[]` at top level.

- [x] **Update `storage.test.ts`:** Updated assertions to expect v6 shape.

- [x] **Update `storage.machineType.test.ts`:** Adjusted migration assertions for v5→v6 chain.

---

## Priority 2 — Fix Bugs

- [x] Off-by-one in `calcReplacementSummary` — Already fixed: code divides by `effectiveSpan` (not `annualCosts.length`), correctly excluding year 0.

- [x] HP reference points: SPEC-03 says 75-300 HP but code uses 100-1000 HP. This is a deliberate deviation — the wider range covers modern farm machinery better, slider goes to 1000 HP, and all tests pass. No action needed (spec is informational).

---

## Priority 3 — Complete SPEC-12 Must-Fix Findings

- [x] Finding #1 — Fuel/hr formula is correct (spec text is informational).
- [x] Finding #2 — `haPerHr` stripped by v2-to-v3 migration.
- [x] Finding #3 — Farm income editable on Profitability tab.
- [x] Finding #4 — No longer applicable: in v6, all machines are saved before they can be edited (no "unsaved current machine" concept exists).
- [x] Finding #5/#8/#19 — Default fuel prices use `FUEL_PRICES.redDiesel.current` from `fuel-data.ts`.

---

## Priority 4 — SPEC-12 Should-Fix UX Improvements

- [x] Finding #6 — "Cost to replace" already renamed to "Replacement price" in `ReplacementPlanner`.

- [x] Finding #9 — Total annual cost displayed prominently in `CostCalculator` (both modes).

- [x] Finding #10 — Label is already "Additional costs" (not "Contracting delivery costs"); no rename needed.

- [x] Finding #12 — NAAC panel in contracting cards already filters by `service.chargeUnit`.

- [x] Finding #13 — Sprayer/spreader unit toggle added to Compare Machines; `unitType` stored on `WorkrateInputs`.

- [x] Finding #16 — Save toast already mentions "Worth It?" overview tab.

- [x] Finding #18 — Already renamed to "Farm Only" / "Farm + Contracting" in `ProfitabilityOverview`.

- [x] Finding #20 — "Use per year" and "Current hours" already have tooltips clarifying "For your reference — not used in cost calculations". Keeping them editable is intentional (user notes).

- [x] Finding #21 — Insurance tooltip already explains it's "as a percentage of what you paid" and notes current value may be lower.

---

## Priority 5 — SPEC-12 Phase-2 Design Findings

- [x] Finding #26 — Tab names phrased as farmer questions.
- [x] Finding #27 — Results-first layout with `CollapsibleSection`.
- [x] Finding #29 — `WelcomePanel` exists.
- [x] Finding #22 — Negative "Cost to budget" shows "You'll receive" message.
- [x] Finding #14 — Interest-rate tooltip says "finance/opportunity cost".

- [x] **Finding #28:** Visual breakdowns complete — donut charts on CostCalculator and ProfitabilityOverview, CostComparisonBar on CostCalculator, DepreciationSparkline on ReplacementPlanner, IncomeVsCostsBar on ProfitabilityOverview, and new ContractingComparisonBar for Farm Only vs Farm + Contracting comparison.

- [x] **Finding #30:** Inter-tab wayfinding complete — SourceBadge now supports clickable navigation (navigates to source tab on click), ProfitabilityOverview badges wired to source tabs, ConnectedTabsFooter added to Machines, Cost Calculator, Replacement Planner, and Contracting tabs. Save toasts with data-flow hints were already implemented.

- [ ] **Finding #31 (partial):** Complete typography and warmth audit — farm-green/amber/red palette and large result numbers exist but consistency not verified.
  *WHY: Inconsistent styling undermines trust.*

- [x] **Finding #32:** Empty states audit complete — MachinesTab, ProfitabilityOverview, ContractingIncomePlanner, and ReplacementPlanner TimelineChart all have farmer-friendly empty states with clear guidance and action buttons.

- [x] **Finding #33:** Farmer-friendly language audit complete — labels, section headers, tooltips, and warning messages updated across all active components (CostCalculator, CompareMachines, ReplacementPlanner, ProfitabilityOverview, ContractingIncomePlanner).
  *Changes: "Spares & repairs" → "Repairs (% of price)", "Coverage speed" → "Ground covered", "Finance / opportunity cost" → "Money tied up", "Shed costs" → "Shed costs (% of price)", "Contractor charges" → "Contractor quote", "Contractor Comparison" → "Compare with a contractor", "Running Costs" → "Running costs", "Overheads" → "Overheads (most farmers leave these as-is)", "Results" → "Your answer", "Budget Summary" → "Your budget", "Farm income" → "Your farm income", warning messages updated to match new labels.*

---

## Priority 6 — Dead Code Cleanup

- [ ] **Delete `src/components/CostPerHectare.tsx` and `src/components/CostPerHour.tsx`:** These files contain TODO merge markers and are no longer imported by `App.tsx`.
  *WHY: Dead code increases confusion and maintenance burden.*

- [ ] **Migrate or delete test files that import old components:** `CostPerHectare.branch.test.tsx`, `CostPerHectare.integration.test.tsx`, `CostPerHour.branch.test.tsx`, `CostPerHour.integration.test.tsx`, `machineProfileLoading.test.tsx` — either adapt to test `CostCalculator` or remove if the scenarios are already covered.
  *WHY: These tests will break once the old components are deleted.*

---

## Already Complete (for reference)

- [x] SPEC-01 through SPEC-11 — fully implemented.
- [x] SPEC-13 core types, migration, and production components — committed and working.
- [x] Finding #7 — `category-mapping.ts` aligns depreciation and replacement categories.
- [x] Finding #15 (partial) — `DepreciationSparkline` links replacement rows to depreciation.
