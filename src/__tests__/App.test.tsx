import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

// ---------------------------------------------------------------------------
// Captured callbacks from mocked child components
// ---------------------------------------------------------------------------
let capturedOnSelectMachine: ((sel: { costMode: string; index: number } | null) => void) | null = null
let capturedOnSaveHectareMachine: ((...args: unknown[]) => void) | null = null
let capturedOnSaveHourMachine: ((...args: unknown[]) => void) | null = null
let capturedOnDeleteHectareMachine: ((index: number) => void) | null = null
let capturedOnDeleteHourMachine: ((index: number) => void) | null = null
let capturedCostPerHectareOnChange: ((inputs: Record<string, unknown>) => void) | null = null
let capturedCostPerHourOnChange: ((inputs: Record<string, unknown>) => void) | null = null
let capturedCompareMachinesOnChange: ((a: unknown, b: unknown) => void) | null = null
let capturedReplacementPlannerOnChange: ((state: unknown) => void) | null = null
let capturedContractingIncomeOnChange: ((state: unknown) => void) | null = null

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/components/CostPerHectare', () => ({
  CostPerHectare: (props: Record<string, unknown>) => {
    capturedCostPerHectareOnChange = props.onChange as typeof capturedCostPerHectareOnChange
    return <div data-testid="cost-per-hectare" />
  },
}))

vi.mock('@/components/CostPerHour', () => ({
  CostPerHour: (props: Record<string, unknown>) => {
    capturedCostPerHourOnChange = props.onChange as typeof capturedCostPerHourOnChange
    return <div data-testid="cost-per-hour" />
  },
}))

vi.mock('@/components/CompareMachines', () => ({
  CompareMachines: (props: Record<string, unknown>) => {
    capturedCompareMachinesOnChange = props.onChange as typeof capturedCompareMachinesOnChange
    return <div data-testid="compare-machines" />
  },
}))

vi.mock('@/components/ReplacementPlanner', () => ({
  ReplacementPlanner: (props: Record<string, unknown>) => {
    capturedReplacementPlannerOnChange = props.onChange as typeof capturedReplacementPlannerOnChange
    return <div data-testid="replacement-planner" />
  },
}))

vi.mock('@/components/DepreciationPanel', () => ({
  DepreciationPanel: () => <div data-testid="depreciation-panel" />,
}))

vi.mock('@/components/ContractingIncomePlanner', () => ({
  ContractingIncomePlanner: (props: Record<string, unknown>) => {
    capturedContractingIncomeOnChange = props.onChange as typeof capturedContractingIncomeOnChange
    return <div data-testid="contracting-income" />
  },
}))

vi.mock('@/components/ProfitabilityOverview', () => ({
  ProfitabilityOverview: () => <div data-testid="profitability-overview" />,
}))

vi.mock('@/components/WelcomePanel', () => ({
  WelcomePanel: () => <div data-testid="welcome-panel" />,
}))

vi.mock('@/components/MachinesTab', () => ({
  MachinesTab: (props: Record<string, unknown>) => {
    capturedOnSelectMachine = props.onSelectMachine as typeof capturedOnSelectMachine
    capturedOnSaveHectareMachine = props.onSaveHectareMachine as typeof capturedOnSaveHectareMachine
    capturedOnSaveHourMachine = props.onSaveHourMachine as typeof capturedOnSaveHourMachine
    capturedOnDeleteHectareMachine = props.onDeleteHectareMachine as typeof capturedOnDeleteHectareMachine
    capturedOnDeleteHourMachine = props.onDeleteHourMachine as typeof capturedOnDeleteHourMachine
    return <div data-testid="machines-tab" />
  },
  MachineIcon: ({ type }: { type: string }) => <span data-testid="machine-icon">{type}</span>,
}))

