# SPEC-13: Unified Machine Data Model (v6)

## Problem

### Bug: Machine data lost when switching between 3+ machines

When a user has 3 machines:
1. Selects machine #3, edits cost-per-hectare values
2. Switches to machine #2 (loads correctly)
3. Switches back to machine #3 — **values have reverted**

**Root cause:** `CostCalculator` is an **uncontrolled component** that copies parent data into local `useState` on mount, then propagates changes back via `useEffect`. When the component unmounts (due to `key` change on machine switch), React may not execute the final `useEffect` before the new instance mounts, so the last edits are lost.

Relevant code:
- `CostCalculator.tsx:36-37` — local state initialized from props
- `CostCalculator.tsx:80-84` — useEffect propagates local state to parent (may not fire before unmount)
- `App.tsx:472` — `key={costMode}-${index}` forces unmount/remount on machine switch
- `App.tsx:80-90` — `onCostPerHectareChange` uses `selectedMachineRef.current` which may already point to the new machine

### Structural problem: Fragmented data model

The current `AppState` splits machine-related data across multiple top-level keys:
- `costPerHectare.savedMachines[]` — separate array for hectare-mode machines
- `costPerHour.savedMachines[]` — separate array for hour-mode machines
- `compareMachines` — a single global pair, not per-machine
- Selection requires `{ costMode, index }` tuple — fragile, index-shift-prone

This makes the JSON export shape unintuitive and creates unnecessary complexity in machine selection, deletion, and cross-tab data flow.

---

## Solution: Unified MachineProfile + Controlled Components

### 1. New Data Model (version 6)

```typescript
// types.ts

export type CostMode = "hectare" | "hour";

/**
 * A unified machine profile. Each machine owns ALL its tab data.
 * Both cost modes are always present; costMode is a UI preference.
 */
export interface MachineProfile {
  name: string;
  machineType: DepreciationCategory;
  costMode: CostMode;                    // preferred calculator mode
  costPerHectare: CostPerHectareInputs;
  costPerHour: CostPerHourInputs;
  compareMachines: {
    machineA: WorkrateInputs;
    machineB: WorkrateInputs;
  };
}

export interface AppState {
  version: number;
  lastSaved: string;
  savedMachines: MachineProfile[];
  replacementPlanner: ReplacementPlannerState;
  contractingIncome: ContractingIncomeState;
}
```

