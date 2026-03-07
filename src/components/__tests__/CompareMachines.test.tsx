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

const machineA: WorkrateInputs = {
  name: "Sprayer A",
  width: 4,
  capacity: 800,
  speed: 6,
  applicationRate: 180,
  transportTime: 5,
  fillingTime: 10,
  fieldEfficiency: 65,
}

const machineB: WorkrateInputs = {
  name: "Sprayer B",
  width: 30,
  capacity: 2000,
  speed: 12,
  applicationRate: 250,
  transportTime: 5,
  fillingTime: 10,
  fieldEfficiency: 75,
}

describe("CompareMachines", () => {
  it("renders both machine names", () => {
    renderWithUnits(
      <CompareMachines initialMachineA={machineA} initialMachineB={machineB} />
    )
    expect(screen.getAllByText("Sprayer A").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Sprayer B").length).toBeGreaterThan(0)
  })

  it("shows results section", () => {
    renderWithUnits(
      <CompareMachines initialMachineA={machineA} initialMachineB={machineB} />
    )
    expect(screen.getByText("Results")).toBeInTheDocument()
    expect(screen.getByText("Spot rate")).toBeInTheDocument()
    expect(screen.getByText("TRUE rate")).toBeInTheDocument()
  })

  it("shows time breakdown bars", () => {
    renderWithUnits(
      <CompareMachines initialMachineA={machineA} initialMachineB={machineB} />
    )
    expect(screen.getByText("Time breakdown per load")).toBeInTheDocument()
  })

  it("shows speed comparison when machines have different workrates", () => {
    renderWithUnits(
      <CompareMachines initialMachineA={machineA} initialMachineB={machineB} />
    )
    expect(screen.getByText(/faster in practice/)).toBeInTheDocument()
  })

  it("shows warning when a machine has zero fields", () => {
    const zeroA: WorkrateInputs = { ...machineA, width: 0 }
    renderWithUnits(
      <CompareMachines initialMachineA={zeroA} initialMachineB={machineB} />
    )
    expect(screen.getByText(/Enter a value for/)).toBeInTheDocument()
  })

  it("calls onChange when input changes", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithUnits(
      <CompareMachines
        initialMachineA={machineA}
        initialMachineB={machineB}
        onChange={onChange}
      />
    )

    // Change the width input on Machine A
    const widthInputs = screen.getAllByDisplayValue("4")
    await user.clear(widthInputs[0])
    await user.type(widthInputs[0], "6")

    expect(onChange).toHaveBeenCalled()
  })

  it("updates machine name", async () => {
    const user = userEvent.setup()
    renderWithUnits(
      <CompareMachines initialMachineA={machineA} initialMachineB={machineB} />
    )

    const nameInputs = screen.getAllByPlaceholderText("Name")
    await user.clear(nameInputs[0])
    await user.type(nameInputs[0], "New Name")

    expect(screen.getByDisplayValue("New Name")).toBeInTheDocument()
  })

  it("renders in acres mode", () => {
    renderWithUnits(
      <CompareMachines initialMachineA={machineA} initialMachineB={machineB} />,
      { area: "acres", speed: "miles" }
    )
    expect(screen.getAllByText(/acres\/hr/).length).toBeGreaterThan(0)
  })

  it("uses default names when names are empty", () => {
    const emptyA = { ...machineA, name: "" }
    const emptyB = { ...machineB, name: "" }
    renderWithUnits(
      <CompareMachines initialMachineA={emptyA} initialMachineB={emptyB} />
    )
    expect(screen.getAllByText("Machine A").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Machine B").length).toBeGreaterThan(0)
  })
})
