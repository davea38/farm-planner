# SPEC-08: Machine Profile Loading Bug Fix

## Goal

Fix a bug where selecting a saved machine profile from the dropdown does not correctly load that profile's data into the form. Affects both Cost per Hectare and Cost per Hour tabs. Add RED/GREEN tests to verify the fix.

## Depends On

SPEC-01 (test infra).

## Bug Description

When a user saves multiple machine profiles (e.g. "Drill" and "Sprayer") and selects one from the dropdown, the form should populate with that profile's saved inputs. This fails because:

1. **Missing `onLoadMachine` prop in App.tsx**: `App.tsx` never creates `onLoadMachine` handler callbacks and never passes them to `<CostPerHectare>` or `<CostPerHour>`. Both child components declare the prop and call it in `handleLoad`, but since it's never provided the parent `appState` is never updated when a profile is loaded. The child's local state updates via `setInputs(machine.inputs)`, but the parent state diverges. On any parent-triggered re-render the stale parent state overwrites the child's local state via `initialInputs`.

2. **Controlled/uncontrolled Select switching in SaveLoadToolbar.tsx (line 65)**: When `selectedIndex` is `null`, the Select `value` is `undefined` (uncontrolled mode). When a number, it's `String(selectedIndex)` (controlled mode). This flip-flopping means that after a delete sets `selectedIndex` back to `null`, selecting an item that lands on the same string index may not fire `onValueChange`.

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/__tests__/SaveLoadToolbar.test.tsx` | Unit tests for profile selection and re-selection after delete |
| `src/components/__tests__/machineProfileLoading.test.tsx` | Integration tests for full load flow across both tabs |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `onLoadCostPerHectareMachine` and `onLoadCostPerHourMachine` callbacks; pass as `onLoadMachine` prop |
| `src/components/SaveLoadToolbar.tsx` | Fix Select `value` prop to always be a string (never `undefined`) |

## RED Tests (must fail before implementation)

### 1. SaveLoadToolbar unit tests (`SaveLoadToolbar.test.tsx`)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SaveLoadToolbar } from '@/components/SaveLoadToolbar'

const twoMachines = [
  { name: 'Drill', inputs: { purchasePrice: 50000 } },
  { name: 'Sprayer', inputs: { purchasePrice: 80000 } },
]

describe('SaveLoadToolbar', () => {
  it('calls onLoad with the selected index when a profile is chosen', () => {
    const onLoad = vi.fn()
    render(
      <SaveLoadToolbar
        savedMachines={twoMachines}
        onSave={vi.fn()}
        onLoad={onLoad}
        onDelete={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText(/Load a saved machine/i))
    fireEvent.click(screen.getByText('Sprayer'))
    expect(onLoad).toHaveBeenCalledWith(1)
  })

  it('re-fires onLoad after delete when selecting same index', () => {
    const onLoad = vi.fn()
    const onDelete = vi.fn()
    const { rerender } = render(
      <SaveLoadToolbar
        savedMachines={twoMachines}
        onSave={vi.fn()}
        onLoad={onLoad}
        onDelete={onDelete}
      />
    )
    // Select index 0 ("Drill")
    fireEvent.click(screen.getByText(/Load a saved machine/i))
    fireEvent.click(screen.getByText('Drill'))
    expect(onLoad).toHaveBeenCalledWith(0)

    // Delete the selected machine
    fireEvent.click(screen.getByText('Delete'))
    expect(onDelete).toHaveBeenCalledWith(0)

    // Re-render with one machine remaining (Sprayer is now index 0)
    rerender(
      <SaveLoadToolbar
        savedMachines={[twoMachines[1]]}
        onSave={vi.fn()}
        onLoad={onLoad}
        onDelete={onDelete}
      />
    )

    // Select index 0 again (now "Sprayer") - onLoad MUST fire
    onLoad.mockClear()
    fireEvent.click(screen.getByText(/Load a saved machine/i))
    fireEvent.click(screen.getByText('Sprayer'))
    expect(onLoad).toHaveBeenCalledWith(0)
  })
})
```

### 2. Machine profile loading integration tests (`machineProfileLoading.test.tsx`)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CostPerHectare } from '@/components/CostPerHectare'
import { CostPerHour } from '@/components/CostPerHour'
import type { CostPerHectareInputs, CostPerHourInputs } from '@/lib/types'
import { defaultCostPerHectare, defaultCostPerHour } from '@/lib/defaults'

const drillInputs: CostPerHectareInputs = {
  ...defaultCostPerHectare,
  purchasePrice: 50000,
  contractorCharge: 40,
}

const sprayerInputs: CostPerHectareInputs = {
  ...defaultCostPerHectare,
  purchasePrice: 80000,
  contractorCharge: 55,
}

