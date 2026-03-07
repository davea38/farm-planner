import { render, screen, fireEvent } from "@testing-library/react"
import { FuelConsumptionPanel } from "@/components/FuelConsumptionPanel"

function renderExpanded(
  props: Partial<React.ComponentProps<typeof FuelConsumptionPanel>> = {}
) {
  const result = render(
    <FuelConsumptionPanel
      onApply={props.onApply ?? vi.fn()}
      mode={props.mode ?? "perHour"}
      workRate={props.workRate}
    />
  )
  fireEvent.click(screen.getByText(/Estimate Fuel Consumption/i))
  return result
}

describe("FuelConsumptionPanel", () => {
  it("renders panel title", () => {
    render(<FuelConsumptionPanel onApply={vi.fn()} mode="perHour" />)
    expect(
      screen.getByText(/Estimate Fuel Consumption/i)
    ).toBeInTheDocument()
  })

  it("shows estimated consumption for default HP (150 → 36.6)", () => {
    renderExpanded()
    expect(screen.getByText("36.6 L/hr")).toBeInTheDocument()
  })

  it("calls onApply with L/hr in perHour mode", () => {
    const onApply = vi.fn()
    renderExpanded({ onApply })
    fireEvent.click(
      screen.getByRole("button", { name: /use this estimate/i })
    )
    expect(onApply).toHaveBeenCalledWith(expect.closeTo(36.6, 0))
  })

  it("shows L/ha conversion in perHectare mode", () => {
    renderExpanded({ mode: "perHectare", workRate: 4 })
    const matches = screen.getAllByText(/L\/ha/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it("calls onApply with L/ha in perHectare mode", () => {
    const onApply = vi.fn()
    renderExpanded({ onApply, mode: "perHectare", workRate: 4 })
    fireEvent.click(
      screen.getByRole("button", { name: /use this estimate/i })
    )
    // 36.6 / 4 = 9.15 → rounded to 9.2
    expect(onApply).toHaveBeenCalledWith(expect.closeTo(9.2, 0))
  })
})
