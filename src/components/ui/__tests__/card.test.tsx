import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "../card"

describe("Card", () => {
  it("renders with data-slot='card'", () => {
    const { container } = render(<Card>Card content</Card>)
    const cardEl = container.querySelector("[data-slot='card']")
    expect(cardEl).toBeInTheDocument()
  })

  it("renders with default size", () => {
    const { container } = render(<Card>content</Card>)
    const cardEl = container.querySelector("[data-slot='card']")
    expect(cardEl).toHaveAttribute("data-size", "default")
  })

  it("renders with sm size", () => {
    const { container } = render(<Card size="sm">content</Card>)
    const cardEl = container.querySelector("[data-slot='card']")
    expect(cardEl).toHaveAttribute("data-size", "sm")
  })

  it("passes custom className", () => {
    const { container } = render(<Card className="my-custom-class">content</Card>)
    const cardEl = container.querySelector("[data-slot='card']")
    expect(cardEl).toHaveClass("my-custom-class")
  })
})

describe("CardHeader", () => {
  it("renders with data-slot='card-header'", () => {
    const { container } = render(<CardHeader>Header</CardHeader>)
    const el = container.querySelector("[data-slot='card-header']")
    expect(el).toBeInTheDocument()
  })

  it("renders children", () => {
    render(<CardHeader>My Header</CardHeader>)
    expect(screen.getByText("My Header")).toBeInTheDocument()
  })
})

describe("CardTitle", () => {
  it("renders with data-slot='card-title'", () => {
    const { container } = render(<CardTitle>Title</CardTitle>)
    const el = container.querySelector("[data-slot='card-title']")
    expect(el).toBeInTheDocument()
  })

  it("renders children", () => {
    render(<CardTitle>My Title</CardTitle>)
    expect(screen.getByText("My Title")).toBeInTheDocument()
  })
})

describe("CardDescription", () => {
  it("renders with data-slot='card-description'", () => {
    const { container } = render(<CardDescription>Desc</CardDescription>)
    const el = container.querySelector("[data-slot='card-description']")
    expect(el).toBeInTheDocument()
  })

  it("renders children", () => {
    render(<CardDescription>My Description</CardDescription>)
    expect(screen.getByText("My Description")).toBeInTheDocument()
  })

  it("passes custom className", () => {
    const { container } = render(
      <CardDescription className="extra-class">Desc</CardDescription>
    )
    const el = container.querySelector("[data-slot='card-description']")
    expect(el).toHaveClass("extra-class")
  })
})

describe("CardAction", () => {
  it("renders with data-slot='card-action'", () => {
    const { container } = render(<CardAction>Action</CardAction>)
    const el = container.querySelector("[data-slot='card-action']")
    expect(el).toBeInTheDocument()
  })

  it("renders children", () => {
    render(<CardAction>My Action</CardAction>)
    expect(screen.getByText("My Action")).toBeInTheDocument()
  })
})

describe("CardContent", () => {
  it("renders with data-slot='card-content'", () => {
    const { container } = render(<CardContent>Body</CardContent>)
    const el = container.querySelector("[data-slot='card-content']")
    expect(el).toBeInTheDocument()
  })

  it("renders children", () => {
    render(<CardContent>My Content</CardContent>)
    expect(screen.getByText("My Content")).toBeInTheDocument()
  })
})

describe("CardFooter", () => {
  it("renders with data-slot='card-footer'", () => {
    const { container } = render(<CardFooter>Footer</CardFooter>)
    const el = container.querySelector("[data-slot='card-footer']")
    expect(el).toBeInTheDocument()
  })

  it("renders children", () => {
    render(<CardFooter>My Footer</CardFooter>)
    expect(screen.getByText("My Footer")).toBeInTheDocument()
  })

  it("passes custom className", () => {
    const { container } = render(
      <CardFooter className="footer-class">Footer</CardFooter>
    )
    const el = container.querySelector("[data-slot='card-footer']")
    expect(el).toHaveClass("footer-class")
  })
})

describe("Card composed", () => {
  it("renders all subcomponents together", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
          <CardAction>Act</CardAction>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Foot</CardFooter>
      </Card>
    )

    expect(container.querySelector("[data-slot='card']")).toBeInTheDocument()
    expect(container.querySelector("[data-slot='card-header']")).toBeInTheDocument()
    expect(container.querySelector("[data-slot='card-title']")).toBeInTheDocument()
    expect(container.querySelector("[data-slot='card-description']")).toBeInTheDocument()
    expect(container.querySelector("[data-slot='card-action']")).toBeInTheDocument()
    expect(container.querySelector("[data-slot='card-content']")).toBeInTheDocument()
    expect(container.querySelector("[data-slot='card-footer']")).toBeInTheDocument()
  })
})
