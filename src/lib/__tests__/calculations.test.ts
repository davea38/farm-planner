import { describe, it, expect } from 'vitest'
import { calcCostPerHectare } from '@/lib/calculations'
import type { CostPerHectareInputs } from '@/lib/types'

// Fixed AHDB example inputs (fuel price 53 p/l as published in the original example)
const ahdbExample: CostPerHectareInputs = {
  purchasePrice: 126000,
  yearsOwned: 8,
  salePrice: 34000,
  hectaresPerYear: 1200,
  interestRate: 2,
  insuranceRate: 2,
  storageRate: 1,
  workRate: 4,
  labourCost: 14,
  fuelPrice: 53,
  fuelUse: 20,
  repairsPct: 2,
  contractorCharge: 76,
}

describe('calcCostPerHectare', () => {
  it('matches AHDB example: £30.27/ha total cost', () => {
    const result = calcCostPerHectare(ahdbExample)
    expect(result.totalCostPerHa).toBeCloseTo(30.27, 1)
  })

  it('matches AHDB example: -£54,880 annual saving', () => {
    const result = calcCostPerHectare(ahdbExample)
    expect(result.annualSaving).toBeCloseTo(-54880, -1)
  })
})
