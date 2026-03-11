import { render, screen, fireEvent } from "@testing-library/react"
import { FuelPricePanel } from "@/components/FuelPricePanel"

function renderExpanded() {
  const result = render(<FuelPricePanel onApply={vi.fn()} />)
  fireEvent.click(screen.getByText(/AHDB Fuel Prices/))
  return result
}

describe("FuelPricePanel", () => {
  it("renders current red diesel price", () => {
    renderExpanded()
    expect(screen.getByText("74.91p/L")).toBeInTheDocument()
  })

  it("renders current pump diesel price", () => {
    renderExpanded()
    expect(screen.getByText(/141.22/)).toBeInTheDocument()
  })

  it("renders SVG sparkline", () => {
    const { container } = renderExpanded()
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("calls onApply with p/L when button clicked", () => {
    const onApply = vi.fn()
    render(<FuelPricePanel onApply={onApply} />)
    fireEvent.click(screen.getByText(/AHDB Fuel Prices/))
    fireEvent.click(screen.getByRole("button", { name: /use red diesel/i }))
    expect(onApply).toHaveBeenCalledWith(74.91)
  })

  it("shows source attribution", () => {
    render(<FuelPricePanel onApply={vi.fn()} />)
    expect(screen.getByText(/AHDB/)).toBeInTheDocument()
  })
})