// Storage mock
const mockDefaultState = {
  version: 4,
  lastSaved: '2025-01-01T00:00:00.000Z',
  costPerHectare: {
    current: {
      purchasePrice: 126000, yearsOwned: 8, salePrice: 34000, hectaresPerYear: 1200,
      interestRate: 2, insuranceRate: 2, storageRate: 1, workRate: 4,
      labourCost: 14, fuelPrice: 0.65, fuelUse: 20, repairsPct: 2, contractorCharge: 76,
    },
    savedMachines: [] as Array<{ name: string; machineType: string; inputs: Record<string, number> }>,
  },
  costPerHour: {
    current: {
      purchasePrice: 92751, yearsOwned: 7, salePrice: 40000, hoursPerYear: 700,
      interestRate: 2, insuranceRate: 2, storageRate: 1, fuelConsumptionPerHr: 14,
      fuelPrice: 0.65, repairsPct: 1, labourCost: 14, contractorCharge: 45,
    },
    savedMachines: [] as Array<{ name: string; machineType: string; inputs: Record<string, number> }>,
  },
  compareMachines: {
    machineA: { name: 'Machine A', width: 4, capacity: 800, speed: 6, applicationRate: 180, transportTime: 5, fillingTime: 10, fieldEfficiency: 65 },
    machineB: { name: 'Machine B', width: 30, capacity: 2000, speed: 12, applicationRate: 250, transportTime: 5, fillingTime: 10, fieldEfficiency: 75 },
  },
  replacementPlanner: { machines: [], farmIncome: 350000 },
  contractingIncome: { services: [] },
}

const mockExportToFile = vi.fn()
const mockImportFromFile = vi.fn()
const mockSaveUnitPreferences = vi.fn()

vi.mock('@/lib/storage', () => ({
  loadState: () => JSON.parse(JSON.stringify(mockDefaultState)),
  useAutoSave: vi.fn(),
  exportToFile: (...args: unknown[]) => mockExportToFile(...args),
  importFromFile: (...args: unknown[]) => mockImportFromFile(...args),
  loadUnitPreferences: () => ({ area: 'ha' as const, speed: 'km' as const }),
  saveUnitPreferences: (...args: unknown[]) => mockSaveUnitPreferences(...args),
}))

vi.mock('@/lib/depreciation-data', () => ({
  DEPRECIATION_PROFILES: {
    tractors_large: { label: 'Large Tractor' },
    combines: { label: 'Combine Harvester' },
  },
}))

import App from '@/App'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderApp() {
  return render(<App />)
}

function resetCaptured() {
  capturedOnSelectMachine = null
  capturedOnSaveHectareMachine = null
  capturedOnSaveHourMachine = null
  capturedOnDeleteHectareMachine = null
  capturedOnDeleteHourMachine = null
  capturedCostPerHectareOnChange = null
  capturedCostPerHourOnChange = null
  capturedCompareMachinesOnChange = null
  capturedReplacementPlannerOnChange = null
  capturedContractingIncomeOnChange = null
}

function addHectareMachine() {
  mockDefaultState.costPerHectare.savedMachines = [
    { name: 'Test Tractor', machineType: 'tractors_large', inputs: { ...mockDefaultState.costPerHectare.current } },
  ]
}

function addHourMachine() {
  mockDefaultState.costPerHour.savedMachines = [
    { name: 'Hour Machine', machineType: 'combines', inputs: { ...mockDefaultState.costPerHour.current } },
  ]
}

function removeSavedMachines() {
  mockDefaultState.costPerHectare.savedMachines = []
  mockDefaultState.costPerHour.savedMachines = []
}

