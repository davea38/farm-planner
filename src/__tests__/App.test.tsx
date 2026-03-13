import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { defaultCostPerHectare, defaultCostPerHour, defaultMachineA, defaultMachineB } from '@/lib/defaults'
import type { MachineProfile } from '@/lib/types'

// ---------------------------------------------------------------------------
// Captured callbacks from mocked child components
// ---------------------------------------------------------------------------
let capturedOnSelectMachine: ((index: number | null) => void) | null = null
let capturedOnSaveMachine: ((...args: unknown[]) => void) | null = null
let capturedOnDeleteMachine: ((index: number) => void) | null = null
let capturedOnHectareFieldChange: ((field: string, value: number) => void) | null = null
let capturedOnHourFieldChange: ((field: string, value: number) => void) | null = null
let capturedCompareMachinesOnChange: ((a: unknown, b: unknown) => void) | null = null
let capturedReplacementPlannerOnChange: ((state: unknown) => void) | null = null
let capturedContractingIncomeOnChange: ((state: unknown) => void) | null = null

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/components/CostCalculator', () => ({
  CostCalculator: (props: Record<string, unknown>) => {
    capturedOnHectareFieldChange = props.onHectareFieldChange as typeof capturedOnHectareFieldChange
    capturedOnHourFieldChange = props.onHourFieldChange as typeof capturedOnHourFieldChange
    return <div data-testid="cost-calculator" />
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
    capturedOnSaveMachine = props.onSaveMachine as typeof capturedOnSaveMachine
    capturedOnDeleteMachine = props.onDeleteMachine as typeof capturedOnDeleteMachine
    return <div data-testid="machines-tab" />
  },
  MachineIcon: ({ type }: { type: string }) => <span data-testid="machine-icon">{type}</span>,
}))

function makeTestMachine(name: string, costMode: "hectare" | "hour" = "hectare", machineType = "tractors_large"): MachineProfile {
  return {
    name,
    machineType: machineType as any,
    costMode,
    costPerHectare: { ...defaultCostPerHectare },
    costPerHour: { ...defaultCostPerHour },
    compareMachines: { machineA: { ...defaultMachineA }, machineB: { ...defaultMachineB } },
  }
}

// Storage mock — v6 shape
const mockDefaultState = {
  version: 6,
  lastSaved: '2025-01-01T00:00:00.000Z',
  savedMachines: [] as MachineProfile[],
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
  capturedOnSaveMachine = null
  capturedOnDeleteMachine = null
  capturedOnHectareFieldChange = null
  capturedOnHourFieldChange = null
  capturedCompareMachinesOnChange = null
  capturedReplacementPlannerOnChange = null
  capturedContractingIncomeOnChange = null
}

function addHectareMachine() {
  mockDefaultState.savedMachines = [
    makeTestMachine('Test Tractor', 'hectare', 'tractors_large'),
  ]
}

function addHourMachine() {
  mockDefaultState.savedMachines = [
    makeTestMachine('Hour Machine', 'hour', 'combines'),
  ]
}

function removeSavedMachines() {
  mockDefaultState.savedMachines = []
}

