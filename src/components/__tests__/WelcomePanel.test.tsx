import { render, screen, fireEvent } from "@testing-library/react"
import { WelcomePanel } from "../WelcomePanel"

const DISMISSED_KEY = "farmPlannerWelcomeDismissed"

beforeEach(() => {
  localStorage.clear()
})

describe("WelcomePanel", () => {
  it("renders the welcome heading when not dismissed", () => {
    render(<WelcomePanel />)
    expect(
      screen.getByRole("heading", { name: /welcome to farm machinery planner/i }),
    ).toBeInTheDocument()
  })

  it('renders the dismiss button "Got it, let\'s start"', () => {
    render(<WelcomePanel />)
    expect(
      screen.getByRole("button", { name: /got it, let's start/i }),
    ).toBeInTheDocument()
  })

  it("clicking the dismiss button hides the panel", () => {
    render(<WelcomePanel />)
    fireEvent.click(screen.getByRole("button", { name: /got it, let's start/i }))
    expect(
      screen.queryByRole("heading", { name: /welcome to farm machinery planner/i }),
    ).not.toBeInTheDocument()
  })

  it("sets localStorage when dismissed", () => {
    render(<WelcomePanel />)
    fireEvent.click(screen.getByRole("button", { name: /got it, let's start/i }))
    expect(localStorage.getItem(DISMISSED_KEY)).toBe("1")
  })

  it("does not render when localStorage already has the dismissed flag", () => {
    localStorage.setItem(DISMISSED_KEY, "1")
    render(<WelcomePanel />)
    expect(
      screen.queryByRole("heading", { name: /welcome to farm machinery planner/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /got it, let's start/i }),
    ).not.toBeInTheDocument()
  })

  it("renders key content mentioning Cost / Hectare, Cost / Hour, and Worth It?", () => {
    render(<WelcomePanel />)
    expect(screen.getAllByText(/cost \/ hectare/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/cost \/ hour/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/worth it\?/i).length).toBeGreaterThanOrEqual(1)
  })

  it("mentions Value Loss, Replacements, and Contracting tabs", () => {
    render(<WelcomePanel />)
    expect(screen.getByText(/value loss/i)).toBeInTheDocument()
    expect(screen.getByText(/replacements/i)).toBeInTheDocument()
    expect(screen.getAllByText(/contracting/i).length).toBeGreaterThanOrEqual(1)
  })
})
