import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SaveLoadToolbar } from "../SaveLoadToolbar"

describe("SaveLoadToolbar - delete loads first remaining or resets", () => {
  it("loads the first remaining machine after deleting a selected machine", async () => {
    const onDelete = vi.fn()
    const onLoad = vi.fn()
    const onReset = vi.fn()
    const user = userEvent.setup()

    render(
      <SaveLoadToolbar
        savedMachines={[
          { name: "Tractor", machineType: "tractors_large", inputs: {} },
          { name: "Combine", machineType: "tractors_large", inputs: {} },
          { name: "Sprayer", machineType: "tractors_large", inputs: {} },
        ]}
        onSave={() => {}}
        onLoad={onLoad}
        onDelete={onDelete}
        onReset={onReset}
      />
    )

    // Select the second machine (Combine)
    await user.click(screen.getByText("Load a saved machine..."))
    await user.click(screen.getByText("Combine"))
    expect(onLoad).toHaveBeenCalledWith(1)

    onLoad.mockClear()

    // Delete it
    await user.click(screen.getByText("Delete"))
    expect(onDelete).toHaveBeenCalledWith(1)
    // Should auto-load the first machine (index 0)
    expect(onLoad).toHaveBeenCalledWith(0)
    expect(onReset).not.toHaveBeenCalled()
  })

  it("loads index 0 after deleting the first machine when others remain", async () => {
    const onDelete = vi.fn()
    const onLoad = vi.fn()
    const onReset = vi.fn()
    const user = userEvent.setup()

    render(
      <SaveLoadToolbar
        savedMachines={[
          { name: "Tractor", machineType: "tractors_large", inputs: {} },
          { name: "Combine", machineType: "tractors_large", inputs: {} },
        ]}
        onSave={() => {}}
        onLoad={onLoad}
        onDelete={onDelete}
        onReset={onReset}
      />
    )

    // Select the first machine
    await user.click(screen.getByText("Load a saved machine..."))
    await user.click(screen.getByText("Tractor"))
    expect(onLoad).toHaveBeenCalledWith(0)

    onLoad.mockClear()

    // Delete it
    await user.click(screen.getByText("Delete"))
    expect(onDelete).toHaveBeenCalledWith(0)
    // Should load index 0 (which will be "Combine" in the updated list)
    expect(onLoad).toHaveBeenCalledWith(0)
    expect(onReset).not.toHaveBeenCalled()
  })

  it("calls onReset when the last machine is deleted", async () => {
    const onDelete = vi.fn()
    const onLoad = vi.fn()
    const onReset = vi.fn()
    const user = userEvent.setup()

    render(
      <SaveLoadToolbar
        savedMachines={[{ name: "Tractor", machineType: "tractors_large", inputs: {} }]}
        onSave={() => {}}
        onLoad={onLoad}
        onDelete={onDelete}
        onReset={onReset}
      />
    )

    // Select the only machine
    await user.click(screen.getByText("Load a saved machine..."))
    await user.click(screen.getByText("Tractor"))

    onLoad.mockClear()

    // Delete it
    await user.click(screen.getByText("Delete"))
    expect(onDelete).toHaveBeenCalledWith(0)
    // No machines remain — should reset
    expect(onReset).toHaveBeenCalledOnce()
    expect(onLoad).not.toHaveBeenCalled()
  })

  it("shows reset toast when last machine is deleted", async () => {
    const user = userEvent.setup()

    render(
      <SaveLoadToolbar
        savedMachines={[{ name: "Tractor", machineType: "tractors_large", inputs: {} }]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
        onReset={() => {}}
      />
    )

    await user.click(screen.getByText("Load a saved machine..."))
    await user.click(screen.getByText("Tractor"))

    await user.click(screen.getByText("Delete"))
    expect(screen.getByText(/form reset to defaults/i)).toBeInTheDocument()
  })

  it("shows loaded toast with remaining machine name after delete", async () => {
    const user = userEvent.setup()

    render(
      <SaveLoadToolbar
        savedMachines={[
          { name: "Tractor", machineType: "tractors_large", inputs: {} },
          { name: "Combine", machineType: "tractors_large", inputs: {} },
        ]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
        onReset={() => {}}
      />
    )

    // Select Combine (index 1), then delete it
    await user.click(screen.getByText("Load a saved machine..."))
    await user.click(screen.getByText("Combine"))

    await user.click(screen.getByText("Delete"))
    // Should mention loading "Tractor" (the remaining first machine)
    expect(screen.getByText(/loaded "Tractor"/i)).toBeInTheDocument()
  })
})
