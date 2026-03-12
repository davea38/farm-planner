import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MachinesTab, MachineIcon } from "@/components/MachinesTab"
import type { DepreciationCategory, MachineProfile } from "@/lib/types"
import { defaultCostPerHectare, defaultCostPerHour, defaultMachineA, defaultMachineB } from "@/lib/defaults"

/* ------------------------------------------------------------------ */
/*  Helper factories                                                   */
/* ------------------------------------------------------------------ */

type MachinesTabProps = Parameters<typeof MachinesTab>[0]

function makeProps(overrides: Partial<MachinesTabProps> = {}): MachinesTabProps {
  return {
    machines: [],
    selectedMachineIndex: null,
    onSelectMachine: vi.fn(),
    onSaveMachine: vi.fn(),
    onDeleteMachine: vi.fn(),
    ...overrides,
  }
}

const makeMachine = (name: string, type: DepreciationCategory = "tractors_large", costMode: "hectare" | "hour" = "hectare"): MachineProfile => ({
  name,
  machineType: type,
  costMode,
  costPerHectare: { ...defaultCostPerHectare },
  costPerHour: { ...defaultCostPerHour },
  compareMachines: { machineA: { ...defaultMachineA }, machineB: { ...defaultMachineB } },
})

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("MachinesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /* ---- Empty state ---- */

  describe("empty state", () => {
    it("shows 'No machines yet' when there are no machines", () => {
      render(<MachinesTab {...makeProps()} />)
      expect(screen.getByText("No machines yet")).toBeInTheDocument()
    })

    it("shows 'Add your first machine' button", () => {
      render(<MachinesTab {...makeProps()} />)
      expect(screen.getByRole("button", { name: /add your first machine/i })).toBeInTheDocument()
    })

    it("clicking 'Add your first machine' opens the add form", async () => {
      const user = userEvent.setup()
      render(<MachinesTab {...makeProps()} />)
      await user.click(screen.getByRole("button", { name: /add your first machine/i }))
      expect(screen.getByText("New Machine")).toBeInTheDocument()
    })

    it("does not show the empty state when add form is open", async () => {
      const user = userEvent.setup()
      render(<MachinesTab {...makeProps()} />)
      await user.click(screen.getByRole("button", { name: /add your first machine/i }))
      expect(screen.queryByText("No machines yet")).not.toBeInTheDocument()
    })

    it("does not show the guidance banner when there are no machines", () => {
      render(<MachinesTab {...makeProps()} />)
      expect(screen.queryByText(/Select a machine/)).not.toBeInTheDocument()
    })
  })

  /* ---- Machine list rendering ---- */

  describe("machine list rendering", () => {
    it("shows machine names in the list", () => {
      const props = makeProps({
        machines: [makeMachine("John Deere 6150R"), makeMachine("Case IH Puma")],
      })
      render(<MachinesTab {...props} />)
      expect(screen.getByText("John Deere 6150R")).toBeInTheDocument()
      expect(screen.getByText("Case IH Puma")).toBeInTheDocument()
    })

    it("shows machine type labels", () => {
      const props = makeProps({
        machines: [makeMachine("My Tractor", "tractors_small")],
      })
      render(<MachinesTab {...props} />)
      // The profile label for tractors_small is "Tractors (80–149 HP)"
      expect(screen.getByText(/Tractors \(80/)).toBeInTheDocument()
    })

    it("does not show empty state when machines exist", () => {
      const props = makeProps({
        machines: [makeMachine("Tractor A")],
      })
      render(<MachinesTab {...props} />)
      expect(screen.queryByText("No machines yet")).not.toBeInTheDocument()
    })
  })

  /* ---- Machine count badge ---- */

  describe("machine count badge", () => {
    it("shows count of all machines", () => {
      const props = makeProps({
        machines: [makeMachine("A"), makeMachine("B"), makeMachine("C", "sprayers", "hour")],
      })
      render(<MachinesTab {...props} />)
      expect(screen.getByText("3")).toBeInTheDocument()
    })

    it("shows correct count with only hour machines", () => {
      const props = makeProps({
        machines: [makeMachine("X", "sprayers", "hour"), makeMachine("Y", "sprayers", "hour")],
      })
      render(<MachinesTab {...props} />)
      expect(screen.getByText("2")).toBeInTheDocument()
    })
  })

  /* ---- Selection ---- */

  describe("selection", () => {
    it("clicking a machine calls onSelectMachine with correct index", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A"), makeMachine("Tractor B")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByText("Tractor B"))
      expect(props.onSelectMachine).toHaveBeenCalledWith(1)
    })

    it("clicking a machine calls onSelectMachine with correct index for second machine", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Sprayer X", "sprayers", "hour")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByText("Sprayer X"))
      expect(props.onSelectMachine).toHaveBeenCalledWith(0)
    })

    it("clicking the radio button also selects the machine", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByTitle("Select this machine"))
      expect(props.onSelectMachine).toHaveBeenCalledWith(0)
    })
  })

  /* ---- Selected state ---- */

  describe("selected state", () => {
    it("shows 'Selected' title on the radio button of the selected machine", () => {
      const props = makeProps({
        machines: [makeMachine("Tractor A"), makeMachine("Tractor B")],
        selectedMachineIndex: 0,
      })
      render(<MachinesTab {...props} />)
      expect(screen.getByTitle("Selected")).toBeInTheDocument()
      expect(screen.getByTitle("Select this machine")).toBeInTheDocument()
    })

    it("applies selected styling (bg-primary/6) to selected machine", () => {
      const props = makeProps({
        machines: [makeMachine("Tractor A")],
        selectedMachineIndex: 0,
      })
      const { container } = render(<MachinesTab {...props} />)
      const selectedRow = container.querySelector(".bg-primary\\/6")
      expect(selectedRow).toBeInTheDocument()
    })
  })

  /* ---- Guidance banner ---- */

  describe("guidance banner", () => {
    it("shows 'Select a machine' banner when machines exist but none selected", () => {
      const props = makeProps({
        machines: [makeMachine("Tractor A")],
        selectedMachineIndex: null,
      })
      render(<MachinesTab {...props} />)
      expect(screen.getByText("Select a machine")).toBeInTheDocument()
    })

    it("does not show banner when a machine is selected", () => {
      const props = makeProps({
        machines: [makeMachine("Tractor A")],
        selectedMachineIndex: 0,
      })
      render(<MachinesTab {...props} />)
      expect(screen.queryByText("Select a machine")).not.toBeInTheDocument()
    })

    it("does not show banner when no machines exist", () => {
      render(<MachinesTab {...makeProps()} />)
      expect(screen.queryByText("Select a machine")).not.toBeInTheDocument()
    })
  })

  /* ---- Add New form ---- */

  describe("add new form", () => {
    it("clicking 'Add New Machine' opens the form", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Existing")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByText(/Add New Machine/))
      expect(screen.getByText("New Machine")).toBeInTheDocument()
      expect(screen.getByLabelText(/Name/)).toBeInTheDocument()
    })

    it("Save button is disabled when name and type are empty", async () => {
      const user = userEvent.setup()
      render(<MachinesTab {...makeProps()} />)
      await user.click(screen.getByText(/Add New Machine/))
      expect(screen.getByRole("button", { name: /Save Machine/ })).toBeDisabled()
    })

    it("Save button is disabled when only name is provided", async () => {
      const user = userEvent.setup()
      render(<MachinesTab {...makeProps()} />)
      await user.click(screen.getByText(/Add New Machine/))
      await user.type(screen.getByPlaceholderText(/John Deere/), "My Tractor")
      expect(screen.getByRole("button", { name: /Save Machine/ })).toBeDisabled()
    })

    it("Save button is disabled when only type is selected", async () => {
      const user = userEvent.setup()
      render(<MachinesTab {...makeProps()} />)
      await user.click(screen.getByText(/Add New Machine/))
      await user.selectOptions(screen.getByRole("combobox"), "tractors_small")
      expect(screen.getByRole("button", { name: /Save Machine/ })).toBeDisabled()
    })

    it("saving calls onSaveMachine with name, type, null", async () => {
      const user = userEvent.setup()
      const props = makeProps()
      render(<MachinesTab {...props} />)
      await user.click(screen.getByText(/Add New Machine/))
      await user.type(screen.getByPlaceholderText(/John Deere/), "New Tractor")
      await user.selectOptions(screen.getByRole("combobox"), "tractors_large")
      await user.click(screen.getByRole("button", { name: /Save Machine/ }))
      expect(props.onSaveMachine).toHaveBeenCalledWith("New Tractor", "tractors_large", null)
    })

    it("saving also calls onSelectMachine to auto-select the new machine", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Existing")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByText(/Add New Machine/))
      await user.type(screen.getByPlaceholderText(/John Deere/), "New Tractor")
      await user.selectOptions(screen.getByRole("combobox"), "tractors_large")
      await user.click(screen.getByRole("button", { name: /Save Machine/ }))
      // machines.length is 1 so new index should be 1
      expect(props.onSelectMachine).toHaveBeenCalledWith(1)
    })

    it("shows a toast after save", async () => {
      const user = userEvent.setup()
      const props = makeProps()
      render(<MachinesTab {...props} />)
      await user.click(screen.getByText(/Add New Machine/))
      await user.type(screen.getByPlaceholderText(/John Deere/), "New Tractor")
      await user.selectOptions(screen.getByRole("combobox"), "tractors_large")
      await user.click(screen.getByRole("button", { name: /Save Machine/ }))
      expect(screen.getByText(/Saved "New Tractor"/)).toBeInTheDocument()
    })

    it("close button cancels the form", async () => {
      const user = userEvent.setup()
      render(<MachinesTab {...makeProps()} />)
      await user.click(screen.getByText(/Add New Machine/))
      expect(screen.getByText("New Machine")).toBeInTheDocument()
      // The close button is inside the form header
      const header = screen.getByText("New Machine").closest("div")!
      const closeButton = within(header).getByRole("button")
      await user.click(closeButton)
      expect(screen.queryByText("New Machine")).not.toBeInTheDocument()
    })

    it("duplicate name shows error message", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Existing Tractor")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByText(/Add New Machine/))
      await user.type(screen.getByPlaceholderText(/John Deere/), "Existing Tractor")
      expect(screen.getByText(/A machine with this name already exists/)).toBeInTheDocument()
    })

    it("duplicate name (case-insensitive) shows error and disables save", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("My Tractor")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByText(/Add New Machine/))
      await user.type(screen.getByPlaceholderText(/John Deere/), "my tractor")
      await user.selectOptions(screen.getByRole("combobox"), "tractors_large")
      expect(screen.getByRole("button", { name: /Save Machine/ })).toBeDisabled()
    })

    it("does not call save when name is duplicate", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Existing")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByText(/Add New Machine/))
      await user.type(screen.getByPlaceholderText(/John Deere/), "Existing")
      await user.selectOptions(screen.getByRole("combobox"), "tractors_large")
      // Button is disabled, clicking it does nothing
      fireEvent.click(screen.getByRole("button", { name: /Save Machine/ }))
      expect(props.onSaveMachine).not.toHaveBeenCalled()
    })
  })

  /* ---- Inline editing ---- */

  describe("inline editing", () => {
    it("clicking edit button shows edit form with current name and type", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A", "tractors_small")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByTitle("Edit name & type"))
      // The edit form should have inputs pre-filled
      const nameInput = screen.getByDisplayValue("Tractor A")
      expect(nameInput).toBeInTheDocument()
      const typeSelect = screen.getByDisplayValue(/Tractors \(80/)
      expect(typeSelect).toBeInTheDocument()
    })

    it("saving edit calls onSaveMachine for machines", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A", "tractors_small")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByTitle("Edit name & type"))
      const nameInput = screen.getByDisplayValue("Tractor A")
      await user.clear(nameInput)
      await user.type(nameInput, "Tractor B")
      await user.click(screen.getByRole("button", { name: /Save/ }))
      expect(props.onSaveMachine).toHaveBeenCalledWith("Tractor B", "tractors_small", 0)
    })

    it("saving edit calls onSaveMachine for hour machines too", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Sprayer X", "sprayers", "hour")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByTitle("Edit name & type"))
      const nameInput = screen.getByDisplayValue("Sprayer X")
      await user.clear(nameInput)
      await user.type(nameInput, "Sprayer Y")
      await user.click(screen.getByRole("button", { name: /Save/ }))
      expect(props.onSaveMachine).toHaveBeenCalledWith("Sprayer Y", "sprayers", 0)
    })

    it("cancel button closes the edit form", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByTitle("Edit name & type"))
      expect(screen.getByDisplayValue("Tractor A")).toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: /Cancel/ }))
      expect(screen.queryByDisplayValue("Tractor A")).not.toBeInTheDocument()
    })

    it("clicking edit button again toggles off the edit form", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A")],
      })
      render(<MachinesTab {...props} />)
      const editBtn = screen.getByTitle("Edit name & type")
      await user.click(editBtn)
      expect(screen.getByDisplayValue("Tractor A")).toBeInTheDocument()
      await user.click(editBtn)
      expect(screen.queryByDisplayValue("Tractor A")).not.toBeInTheDocument()
    })

    it("duplicate name of another machine shows error in edit form", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A"), makeMachine("Tractor B")],
      })
      render(<MachinesTab {...props} />)
      // Edit the first machine
      const editButtons = screen.getAllByTitle("Edit name & type")
      await user.click(editButtons[0])
      const nameInput = screen.getByDisplayValue("Tractor A")
      await user.clear(nameInput)
      await user.type(nameInput, "Tractor B")
      expect(screen.getByText(/A machine with this name already exists/)).toBeInTheDocument()
    })

    it("using own name in edit does not show duplicate error", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A"), makeMachine("Tractor B")],
      })
      render(<MachinesTab {...props} />)
      const editButtons = screen.getAllByTitle("Edit name & type")
      await user.click(editButtons[0])
      // Name is already "Tractor A" - should not show duplicate error
      expect(screen.queryByText(/A machine with this name already exists/)).not.toBeInTheDocument()
    })

    it("edit save is disabled when name is empty", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByTitle("Edit name & type"))
      const nameInput = screen.getByDisplayValue("Tractor A")
      await user.clear(nameInput)
      expect(screen.getByRole("button", { name: /Save/ })).toBeDisabled()
    })

    it("shows toast after saving edit", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A", "tractors_small")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByTitle("Edit name & type"))
      await user.click(screen.getByRole("button", { name: /Save/ }))
      expect(screen.getByText(/Updated "Tractor A"/)).toBeInTheDocument()
    })
  })

  /* ---- Delete ---- */

  describe("delete", () => {
    it("clicking delete shows confirmation modal", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByTitle("Delete"))
      expect(screen.getByText(/permanently remove/)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    })

    it("confirming delete calls onDeleteMachine", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A"), makeMachine("Tractor B")],
      })
      render(<MachinesTab {...props} />)
      const deleteButtons = screen.getAllByTitle("Delete")
      await user.click(deleteButtons[1])
      // Click the "Delete" button in the modal
      const modal = screen.getByText(/permanently remove/).closest("div")!.parentElement!
      await user.click(within(modal).getByRole("button", { name: "Delete" }))
      expect(props.onDeleteMachine).toHaveBeenCalledWith(1)
    })

    it("confirming delete calls onDeleteMachine for hour machines", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Sprayer X", "sprayers", "hour")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByTitle("Delete"))
      const modal = screen.getByText(/permanently remove/).closest("div")!.parentElement!
      await user.click(within(modal).getByRole("button", { name: "Delete" }))
      expect(props.onDeleteMachine).toHaveBeenCalledWith(0)
    })

    it("cancel closes the modal", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByTitle("Delete"))
      expect(screen.getByText(/permanently remove/)).toBeInTheDocument()
      const modal = screen.getByText(/permanently remove/).closest("div")!.parentElement!
      await user.click(within(modal).getByRole("button", { name: "Cancel" }))
      expect(screen.queryByText(/permanently remove/)).not.toBeInTheDocument()
    })

    it("clicking overlay closes the modal", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByTitle("Delete"))
      expect(screen.getByText(/permanently remove/)).toBeInTheDocument()
      // Click the overlay (the outer fixed div)
      const overlay = screen.getByText(/permanently remove/).closest(".fixed")!
      fireEvent.click(overlay)
      expect(screen.queryByText(/permanently remove/)).not.toBeInTheDocument()
    })

    it("deleting the selected machine also calls onSelectMachine(null)", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A")],
        selectedMachineIndex: 0,
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByTitle("Delete"))
      const modal = screen.getByText(/permanently remove/).closest("div")!.parentElement!
      await user.click(within(modal).getByRole("button", { name: "Delete" }))
      expect(props.onDeleteMachine).toHaveBeenCalledWith(0)
      expect(props.onSelectMachine).toHaveBeenCalledWith(null)
    })

    it("deleting a non-selected machine does not call onSelectMachine(null)", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A"), makeMachine("Tractor B")],
        selectedMachineIndex: 0,
      })
      render(<MachinesTab {...props} />)
      const deleteButtons = screen.getAllByTitle("Delete")
      await user.click(deleteButtons[1]) // delete Tractor B (index 1)
      const modal = screen.getByText(/permanently remove/).closest("div")!.parentElement!
      await user.click(within(modal).getByRole("button", { name: "Delete" }))
      expect(props.onDeleteMachine).toHaveBeenCalledWith(1)
      expect(props.onSelectMachine).not.toHaveBeenCalledWith(null)
    })

    it("shows a toast after deleting", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByTitle("Delete"))
      const modal = screen.getByText(/permanently remove/).closest("div")!.parentElement!
      await user.click(within(modal).getByRole("button", { name: "Delete" }))
      expect(screen.getByText(/Deleted "Tractor A"/)).toBeInTheDocument()
    })

    it("deleting a machine being edited also cancels the edit", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor A")],
      })
      render(<MachinesTab {...props} />)
      // Start editing
      await user.click(screen.getByTitle("Edit name & type"))
      expect(screen.getByDisplayValue("Tractor A")).toBeInTheDocument()
      // Delete the machine
      await user.click(screen.getByTitle("Delete"))
      const modal = screen.getByText(/permanently remove/).closest("div")!.parentElement!
      await user.click(within(modal).getByRole("button", { name: "Delete" }))
      // Edit form should be closed (though the machine list entry will also be removed by parent)
      expect(props.onDeleteMachine).toHaveBeenCalledWith(0)
    })
  })

  /* ---- MachineIcon ---- */

  describe("MachineIcon", () => {
    const machineTypes = [
      "tractors_small",
      "tractors_large",
      "combines",
      "sprayers",
      "tillage",
      "drills",
      "forage_harvesters",
      "unknown_type",
    ]

    it.each(machineTypes)("renders an SVG for type '%s'", (type) => {
      const { container } = render(<MachineIcon type={type} />)
      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
    })

    it("tractors_small and tractors_large render the same SVG structure", () => {
      const { container: c1 } = render(<MachineIcon type="tractors_small" />)
      const { container: c2 } = render(<MachineIcon type="tractors_large" />)
      expect(c1.innerHTML).toEqual(c2.innerHTML)
    })

    it("combines renders a different SVG than tractors", () => {
      const { container: c1 } = render(<MachineIcon type="combines" />)
      const { container: c2 } = render(<MachineIcon type="tractors_small" />)
      expect(c1.innerHTML).not.toEqual(c2.innerHTML)
    })

    it("sprayers renders a different SVG than combines", () => {
      const { container: c1 } = render(<MachineIcon type="sprayers" />)
      const { container: c2 } = render(<MachineIcon type="combines" />)
      expect(c1.innerHTML).not.toEqual(c2.innerHTML)
    })

    it("tillage renders a different SVG than drills", () => {
      const { container: c1 } = render(<MachineIcon type="tillage" />)
      const { container: c2 } = render(<MachineIcon type="drills" />)
      expect(c1.innerHTML).not.toEqual(c2.innerHTML)
    })

    it("forage_harvesters renders a unique SVG", () => {
      const { container: c1 } = render(<MachineIcon type="forage_harvesters" />)
      const { container: c2 } = render(<MachineIcon type="tractors_small" />)
      expect(c1.innerHTML).not.toEqual(c2.innerHTML)
    })

    it("unknown type renders the default SVG", () => {
      const { container: c1 } = render(<MachineIcon type="something_unknown" />)
      const { container: c2 } = render(<MachineIcon type="another_unknown" />)
      expect(c1.innerHTML).toEqual(c2.innerHTML)
    })

    it("respects size prop", () => {
      const { container } = render(<MachineIcon type="combines" size={48} />)
      const svg = container.querySelector("svg")
      expect(svg).toHaveAttribute("width", "48")
      expect(svg).toHaveAttribute("height", "48")
    })

    it("respects className prop", () => {
      const { container } = render(<MachineIcon type="combines" className="text-red-500" />)
      const svg = container.querySelector("svg")
      expect(svg).toHaveClass("text-red-500")
    })
  })

  /* ---- Hour machines ---- */

  describe("hour machines", () => {
    it("hour-mode machines appear in the list", () => {
      const props = makeProps({
        machines: [makeMachine("Hour Sprayer", "sprayers", "hour")],
      })
      render(<MachinesTab {...props} />)
      expect(screen.getByText("Hour Sprayer")).toBeInTheDocument()
    })

    it("mixed hectare and hour machines all appear", () => {
      const props = makeProps({
        machines: [makeMachine("Hectare Tractor"), makeMachine("Hour Sprayer", "sprayers", "hour")],
      })
      render(<MachinesTab {...props} />)
      expect(screen.getByText("Hectare Tractor")).toBeInTheDocument()
      expect(screen.getByText("Hour Sprayer")).toBeInTheDocument()
    })

    it("selecting an hour machine passes correct index", async () => {
      const user = userEvent.setup()
      const props = makeProps({
        machines: [makeMachine("Tractor"), makeMachine("Sprayer", "sprayers", "hour")],
      })
      render(<MachinesTab {...props} />)
      await user.click(screen.getByText("Sprayer"))
      expect(props.onSelectMachine).toHaveBeenCalledWith(1)
    })
  })

  /* ---- Toast cleanup ---- */

  describe("toast", () => {
    it("toast disappears after timeout", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
      const props = makeProps()
      render(<MachinesTab {...props} />)
      await user.click(screen.getByText(/Add New Machine/))
      await user.type(screen.getByPlaceholderText(/John Deere/), "New Tractor")
      await user.selectOptions(screen.getByRole("combobox"), "tractors_large")
      await user.click(screen.getByRole("button", { name: /Save Machine/ }))
      expect(screen.getByText(/Saved "New Tractor"/)).toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(4000)
      })
      expect(screen.queryByText(/Saved "New Tractor"/)).not.toBeInTheDocument()
      vi.useRealTimers()
    })
  })
})
