/** Tab identifiers used for hash-based routing */
export type TabId =
  | "machines"
  | "cost-per-hectare"
  | "cost-per-hour"
  | "cost-calculator"
  | "depreciation"
  | "compare-machines"
  | "replacement-planner"
  | "contracting-income"
  | "profitability"

/** Human-readable labels for each tab */
export const TAB_LABELS: Record<TabId, string> = {
  machines: "Machines",
  "cost-per-hectare": "Cost per hectare",
  "cost-per-hour": "Cost per hour",
  "cost-calculator": "Cost Calculator",
  depreciation: "Depreciation",
  "compare-machines": "Compare Machines",
  "replacement-planner": "Replacement Planner",
  "contracting-income": "Contracting",
  profitability: "Worth It?",
}

/** Navigate to a tab by updating the URL hash */
export function navigateToTab(tabId: TabId): void {
  const hash = tabId === "machines" ? "" : `#${tabId}`
  window.history.pushState(null, "", hash || window.location.pathname)
  window.dispatchEvent(new HashChangeEvent("hashchange"))
}
