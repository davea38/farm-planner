import { useState } from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, act } from "@testing-library/react"
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

// Stateful wrapper that manages value internally (for controlled-component tests)
function StatefulInput({
  initialValue,
  units: unitsProp,
  ...props
}: {
  initialValue: number
  units?: UnitPreferences
} & Omit<React.ComponentProps<typeof InputField>, "value" | "onChange">) {
  const [value, setValue] = useState(initialValue)
  return (
    <UnitContext.Provider value={{ units: unitsProp ?? metricUnits, setUnits: () => {} }}>
      <InputField value={value} onChange={setValue} {...props} />
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

  it("calls onChange with numeric value when no metricUnit", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(
      <InputField label="Price" value={100} onChange={onChange} unit="£" />
    )

    const input = screen.getByRole("spinbutton")
    await user.clear(input)
    await user.type(input, "200")

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toBe(200)
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
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    expect(Number(input.value)).toBeCloseTo(247.105, 1)
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

  it("renders source badge when provided", () => {
    renderWithUnits(
      <InputField label="Fuel" value={0.74} onChange={() => {}} unit="£/L" sourceBadge="AHDB fuel price" />
    )
    expect(screen.getByText("AHDB fuel price")).toBeInTheDocument()
  })

  it("does not render source badge when not provided", () => {
    const { container } = renderWithUnits(
      <InputField label="Fuel" value={0.74} onChange={() => {}} unit="£/L" />
    )
    // No badge span should exist
    const badges = container.querySelectorAll(".inline-flex.items-center.gap-1.rounded-full")
    expect(badges.length).toBe(0)
  })

  it("passes min, max, step props to the input element", () => {
    renderWithUnits(
      <InputField label="Rate" value={5} onChange={() => {}} unit="%" min={0} max={100} step={0.5} />
    )
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    expect(input.min).toBe("0")
    expect(input.max).toBe("100")
    expect(input.step).toBe("0.5")
  })

  it("uses step='any' by default", () => {
    renderWithUnits(
      <InputField label="Rate" value={5} onChange={() => {}} unit="%" />
    )
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    expect(input.step).toBe("any")
  })

  it("shows metric unit label when in metric mode", () => {
    renderWithUnits(
      <InputField label="Area" value={100} onChange={() => {}} metricUnit="ha" />,
      metricUnits
    )
    expect(screen.getByText("ha")).toBeInTheDocument()
  })

  it("converts display value for speed units (mph mode)", () => {
    // 10 km/hr * 0.621371 = 6.21371 mph
    renderWithUnits(
      <InputField label="Speed" value={10} onChange={() => {}} metricUnit="km/hr" />,
      imperialUnits
    )
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    expect(Number(input.value)).toBeCloseTo(6.21371, 2)
  })

  it("shows mph unit label in imperial speed mode", () => {
    renderWithUnits(
      <InputField label="Speed" value={10} onChange={() => {}} metricUnit="km/hr" />,
      imperialUnits
    )
    expect(screen.getByText("mph")).toBeInTheDocument()
  })

  it("converts mph input back to km/hr on change", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(
      <InputField label="Speed" value={10} onChange={onChange} metricUnit="km/hr" />,
      imperialUnits
    )
    const input = screen.getByRole("spinbutton")
    await user.clear(input)
    await user.type(input, "10")

    // The last call should convert 10 mph back to km/hr: 10 / 0.621371 ≈ 16.09
    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toBeCloseTo(10 / 0.621371, 0)
  })
})

describe("InputField - leading zero prevention", () => {
  it("does not show leading zero when typing into a field starting at 0", async () => {
    const user = userEvent.setup()
    render(<StatefulInput initialValue={0} label="Price" unit="£" />)
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    expect(input.value).toBe("0")

    await user.type(input, "5")
    expect(input.value).toBe("5")
  })

  it("does not show leading zero when typing multi-digit number from 0", async () => {
    const user = userEvent.setup()
    render(<StatefulInput initialValue={0} label="Price" unit="£" />)
    const input = screen.getByRole("spinbutton") as HTMLInputElement

    await user.type(input, "42")
    expect(input.value).toBe("42")
  })

  it("does not show leading zero with metricUnit conversion from 0", async () => {
    const user = userEvent.setup()
    render(
      <StatefulInput initialValue={0} label="Area" metricUnit="ha" units={imperialUnits} />
    )
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    expect(input.value).toBe("0")

    await user.type(input, "100")
    expect(input.value).toBe("100")
  })

  it("preserves decimal input like 0.5 (no false stripping)", async () => {
    const user = userEvent.setup()
    render(<StatefulInput initialValue={0} label="Rate" unit="%" />)
    const input = screen.getByRole("spinbutton") as HTMLInputElement

    await user.clear(input)
    await user.type(input, "0.5")
    expect(input.value).toBe("0.5")
  })

  it("handles clearing and retyping without leading zeros", async () => {
    const user = userEvent.setup()
    render(<StatefulInput initialValue={126000} label="Price" unit="£" />)
    const input = screen.getByRole("spinbutton") as HTMLInputElement

    await user.clear(input)
    await user.type(input, "50000")
    expect(input.value).toBe("50000")
  })

  it("strips leading zeros from multi-zero prefix like '007'", async () => {
    const user = userEvent.setup()
    render(<StatefulInput initialValue={0} label="Count" unit="units" />)
    const input = screen.getByRole("spinbutton") as HTMLInputElement

    await user.type(input, "07")
    expect(input.value).toBe("7")
  })
})

