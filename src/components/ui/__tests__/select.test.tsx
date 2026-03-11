import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
} from "../select"

function renderFullSelect() {
  return render(
    <Select defaultValue="apple">
      <SelectTrigger>
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectSeparator />
          <SelectItem value="banana">Banana</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

describe("SelectGroup", () => {
  it("renders with data-slot='select-group' when popup is open", async () => {
    const user = userEvent.setup()
    const { container } = renderFullSelect()

    // Open the select
    const trigger = container.querySelector("[data-slot='select-trigger']")
    expect(trigger).toBeInTheDocument()
    await user.click(trigger!)

    // SelectGroup should now be in the DOM
    const group = document.querySelector("[data-slot='select-group']")
    expect(group).toBeInTheDocument()
  })
})

describe("SelectLabel", () => {
  it("renders with data-slot='select-label' when popup is open", async () => {
    const user = userEvent.setup()
    renderFullSelect()

    const trigger = document.querySelector("[data-slot='select-trigger']")
    await user.click(trigger!)

    const label = document.querySelector("[data-slot='select-label']")
    expect(label).toBeInTheDocument()
  })
})

describe("SelectSeparator", () => {
  it("renders with data-slot='select-separator' when popup is open", async () => {
    const user = userEvent.setup()
    renderFullSelect()

    const trigger = document.querySelector("[data-slot='select-trigger']")
    await user.click(trigger!)

    const separator = document.querySelector("[data-slot='select-separator']")
    expect(separator).toBeInTheDocument()
  })
})
