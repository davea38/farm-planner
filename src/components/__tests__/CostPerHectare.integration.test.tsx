import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { CostPerHectare } from "@/components/CostPerHectare"

describe("CostPerHectare reference panel integration", () => {
  it("has fuel price panel", () => {
    render(<CostPerHectare />)
    expect(screen.getByText(/AHDB Fuel Prices/i)).toBeInTheDocument()
  })

  it("has fuel consumption panel", () => {
    render(<CostPerHectare />)
    expect(screen.getByText(/Estimate Fuel Consumption/i)).toBeInTheDocument()
  })

  it("has contractor rates panel", () => {
    render(<CostPerHectare />)
    expect(screen.getByText(/NAAC Contractor Rates/i)).toBeInTheDocument()
  })

  it("has depreciation panel", () => {
    render(<CostPerHectare />)
    expect(screen.getByText(/Depreciation Curve/i)).toBeInTheDocument()
  })

  it("shows source attribution for AHDB when expanded", () => {
    render(<CostPerHectare />)
    fireEvent.click(screen.getByText(/AHDB Fuel Prices/i))
    expect(screen.getByText(/Source: AHDB/)).toBeInTheDocument()
  })

  it("shows source attribution for NAAC when expanded", () => {
    render(<CostPerHectare />)
    fireEvent.click(screen.getByText(/NAAC Contractor Rates/i))
    expect(screen.getByText(/Source:.*NAAC/)).toBeInTheDocument()
  })

  it("fills fuel price input when 'Use red diesel price' clicked", () => {
    const onChange = vi.fn()
    render(<CostPerHectare onChange={onChange} />)
    // Expand fuel price panel
    fireEvent.click(screen.getByText(/AHDB Fuel Prices/i))
    // Click use red diesel price button
    fireEvent.click(screen.getByRole("button", { name: /use red diesel/i }))
    // onChange should be called with updated inputs containing the red diesel price
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ fuelPrice: 0.7491 })
    )
  })

  it("fills contractor charge when 'Use' clicked on a drilling rate", () => {
    const onChange = vi.fn()
    render(<CostPerHectare onChange={onChange} />)
    // Expand contractor rates panel
    fireEvent.click(screen.getByText(/NAAC Contractor Rates/i))
    // Switch to Drilling category
    fireEvent.click(screen.getByText("Drilling"))
    // Click the first Use button in the rate table
    const useButtons = screen.getAllByRole("button", { name: /use/i })
    // Filter to just the "Use" buttons that are inside rate rows
    const rateUseButtons = useButtons.filter(
      (btn) => btn.textContent?.trim() === "Use"
    )
    fireEvent.click(rateUseButtons[0])
    // onChange should be called with an updated contractorCharge
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ contractorCharge: expect.any(Number) })
    )
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall.contractorCharge).toBeGreaterThan(0)
  })
})
