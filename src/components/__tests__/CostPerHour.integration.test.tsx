import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { CostPerHour } from "@/components/CostPerHour"

describe("CostPerHour reference panel integration", () => {
  it("has fuel price panel", () => {
    render(<CostPerHour />)
    expect(screen.getByText(/AHDB Fuel Prices/i)).toBeInTheDocument()
  })

  it("has fuel consumption panel", () => {
    render(<CostPerHour />)
    expect(screen.getByText(/Estimate Fuel Consumption/i)).toBeInTheDocument()
  })

  it("has contractor rates panel", () => {
    render(<CostPerHour />)
    expect(screen.getByText(/NAAC Contractor Rates/i)).toBeInTheDocument()
  })

  it("has depreciation panel", () => {
    render(<CostPerHour />)
    expect(screen.getByText(/Depreciation Curve/i)).toBeInTheDocument()
  })

  it("shows source attribution for AHDB when expanded", () => {
    render(<CostPerHour />)
    fireEvent.click(screen.getByText(/AHDB Fuel Prices/i))
    expect(screen.getByText(/Source: AHDB/)).toBeInTheDocument()
  })

  it("shows source attribution for NAAC when expanded", () => {
    render(<CostPerHour />)
    fireEvent.click(screen.getByText(/NAAC Contractor Rates/i))
    expect(screen.getByText(/Source:.*NAAC/)).toBeInTheDocument()
  })

  it("fuel consumption panel shows L/hr (not L/ha)", () => {
    render(<CostPerHour />)
    fireEvent.click(screen.getByText(/Estimate Fuel Consumption/i))
    const matches = screen.getAllByText(/L\/hr/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it("shows Tractor Hire rates by default in contractor panel", () => {
    render(<CostPerHour />)
    fireEvent.click(screen.getByText(/NAAC Contractor Rates/i))
    // Tractor Hire category should be active/selected by default
    expect(screen.getByText(/Tractor Hire/i)).toBeInTheDocument()
  })

  it("fills fuel price input when 'Use red diesel price' clicked", () => {
    const onChange = vi.fn()
    render(<CostPerHour onChange={onChange} />)
    fireEvent.click(screen.getByText(/AHDB Fuel Prices/i))
    fireEvent.click(screen.getByRole("button", { name: /use red diesel/i }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ fuelPrice: 0.7491 })
    )
  })

  it("fills fuel consumption input when 'Use this estimate' clicked", () => {
    const onChange = vi.fn()
    render(<CostPerHour onChange={onChange} />)
    fireEvent.click(screen.getByText(/Estimate Fuel Consumption/i))
    // Default HP is 150, so estimate = 0.244 * 150 = 36.6 L/hr
    fireEvent.click(screen.getByRole("button", { name: /use this estimate/i }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ fuelConsumptionPerHr: 36.6 })
    )
  })

  it("fills contractor charge when 'Use' clicked on a tractor hire rate", () => {
    const onChange = vi.fn()
    render(<CostPerHour onChange={onChange} />)
    fireEvent.click(screen.getByText(/NAAC Contractor Rates/i))
    // Click the first Use button in the rate table
    const useButtons = screen.getAllByRole("button", { name: /use/i })
    const rateUseButtons = useButtons.filter(
      (btn) => btn.textContent?.trim() === "Use"
    )
    fireEvent.click(rateUseButtons[0])
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ contractorCharge: expect.any(Number) })
    )
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall.contractorCharge).toBeGreaterThan(0)
  })
})
