import { render, screen, fireEvent } from "@testing-library/react"
import { DepreciationPanel } from "@/components/DepreciationPanel"

function renderExpanded(
  props: Partial<React.ComponentProps<typeof DepreciationPanel>> = {}
) {
  const result = render(
    <DepreciationPanel
      onApplySalePrice={props.onApplySalePrice ?? vi.fn()}
      purchasePrice={props.purchasePrice}
      yearsOwned={props.yearsOwned}
      onYearsChange={props.onYearsChange}
    />
  )
  fireEvent.click(screen.getByText(/Depreciation Curve/i))
  return result
}

describe("DepreciationPanel", () => {
  it("renders panel title", () => {
    render(<DepreciationPanel onApplySalePrice={vi.fn()} />)
    expect(screen.getByText(/Depreciation Curve/i)).toBeInTheDocument()
  })

  it("renders machine category dropdown", () => {
    renderExpanded()
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })

  it("renders SVG chart", () => {
    const { container } = renderExpanded({ purchasePrice: 126000 })
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("shows estimated value for given years", () => {
    renderExpanded({ purchasePrice: 126000, yearsOwned: 8 })
    const matches = screen.getAllByText(/£/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it("shows percentage lost", () => {
    renderExpanded({ purchasePrice: 100000, yearsOwned: 5 })
    const matches = screen.getAllByText(/%/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it("shows sweet spot callout", () => {
    renderExpanded({ purchasePrice: 126000 })
    expect(screen.getByText(/sweet spot/i)).toBeInTheDocument()
  })

  it("calls onApplySalePrice when button clicked", () => {
    const onApply = vi.fn()
    renderExpanded({
      onApplySalePrice: onApply,
      purchasePrice: 126000,
      yearsOwned: 8,
    })
    fireEvent.click(screen.getByRole("button", { name: /use.*sale price/i }))
    expect(onApply).toHaveBeenCalledWith(expect.any(Number))
  })

  it("shows source attribution", () => {
    renderExpanded()
    expect(screen.getByText(/ASAE/i)).toBeInTheDocument()
  })

  it("has year slider", () => {
    renderExpanded({ purchasePrice: 126000 })
    expect(screen.getByRole("slider")).toBeInTheDocument()
  })

  it("updates estimated value when slider changes", () => {
    const onYearsChange = vi.fn()
    renderExpanded({
      purchasePrice: 100000,
      yearsOwned: 2,
      onYearsChange,
    })
    const slider = screen.getByRole("slider")
    fireEvent.change(slider, { target: { value: "6" } })
    expect(onYearsChange).toHaveBeenCalledWith(6)
  })
})