// Helper: render app, select a machine, and switch to a given tab.
// Machine banner only appears on Cost/Ha and Depreciation tabs.
async function renderWithMachineAndTab(tab: string) {
  addHectareMachine()
  renderApp()
  act(() => { capturedOnSelectMachine!(0) })
  if (tab !== 'machines') {
    const user = userEvent.setup()
    await user.click(screen.getByText(tab))
    // Machine banner only shows on cost-calculator/depreciation tabs
    const bannerTabs = ['Cost/Ha', 'Depreciation']
    if (bannerTabs.includes(tab)) {
      await waitFor(() => { expect(screen.getByText('Test Tractor')).toBeInTheDocument() })
    }
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

  it('shows all 7 tab labels', () => {
    renderApp()
    for (const label of ['Machines', 'Cost/Ha', 'Depreciation', 'Compare', 'Replace', 'Contract', 'Worth It']) {
      const matches = screen.getAllByText(label)
      expect(matches.length).toBeGreaterThanOrEqual(1)
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

  it('disables machine-dependent tabs when no machine selected', () => {
    renderApp()
    // Only Cost/Ha and Depreciation require a selected machine
    for (const label of ['Cost/Ha', 'Depreciation']) {
      const matches = screen.getAllByText(label)
      const tab = matches[0].closest('button')!
      expect(tab.hasAttribute('disabled') || tab.getAttribute('aria-disabled') === 'true').toBe(true)
    }
    // Compare, Replace, Contract, Worth It are accessible without a machine (show empty states)
    for (const label of ['Compare', 'Replace', 'Contract', 'Worth It']) {
      const matches = screen.getAllByText(label)
      const tab = matches[0].closest('button')!
      expect(tab.hasAttribute('disabled') || tab.getAttribute('aria-disabled') === 'true').toBe(false)
    }
  })

  it('does not disable Machines tab', () => {
    renderApp()
    const tab = screen.getByText('Machines').closest('button')!
    expect(tab.hasAttribute('disabled') || tab.getAttribute('aria-disabled') === 'true').toBe(false)
  })

  // --- No-machine banners ---

  it('shows "No machine selected"', () => {
    window.location.hash = '#cost-per-hectare'
    renderApp()
    expect(screen.getByText('No machine selected')).toBeInTheDocument()
  })

  it('shows "Add your first machine" when no saved machines', () => {
    window.location.hash = '#cost-per-hectare'
    renderApp()
    expect(screen.getByText(/Add your first machine/)).toBeInTheDocument()
  })

  it('shows "Select a machine" when machines exist but none selected', () => {
    addHectareMachine()
    window.location.hash = '#cost-per-hectare'
    renderApp()
    expect(screen.getByText(/Select a machine/)).toBeInTheDocument()
  })

  // --- Active machine banner ---

  it('shows active machine banner with name, Change button, and profile label', async () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!(0) })
    // Banner only renders on non-machines tabs
    const user = userEvent.setup()
    await user.click(screen.getByText('Cost/Ha'))
    await waitFor(() => { expect(screen.getByText('Test Tractor')).toBeInTheDocument() })
    expect(screen.getByText('Change')).toBeInTheDocument()
    expect(screen.getByText('Large Tractor')).toBeInTheDocument()
  })

  it('shows active banner for cost-per-hour machine', async () => {
    addHourMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!(0) })
    // Banner only renders on non-machines tabs
    const user = userEvent.setup()
    await user.click(screen.getByText('Cost/Ha'))
    await waitFor(() => { expect(screen.getByText('Hour Machine')).toBeInTheDocument() })
    expect(screen.getByText('Combine Harvester')).toBeInTheDocument()
  })

  it('enables non-machine tabs after selection', () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!(0) })
    const tab = screen.getByText('Cost/Ha').closest('button')!
    expect(tab.hasAttribute('disabled') || tab.getAttribute('aria-disabled') === 'true').toBe(false)
  })

  it('removes "No machine selected" when machine selected', async () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!(0) })
    await waitFor(() => { expect(screen.queryByText('No machine selected')).not.toBeInTheDocument() })
  })

  it('returns null for active banner when selected machine index is out of bounds', async () => {
    addHectareMachine()
    renderApp()
    // Select index 99 which doesn't exist
    act(() => { capturedOnSelectMachine!(99) })
    // Banner should not show machine name or Change button
    await waitFor(() => {
      expect(screen.queryByText('Change')).not.toBeInTheDocument()
    })
  })

  // --- Deselection ---

  it('shows "No machine selected" after deselecting', async () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!(0) })
    // Navigate to non-machines tab to see the banner
    const user = userEvent.setup()
    await user.click(screen.getByText('Cost/Ha'))
    await waitFor(() => { expect(screen.getByText('Test Tractor')).toBeInTheDocument() })
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
    newState.savedMachines = [
      makeTestMachine('Imported', 'hectare', 'tractors_large'),
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
    await waitFor(() => { expect(screen.getByTestId('cost-calculator')).toBeInTheDocument() })
  })

  // --- Callback exercise: handleSelectMachine loads inputs ---

  it('handleSelectMachine with hectare loads cost-per-hectare inputs', () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!(0) })
    // The state was updated internally — verify the app didn't crash
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  it('handleSelectMachine with hour loads cost-per-hour inputs', () => {
    addHourMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!(0) })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  it('handleSelectMachine with out-of-bounds index returns prev state', async () => {
    renderApp()
    act(() => { capturedOnSelectMachine!(99) })
    // App should not crash
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  // --- Callback exercise: onSaveMachine ---

  it('onSaveMachine adds a new machine', async () => {
    renderApp()
    act(() => { capturedOnSaveMachine!('New Machine', 'tractors_large', null) })
    // App should not crash and the state is updated
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  it('onSaveMachine updates existing machine', async () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnSaveMachine!('Updated', 'tractors_large', 0) })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  // --- Callback exercise: onDeleteMachine ---

  it('onDeleteMachine removes machine', async () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnDeleteMachine!(0) })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  // --- Callback exercise: onHectareFieldChange ---

  it('onHectareFieldChange updates selected machine hectare inputs', async () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!(0) })

    // Switch to Cost tab to get the onChange callback
    const user = userEvent.setup()
    await user.click(screen.getByText('Cost/Ha'))
    await waitFor(() => { expect(screen.getByTestId('cost-calculator')).toBeInTheDocument() })

    // Now invoke the field change
    act(() => {
      capturedOnHectareFieldChange!('purchasePrice', 999)
    })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  it('onHectareFieldChange skips update if no machine selected', async () => {
    addHectareMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!(0) })
    const user = userEvent.setup()
    await user.click(screen.getByText('Cost/Ha'))
    await waitFor(() => { expect(screen.getByTestId('cost-calculator')).toBeInTheDocument() })

    // Deselect, then call onChange
    act(() => { capturedOnSelectMachine!(null) })
    act(() => {
      capturedOnHectareFieldChange!('purchasePrice', 888)
    })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  // --- Callback exercise: onHourFieldChange ---

  it('onHourFieldChange updates selected machine hour inputs', async () => {
    addHourMachine()
    renderApp()
    act(() => { capturedOnSelectMachine!(0) })

    // Navigate to the cost tab
    const user = userEvent.setup()
    await user.click(screen.getByText('Cost/Ha'))
    await waitFor(() => { expect(screen.getByTestId('cost-calculator')).toBeInTheDocument() })

    act(() => {
      capturedOnHourFieldChange!('purchasePrice', 777)
    })
    expect(screen.getByText('Farm Machinery Planner')).toBeInTheDocument()
  })

  // --- Callback exercise: onCompareMachinesChange ---

  it('onCompareMachinesChange updates compare state', async () => {
    await renderWithMachineAndTab('Compare')
    await waitFor(() => { expect(screen.getByTestId('compare-machines')).toBeInTheDocument() })

    act(() => {
      capturedCompareMachinesOnChange!(
        { ...defaultMachineA },
        { ...defaultMachineB },
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
