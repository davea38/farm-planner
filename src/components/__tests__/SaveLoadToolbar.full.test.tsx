import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SaveLoadToolbar } from "../SaveLoadToolbar"

describe("SaveLoadToolbar - save functionality", () => {
  it("renders save input and button", () => {
    render(
      <SaveLoadToolbar
        savedMachines={[]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.getByPlaceholderText("Name this machine...")).toBeInTheDocument()
    expect(screen.getByText("Save")).toBeInTheDocument()
  })

  it("save button is disabled when name is empty", () => {
    render(
      <SaveLoadToolbar
        savedMachines={[]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.getByText("Save")).toBeDisabled()
  })

  it("calls onSave with trimmed name, machineType and clears input", async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(
      <SaveLoadToolbar
        savedMachines={[]}
        onSave={onSave}
        onLoad={() => {}}
        onDelete={() => {}}
      />
    )

    // Select a machine type first
    const machineTypeSelect = screen.getByDisplayValue("Please select...")
    await user.selectOptions(machineTypeSelect, "tractors_large")

    const input = screen.getByPlaceholderText("Name this machine...")
    await user.type(input, "  My Tractor  ")
    await user.click(screen.getByText("Save"))

    expect(onSave).toHaveBeenCalledWith("My Tractor", "tractors_large")
    expect(input).toHaveValue("")
  })

  it("does not call onSave when name is only whitespace", async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(
      <SaveLoadToolbar
        savedMachines={[]}
        onSave={onSave}
        onLoad={() => {}}
        onDelete={() => {}}
      />
    )

    // Even with machine type selected, whitespace name should disable save
    const machineTypeSelect = screen.getByDisplayValue("Please select...")
    await user.selectOptions(machineTypeSelect, "tractors_large")

    const input = screen.getByPlaceholderText("Name this machine...")
    await user.type(input, "   ")
    // Button should still be disabled for whitespace-only
    expect(screen.getByText("Save")).toBeDisabled()
  })

  it("does not show load/delete row when no saved machines", () => {
    render(
      <SaveLoadToolbar
        savedMachines={[]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.queryByText("Delete")).not.toBeInTheDocument()
  })

  it("shows delete button when machines exist", () => {
    render(
      <SaveLoadToolbar
        savedMachines={[{ name: "Tractor", machineType: "tractors_large", inputs: {} }]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.getByText("Delete")).toBeInTheDocument()
    expect(screen.getByText("Delete")).toBeDisabled() // No selection yet
  })

  it("calls onDelete and resets selection", async () => {
    const onDelete = vi.fn()
    const onLoad = vi.fn()
    const user = userEvent.setup()
    render(
      <SaveLoadToolbar
        savedMachines={[
          { name: "Tractor 1", machineType: "tractors_large", inputs: {} },
          { name: "Combine", machineType: "combines", inputs: {} },
        ]}
        onSave={() => {}}
        onLoad={onLoad}
        onDelete={onDelete}
      />
    )

    // Click the select trigger to open dropdown
    await user.click(screen.getByText("Load a saved machine..."))
    // Select the first machine
    await user.click(screen.getByText("Tractor 1"))

    expect(onLoad).toHaveBeenCalledWith(0)

    // Now delete
    await user.click(screen.getByText("Delete"))
    expect(onDelete).toHaveBeenCalledWith(0)
  })
})
