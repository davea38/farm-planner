# Farm Machinery Planner — Implementation Plan

> Updated: 2026-03-11
> Baseline: SPEC-01 through SPEC-11 fully implemented. SPEC-08 architecture diverged (improved). SPEC-12 partially complete.
> Remaining: 8 pending tasks across UX improvements.

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
| 08 | Machine Profile Loading | Partially done — architecture improved but tests stale |
| 09 | Complete NAAC Data | [x] Done |
| 10 | Contracting Income | [x] Done |
| 11 | Profitability Overview | [x] Done |
| 12 | UX & Logic Review | Partially done — see below |

---

## Priority 1: Fix TypeScript Errors in Tests

These block the build and CI pipeline. Nothing else can ship until these are resolved.

- [x] Fix ProfitabilityOverview.test.tsx by adding the missing `machineType` property to all SavedMachine test objects.
  WHY: TypeScript compilation fails; CI cannot run any tests until this is resolved.

- [x] Fix machineProfileLoading.test.tsx by removing props (savedMachines, onSaveMachine, onLoadMachine, onDeleteMachine) that CostPerHectare and CostPerHour no longer accept.
  WHY: TypeScript compilation fails; these props were removed during the centralized MachinesTab refactor.

- [x] Fix select.test.tsx by removing the unused `screen` import.
  WHY: TypeScript strict mode treats unused imports as errors, blocking the build.

- [x] Fix MachinesTab.test.tsx by providing complete SavedMachine `inputs` objects instead of partial stubs.
  WHY: TypeScript compilation fails because test data uses `{ purchasePrice: number }` instead of the full CostPerHectareInputs/CostPerHourInputs shapes.

---

## Priority 2: Fix Failing Tests

30 tests across 7 files are failing. These must pass before any refactoring to avoid cascading breakage.

- [x] Fix App.test.tsx (10 failures) by updating tab switching, machine selection callbacks, and state change handler tests to match the centralized MachinesTab architecture.
  WHY: Tests reference the old per-tab save/load pattern which no longer exists.

- [x] Fix SaveLoadToolbar.machineType.test.tsx (6 failures) by updating machine type dropdown save/load/delete/reset flow assertions to reflect current SaveLoadToolbar behavior within MachinesTab.
  WHY: Save/load orchestration moved to MachinesTab; toolbar test expectations are stale.

- [x] Fix CostPerHour.branch.test.tsx (4 failures) by removing savedMachines/onSaveMachine/onLoadMachine props and testing saved machine loading through the centralized flow.
  WHY: CostPerHour no longer accepts these props; tests must exercise the new architecture.

- [x] Fix CostPerHectare.branch.test.tsx (4 failures) by removing save/load/delete callback props and updating dirty state tracking tests for the centralized architecture.
  WHY: CostPerHectare no longer accepts these props; tests must exercise the new architecture.

- [x] Fix SaveLoadToolbar.full.test.tsx (1 failure) by adding the third `selectedIndex` argument to the onSave assertion and fixing the component to clear the name input after save.
  WHY: onSave now takes 3 args (name, machineType, selectedIndex); test only asserted 2. Component also wasn't clearing the input after save.

- [x] Fix ContractingIncomePlanner.test.tsx (2 failures) by updating NAAC rates filtering assertions and collapsible section interaction tests. Also add missing `machineType` to SavedMachine objects (TS error).
  WHY: Filter logic or DOM structure changed since these tests were written. Also has the same missing machineType TS error as ProfitabilityOverview had.

- [x] Fix machineProfileLoading.test.tsx — tests already pass after prior refactors removed stale save/load props.
  WHY: Tests were already aligned with the centralized MachinesTab architecture.

---

## Priority 3: Wire Missing Functionality

- [x] Wire onFarmIncomeChange in App.tsx so ProfitabilityOverview can actually update farm income state.
  WHY: The prop is defined on ProfitabilityOverview but never connected in App.tsx; users cannot change farm income, which breaks the core profitability calculation.

- [x] Fix the off-by-one bug in the replacement planner average annual cost calculation (divide by effectiveSpan, not effectiveSpan+1).
  WHY: Every machine's average annual cost is understated because the denominator is one year too large.

---

## Priority 4: Results-First Layout

- [x] Restructure CostPerHectare so the results section renders above the inputs section.
  WHY: SPEC-12 finding #27; users must scroll past all inputs before seeing output, which is the single biggest UX friction point.

- [x] Restructure CostPerHour so the results section renders above the inputs section.
  WHY: Same results-first rationale; both cost tabs should be consistent.

---

## Priority 5: Tab Names and Label Audit

- [x] Rename tabs to use question-based names per SPEC-12 finding #26 (e.g. "Cost per Hectare" becomes "What does it cost per hectare?").
  WHY: Question-based names tell users what each tab answers, reducing the learning curve.
  DONE: Desktop (sm+) shows question-based names ("Cost per hectare?", "Losing value?", etc.); mobile keeps short names ("Cost/Ha", "Value Loss", etc.). Layout changed to 4-col grid on all breakpoints to accommodate longer labels.

- [x] Rename "Storage" label to "Shed costs" across all cost tabs.
  WHY: "Shed costs" matches the language farmers actually use; "Storage" is ambiguous.

- [ ] Rename "Expected sale price" to "What you'll get when you sell" on relevant inputs.
  WHY: Conversational labels reduce cognitive load for non-technical users.

---

## Priority 6: Save Confirmation Messaging

- [ ] Update save confirmation toasts to mention that saved machines feed the Profitability tab.
  WHY: SPEC-12 finding #16; users do not realize saving a machine on one tab updates profitability calculations on another.

---

## Priority 7: Typography and Warmth Polish

- [ ] Complete the remaining typography and warm-color styling per SPEC-12 finding #31.
  WHY: Partially applied; finishing this pass gives the app a consistent, approachable feel across all tabs.

---

## Dependency Order

Tasks must be executed respecting these dependencies:

1. **Priority 1 (TS errors)** — must be fixed first; the build is broken without these.
2. **Priority 2 (failing tests)** — fix after TS errors; tests must pass before any refactoring.
3. **Priority 3 (wiring + bug fix)** — independent of each other; can proceed in parallel with test fixes.
4. **Priority 4 (results-first layout)** — do after tests pass; layout changes will shift DOM structure and break test selectors.
5. **Priorities 5-7 (labels, confirmations, polish)** — independent of each other; do after layout is stable.

---

## Summary

| Group | Done | Pending |
|-------|------|---------|
| SPEC-01 through SPEC-07, SPEC-09 through SPEC-11 | 10 | 0 |
| SPEC-08 Machine Profile Loading | partial | tests need rewrite |
| Priority 1 — TypeScript Errors | 4 | 0 |
| Priority 2 — Failing Tests | 7 | 0 |
| Priority 3 — Wire Missing Functionality | 2 | 0 |
| Priority 4 — Results-First Layout | 2 | 0 |
| Priority 5 — Tab Names & Label Audit | 0 | 3 |
| Priority 6 — Save Confirmation Messaging | 0 | 1 |
| Priority 7 — Typography & Warmth Polish | 0 | 1 |
| **Total** | **0** | **21** |