describe("InputField - local string state management", () => {
  it("syncs display when external value changes while not focused", () => {
    function ExternalUpdate() {
      const [value, setValue] = useState(100)
      return (
        <UnitContext.Provider value={{ units: metricUnits, setUnits: () => {} }}>
          <InputField label="Price" value={value} onChange={setValue} unit="£" />
          <button onClick={() => setValue(999)}>Set 999</button>
        </UnitContext.Provider>
      )
    }
    render(<ExternalUpdate />)
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    expect(input.value).toBe("100")

    // External update without focus should update the input immediately
    act(() => {
      screen.getByText("Set 999").click()
    })
    expect(input.value).toBe("999")
  })

  it("normalises on blur after user interaction", async () => {
    const user = userEvent.setup()

    function ExternalUpdate() {
      const [value, setValue] = useState(100)
      return (
        <UnitContext.Provider value={{ units: metricUnits, setUnits: () => {} }}>
          <InputField label="Price" value={value} onChange={setValue} unit="£" />
          <button onClick={() => setValue(999)}>Set 999</button>
        </UnitContext.Provider>
      )
    }
    render(<ExternalUpdate />)
    const input = screen.getByRole("spinbutton") as HTMLInputElement

    // Focus the input
    await user.click(input)
    // Externally update the value while focused
    act(() => {
      screen.getByText("Set 999").click()
    })
    // While focused, input may not update to the new external value
    // But after blur, it should normalise
    await user.tab()
    expect(input.value).toBe("999")
  })

  it("treats empty input as zero", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(
      <InputField label="Price" value={100} onChange={onChange} unit="£" />
    )
    const input = screen.getByRole("spinbutton")
    await user.clear(input)

    expect(onChange).toHaveBeenCalledWith(0)
  })

  it("treats empty input as zero with metricUnit conversion", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(
      <InputField label="Area" value={100} onChange={onChange} metricUnit="ha" />,
      imperialUnits
    )
    const input = screen.getByRole("spinbutton")
    await user.clear(input)

    // fromDisplay(0, "ha", imperialUnits) = 0 / 2.47105 = 0
    expect(onChange).toHaveBeenCalledWith(0)
  })

  it("displays value as string, not raw number", () => {
    renderWithUnits(
      <InputField label="Price" value={42} onChange={() => {}} unit="£" />
    )
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    // The value attribute should be the string "42"
    expect(input.value).toBe("42")
  })

  it("handles value of 0 correctly on initial render", () => {
    renderWithUnits(
      <InputField label="Count" value={0} onChange={() => {}} unit="items" />
    )
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    expect(input.value).toBe("0")
  })

  it("handles negative values", () => {
    renderWithUnits(
      <InputField label="Savings" value={-500} onChange={() => {}} unit="£" />
    )
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    expect(input.value).toBe("-500")
  })

  it("handles decimal values", () => {
    renderWithUnits(
      <InputField label="Rate" value={0.7491} onChange={() => {}} unit="£/L" />
    )
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    expect(input.value).toBe("0.7491")
  })

  it("handles very large values", () => {
    renderWithUnits(
      <InputField label="Price" value={1000000} onChange={() => {}} unit="£" />
    )
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    expect(input.value).toBe("1000000")
  })
})

describe("InputField - stripLeadingZeros", () => {
  // These tests verify the strip behaviour through the component
  it("strips single leading zero: '05' → '5'", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(
      <InputField label="Test" value={0} onChange={onChange} unit="x" />
    )
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    // Type "5" when field shows "0" → raw becomes "05"
    await user.type(input, "5")
    // The local state should strip the leading zero
    expect(input.value).not.toMatch(/^0\d/)
  })

  it("preserves lone zero: '0' stays '0'", () => {
    renderWithUnits(
      <InputField label="Test" value={0} onChange={() => {}} unit="x" />
    )
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    expect(input.value).toBe("0")
  })

  it("preserves decimal with leading zero: '0.5' stays '0.5'", async () => {
    const user = userEvent.setup()
    render(<StatefulInput initialValue={0} label="Test" unit="x" />)
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    await user.clear(input)
    await user.type(input, "0.5")
    expect(input.value).toBe("0.5")
  })

  it("preserves negative decimal: '-0.5' stays '-0.5'", async () => {
    const user = userEvent.setup()
    render(<StatefulInput initialValue={0} label="Test" unit="x" />)
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    await user.clear(input)
    await user.type(input, "-0.5")
    expect(input.value).toBe("-0.5")
  })
})
