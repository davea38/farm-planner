import { render, screen, fireEvent } from "@testing-library/react"
import { DepreciationPanel } from "@/components/DepreciationPanel"

function renderPanel(props: Parameters<typeof DepreciationPanel>[0] = {}) {
  return render(<DepreciationPanel {...props} />)
}

describe("DepreciationPanel — standalone mode", () => {
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

  it("shows purchase price input when no prop provided", () => {
    renderPanel()
    expect(screen.getByText(/purchase price/i)).toBeInTheDocument()
  })

  it("does not show Use as sale price button without onApplySalePrice", () => {
    renderPanel()
    expect(screen.queryByRole("button", { name: /use.*sale price/i })).not.toBeInTheDocument()
  })
})

describe("DepreciationPanel — prop-driven mode", () => {
  it("shows purchase price input pre-filled when purchasePrice prop provided", () => {
    renderPanel({ purchasePrice: 126000 })
    expect(screen.getByText(/purchase price/i)).toBeInTheDocument()
    const input = screen.getByDisplayValue("126000")
    expect(input).toBeInTheDocument()
  })

  it("uses provided purchasePrice for calculations", () => {
    renderPanel({ purchasePrice: 126000, yearsOwned: 8 })
    // Should show estimated value based on 126000 and 8 years
    const matches = screen.getAllByText(/£/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it("uses provided yearsOwned for slider position", () => {
    renderPanel({ purchasePrice: 100000, yearsOwned: 8 })
    const slider = screen.getByRole("slider")
    expect(slider).toHaveValue("8")
  })

  it("calls onYearsChange when slider changes in controlled mode", () => {
    const onYearsChange = vi.fn()
    renderPanel({ purchasePrice: 100000, yearsOwned: 2, onYearsChange })
    const slider = screen.getByRole("slider")
    fireEvent.change(slider, { target: { value: "6" } })
    expect(onYearsChange).toHaveBeenCalledWith(6)
  })

  it("shows Use as sale price button when onApplySalePrice provided", () => {
    renderPanel({ purchasePrice: 126000, yearsOwned: 8, onApplySalePrice: vi.fn() })
    expect(screen.getByRole("button", { name: /use.*sale price/i })).toBeInTheDocument()
  })

  it("calls onApplySalePrice with estimated value when button clicked", () => {
    const onApply = vi.fn()
    renderPanel({ purchasePrice: 126000, yearsOwned: 8, onApplySalePrice: onApply })
    fireEvent.click(screen.getByRole("button", { name: /use.*sale price/i }))
    expect(onApply).toHaveBeenCalledWith(expect.any(Number))
    // tractors_large at year 8 = 36% remaining -> 126000 * 0.36 = 45360
    expect(onApply).toHaveBeenCalledWith(45360)
  })
})

describe("DepreciationPanel — category control", () => {
  it("calls onCategoryChange when category prop is controlled", () => {
    const onCategoryChange = vi.fn()
    renderPanel({ category: "tractors_large", onCategoryChange })
    const select = screen.getByRole("combobox")
    fireEvent.change(select, { target: { value: "combines" } })
    expect(onCategoryChange).toHaveBeenCalledWith("combines")
  })

  it("updates internal category when not controlled", () => {
    renderPanel()
    const select = screen.getByRole("combobox")
    fireEvent.change(select, { target: { value: "combines" } })
    // Verify the select now shows "combines"
    expect(select).toHaveValue("combines")
  })

  it("updates internal purchase price when no prop provided", () => {
    renderPanel()
    const priceInput = screen.getByRole("spinbutton") // purchase price input
    fireEvent.change(priceInput, { target: { value: "200000" } })
    // Verify the value updates
    expect(priceInput).toHaveValue(200000)
  })

  it("shows singular 'year' for 1 year", () => {
    renderPanel({ purchasePrice: 100000, yearsOwned: 1 })
    expect(screen.getByText(/after 1 year$/i)).toBeInTheDocument()
  })

  it("shows plural 'years' for multiple years", () => {
    renderPanel({ purchasePrice: 100000, yearsOwned: 5 })
    expect(screen.getByText(/after 5 years/i)).toBeInTheDocument()
  })
})
