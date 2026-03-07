import { render, screen, fireEvent } from "@testing-library/react"
import { FuelPricePanel } from "@/components/FuelPricePanel"
import { FuelConsumptionPanel } from "@/components/FuelConsumptionPanel"
import { ContractorRatesPanel } from "@/components/ContractorRatesPanel"
import { CollapsibleSection } from "@/components/CollapsibleSection"

describe("Accessibility", () => {
  describe("Sparkline", () => {
    it("has role=img and aria-label", () => {
      render(<FuelPricePanel onApply={vi.fn()} />)
      fireEvent.click(screen.getByText(/AHDB Fuel Prices/))
      const svg = screen.getByRole("img")
      expect(svg).toHaveAttribute(
        "aria-label",
        expect.stringContaining("trend")
      )
    })
  })

  describe("FuelPricePanel Use button", () => {
    it("has descriptive aria-label", () => {
      render(<FuelPricePanel onApply={vi.fn()} />)
      fireEvent.click(screen.getByText(/AHDB Fuel Prices/))
      const btn = screen.getByRole("button", { name: /use red diesel/i })
      expect(btn.getAttribute("aria-label")).toBeTruthy()
    })
  })

  describe("FuelConsumptionPanel", () => {
    it("HP slider has aria-label", () => {
      render(
        <FuelConsumptionPanel onApply={vi.fn()} mode="perHour" />
      )
      fireEvent.click(screen.getByText(/Estimate Fuel Consumption/i))
      const slider = screen.getByRole("slider", { name: /tractor horsepower/i })
      expect(slider).toBeInTheDocument()
    })

    it("Use button has descriptive aria-label", () => {
      render(
        <FuelConsumptionPanel onApply={vi.fn()} mode="perHour" />
      )
      fireEvent.click(screen.getByText(/Estimate Fuel Consumption/i))
      const btn = screen.getByRole("button", { name: /use fuel consumption/i })
      expect(btn.getAttribute("aria-label")).toBeTruthy()
    })
  })

  describe("ContractorRatesPanel Use buttons", () => {
    it("all Use buttons have descriptive aria-labels", () => {
      render(<ContractorRatesPanel onApply={vi.fn()} />)
      fireEvent.click(screen.getByText(/NAAC Contractor Rates/))
      const buttons = screen.getAllByRole("button", { name: /^Use /i })
      buttons.forEach((btn) => {
        expect(btn.getAttribute("aria-label")).toBeTruthy()
      })
    })

    it("aria-label includes rate value", () => {
      render(<ContractorRatesPanel onApply={vi.fn()} />)
      fireEvent.click(screen.getByText(/NAAC Contractor Rates/))
      const buttons = screen.getAllByRole("button", { name: /^Use .+ rate £/i })
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe("CollapsibleSection aria-expanded", () => {
    it("trigger has aria-expanded=false when collapsed", () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>
      )
      const trigger = screen.getByRole("button", { name: /test section/i })
      expect(trigger).toHaveAttribute("aria-expanded", "false")
    })

    it("trigger has aria-expanded=true when expanded", () => {
      render(
        <CollapsibleSection title="Test Section" defaultOpen>
          <p>Content</p>
        </CollapsibleSection>
      )
      const trigger = screen.getByRole("button", { name: /test section/i })
      expect(trigger).toHaveAttribute("aria-expanded", "true")
    })

    it("aria-expanded toggles on click", () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>
      )
      const trigger = screen.getByRole("button", { name: /test section/i })
      expect(trigger).toHaveAttribute("aria-expanded", "false")
      fireEvent.click(trigger)
      expect(trigger).toHaveAttribute("aria-expanded", "true")
    })
  })
})