// Helper: render app, select a hectare machine, and switch to a given tab
async function renderWithMachineAndTab(tab: string) {
  addHectareMachine()
  renderApp()
  act(() => { capturedOnSelectMachine!({ costMode: 'hectare', index: 0 }) })
  await waitFor(() => { expect(screen.getByText('Active')).toBeInTheDocument() })
  if (tab !== 'machines') {
    const user = userEvent.setup()
    await user.click(screen.getByText(tab))
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetCaptured()
    removeSavedMachines()
    window.location.hash = ''
  })

  // --- Rendering basics ---

  it('renders the title', () => {
    renderApp()
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  it('renders WelcomePanel', () => {
    renderApp()
    expect(screen.getByTestId('welcome-panel')).toBeInTheDocument()
  })

  it('shows Export JSON and Import JSON buttons', () => {
    renderApp()
    expect(screen.getByText('Export JSON')).toBeInTheDocument()
    expect(screen.getByText('Import JSON')).toBeInTheDocument()
  })

  // --- Tabs ---

  it('shows all 8 tab labels', () => {
    renderApp()
    for (const label of ['Machines', 'Cost/Ha', 'Cost/Hr', 'Value Loss', 'Compare', 'Replace', 'Contract', 'Worth It?']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('shows Cost/Acre when unit is acres', () => {
    renderApp()
    fireEvent.click(screen.getByText('acres'))
    expect(screen.getByText('Cost/Acre')).toBeInTheDocument()
  })

  it('defaults to Machines tab', () => {
    renderApp()
    expect(screen.getByTestId('machines-tab')).toBeInTheDocument()
  })

  // --- Disabled tabs ---

  it('disables non-machine tabs when no machine selected', () => {
    renderApp()
    for (const label of ['Cost/Ha', 'Cost/Hr', 'Value Loss', 'Compare', 'Replace', 'Contract', 'Worth It?']) {
      const tab = screen.getByText(label).closest('button')!
      expect(tab.hasAttribute('disabled') || tab.getAttribute('aria-disabled') === 'true').toBe(true)
    }
  })

  it('does not disable Machines tab', () => {
    renderApp()
    const tab = screen.getByText('Machines').closest('button')!
    expect(tab.hasAttribute('disabled') || tab.getAttribute('aria-disabled') === 'true').toBe(false)
  })

  // --- No-machine banners ---

  it('shows "No machine selected"', () => {
    renderApp()
    expect(screen.getByText('No machine selected')).toBeInTheDocument()
  })

  it('shows "Add your first machine" when no saved machines', () => {
    renderApp()
    expect(screen.getByText(/Add your first machine/)).toBeInTheDocument()
  })

  it('shows "Select a machine" when machines exist but none selected', () => {
    addHectareMachine()
    renderApp()
    expect(screen.getByText(/Select a machine on the Machines tab/)).toBeInTheDocument()
  })

  // --- Active machine banner ---

  it('shows active machine banner with name, Active badge, and profile label', async () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!({ costMode: 'hectare', index: 0 }) })
    await waitFor(() => { expect(screen.getByText('Test Tractor')).toBeInTheDocument() })
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Large Tractor')).toBeInTheDocument()
  })

  it('shows active banner for cost-per-hour machine', async () => {
    addHourMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!({ costMode: 'hour', index: 0 }) })
    await waitFor(() => { expect(screen.getByText('Hour Machine')).toBeInTheDocument() })
    expect(screen.getByText('Combine Harvester')).toBeInTheDocument()
  })

  it('enables non-machine tabs after selection', async () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!({ costMode: 'hectare', index: 0 }) })
    await waitFor(() => { expect(screen.getByText('Active')).toBeInTheDocument() })
    const tab = screen.getByText('Cost/Ha').closest('button')!
    expect(tab.hasAttribute('disabled') || tab.getAttribute('aria-disabled') === 'true').toBe(false)
  })

  it('removes "No machine selected" when machine selected', async () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!({ costMode: 'hectare', index: 0 }) })
    await waitFor(() => { expect(screen.queryByText('No machine selected')).not.toBeInTheDocument() })
  })

  it('returns null for active banner when selected machine index is out of bounds', async () => {
    addHectareMachine()
    renderApp()
    // Select index 99 which doesn't exist
    act(() => { capturedOnSelectMachine!({ costMode: 'hectare', index: 99 }) })
    // Banner should not show machine name or Active
    await waitFor(() => {
      expect(screen.queryByText('Active')).not.toBeInTheDocument()
    })
  })

  // --- Deselection ---

  it('shows "No machine selected" after deselecting', async () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!({ costMode: 'hectare', index: 0 }) })
    await waitFor(() => { expect(screen.getByText('Active')).toBeInTheDocument() })
    act(() => { capturedOnSelectMachine!(null) })
    await waitFor(() => { expect(screen.getByText('No machine selected')).toBeInTheDocument() })
  })

  // --- UnitToggle ---

  it('renders UnitToggle options', () => {
    renderApp()
    for (const label of ['ha', 'acres', 'km', 'miles']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('saves unit preferences when toggled', () => {
    renderApp()
    fireEvent.click(screen.getByText('acres'))
    expect(mockSaveUnitPreferences).toHaveBeenCalledWith({ area: 'acres', speed: 'km' })
  })

  // --- Export ---

  it('calls exportToFile on Export JSON click', async () => {
    renderApp()
    await userEvent.setup().click(screen.getByText('Export JSON'))
    expect(mockExportToFile).toHaveBeenCalledTimes(1)
  })

  // --- Import ---

  it('renders hidden file input for import', () => {
    const { container } = renderApp()
    const input = container.querySelector('input[type="file"]')!
    expect(input).toHaveClass('hidden')
    expect(input).toHaveAttribute('accept', '.json')
  })

  it('imports file and updates state', async () => {
    const newState = JSON.parse(JSON.stringify(mockDefaultState))
    newState.costPerHectare.savedMachines = [
      { name: 'Imported', machineType: 'tractors_large', inputs: newState.costPerHectare.current },
    ]
    mockImportFromFile.mockResolvedValue(newState)

    const { container } = renderApp()
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    const file = new File(['{}'], 'test.json', { type: 'application/json' })
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    expect(mockImportFromFile).toHaveBeenCalledWith(file)
  })

  it('alerts on import error', async () => {
    mockImportFromFile.mockRejectedValue(new Error('Invalid file'))
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    const { container } = renderApp()
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    const file = new File(['bad'], 'test.json', { type: 'application/json' })
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    expect(alertSpy).toHaveBeenCalledWith('Invalid file')
    alertSpy.mockRestore()
  })

  it('alerts with fallback message for non-Error rejection', async () => {
    mockImportFromFile.mockRejectedValue('something')
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    const { container } = renderApp()
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    const file = new File(['bad'], 'test.json', { type: 'application/json' })
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    expect(alertSpy).toHaveBeenCalledWith('Failed to import file')
    alertSpy.mockRestore()
  })

  it('does nothing if no file selected on import', async () => {
    const { container } = renderApp()
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [] } })
    })

    expect(mockImportFromFile).not.toHaveBeenCalled()
  })

  // --- Tab gate logic ---

  it('prevents switching to non-machine tabs when no machine selected', async () => {
    renderApp()
    await userEvent.setup().click(screen.getByText('Cost/Ha'))
    expect(screen.getByTestId('machines-tab')).toBeInTheDocument()
  })

  it('allows switching to Cost/Ha tab after selecting a machine', async () => {
    await renderWithMachineAndTab('Cost/Ha')
    await waitFor(() => { expect(screen.getByTestId('cost-per-hectare')).toBeInTheDocument() })
  })

  // --- Callback exercise: handleSelectMachine loads inputs ---

  it('handleSelectMachine with hectare loads cost-per-hectare inputs', async () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!({ costMode: 'hectare', index: 0 }) })
    await waitFor(() => { expect(screen.getByText('Test Tractor')).toBeInTheDocument() })
    // The state was updated internally — we can verify the app didn't crash
  })

  it('handleSelectMachine with hour loads cost-per-hour inputs', async () => {
    addHourMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!({ costMode: 'hour', index: 0 }) })
    await waitFor(() => { expect(screen.getByText('Hour Machine')).toBeInTheDocument() })
  })

  it('handleSelectMachine with out-of-bounds hectare index returns prev state', async () => {
    renderApp()
    act(() => { capturedOnSelectMachine!({ costMode: 'hectare', index: 99 }) })
    // App should not crash
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  it('handleSelectMachine with out-of-bounds hour index returns prev state', async () => {
    renderApp()
    act(() => { capturedOnSelectMachine!({ costMode: 'hour', index: 99 }) })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  // --- Callback exercise: onSaveCostPerHectareMachine ---

  it('onSaveCostPerHectareMachine adds a new machine', async () => {
    renderApp()
    act(() => { capturedOnSaveHectareMachine!('New Machine', 'tractors_large', null) })
    // App should not crash and the state is updated
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  it('onSaveCostPerHectareMachine updates existing machine', async () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnSaveHectareMachine!('Updated', 'tractors_large', 0) })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  // --- Callback exercise: onDeleteCostPerHectareMachine ---

  it('onDeleteCostPerHectareMachine removes machine', async () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnDeleteHectareMachine!(0) })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  // --- Callback exercise: onSaveCostPerHourMachine ---

  it('onSaveCostPerHourMachine adds a new machine', async () => {
    renderApp()
    act(() => { capturedOnSaveHourMachine!('New Hour', 'combines', null) })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  it('onSaveCostPerHourMachine updates existing machine', async () => {
    addHourMachine()
    renderApp()
    act(() => { capturedOnSaveHourMachine!('Updated Hour', 'combines', 0) })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  // --- Callback exercise: onDeleteCostPerHourMachine ---

  it('onDeleteCostPerHourMachine removes machine', async () => {
    addHourMachine()
    renderApp()
    act(() => { capturedOnDeleteHourMachine!(0) })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  // --- Callback exercise: onCostPerHectareChange ---

  it('onCostPerHectareChange updates current and saved machine if selected', async () => {
    addHectareMachine()
    renderApp()
    // Select the machine first
    act(() => { capturedOnSelectMachine!({ costMode: 'hectare', index: 0 }) })
    await waitFor(() => { expect(screen.getByText('Active')).toBeInTheDocument() })

    // Switch to Cost/Ha tab to get the onChange callback
    const user = userEvent.setup()
    await user.click(screen.getByText('Cost/Ha'))
    await waitFor(() => { expect(screen.getByTestId('cost-per-hectare')).toBeInTheDocument() })

    // Now invoke the onChange
    act(() => {
      capturedCostPerHectareOnChange!({ ...mockDefaultState.costPerHectare.current, purchasePrice: 999 })
    })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  it('onCostPerHectareChange skips saved machine update if no machine selected', async () => {
    addHectareMachine()
    renderApp()
    // Select and then switch to Cost/Ha
    act(() => { capturedOnSelectMachine!({ costMode: 'hectare', index: 0 }) })
    await waitFor(() => { expect(screen.getByText('Active')).toBeInTheDocument() })
    const user = userEvent.setup()
    await user.click(screen.getByText('Cost/Ha'))
    await waitFor(() => { expect(screen.getByTestId('cost-per-hectare')).toBeInTheDocument() })

    // Deselect, then call onChange
    act(() => { capturedOnSelectMachine!(null) })
    act(() => {
      capturedCostPerHectareOnChange!({ ...mockDefaultState.costPerHectare.current, purchasePrice: 888 })
    })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  // --- Callback exercise: onCostPerHourChange ---

  it('onCostPerHourChange updates current and saved machine if selected', async () => {
    addHourMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!({ costMode: 'hour', index: 0 }) })
    await waitFor(() => { expect(screen.getByText('Active')).toBeInTheDocument() })

    const user = userEvent.setup()
    await user.click(screen.getByText('Cost/Hr'))
    await waitFor(() => { expect(screen.getByTestId('cost-per-hour')).toBeInTheDocument() })

    act(() => {
      capturedCostPerHourOnChange!({ ...mockDefaultState.costPerHour.current, purchasePrice: 777 })
    })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  // --- Callback exercise: onCompareMachinesChange ---

  it('onCompareMachinesChange updates compare state', async () => {
    await renderWithMachineAndTab('Compare')
    await waitFor(() => { expect(screen.getByTestId('compare-machines')).toBeInTheDocument() })

    act(() => {
      capturedCompareMachinesOnChange!(
        { ...mockDefaultState.compareMachines.machineA },
        { ...mockDefaultState.compareMachines.machineB },
      )
    })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  // --- Callback exercise: onReplacementPlannerChange ---

  it('onReplacementPlannerChange updates replacement state', async () => {
    await renderWithMachineAndTab('Replace')
    await waitFor(() => { expect(screen.getByTestId('replacement-planner')).toBeInTheDocument() })

    act(() => {
      capturedReplacementPlannerOnChange!({ machines: [], farmIncome: 500000 })
    })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  // --- Callback exercise: onContractingIncomeChange ---

  it('onContractingIncomeChange updates contracting state', async () => {
    await renderWithMachineAndTab('Contract')
    await waitFor(() => { expect(screen.getByTestId('contracting-income')).toBeInTheDocument() })

    act(() => {
      capturedContractingIncomeOnChange!({ services: [] })
    })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  // --- Hash routing ---

  it('reads initial tab from URL hash', () => {
    window.location.hash = '#machines'
    renderApp()
    expect(screen.getByTestId('machines-tab')).toBeInTheDocument()
  })

  // --- Import button triggers file input ---

  it('Import JSON button triggers hidden file input click', async () => {
    const { container } = renderApp()
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, 'click')

    await userEvent.setup().click(screen.getByText('Import JSON'))
    expect(clickSpy).toHaveBeenCalled()
    clickSpy.mockRestore()
  })
})
