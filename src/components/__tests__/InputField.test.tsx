import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { InputField } from "../InputField"
import { UnitContext } from "@/lib/UnitContext"
import type { UnitPreferences } from "@/lib/units"

const metricUnits = { area: "ha" as const, speed: "km" as const }
const imperialUnits = { area: "acres" as const, speed: "miles" as const }

function renderWithUnits(ui: React.ReactElement, units: UnitPreferences = metricUnits) {
  return render(
    <UnitContext.Provider value={{ units, setUnits: () => {} }}>
      {ui}
    </UnitContext.Provider>
  )
}

describe("InputField", () => {
  it("renders label and value", () => {
    renderWithUnits(
      <InputField label="Coverage speed" value={4} onChange={() => {}} unit="ha/hr" />
    )
    expect(screen.getByText("Coverage speed")).toBeInTheDocument()
    expect(screen.getByDisplayValue("4")).toBeInTheDocument()
  })

  it("renders unit suffix", () => {
    renderWithUnits(
      <InputField label="Price" value={100} onChange={() => {}} unit="£" />
    )
    expect(screen.getByText("£")).toBeInTheDocument()
  })

  it("calls onChange with numeric value when no metricUnit", () => {
    const onChange = vi.fn()
    renderWithUnits(
      <InputField label="Price" value={100} onChange={onChange} unit="£" />
    )

    const input = screen.getByDisplayValue("100") as HTMLInputElement
    // Simulate a native change event directly
    Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, "value"
    )!.set!.call(input, "200")
    input.dispatchEvent(new Event("input", { bubbles: true }))
    // React onChange maps to onInput
    input.dispatchEvent(new Event("change", { bubbles: true }))

    expect(onChange).toHaveBeenCalledWith(200)
  })

  it("converts display value to metric when metricUnit is provided (acres mode)", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(
      <InputField label="Area" value={100} onChange={onChange} metricUnit="ha" />,
      imperialUnits
    )

    const input = screen.getByRole("spinbutton")
    await user.clear(input)
    await user.type(input, "247")

    // fromDisplay: 247 / 2.47105 ≈ 99.95 (converting acres back to ha)
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toBeCloseTo(247 / 2.47105, 0)
  })

  it("displays converted value when metricUnit is provided (acres mode)", () => {
    renderWithUnits(
      <InputField label="Area" value={100} onChange={() => {}} metricUnit="ha" />,
      imperialUnits
    )
    // 100 ha * 2.47105 = 247.105
    const input = screen.getByRole("spinbutton")
    expect(Number(input.getAttribute("value"))).toBeCloseTo(247.105, 1)
  })

  it("shows displayUnit in acres mode", () => {
    renderWithUnits(
      <InputField label="Rate" value={10} onChange={() => {}} metricUnit="L/ha" />,
      imperialUnits
    )
    expect(screen.getByText("L/acre")).toBeInTheDocument()
  })

  it("renders tooltip when provided", () => {
    renderWithUnits(
      <InputField label="Price" value={100} onChange={() => {}} unit="£" tooltip="The price" />
    )
    expect(screen.getByLabelText("Help: Price")).toBeInTheDocument()
  })

  it("does not render tooltip when not provided", () => {
    renderWithUnits(
      <InputField label="Price" value={100} onChange={() => {}} unit="£" />
    )
    expect(screen.queryByText("?")).not.toBeInTheDocument()
  })

  it("renders without unit when neither unit nor metricUnit provided", () => {
    const { container } = renderWithUnits(
      <InputField label="Count" value={5} onChange={() => {}} />
    )
    const spans = container.querySelectorAll("span.text-sm.text-muted-foreground.w-12")
    expect(spans.length).toBe(0)
  })

  it("displays clean integer when round-trip conversion yields floating point noise (acres mode)", () => {
    // Simulate a value that was stored via fromDisplay(500, "ha", acres)
    // fromDisplay: 500 / 2.47105 = 202.3428...
    // toDisplay: 202.3428... * 2.47105 should display as 500, not 499.9999999...
    const storedMetric = 500 / 2.47105 // what fromDisplay would store
    renderWithUnits(
      <InputField label="Area" value={storedMetric} onChange={() => {}} metricUnit="ha" />,
      imperialUnits
    )
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    // The displayed value should be 500, not 499.99999999...
    expect(Number(input.value)).toBe(500)
  })

  it("displays clean decimal for per-unit rates after round-trip conversion (acres mode)", () => {
    // Simulate a value stored via fromDisplay(10, "L/ha", acres)
    // fromDisplay: 10 * 2.47105 = 24.7105
    // toDisplay: 24.7105 / 2.47105 should display as 10, not 9.9999999...
    const storedMetric = 10 * 2.47105
    renderWithUnits(
      <InputField label="Fuel" value={storedMetric} onChange={() => {}} metricUnit="L/ha" />,
      imperialUnits
    )
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    expect(Number(input.value)).toBe(10)
  })
})
