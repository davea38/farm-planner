import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CompareMachines } from "../CompareMachines"
import { UnitContext } from "@/lib/UnitContext"
import type { WorkrateInputs } from "@/lib/types"

const defaultUnits = { area: "ha" as const, speed: "km" as const }

function renderWithUnits(ui: React.ReactElement, units = defaultUnits) {
  return render(
    <UnitContext.Provider value={{ units, setUnits: () => {} }}>
      {ui}
    </UnitContext.Provider>
  )
}

describe("CompareMachines – additional branch coverage", () => {
  it("Machine B name changes trigger onChange", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(
      <CompareMachines onChange={onChange} />
    )

    const nameInputs = screen.getAllByPlaceholderText("Name")
    await user.clear(nameInputs[1])
    await user.type(nameInputs[1], "Sprayer X")

    expect(onChange).toHaveBeenCalled()
  })

  it("Machine B field updates trigger onChange", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(
      <CompareMachines onChange={onChange} />
    )

    // Machine B's width input (default machine B width = 30)
    const widthInput = screen.getByDisplayValue("30")
    await user.clear(widthInput)
    await user.type(widthInput, "24")

    expect(onChange).toHaveBeenCalled()
  })

  it("shows equal machines (no winner) when both identical", () => {
    const same: WorkrateInputs = {
      name: "Same",
      width: 10,
      capacity: 1000,
      speed: 8,
      applicationRate: 200,
      transportTime: 5,
      fillingTime: 10,
      fieldEfficiency: 70,
    }
    renderWithUnits(
      <CompareMachines initialMachineA={same} initialMachineB={same} />
    )
    // No "faster in practice" should appear
    expect(screen.queryByText(/faster in practice/)).not.toBeInTheDocument()
  })

  it("shows Machine A as faster when A has better workrate", () => {
    const fastA: WorkrateInputs = {
      name: "Fast A",
      width: 20,
      capacity: 3000,
      speed: 12,
      applicationRate: 200,
      transportTime: 2,
      fillingTime: 5,
      fieldEfficiency: 80,
    }
    const slowB: WorkrateInputs = {
      name: "Slow B",
      width: 4,
      capacity: 500,
      speed: 6,
      applicationRate: 200,
      transportTime: 10,
      fillingTime: 15,
      fieldEfficiency: 60,
    }
    renderWithUnits(
      <CompareMachines initialMachineA={fastA} initialMachineB={slowB} />
    )
    expect(screen.getByText(/Fast A is.*faster in practice/)).toBeInTheDocument()
  })

  it("renders without initial machines (uses defaults)", () => {
    renderWithUnits(<CompareMachines />)
    expect(screen.getAllByText("Machine A").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Machine B").length).toBeGreaterThan(0)
  })

  it("shows multiple zero field warnings", () => {
    const zeroFields: WorkrateInputs = {
      name: "Zero",
      width: 0,
      capacity: 0,
      speed: 0,
      applicationRate: 0,
      transportTime: 0,
      fillingTime: 0,
      fieldEfficiency: 0,
    }
    renderWithUnits(
      <CompareMachines initialMachineA={zeroFields} initialMachineB={zeroFields} />
    )
    const warnings = screen.getAllByText(/Enter a value for/)
    expect(warnings.length).toBe(2) // one for each machine
  })
})
