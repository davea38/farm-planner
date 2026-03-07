import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RepairEstimator } from "../RepairEstimator"

describe("RepairEstimator", () => {
  it("renders trigger text", () => {
    render(<RepairEstimator onApply={() => {}} />)
    expect(screen.getByText("Help me estimate repairs")).toBeInTheDocument()
  })

  it("opens dialog on click", async () => {
    const user = userEvent.setup()
    render(<RepairEstimator onApply={() => {}} />)

    await user.click(screen.getByText("Help me estimate repairs"))

    expect(screen.getByText("Repair Cost Estimator")).toBeInTheDocument()
    expect(screen.getByText(/AHDB data/)).toBeInTheDocument()
  })

  it("shows default tractor repair percentage", async () => {
    const user = userEvent.setup()
    render(<RepairEstimator onApply={() => {}} />)

    await user.click(screen.getByText("Help me estimate repairs"))

    // Default: tractors at 500 hours → 3.0%
    expect(screen.getByText("3.0%")).toBeInTheDocument()
  })

  it("updates repair percentage when hours change", async () => {
    const user = userEvent.setup()
    render(<RepairEstimator onApply={() => {}} />)

    await user.click(screen.getByText("Help me estimate repairs"))

    const hoursInput = screen.getByDisplayValue("500")
    await user.clear(hoursInput)
    await user.type(hoursInput, "1000")

    // tractors at 1000 hours → 5.0%
    expect(screen.getByText("5.0%")).toBeInTheDocument()
  })

  it("calls onApply with repair percentage and closes dialog", async () => {
    const onApply = vi.fn()
    const user = userEvent.setup()
    render(<RepairEstimator onApply={onApply} />)

    await user.click(screen.getByText("Help me estimate repairs"))
    await user.click(screen.getByText("Use this value"))

    expect(onApply).toHaveBeenCalledWith(3) // tractors at 500 hrs = 3%
  })
})
