import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  it('calls onLoadMachine with correct index when profile A is selected', async () => {
    const user = userEvent.setup()
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
    await user.click(screen.getByText(/Load a saved machine/i))
    await user.click(screen.getByText('Drill'))
    expect(onLoadMachine).toHaveBeenCalledWith(0)
  })

  it('fires onChange with profile B data when profile B is selected', async () => {
    const user = userEvent.setup()
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
    await user.click(screen.getByText(/Load a saved machine/i))
    await user.click(screen.getByText('Sprayer'))
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
  it('loads the correct profile when selected', async () => {
    const user = userEvent.setup()
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
    await user.click(screen.getByText(/Load a saved machine/i))
    await user.click(screen.getByText('Loader'))
    expect(onLoadMachine).toHaveBeenCalledWith(0)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ purchasePrice: 60000, contractorCharge: 35 })
    )
  })
})
