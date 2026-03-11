import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs"

function renderTabs(props: Record<string, unknown> = {}) {
  return render(
    <Tabs defaultValue="a" {...props}>
      <TabsList>
        <TabsTrigger value="a">Tab A</TabsTrigger>
        <TabsTrigger value="b">Tab B</TabsTrigger>
      </TabsList>
      <TabsContent value="a">Content A</TabsContent>
      <TabsContent value="b">Content B</TabsContent>
    </Tabs>
  )
}

describe("Tabs", () => {
  it("renders with data-slot='tabs'", () => {
    const { container } = renderTabs()
    const tabsEl = container.querySelector("[data-slot='tabs']")
    expect(tabsEl).toBeInTheDocument()
  })

  it("renders with horizontal orientation by default", () => {
    const { container } = renderTabs()
    const tabsEl = container.querySelector("[data-slot='tabs']")
    expect(tabsEl).toHaveAttribute("data-orientation", "horizontal")
  })
})

describe("TabsList", () => {
  it("renders with data-slot='tabs-list'", () => {
    const { container } = renderTabs()
    const listEl = container.querySelector("[data-slot='tabs-list']")
    expect(listEl).toBeInTheDocument()
  })

  it("renders with default variant", () => {
    const { container } = renderTabs()
    const listEl = container.querySelector("[data-slot='tabs-list']")
    expect(listEl).toHaveAttribute("data-variant", "default")
  })

  it("renders with segment variant", () => {
    const { container } = render(
      <Tabs defaultValue="a">
        <TabsList variant="segment">
          <TabsTrigger value="a">Tab A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
      </Tabs>
    )
    const listEl = container.querySelector("[data-slot='tabs-list']")
    expect(listEl).toHaveAttribute("data-variant", "segment")
  })
})

describe("TabsTrigger", () => {
  it("renders with data-slot='tabs-trigger'", () => {
    const { container } = renderTabs()
    const triggers = container.querySelectorAll("[data-slot='tabs-trigger']")
    expect(triggers).toHaveLength(2)
  })

  it("renders trigger text", () => {
    renderTabs()
    expect(screen.getByText("Tab A")).toBeInTheDocument()
    expect(screen.getByText("Tab B")).toBeInTheDocument()
  })

  it("supports disabled prop", () => {
    const { container } = render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b" disabled>Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
        <TabsContent value="b">Content B</TabsContent>
      </Tabs>
    )
    const disabledTrigger = container.querySelectorAll("[data-slot='tabs-trigger']")[1]
    expect(disabledTrigger).toHaveAttribute("aria-disabled", "true")
  })
})

describe("TabsContent", () => {
  it("renders active tab content", () => {
    renderTabs()
    expect(screen.getByText("Content A")).toBeInTheDocument()
  })

  it("has data-slot='tabs-content'", () => {
    const { container } = renderTabs()
    const contentEl = container.querySelector("[data-slot='tabs-content']")
    expect(contentEl).toBeInTheDocument()
  })
})

describe("Tabs switching", () => {
  it("calls onValueChange when switching tabs", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Tabs defaultValue="a" onValueChange={onChange}>
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
        <TabsContent value="b">Content B</TabsContent>
      </Tabs>
    )

    await user.click(screen.getByText("Tab B"))
    expect(onChange).toHaveBeenCalled()
  })

  it("switches content when clicking a tab", async () => {
    const user = userEvent.setup()
    renderTabs()

    expect(screen.getByText("Content A")).toBeInTheDocument()
    await user.click(screen.getByText("Tab B"))
    expect(screen.getByText("Content B")).toBeInTheDocument()
  })
})
