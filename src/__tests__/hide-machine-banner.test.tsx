import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { defaultCostPerHectare, defaultCostPerHour, defaultMachineA, defaultMachineB } from '@/lib/defaults'
import type { MachineProfile } from '@/lib/types'

// ---------------------------------------------------------------------------
// Captured callbacks
// ---------------------------------------------------------------------------
let capturedOnSelectMachine: ((index: number | null) => void) | null = null

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/components/CostCalculator', () => ({
  CostCalculator: () => <div data-testid="cost-calculator" />,
}))

vi.mock('@/components/CompareMachines', () => ({
  CompareMachines: () => <div data-testid="compare-machines" />,
}))

vi.mock('@/components/ReplacementPlanner', () => ({
  ReplacementPlanner: () => <div data-testid="replacement-planner" />,
}))

vi.mock('@/components/DepreciationPanel', () => ({
  DepreciationPanel: () => <div data-testid="depreciation-panel" />,
}))

vi.mock('@/components/ContractingIncomePlanner', () => ({
  ContractingIncomePlanner: () => <div data-testid="contracting-income" />,
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
    return <div data-testid="machines-tab" />
  },
  MachineIcon: ({ type }: { type: string }) => <span data-testid="machine-icon">{type}</span>,
}))

function makeTestMachine(name: string): MachineProfile {
  return {
    name,
    machineType: 'tractors_large',
    costMode: 'hectare',
    costPerHectare: { ...defaultCostPerHectare },
    costPerHour: { ...defaultCostPerHour },
    compareMachines: { machineA: { ...defaultMachineA }, machineB: { ...defaultMachineB } },
  }
}

const mockDefaultState = {
  version: 6,
  lastSaved: '2025-01-01T00:00:00.000Z',
  savedMachines: [] as MachineProfile[],
  replacementPlanner: { machines: [], farmIncome: 350000 },
  contractingIncome: { services: [] },
}

vi.mock('@/lib/storage', () => ({
  loadState: () => JSON.parse(JSON.stringify(mockDefaultState)),
  useAutoSave: vi.fn(),
  exportToFile: vi.fn(),
  importFromFile: vi.fn(),
  loadUnitPreferences: () => ({ area: 'ha' as const, speed: 'km' as const }),
  saveUnitPreferences: vi.fn(),
}))

vi.mock('@/lib/depreciation-data', () => ({
  DEPRECIATION_PROFILES: {
    tractors_large: { label: 'Large Tractor' },
  },
}))

import App from '@/App'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addMachine() {
  mockDefaultState.savedMachines = [makeTestMachine('My Tractor')]
}

function removeMachines() {
  mockDefaultState.savedMachines = []
}

// ---------------------------------------------------------------------------
// Tests — SPEC-14: Hide selected machine banner on specific tabs
// ---------------------------------------------------------------------------

