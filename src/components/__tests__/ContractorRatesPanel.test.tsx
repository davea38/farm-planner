import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ContractorRatesPanel } from "@/components/ContractorRatesPanel"

function renderExpanded(props: Partial<Parameters<typeof ContractorRatesPanel>[0]> = {}) {
  const result = render(<ContractorRatesPanel onApply={props.onApply ?? vi.fn()} {...props} />)
  fireEvent.click(screen.getByText(/NAAC Contractor Rates/))
  return result
}

describe("ContractorRatesPanel", () => {
  it("renders panel title", () => {
    render(<ContractorRatesPanel onApply={vi.fn()} />)
    expect(screen.getByText(/NAAC Contractor Rates/i)).toBeInTheDocument()
  })

  it("shows category tabs", () => {
    renderExpanded()
    expect(screen.getByText("Soil Prep")).toBeInTheDocument()
    expect(screen.getByText("Drilling")).toBeInTheDocument()
    expect(screen.getByText("Application")).toBeInTheDocument()
    expect(screen.getByText("Harvesting")).toBeInTheDocument()
    expect(screen.getByText("Baling")).toBeInTheDocument()
    expect(screen.getByText("Tractor Hire")).toBeInTheDocument()
  })

  it("shows operation rates for default category (Soil Prep)", () => {
    renderExpanded()
    expect(screen.getByText("Ploughing (light)")).toBeInTheDocument()
  })

  it("calls onApply when Use button clicked", () => {
    const onApply = vi.fn()
    renderExpanded({ onApply })
    const useButtons = screen.getAllByRole("button", { name: /use/i })
    fireEvent.click(useButtons[0])
    expect(onApply).toHaveBeenCalledWith(expect.any(Number))
  })

  it("applies traffic-light colors to rows", () => {
    const { container } = renderExpanded()
    expect(container.querySelector('[data-rate-tier="low"]')).toBeInTheDocument()
    expect(container.querySelector('[data-rate-tier="mid"]')).toBeInTheDocument()
  })

  it("switches category when pill clicked", () => {
    renderExpanded()
    fireEvent.click(screen.getByText("Harvesting"))
    expect(screen.getByText(/Combining cereals/)).toBeInTheDocument()
  })

  it("shows high tier for expensive rates", () => {
    const { container } = renderExpanded()
    fireEvent.click(screen.getByText("Harvesting"))
    expect(container.querySelector('[data-rate-tier="high"]')).toBeInTheDocument()
  })

  it("filters by unit when unitFilter provided", () => {
    renderExpanded({ unitFilter: "hr" })
    expect(screen.getByText(/100–150 HP/)).toBeInTheDocument()
  })

  it("defaults to specified category", () => {
    renderExpanded({ unitFilter: "hr", defaultCategory: "Tractor Hire" })
    expect(screen.getByText(/100–150 HP/)).toBeInTheDocument()
  })

  it("shows source attribution", () => {
    render(<ContractorRatesPanel onApply={vi.fn()} />)
    expect(screen.getByText(/NAAC/)).toBeInTheDocument()
  })

  it("shows range indicator when currentRate provided", () => {
    renderExpanded({ currentRate: 76 })
    expect(screen.getByText(/Your current rate/)).toBeInTheDocument()
  })
})
