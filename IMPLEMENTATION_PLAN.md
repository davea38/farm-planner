# Farm Machinery Planner — Implementation Plan

> Updated: 2026-03-12
> Baseline: SPECs 01-11 fully implemented. SPEC-12 partially complete. SPEC-13 not started.
> Remaining: 0 build fixes, 6 SPEC-13 requirements (types done), 6 SPEC-12 items.

---

## Spec Status Summary

| Spec | Title | Status |
|------|-------|--------|
| SPEC-01 | Test Infrastructure | Complete |
| SPEC-02 | Fuel Price Panel | Complete |
| SPEC-03 | Fuel Consumption Panel | Complete |
| SPEC-04 | Contractor Rates Panel | Complete |
| SPEC-05 | Integration & Polish | Complete |
| SPEC-06 | UK Units & Labels | Complete |
| SPEC-07 | Depreciation Planner | Complete |
| SPEC-08 | Machine Profile Loading | Complete |
| SPEC-09 | Complete NAAC Data | Complete |
| SPEC-10 | Contracting Income | Complete |
| SPEC-11 | Profitability Overview | Complete |
| SPEC-12 | UX & Logic Review | Partially complete — 6 findings remain |
| SPEC-13 | Unified Machine Data Model (v6) | Not started — 0 of 6 requirements |

---

## Previously Completed Work

The following groups from the prior plan are all done:

