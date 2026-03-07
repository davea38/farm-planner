import { describe, it, expect } from 'vitest'
import { calcCostPerHectare } from '@/lib/calculations'
import { defaultCostPerHectare } from '@/lib/defaults'

describe('calcCostPerHectare', () => {
  it('matches AHDB example: £30.27/ha total cost', () => {
    const result = calcCostPerHectare(defaultCostPerHectare)
    expect(result.totalCostPerHa).toBeCloseTo(30.27, 1)
  })

  it('matches AHDB example: -£54,880 annual saving', () => {
    const result = calcCostPerHectare(defaultCostPerHectare)
    expect(result.annualSaving).toBeCloseTo(-54880, -1)
  })
})
