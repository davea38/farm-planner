# SPEC-14: Hide selected machine banner on independent tabs

## Summary

The selected machine banner (showing the active machine name, icon, type, and "Change" button) is no longer displayed on the following tabs:

- **Compare Machines** (`compare-machines`)
- **Replacement Planner** (`replacement-planner`)
- **Contracting Income** (`contracting-income`)
- **Profitability** (`profitability`)

The banner continues to appear on **Cost Calculator** and **Depreciation** tabs, which depend on per-machine data.

## Rationale

These four tabs operate on fleet-level or standalone data, not on the currently selected machine's per-machine profile. Showing the selected machine banner on these tabs was misleading — it suggested the tab content was scoped to that machine when it was not.

## Changes

### `src/App.tsx`

1. **Banner visibility**: Changed the condition from `activeTab !== "machines"` to exclude all five non-banner tabs: `machines`, `compare-machines`, `replacement-planner`, `contracting-income`, `profitability`. The banner now only renders on `cost-calculator` and `depreciation` tabs.

2. **Tab disabled state**: Removed `disabled={!hasMachineSelected}` from the four tab triggers. These tabs are now always accessible, even before a machine is selected.

3. **Navigation guard**: Updated the `onValueChange` handler to allow navigation to the four independent tabs without a machine selected. Only `cost-calculator` and `depreciation` still require a machine selection to navigate.

## Tests

Test file: `src/__tests__/hide-machine-banner.test.tsx` (17 tests)

### Banner visibility tests
- Banner IS shown on cost-calculator tab (with machine name and Change button)
- Banner IS shown on depreciation tab
- Banner is NOT shown on compare-machines tab
- Banner is NOT shown on replacement-planner tab
- Banner is NOT shown on contracting-income tab
- Banner is NOT shown on profitability tab

### Tab disabled state tests
- compare-machines tab is NOT disabled when no machine selected
- replacement-planner tab is NOT disabled when no machine selected
- contracting-income tab is NOT disabled when no machine selected
- profitability tab is NOT disabled when no machine selected
- cost-calculator tab IS still disabled when no machine selected
- depreciation tab IS still disabled when no machine selected

### Navigation tests
- Can navigate to compare-machines without selecting a machine
- Can navigate to replacement-planner without selecting a machine
- Can navigate to contracting-income without selecting a machine
- Can navigate to profitability without selecting a machine
- Cannot navigate to cost-calculator without selecting a machine

All existing tests (648 total across 46 files) continue to pass.