describe('SPEC-14: selected machine banner visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnSelectMachine = null
    removeMachines()
    window.location.hash = ''
  })

  describe('banner is shown on cost-calculator and depreciation tabs', () => {
    it('shows machine banner on cost-calculator tab', async () => {
      addMachine()
      render(<App />)
      act(() => { capturedOnSelectMachine!(0) })

      const user = userEvent.setup()
      await user.click(screen.getByText('Cost/Ha'))
      await waitFor(() => {
        expect(screen.getByText('My Tractor')).toBeInTheDocument()
      })
      expect(screen.getByText('Change')).toBeInTheDocument()
    })

    it('shows machine banner on depreciation tab', async () => {
      addMachine()
      render(<App />)
      act(() => { capturedOnSelectMachine!(0) })

      const user = userEvent.setup()
      const depMatches = screen.getAllByText('Depreciation')
      await user.click(depMatches[0])
      await waitFor(() => {
        expect(screen.getByText('My Tractor')).toBeInTheDocument()
      })
      expect(screen.getByText('Change')).toBeInTheDocument()
    })
  })

  describe('banner is NOT shown on compare-machines, replacement-planner, contracting-income, profitability', () => {
    it('does not show machine banner on compare-machines tab', async () => {
      addMachine()
      render(<App />)
      act(() => { capturedOnSelectMachine!(0) })

      const user = userEvent.setup()
      await user.click(screen.getByText('Compare'))
      await waitFor(() => {
        expect(screen.getByTestId('compare-machines')).toBeInTheDocument()
      })
      expect(screen.queryByText('Change')).not.toBeInTheDocument()
    })

    it('does not show machine banner on replacement-planner tab', async () => {
      addMachine()
      render(<App />)
      act(() => { capturedOnSelectMachine!(0) })

      const user = userEvent.setup()
      await user.click(screen.getByText('Replace'))
      await waitFor(() => {
        expect(screen.getByTestId('replacement-planner')).toBeInTheDocument()
      })
      expect(screen.queryByText('Change')).not.toBeInTheDocument()
    })

    it('does not show machine banner on contracting-income tab', async () => {
      addMachine()
      render(<App />)
      act(() => { capturedOnSelectMachine!(0) })

      const user = userEvent.setup()
      await user.click(screen.getByText('Contract'))
      await waitFor(() => {
        expect(screen.getByTestId('contracting-income')).toBeInTheDocument()
      })
      expect(screen.queryByText('Change')).not.toBeInTheDocument()
    })

    it('does not show machine banner on profitability tab', async () => {
      addMachine()
      render(<App />)
      act(() => { capturedOnSelectMachine!(0) })

      const user = userEvent.setup()
      await user.click(screen.getByText('Worth It'))
      await waitFor(() => {
        expect(screen.getByTestId('profitability-overview')).toBeInTheDocument()
      })
      expect(screen.queryByText('Change')).not.toBeInTheDocument()
    })
  })

  describe('tabs are accessible without a machine selected', () => {
    it('compare-machines tab is NOT disabled when no machine selected', () => {
      render(<App />)
      const tab = screen.getByText('Compare').closest('button')!
      expect(tab.hasAttribute('disabled') || tab.getAttribute('aria-disabled') === 'true').toBe(false)
    })

    it('replacement-planner tab is NOT disabled when no machine selected', () => {
      render(<App />)
      const tab = screen.getByText('Replace').closest('button')!
      expect(tab.hasAttribute('disabled') || tab.getAttribute('aria-disabled') === 'true').toBe(false)
    })

    it('contracting-income tab is NOT disabled when no machine selected', () => {
      render(<App />)
      const tab = screen.getByText('Contract').closest('button')!
      expect(tab.hasAttribute('disabled') || tab.getAttribute('aria-disabled') === 'true').toBe(false)
    })

    it('profitability tab is NOT disabled when no machine selected', () => {
      render(<App />)
      const tab = screen.getByText('Worth It').closest('button')!
      expect(tab.hasAttribute('disabled') || tab.getAttribute('aria-disabled') === 'true').toBe(false)
    })

    it('cost-calculator tab IS still disabled when no machine selected', () => {
      render(<App />)
      const matches = screen.getAllByText('Cost/Ha')
      const tab = matches[0].closest('button')!
      expect(tab.hasAttribute('disabled') || tab.getAttribute('aria-disabled') === 'true').toBe(true)
    })

    it('depreciation tab IS still disabled when no machine selected', () => {
      render(<App />)
      const matches = screen.getAllByText('Depreciation')
      const tab = matches[0].closest('button')!
      expect(tab.hasAttribute('disabled') || tab.getAttribute('aria-disabled') === 'true').toBe(true)
    })
  })

  describe('navigation works without machine selection for independent tabs', () => {
    it('can navigate to compare-machines without selecting a machine', async () => {
      render(<App />)
      const user = userEvent.setup()
      await user.click(screen.getByText('Compare'))
      await waitFor(() => {
        expect(screen.getByTestId('compare-machines')).toBeInTheDocument()
      })
    })

    it('can navigate to replacement-planner without selecting a machine', async () => {
      render(<App />)
      const user = userEvent.setup()
      await user.click(screen.getByText('Replace'))
      await waitFor(() => {
        expect(screen.getByTestId('replacement-planner')).toBeInTheDocument()
      })
    })

    it('can navigate to contracting-income without selecting a machine', async () => {
      render(<App />)
      const user = userEvent.setup()
      await user.click(screen.getByText('Contract'))
      await waitFor(() => {
        expect(screen.getByTestId('contracting-income')).toBeInTheDocument()
      })
    })

    it('can navigate to profitability without selecting a machine', async () => {
      render(<App />)
      const user = userEvent.setup()
      await user.click(screen.getByText('Worth It'))
      await waitFor(() => {
        expect(screen.getByTestId('profitability-overview')).toBeInTheDocument()
      })
    })

    it('cannot navigate to cost-calculator without selecting a machine', async () => {
      render(<App />)
      const user = userEvent.setup()
      await user.click(screen.getByText('Cost/Ha'))
      // Should still show machines tab (navigation blocked)
      expect(screen.getByTestId('machines-tab')).toBeInTheDocument()
    })
  })
})
