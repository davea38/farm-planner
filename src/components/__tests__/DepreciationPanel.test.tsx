import { render, screen, fireEvent } from "@testing-library/react"
import { DepreciationPanel } from "@/components/DepreciationPanel"

function renderPanel() {
  return render(<DepreciationPanel />)
}

describe("DepreciationPanel", () => {
  it("renders machine category dropdown", () => {
    renderPanel()
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })

  it("renders SVG chart", () => {
    const { container } = renderPanel()
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("shows estimated value", () => {
    renderPanel()
    const matches = screen.getAllByText(/£/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it("shows percentage lost", () => {
    renderPanel()
    const matches = screen.getAllByText(/%/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it("shows sweet spot callout", () => {
    renderPanel()
    expect(screen.getByText(/sweet spot/i)).toBeInTheDocument()
  })

  it("shows source attribution", () => {
    renderPanel()
    expect(screen.getByText(/ASAE/i)).toBeInTheDocument()
  })

  it("has year slider", () => {
    renderPanel()
    expect(screen.getByRole("slider")).toBeInTheDocument()
  })

  it("updates when slider changes", () => {
    renderPanel()
    const slider = screen.getByRole("slider")
    fireEvent.change(slider, { target: { value: "6" } })
    expect(slider).toHaveValue("6")
  })
})
