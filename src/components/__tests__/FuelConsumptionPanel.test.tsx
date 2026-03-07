import { render, screen, fireEvent } from "@testing-library/react"
import { FuelConsumptionPanel } from "@/components/FuelConsumptionPanel"
import { UnitContext } from "@/lib/UnitContext"
import type { UnitPreferences } from "@/lib/units"

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
      screen.getByRole("button", { name: /use fuel consumption estimate/i })
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
      screen.getByRole("button", { name: /use fuel consumption estimate/i })
    )
    // 36.6 / 4 = 9.15 → rounded to 9.2
    expect(onApply).toHaveBeenCalledWith(expect.closeTo(9.2, 0))
  })

  it("shows L/acre in perHectare mode when area unit is acres", () => {
    const acresUnits: UnitPreferences = { area: "acres", speed: "km" }
    render(
      <UnitContext.Provider value={{ units: acresUnits, setUnits: vi.fn() }}>
        <FuelConsumptionPanel onApply={vi.fn()} mode="perHectare" workRate={4} />
      </UnitContext.Provider>
    )
    fireEvent.click(screen.getByText(/Estimate Fuel Consumption/i))
    const matches = screen.getAllByText(/L\/acre/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it("still applies metric L/ha value when in acres mode", () => {
    const onApply = vi.fn()
    const acresUnits: UnitPreferences = { area: "acres", speed: "km" }
    render(
      <UnitContext.Provider value={{ units: acresUnits, setUnits: vi.fn() }}>
        <FuelConsumptionPanel onApply={onApply} mode="perHectare" workRate={4} />
      </UnitContext.Provider>
    )
    fireEvent.click(screen.getByText(/Estimate Fuel Consumption/i))
    fireEvent.click(
      screen.getByRole("button", { name: /use fuel consumption estimate/i })
    )
    // onApply should still receive metric L/ha value: 36.6 / 4 = 9.15 → 9.2
    expect(onApply).toHaveBeenCalledWith(expect.closeTo(9.2, 0))
  })
})
