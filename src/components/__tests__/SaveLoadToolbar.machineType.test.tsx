import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SaveLoadToolbar } from "../SaveLoadToolbar"
import { DEPRECIATION_PROFILES } from "@/lib/depreciation-data"

describe("SaveLoadToolbar - machine type dropdown", () => {
  // --- Rendering ---

  it("renders the Machine type label and dropdown", () => {
    render(
      <SaveLoadToolbar
        savedMachines={[]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.getByText("Machine type")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Please select...")).toBeInTheDocument()
  })

  it("lists every depreciation profile as an option", () => {
    render(
      <SaveLoadToolbar
        savedMachines={[]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
      />
    )
    for (const profile of Object.values(DEPRECIATION_PROFILES)) {
      expect(screen.getByText(profile.label)).toBeInTheDocument()
    }
  })

  // --- Save button gating ---

  it("disables Save when name is filled but machine type is not selected", async () => {
    const user = userEvent.setup()
    render(
      <SaveLoadToolbar
        savedMachines={[]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
      />
    )
    await user.type(screen.getByPlaceholderText("Name this machine..."), "My Drill")
    expect(screen.getByText("Save")).toBeDisabled()
  })

  it("disables Save when machine type is selected but name is empty", async () => {
    const user = userEvent.setup()
    render(
      <SaveLoadToolbar
        savedMachines={[]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
      />
    )
    await user.selectOptions(screen.getByDisplayValue("Please select..."), "sprayers")
    expect(screen.getByText("Save")).toBeDisabled()
  })

  it("enables Save only when both name and machine type are provided", async () => {
    const user = userEvent.setup()
    render(
      <SaveLoadToolbar
        savedMachines={[]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
      />
    )
    await user.selectOptions(screen.getByDisplayValue("Please select..."), "combines")
    await user.type(screen.getByPlaceholderText("Name this machine..."), "JD S790")
    expect(screen.getByText("Save")).toBeEnabled()
  })

  // --- Save callback ---

  it("passes both name and machineType to onSave", async () => {
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
    await user.selectOptions(screen.getByDisplayValue("Please select..."), "drills")
    await user.type(screen.getByPlaceholderText("Name this machine..."), "Horsch Pronto")
    await user.click(screen.getByText("Save"))

    expect(onSave).toHaveBeenCalledWith("Horsch Pronto", "drills")
  })

  it("resets machine type dropdown to placeholder after saving", async () => {
    const user = userEvent.setup()
    render(
      <SaveLoadToolbar
        savedMachines={[]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
      />
    )
    await user.selectOptions(screen.getByDisplayValue("Please select..."), "tillage")
    await user.type(screen.getByPlaceholderText("Name this machine..."), "Cultivator")
    await user.click(screen.getByText("Save"))

    // Dropdown should be back to the empty/placeholder state
    const select = screen.getByLabelText("Machine type") as HTMLSelectElement
    expect(select.value).toBe("")
  })

  // --- Loading populates machineType ---

  it("populates machine type dropdown when a machine is loaded", async () => {
    const user = userEvent.setup()
    render(
      <SaveLoadToolbar
        savedMachines={[
          { name: "Big Sprayer", machineType: "sprayers", inputs: {} },
          { name: "Seed Drill", machineType: "drills", inputs: {} },
        ]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
      />
    )
    // Load the second machine
    await user.click(screen.getByText("Load a saved machine..."))
    await user.click(screen.getByText("Seed Drill"))

    const select = screen.getByLabelText("Machine type") as HTMLSelectElement
    expect(select.value).toBe("drills")
  })

  it("populates correct machineType for each machine category", async () => {
    const user = userEvent.setup()
    // Test with a single combines machine to confirm category-specific population
    render(
      <SaveLoadToolbar
        savedMachines={[
          { name: "Forage Machine", machineType: "forage_harvesters", inputs: {} },
        ]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
      />
    )
    const machineTypeSelect = screen.getByLabelText("Machine type") as HTMLSelectElement
    expect(machineTypeSelect.value).toBe("") // initially empty

    await user.click(screen.getByText("Load a saved machine..."))
    await user.click(screen.getByText("Forage Machine"))
    expect(machineTypeSelect.value).toBe("forage_harvesters")
  })

  // --- Delete resets machineType ---

  it("resets machine type to placeholder when the last machine is deleted", async () => {
    const user = userEvent.setup()
    render(
      <SaveLoadToolbar
        savedMachines={[{ name: "Sprayer", machineType: "sprayers", inputs: {} }]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
        onReset={() => {}}
      />
    )
    await user.click(screen.getByText("Load a saved machine..."))
    await user.click(screen.getByText("Sprayer"))

    await user.click(screen.getByText("Delete"))

    const select = screen.getByLabelText("Machine type") as HTMLSelectElement
    expect(select.value).toBe("")
  })

  it("sets machine type from the remaining machine after delete", async () => {
    const user = userEvent.setup()
    render(
      <SaveLoadToolbar
        savedMachines={[
          { name: "Tractor", machineType: "tractors_small", inputs: {} },
          { name: "Combine", machineType: "combines", inputs: {} },
        ]}
        onSave={() => {}}
        onLoad={() => {}}
        onDelete={() => {}}
        onReset={() => {}}
      />
    )
    // Load Combine (index 1), then delete it
    await user.click(screen.getByText("Load a saved machine..."))
    await user.click(screen.getByText("Combine"))

    await user.click(screen.getByText("Delete"))

    // Should now show Tractor's machineType
    const select = screen.getByLabelText("Machine type") as HTMLSelectElement
    expect(select.value).toBe("tractors_small")
  })
})
