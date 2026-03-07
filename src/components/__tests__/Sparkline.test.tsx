import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Sparkline } from "../Sparkline"

describe("Sparkline", () => {
  it("returns null for empty data", () => {
    const { container } = render(<Sparkline data={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders SVG with role=img", () => {
    render(
      <Sparkline
        data={[
          { label: "2022", value: 50 },
          { label: "2023", value: 60 },
        ]}
      />
    )
    expect(screen.getByRole("img")).toBeInTheDocument()
  })

  it("renders circles for each data point", () => {
    const { container } = render(
      <Sparkline
        data={[
          { label: "2022", value: 50 },
          { label: "2023", value: 60 },
          { label: "2024", value: 55 },
        ]}
      />
    )
    const circles = container.querySelectorAll("circle")
    expect(circles.length).toBe(3)
  })

  it("renders year labels", () => {
    render(
      <Sparkline
        data={[
          { label: "2022", value: 50 },
          { label: "2023", value: 60 },
        ]}
      />
    )
    expect(screen.getByText("2022")).toBeInTheDocument()
    expect(screen.getByText("2023")).toBeInTheDocument()
  })

  it("renders value labels with p suffix", () => {
    render(
      <Sparkline
        data={[
          { label: "2022", value: 50 },
          { label: "2023", value: 60 },
        ]}
      />
    )
    expect(screen.getByText("50p")).toBeInTheDocument()
    expect(screen.getByText("60p")).toBeInTheDocument()
  })

  it("handles single data point", () => {
    const { container } = render(
      <Sparkline data={[{ label: "2022", value: 50 }]} />
    )
    // With one point, data.length - 1 = 0, causes division by zero in x calc
    // But it should still render
    expect(container.querySelector("svg")).toBeInTheDocument()
    expect(container.querySelectorAll("circle").length).toBe(1)
  })

  it("handles all same values (range = 0)", () => {
    const { container } = render(
      <Sparkline
        data={[
          { label: "2022", value: 50 },
          { label: "2023", value: 50 },
        ]}
      />
    )
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("accepts custom width, height, and color", () => {
    const { container } = render(
      <Sparkline
        data={[
          { label: "2022", value: 50 },
          { label: "2023", value: 60 },
        ]}
        width={400}
        height={150}
        color="#ff0000"
      />
    )
    const svg = container.querySelector("svg")!
    expect(svg.getAttribute("width")).toBe("400")
    expect(svg.getAttribute("height")).toBe("150")
  })
})