- [x] Fix TypeScript errors in tests (ProfitabilityOverview, machineProfileLoading, select, MachinesTab).
- [x] Fix 30 failing tests across 7 files (App.test, SaveLoadToolbar, CostPerHour.branch, CostPerHectare.branch, etc.).
- [x] Wire onFarmIncomeChange in App.tsx for ProfitabilityOverview.
- [x] Fix replacement planner off-by-one bug (divide by effectiveSpan, not effectiveSpan+1).
- [x] Results-first layout for CostPerHectare and CostPerHour.
- [x] Question-based tab names (SPEC-12 #26).
- [x] Label audit: "Storage" to "Shed costs", "Expected sale price" to "What you'll get when you sell" (SPEC-12 #33).
- [x] Save confirmation toasts mention Profitability tab (SPEC-12 #16).
- [x] Typography and warmth polish (SPEC-12 #31).

---

## Priority 1: Fix Build-Breaking Issues

- [x] Remove the unused imports `defaultCostPerHectare` and `defaultCostPerHour` from `src/lib/storage.ts`.
  WHY: These 2 TypeScript errors prevent the project from building; nothing can ship until they are resolved.

- [x] Update the test helper and mock state in `src/__tests__/App.test.tsx` to account for the inline machine picker banner that now renders machine names in the banner DOM rather than solely inside the mocked MachinesTab.
  WHY: 16 tests timeout because `renderWithMachineAndTab` waits for `screen.getByText('Test Tractor')` which no longer resolves as expected after the banner was added; fixing selectors unblocks the full test suite.

---

## Priority 2: SPEC-13 — Core Data Model (Types & Defaults)

- [x] Define the `MachineProfile` interface in `src/lib/types.ts` with fields: `name`, `machineType: DepreciationCategory`, `costMode: CostMode`, `costPerHectare: CostPerHectareInputs`, `costPerHour: CostPerHourInputs`, and `compareMachines: { machineA: WorkrateInputs; machineB: WorkrateInputs }`.
  WHY: This is the foundational type that replaces the split `SavedMachine<T>` generic with a single self-contained machine record; every subsequent SPEC-13 task depends on it.

- [x] Add a `CostMode` type alias (`"hectare" | "hour"`) to `src/lib/types.ts`.
  WHY: Used by `MachineProfile.costMode` to indicate the machine's preferred calculator view.

- [x] Update the `AppState` interface in `src/lib/types.ts` to the v6 shape: replace `costPerHectare`, `costPerHour`, and the global `compareMachines` top-level keys with a single `savedMachines: MachineProfile[]`.
  WHY: The flat array eliminates the fragmented data model that causes complexity in selection, deletion, and cross-tab data flow.
  NOTE: Added as `AppStateV6` alongside existing `AppState` to avoid breaking consumers. The switchover from `AppState` to `AppStateV6` happens during Priority 5 wiring.

- [x] Add a `createDefaultMachineProfile(name: string, machineType: DepreciationCategory): MachineProfile` factory in `src/lib/defaults.ts` that populates both cost modes and default `compareMachines`.
  WHY: Every code path that creates a new machine needs a single source of truth for default values across all tabs.

---

## Priority 3: SPEC-13 — Storage Migration (v5 to v6)

- [ ] Bump `CURRENT_VERSION` from `5` to `6` in `src/lib/storage.ts`.
  WHY: Signals the new data format and triggers migration for existing users loading saved data.

- [ ] Add the v5-to-v6 migration function to the `migrations[]` array in `src/lib/storage.ts`: merge `costPerHectare.savedMachines` and `costPerHour.savedMachines` into a unified `savedMachines: MachineProfile[]` (hectare machines first), fill the missing cost-mode data with defaults, copy global `compareMachines` into each machine, and remap `linkedMachineSource` references in contracting services from `"costMode:index"` format to flat indices.
  WHY: Existing users' localStorage must be losslessly transformed to the new shape; contracting service links must remain valid after index renumbering.

- [ ] Update `createDefaultState()` in `src/lib/storage.ts` to return the v6 shape with `savedMachines: []` and no `costPerHectare`/`costPerHour`/`compareMachines` top-level keys.
  WHY: New users and fallback states must produce valid v6 data.

- [ ] Update `hasValidStructure()` in `src/lib/storage.ts` to validate v6 data (check for `savedMachines` array) while still accepting pre-v6 data so migration can run.
  WHY: The structural guard is called before migration; it must accept both old and new shapes.

- [ ] Write migration tests in `src/lib/__tests__/storage.migration-v6.test.ts` covering all 8 scenarios from SPEC-13: (1) 2 hectare + 1 hour machine merge into unified array, (2) input value preservation, (3) default filling for missing cost mode, (4) `linkedMachineSource` remapping for hectare machines, (5) `linkedMachineSource` remapping for hour machines offset after hectare machines, (6) empty machine lists, (7) `replacementPlanner`/`contractingIncome` passthrough, (8) v6 data round-trips without re-migration.
  WHY: Data migrations are irreversible and high-risk; automated tests prevent corruption for upgrading users.

---

## Priority 4: SPEC-13 — Controlled CostCalculator Conversion

- [ ] Convert `src/components/CostCalculator.tsx` from uncontrolled to fully controlled: remove all local `useState` for inputs, read `hectareInputs`/`hourInputs` directly from props, compute results via `useMemo` from props, and call `onHectareFieldChange(field, value)` / `onHourFieldChange(field, value)` synchronously on every input change instead of propagating via `useEffect`.
  WHY: This is the structural fix for the 3-machine data loss bug — eliminating local state means no stale copy can be lost when the component unmounts during a machine switch.

- [ ] Remove the `key={costMode}-${index}` prop from the CostCalculator mount in `src/App.tsx` and remove the `selectedMachineRef` that was a workaround for stale closures.
  WHY: Controlled components do not need forced remounting on machine switch, and the ref-based workaround becomes unnecessary.

- [ ] Add field-level updater callbacks in `src/App.tsx` that write directly to `appState.savedMachines[selectedIndex]` using `setAppState` with immutable updates.
  WHY: The parent must own all state; field-level callbacks replace the old bulk `onHectareChange`/`onHourChange` pattern.

- [ ] Write controlled-component tests in `src/components/__tests__/CostCalculator.controlled.test.tsx`: (9) renders values from props not internal state, (10) changing prop values updates display immediately, (11) field change calls `onHectareFieldChange` synchronously.
  WHY: Verifies the controlled contract is maintained and prevents regression to uncontrolled patterns.

- [ ] Write the 3-machine switch regression test in `src/lib/__tests__/machine-switch-save.test.ts`: set up 3 machines, edit machine #3's `purchasePrice` to 99999, switch to #2, switch back to #3, assert the edit persisted.
  WHY: Directly reproduces the original data-loss bug to prove it is fixed and prevent regression.

---

## Priority 5: SPEC-13 — Remaining Wiring (Selection, Components, Tests)

- [ ] Replace the `{ costMode, index }` selection tuple in `src/App.tsx` with a single `selectedMachineIndex: number | null`, reading `costMode` from `appState.savedMachines[index].costMode`.
  WHY: A flat index is simpler, aligns with the unified array, and eliminates index-shift bugs that arise from maintaining separate indices per cost mode.

- [ ] Consolidate `onSaveHectareMachine`/`onSaveHourMachine` and `onDeleteHectareMachine`/`onDeleteHourMachine` in `src/App.tsx` into single `onSaveMachine` and `onDeleteMachine` callbacks operating on `savedMachines[]`.
  WHY: With a unified array, there is no reason to have cost-mode-specific save/delete handlers; the split adds code and bug surface.

- [ ] Update `src/components/MachinesTab.tsx` to accept a single `machines: MachineProfile[]` prop and a single `onSelectMachine(index: number)` callback instead of separate hectare/hour machine arrays and callbacks.
  WHY: Matches the unified data model; the machine list no longer needs to merge two arrays for display.

- [ ] Update `src/components/CompareMachines.tsx` to read `machineA`/`machineB` from `selectedMachine.compareMachines` (per-machine) instead of the global `appState.compareMachines`, and write changes back to the selected machine's profile.
  WHY: Per-machine compare data means editing one machine's work-rate comparison does not affect another's.

- [ ] Update `src/components/ContractingIncomePlanner.tsx` to accept a single `savedMachines: MachineProfile[]` prop and use flat numeric indices for `linkedMachineSource`.
  WHY: The component currently builds a combined machine list from two separate arrays with `"hectare:N"` / `"hour:N"` keys; with unified machines this simplifies to a direct pass-through.

- [ ] Update `src/components/ProfitabilityOverview.tsx` to iterate `appState.savedMachines` (unified array) instead of combining two separate arrays for running cost aggregation.
  WHY: Running cost totals must use the unified array to be correct; the old merging logic would break with the new shape.

- [ ] Overhaul `src/__tests__/App.test.tsx` to use v6 `AppState` mock data, updated callback names (`onSaveMachine` instead of `onSaveHectareMachine`/`onSaveHourMachine`), and the new `selectedMachineIndex` selection model.
  WHY: All existing integration tests must pass against the new data model; stale mocks will cause false failures.

- [ ] Write data model unit tests in `src/lib/__tests__/machine-profile.test.ts`: (13) `createDefaultMachineProfile` fills both cost modes, (14) deleting middle machine adjusts selection index, (15) per-machine `compareMachines` independence, (16) export JSON matches SPEC-13 target shape.
  WHY: Validates new data model invariants and the JSON export contract against the spec.

---

## Priority 6: SPEC-12 — Remaining UX Items

- [ ] Include the current unsaved machine's running costs in the Profitability Overview totals (Finding #4).
  WHY: Product owner confirmed that the active machine's costs should appear in profitability even before the user saves; omitting them makes the overview silently inaccurate.

- [ ] Apply results-first layout to `src/components/CostCalculator.tsx` — the active unified component (Finding #27).
  WHY: Results-first was applied to the old `CostPerHectare`/`CostPerHour` components but CostCalculator (the component users actually see) still shows results at the bottom below all inputs; this is the single biggest remaining UX improvement.

- [ ] Add a L/ha-to-L/hr conversion hint tooltip to the fuel consumption field on the Cost per Hour mode of CostCalculator.
  WHY: Users who know their fuel use in L/ha (common for field operations) need guidance converting to L/hr; this was identified as missing and has not been added.

- [ ] Visually differentiate `usePerYear` and `currentHours` as read-only/reference fields in the Replacement Planner by greying them out or adding a "calculated" visual indicator (Finding #20).
  WHY: Users cannot currently tell which fields are editable inputs vs derived reference values; the "for reference" tooltips exist but lack visual reinforcement.

- [ ] Make source badges on `ProfitabilityOverview` clickable to navigate to the originating tab, add an "unsaved changes" indicator on tabs with pending edits, and add "This data also appears on:" footer notes to cross-referenced panels (Finding #30).
  WHY: Without inter-tab wayfinding, users lose track of where data originates and whether their changes have been captured elsewhere.

- [ ] Enhance empty states with richer illustrations and guided actions per SPEC-12 Finding #32 recommendations.
  WHY: First-time users see minimal empty states; richer guidance reduces confusion and accelerates onboarding.

---

## Dependency Order

```
Priority 1: Build fixes (2 TS errors + 16 failing tests)
    |
    v
Priority 2: SPEC-13 types & defaults
    |   MachineProfile interface
    |   CostMode type alias
    |   AppState v6 shape
    |   createDefaultMachineProfile factory
    |
    +---------------------------+
    |                           |
    v                           v
Priority 3: Storage migration   Priority 4: Controlled CostCalculator
    |   v5->v6 migration fn         |   Remove local useState
    |   createDefaultState()         |   Read from props
    |   hasValidStructure()          |   Field-level callbacks
    |   Migration tests              |   Controlled component tests
    |                                |   3-machine regression test
    +---------------------------+
                |
                v
Priority 5: SPEC-13 wiring
    |   Selection model (number | null)
    |   Unified save/delete callbacks
    |   MachinesTab update
    |   CompareMachines per-machine
    |   ContractingIncome update
    |   ProfitabilityOverview update
    |   App.test.tsx overhaul
    |   Data model unit tests
    |
    v
Priority 6: SPEC-12 remaining UX
        Unsaved machine in Profitability (#4)
        Results-first on CostCalculator (#27)
        Fuel tooltip L/ha->L/hr
        Read-only field styling (#20)
        Inter-tab wayfinding (#30)
        Enhanced empty states (#32)
```

Note: Priorities 3 and 4 can proceed in parallel since they both depend only on Priority 2 (types). Priority 5 requires both 3 and 4 to be complete. Priority 6 items are independent of each other and can be tackled in any order once Priority 5 is done.

---

## Summary

| Group | Done | Pending |
|-------|------|---------|
| SPECs 01-11 | 11 | 0 |
| Prior plan tasks (TS errors, test fixes, wiring, layout, labels, polish) | 20 | 0 |
| Priority 1 — Current build fixes | 2 | 0 |
| Priority 2 — SPEC-13 types & defaults | 4 | 0 |
| Priority 3 — SPEC-13 storage migration | 0 | 5 |
| Priority 4 — SPEC-13 controlled CostCalculator | 0 | 5 |
| Priority 5 — SPEC-13 wiring | 0 | 8 |
| Priority 6 — SPEC-12 remaining UX | 0 | 6 |
| **Total** | **37** | **24** |