describe('CostPerHectare machine profile loading', () => {
  it('calls onLoadMachine with correct index when profile A is selected', () => {
    const onLoadMachine = vi.fn()
    render(
      <CostPerHectare
        initialInputs={defaultCostPerHectare}
        onChange={vi.fn()}
        savedMachines={[
          { name: 'Drill', inputs: drillInputs },
          { name: 'Sprayer', inputs: sprayerInputs },
        ]}
        onSaveMachine={vi.fn()}
        onLoadMachine={onLoadMachine}
        onDeleteMachine={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText(/Load a saved machine/i))
    fireEvent.click(screen.getByText('Drill'))
    expect(onLoadMachine).toHaveBeenCalledWith(0)
  })

  it('fires onChange with profile B data when profile B is selected', () => {
    const onChange = vi.fn()
    render(
      <CostPerHectare
        initialInputs={defaultCostPerHectare}
        onChange={onChange}
        savedMachines={[
          { name: 'Drill', inputs: drillInputs },
          { name: 'Sprayer', inputs: sprayerInputs },
        ]}
        onSaveMachine={vi.fn()}
        onLoadMachine={vi.fn()}
        onDeleteMachine={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText(/Load a saved machine/i))
    fireEvent.click(screen.getByText('Sprayer'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ purchasePrice: 80000, contractorCharge: 55 })
    )
  })
})

const loaderInputs: CostPerHourInputs = {
  ...defaultCostPerHour,
  purchasePrice: 60000,
  contractorCharge: 35,
}

describe('CostPerHour machine profile loading', () => {
  it('loads the correct profile when selected', () => {
    const onLoadMachine = vi.fn()
    const onChange = vi.fn()
    render(
      <CostPerHour
        initialInputs={defaultCostPerHour}
        onChange={onChange}
        savedMachines={[{ name: 'Loader', inputs: loaderInputs }]}
        onSaveMachine={vi.fn()}
        onLoadMachine={onLoadMachine}
        onDeleteMachine={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText(/Load a saved machine/i))
    fireEvent.click(screen.getByText('Loader'))
    expect(onLoadMachine).toHaveBeenCalledWith(0)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ purchasePrice: 60000, contractorCharge: 35 })
    )
  })
})
```

## GREEN Tests (must pass after implementation)

All tests above pass:
- SaveLoadToolbar calls `onLoad` with the correct index
- SaveLoadToolbar re-fires `onLoad` after delete when selecting the same index position
- CostPerHectare calls `onLoadMachine` with the correct index
- CostPerHour does the same
- `onChange` fires with the loaded profile's actual inputs

## Implementation Steps

### Step 1: Write RED tests
Create the two test files above. Run `npm test` and confirm they fail.

### Step 2: Fix SaveLoadToolbar.tsx
Change line 65 from:
```tsx
value={selectedIndex !== null ? String(selectedIndex) : undefined}
```
to:
```tsx
value={selectedIndex !== null ? String(selectedIndex) : ""}
```
This keeps the Select permanently in controlled mode.

### Step 3: Fix App.tsx
Add two `useCallback` handlers:

```typescript
const onLoadCostPerHectareMachine = useCallback((index: number) => {
  setAppState((prev) => {
    const machine = prev.costPerHectare.savedMachines[index]
    if (!machine) return prev
    return {
      ...prev,
      costPerHectare: { ...prev.costPerHectare, current: machine.inputs },
    }
  })
}, [])

const onLoadCostPerHourMachine = useCallback((index: number) => {
  setAppState((prev) => {
    const machine = prev.costPerHour.savedMachines[index]
    if (!machine) return prev
    return {
      ...prev,
      costPerHour: { ...prev.costPerHour, current: machine.inputs },
    }
  })
}, [])
```

Pass them as props:
```tsx
<CostPerHectare
  ...
  onLoadMachine={onLoadCostPerHectareMachine}
/>
<CostPerHour
  ...
  onLoadMachine={onLoadCostPerHourMachine}
/>
```

### Step 4: Run tests
Confirm all RED tests now pass (GREEN). Run full suite: `npm test`.

### Step 5: Build
Run `npx tsc -b && npx vite build` to confirm no TypeScript errors.

## Acceptance Criteria

- [ ] Selecting a saved machine profile loads that profile's data into the form
- [ ] Both CostPerHectare and CostPerHour tabs correctly load saved profiles
- [ ] Parent state (`appState`) is updated when a profile is loaded
- [ ] After deleting a profile and selecting a new one at the same dropdown index, the new profile loads correctly
- [ ] The Select component in SaveLoadToolbar is always in controlled mode
- [ ] All new tests pass
- [ ] All existing tests continue to pass
- [ ] `npm run build` succeeds with no TypeScript errors
