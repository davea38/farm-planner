import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CostPerHectare } from '@/components/CostPerHectare'
import { CostPerHour } from '@/components/CostPerHour'
import type { CostPerHectareInputs, CostPerHourInputs } from '@/lib/types'
import { defaultCostPerHectare, defaultCostPerHour } from '@/lib/defaults'

const drillInputs: CostPerHectareInputs = {
  ...defaultCostPerHectare,
  purchasePrice: 50000,
  contractorCharge: 40,
}

describe('CostPerHectare machine profile loading', () => {
  it('renders without save/load props (now handled by MachinesTab)', () => {
    render(
      <CostPerHectare
        initialInputs={defaultCostPerHectare}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText(/Purchase price/i)).toBeInTheDocument()
  })

  it('renders with initialInputs when provided', () => {
    render(
      <CostPerHectare
        initialInputs={drillInputs}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText(/Purchase price/i)).toBeInTheDocument()
  })
})

const loaderInputs: CostPerHourInputs = {
  ...defaultCostPerHour,
  purchasePrice: 60000,
  contractorCharge: 35,
}

describe('CostPerHour machine profile loading', () => {
  it('renders with initialInputs when provided', () => {
    render(
      <CostPerHour
        initialInputs={loaderInputs}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText(/Purchase price/i)).toBeInTheDocument()
  })
})