**Key decisions:**
- Each machine always stores **both** costPerHectare and costPerHour data. `costMode` is a per-machine UI preference for which view to show by default.
- `compareMachines` moves inside each machine profile (per-machine, not global).
- `replacementPlanner` and `contractingIncome` remain global (they reference machines but aren't owned by a single machine).
- Selected machine becomes a simple `number | null` index into `savedMachines[]`.

### 2. Target JSON shape

```json
{
  "version": 6,
  "lastSaved": "2026-03-12T10:00:00.000Z",
  "savedMachines": [
    {
      "name": "970",
      "machineType": "tractors_large",
      "costMode": "hectare",
      "costPerHectare": {
        "purchasePrice": 126000,
        "yearsOwned": 8,
        "salePrice": 34000,
        "hectaresPerYear": 1200,
        "interestRate": 2,
        "insuranceRate": 2,
        "storageRate": 1,
        "workRate": 4,
        "labourCost": 14,
        "fuelPrice": 0.85,
        "fuelUse": 20,
        "repairsPct": 2,
        "contractorCharge": 76
      },
      "costPerHour": {
        "purchasePrice": 126000,
        "yearsOwned": 8,
        "salePrice": 34000,
        "hoursPerYear": 700,
        "interestRate": 2,
        "insuranceRate": 2,
        "storageRate": 1,
        "fuelConsumptionPerHr": 14,
        "fuelPrice": 0.85,
        "repairsPct": 2,
        "labourCost": 14,
        "contractorCharge": 45
      },
      "compareMachines": {
        "machineA": { "name": "Machine A", "width": 4, "...": "..." },
        "machineB": { "name": "Machine B", "width": 30, "...": "..." }
      }
    },
    {
      "name": "Sprayer",
      "machineType": "sprayers",
      "costMode": "hectare",
      "costPerHectare": { "..." : "..." },
      "costPerHour": { "..." : "..." },
      "compareMachines": { "..." : "..." }
    }
  ],
  "replacementPlanner": { "machines": [], "farmIncome": 350000 },
  "contractingIncome": { "services": [] }
}
```

### 3. Bug fix: Controlled CostCalculator

Convert `CostCalculator` from uncontrolled (local state + useEffect propagation) to **fully controlled** (reads from props, writes directly to parent on every change).

**Before (buggy):**
```typescript
// CostCalculator.tsx — local state diverges from parent
const [haInputs, setHaInputs] = useState(initialHectareInputs ?? default)
// useEffect propagates to parent... but may not fire before unmount
useEffect(() => { onHectareChange?.(haInputs) }, [haInputs])
```

**After (controlled):**
```typescript
// CostCalculator.tsx — no local state for inputs
export function CostCalculator({
  hectareInputs,                // read directly from parent
  hourInputs,                   // read directly from parent
  onHectareFieldChange,         // (field, value) => void — writes to parent immediately
  onHourFieldChange,            // (field, value) => void — writes to parent immediately
  ...
}) {
  // NO useState for inputs. NO useEffect propagation.
  const updateHa = (field) => (value) => onHectareFieldChange(field, value)
  // Results computed from props:
  const haResults = useMemo(() => calcCostPerHectare(hectareInputs), [hectareInputs])
}
```

**In App.tsx**, field-level updaters write directly to appState:
```typescript
const onHectareFieldChange = useCallback((field, value) => {
  if (selectedIndex === null) return;
  setAppState(prev => ({
    ...prev,
    savedMachines: prev.savedMachines.map((m, i) =>
      i === selectedIndex
        ? { ...m, costPerHectare: { ...m.costPerHectare, [field]: value } }
        : m
    ),
  }));
}, [selectedIndex]);
```

This eliminates:
- The `key` prop hack (no longer needed since component is controlled)
- The `selectedMachineRef` (no longer needed)
- The useEffect propagation timing bug
- Any possibility of stale/lost data on machine switch

### 4. Migration: v5 → v6

```typescript
// storage.ts — add to migrations array

// v5 → v6: Unify savedMachines into single array with per-machine data
(state) => {
  const ha = (state.costPerHectare as any)?.savedMachines ?? [];
  const hr = (state.costPerHour as any)?.savedMachines ?? [];
  const compare = state.compareMachines as any;

  const indexMap: Record<string, number> = {};
  const unified: MachineProfile[] = [];

  // Hectare machines first (preserves current UI ordering)
  for (let i = 0; i < ha.length; i++) {
    indexMap[`hectare:${i}`] = unified.length;
    unified.push({
      name: ha[i].name,
      machineType: ha[i].machineType ?? "miscellaneous",
      costMode: "hectare",
      costPerHectare: ha[i].inputs,
      costPerHour: { ...defaultCostPerHour },
      compareMachines: {
        machineA: compare?.machineA ?? { ...defaultMachineA },
        machineB: compare?.machineB ?? { ...defaultMachineB },
      },
    });
  }

  // Hour machines after
  for (let i = 0; i < hr.length; i++) {
    indexMap[`hour:${i}`] = unified.length;
    unified.push({
      name: hr[i].name,
      machineType: hr[i].machineType ?? "miscellaneous",
      costMode: "hour",
      costPerHour: hr[i].inputs,
      costPerHectare: { ...defaultCostPerHectare },
      compareMachines: {
        machineA: compare?.machineA ?? { ...defaultMachineA },
        machineB: compare?.machineB ?? { ...defaultMachineB },
      },
    });
  }

  // Migrate linkedMachineSource in contracting services
  const contracting = state.contractingIncome as any;
  if (contracting?.services) {
    for (const svc of contracting.services) {
      if (svc.linkedMachineSource) {
        const newIdx = indexMap[svc.linkedMachineSource];
        svc.linkedMachineSource = newIdx !== undefined ? String(newIdx) : null;
      }
    }
  }

  const { costPerHectare: _, costPerHour: __, compareMachines: ___, ...rest } = state;
  return { ...rest, version: 6, savedMachines: unified };
}
```

### 5. Selection model change

**Before:** `SelectedMachine = { costMode: CostMode, index: number }`
**After:** `selectedMachineIndex: number | null`

The `costMode` for display is read from `appState.savedMachines[index].costMode`.

### 6. Files to modify

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `MachineProfile`, update `AppState` to v6 shape |
| `src/lib/defaults.ts` | Add `createDefaultMachineProfile(name, machineType)` |
| `src/lib/storage.ts` | Bump version to 6, add migration, update `hasValidStructure`, update `createDefaultState` |
| `src/components/CostCalculator.tsx` | Convert to controlled component (remove local state + useEffect) |
| `src/App.tsx` | Unified `savedMachines`, single-index selection, simplified callbacks |
| `src/components/MachinesTab.tsx` | Single `machines[]` prop, simplified selection type |
| `src/components/CompareMachines.tsx` | Read from `machine.compareMachines` |
| `src/components/ContractingIncomePlanner.tsx` | Single `savedMachines` prop, update `linkedMachineSource` |
| `src/components/ProfitabilityOverview.tsx` | Iterate `appState.savedMachines` |

### 7. Implementation order

1. Types (`types.ts`)
2. Defaults (`defaults.ts`)
3. Migration + storage (`storage.ts`)
4. CostCalculator controlled conversion
5. App.tsx state rewiring
6. MachinesTab simplification
7. CompareMachines per-machine wiring
8. ContractingIncomePlanner + ProfitabilityOverview updates
9. Tests

---

## RED/GREEN Tests

### Migration tests (`src/lib/__tests__/storage.migration-v6.test.ts`)

#### Test 1: v5 with 2 hectare + 1 hour machine → v6 unified array
- **RED:** Call `migrateState()` with v5 data containing `costPerHectare.savedMachines` (2 entries) and `costPerHour.savedMachines` (1 entry). Assert `result.savedMachines` has 3 entries, `result.version === 6`.
- **GREEN:** Migration merges arrays, hectare-first, sets `costMode` correctly.

#### Test 2: Migration preserves all input values
- **RED:** v5 machine with `purchasePrice: 99999` → v6 machine has `costPerHectare.purchasePrice === 99999`.
- **GREEN:** Migration copies `inputs` into `costPerHectare`/`costPerHour` fields.

#### Test 3: Migration fills missing cost mode with defaults
- **RED:** A v5 hectare machine has no hour data. After migration, `costPerHour` is populated with defaults (not undefined/null).
- **GREEN:** Migration spreads `defaultCostPerHour` for hectare machines' missing hour data.

#### Test 4: Migration remaps linkedMachineSource
- **RED:** v5 contracting service has `linkedMachineSource: "hectare:1"` with 2 hectare machines. After migration, `linkedMachineSource === "1"`.
- **GREEN:** Index map correctly translates old `"costMode:index"` format.

#### Test 5: Migration with `linkedMachineSource: "hour:0"` and 2 hectare machines
- **RED:** Old `"hour:0"` should become `"2"` (after 2 hectare machines).
- **GREEN:** Hour machines are appended after hectare machines in the unified array.

#### Test 6: Migration handles empty machine lists
- **RED:** v5 with zero machines → v6 has `savedMachines: []`.
- **GREEN:** Empty arrays produce empty result.

#### Test 7: Migration preserves replacementPlanner and contractingIncome
- **RED:** v5 `replacementPlanner.farmIncome === 400000` → v6 same value.
- **GREEN:** These global sections pass through unchanged.

#### Test 8: v6 data round-trips without re-migration
- **RED:** `loadState()` with v6 data returns it unchanged, no migration applied.
- **GREEN:** Version check skips migration for current version.

### Controlled CostCalculator tests (`src/components/__tests__/CostCalculator.controlled.test.tsx`)

#### Test 9: Renders values from props, not internal state
- **RED:** Render `CostCalculator` with `hectareInputs.purchasePrice = 50000`. Assert rendered input shows 50000.
- **GREEN:** Component reads from props directly.

#### Test 10: Changing prop values updates display immediately
- **RED:** Re-render with `hectareInputs.purchasePrice = 75000`. Assert input now shows 75000.
- **GREEN:** No stale local state — component is controlled.

#### Test 11: Field change calls onHectareFieldChange synchronously
- **RED:** User types new value in purchase price field. Assert `onHectareFieldChange` called with `("purchasePrice", newValue)`.
- **GREEN:** No useEffect delay — callback fires on change event.

### Bug reproduction test (`src/lib/__tests__/machine-switch-save.test.ts`)

#### Test 12: Three-machine switch preserves edited data
- **RED:** Set up appState with 3 machines. Simulate: select machine #3, update `costPerHectare.purchasePrice` to 99999, select machine #2, select machine #3 again. Assert `appState.savedMachines[2].costPerHectare.purchasePrice === 99999`.
- **GREEN:** With controlled component, changes write directly to appState — no data loss on switch.

### Data model tests (`src/lib/__tests__/machine-profile.test.ts`)

#### Test 13: createDefaultMachineProfile fills both cost modes
- **RED:** `createDefaultMachineProfile("Test", "tractors_large")` has valid `costPerHectare`, valid `costPerHour`, and valid `compareMachines`.
- **GREEN:** Factory function populates all nested defaults.

#### Test 14: Deleting middle machine adjusts selection
- **RED:** 3 machines, selected index 2. Delete machine at index 1. Selected index should become 1 (decremented because a lower-index machine was removed).
- **GREEN:** Delete handler adjusts `selectedMachineIndex` when a machine below the selected one is removed.

#### Test 15: Per-machine compareMachines is independent
- **RED:** Machine #1 has `compareMachines.machineA.width = 10`. Machine #2 has `compareMachines.machineA.width = 20`. Editing machine #1's width does not affect machine #2.
- **GREEN:** Each MachineProfile owns its own `compareMachines` object.

#### Test 16: Export JSON matches target shape
- **RED:** Export a v6 state. Parse the JSON. Assert top-level keys are `version`, `lastSaved`, `savedMachines`, `replacementPlanner`, `contractingIncome`. Assert each machine in `savedMachines` has keys `name`, `machineType`, `costMode`, `costPerHectare`, `costPerHour`, `compareMachines`.
- **GREEN:** `exportToFile` serializes the new structure correctly.
