# Implementation Plan

<!-- This file is generated and updated by RALPH. -->
<!-- Run ./loop.sh plan to create/refresh this from your specs. -->
<!-- Run ./loop.sh build to implement tasks one at a time. -->

## Gap Analysis

**Status: Greenfield project.** No source code exists. Everything in `specs/SPECS.md` must be built from scratch.

---

## Phase 1: Project Scaffolding & Tooling

- [x] **1.1** Initialize a Vite + React + TypeScript project (`npm create vite@latest . -- --template react-ts`)
  - WHY: The entire app depends on a working build pipeline; nothing else can be developed without it.

- [x] **1.2** Install and configure Tailwind CSS (`@tailwindcss/vite` plugin, `@import "tailwindcss"` in `src/index.css`)
  - WHY: Every component uses Tailwind for styling; must be in place before any UI work.
  - NOTE: Using Tailwind CSS v4 with native Vite plugin (no PostCSS config or tailwind.config.js needed).

- [x] **1.3** Initialize shadcn/ui (`npx shadcn@latest init`) and create `components.json` config
  - WHY: shadcn/ui provides the accessible primitives (Tabs, Input, Card, Tooltip, Collapsible, Dialog, Select) used throughout.
  - NOTE: Used shadcn v4 (base-nova style). Also added `@/` path alias to tsconfig.json, tsconfig.app.json, and vite.config.ts.

- [x] **1.4** Install required shadcn/ui components: `tabs`, `input`, `card`, `tooltip`, `collapsible`, `dialog`, `select`, `button`, `label`
  - WHY: Pre-installing all needed primitives avoids ad-hoc installs later.
  - NOTE: All 9 components installed. TooltipProvider needed at app root.

- [x] **1.5** Create `src/lib/utils.ts` with the shadcn/ui `cn()` class-merge helper
  - WHY: Used by every shadcn/ui component for conditional Tailwind class composition.
  - NOTE: Created automatically by shadcn init (clsx + tailwind-merge).

- [x] **1.6** Set up custom Tailwind theme colors: primary green `#2E7D32`, accent blue `#1565C0`, traffic lights (`#2E7D32`/`#F9A825`/`#C62828`), background `#FAFAFA`, card `#FFFFFF`
  - WHY: Spec mandates specific farm-themed colors consistent across all components.
  - NOTE: Updated shadcn CSS variables in index.css. Added `--farm-green`, `--farm-amber`, `--farm-red` custom properties mapped to Tailwind via `@theme inline` as `farm-green`, `farm-amber`, `farm-red`. Primary/accent/destructive/ring also updated. Pre-existing lint warnings in shadcn button.tsx and tabs.tsx (react-refresh/only-export-components) are unrelated.

- [x] **1.7** Configure global typography: 18px base, sans-serif stack, 800px max-width centered container
  - WHY: Spec requires large readable text and constrained layout for tablet/laptop use.
  - NOTE: Set font-size: 18px on html element in index.css. Sans-serif stack already configured via Geist Variable font. Added max-w-[800px] centered container with horizontal padding in App.tsx. Used bg-background token instead of hardcoded bg-gray-50.

- [ ] **1.8** Add a tractor favicon to `public/favicon.ico` and set page title to "Farm Machinery Planner"
  - WHY: Professional identity matching the farm context.

---

## Phase 2: Shared Utilities (Pure Logic, No UI)

- [x] **2.1** Create `src/lib/types.ts` with TypeScript interfaces: `CostPerHectareInputs`, `CostPerHourInputs`, `WorkrateInputs`, `ReplacementMachine`, `ReplacementPlannerState`, `AppState`
  - WHY: Shared types enforce consistency between calculations, UI, and storage.
  - NOTE: Also added result interfaces (CostPerHectareResults, CostPerHourResults, WorkrateResults, ReplacementSummary) and SavedMachine<T> generic for save/load.

- [x] **2.2** Create `src/lib/defaults.ts` exporting default values for every tab (from spec defaults) and default Replacement Planner rows (Tractor 1-4, Combine, SP Sprayer, Seed drill, Cultivator x2, Other)
  - WHY: Every field must be pre-filled with sensible UK farming defaults so the farmer only changes what they know.
  - NOTE: Exports defaultCostPerHectare, defaultCostPerHour, defaultMachineA/B, defaultReplacementPlanner, and createDefaultReplacementMachines() factory for unique IDs.

- [x] **2.3** Create `src/lib/calculations.ts` with `calcCostPerHectare(inputs)` returning all intermediate and final values (average value, interest, depreciation, insurance, storage, fixed/ha, labour/ha, fuel/ha, repairs/ha, total/ha, annual saving)
  - WHY: Tab 1 depends on these AHDB formulas. Pure functions are testable and reusable.
  - NOTE: Verified against AHDB defaults: £30.27/ha total, -£54,880 annual saving. Handles zero division for hectaresPerYear, workRate, and yearsOwned.

- [x] **2.4** Add `calcCostPerHour(inputs)` to `calculations.ts` returning fixed/hr, fuel/hr, repairs/hr, total/hr, annual saving
  - WHY: Tab 2 uses the same structure but with hour-based formulas.
  - NOTE: Verified against AHDB defaults: £65.56/hr total, £14,393.41 annual saving. Added missing labourPerHr field to CostPerHourResults interface. Handles zero division for hoursPerYear and yearsOwned.

- [x] **2.5** Add `calcWorkrate(machineInputs)` to `calculations.ts` returning area/load, spot rate, application time, total time/load, overall work rate, overall efficiency, time-breakdown percentages
  - WHY: Tab 3 needs these for each machine plus derived comparison values.
  - NOTE: Verified Machine A: spot rate 2.40, overall 1.40 ha/hr (matches spec). Machine B: spot rate 36.00, overall 12.71 ha/hr (spec says 9.64 — inconsistency: the formulas + defaults produce 12.71; 9.64 requires capacity=1250 not 2000). Handles zero division for applicationRate, spotRate*efficiency, totalTimePerLoad, and spotRate.

- [ ] **2.6** Add `calcReplacementSummary(machines[], farmIncome, startYear, yearSpan)` to `calculations.ts` returning per-year cost arrays, total spend, average annual cost, % of income
  - WHY: Tab 4 Gantt chart and budget summary consume this derived data.

- [ ] **2.7** Create `src/lib/repair-data.ts` with AHDB repair cost lookup table and `lookupRepairPct(machineType, annualHours)` interpolation function (tractors use 500/750/1000/1500 brackets; others use 50/100/150/200)
  - WHY: Repair Cost Estimator pop-up depends on this data and interpolation logic.

- [x] **2.8** Create `src/lib/format.ts` with `formatGBP()` (£ + commas), `formatPct()` (1 decimal), `formatNumber()`
  - WHY: Spec requires consistent GBP and percentage formatting across every tab.
  - NOTE: formatGBP rounds to integer for values >= £1,000, shows 2 decimals below. All functions handle non-finite values gracefully (show "—"). formatNumber supports optional decimal places via toLocaleString("en-GB").

- [ ] **2.9** Create `src/lib/storage.ts` with `loadState()`, `saveState(data)`, `exportToFile()`, `importFromFile(file)` using localStorage key `farmPlanner` with version field
  - WHY: All four tabs auto-save to localStorage and share export/import.

- [ ] **2.10** Add debounced auto-save hook `useAutoSave(data, delayMs=1000)` in storage module
  - WHY: Spec requires auto-save on every change, debounced to 1 second.

---

## Phase 3: Shared UI Components

- [ ] **3.1** Create `src/components/InputField.tsx` - labeled number input with unit suffix, optional `[?]` tooltip (shadcn Tooltip), onChange handler, min 44px tap target
  - WHY: Every tab has 8-13 identically styled inputs; shared component eliminates repetition.

- [ ] **3.2** Create `src/components/ResultBanner.tsx` - full-width colored banner with `type` (green/amber/red), `mainText`, `subText` (32px main, white/dark text per color)
  - WHY: Used by Tabs 1, 2, and 4 for the traffic-light verdict.

- [ ] **3.3** Create `src/components/CostBreakdown.tsx` - breakdown table showing labeled cost rows with formatted values
  - WHY: Both cost tabs display an itemized breakdown below the main result.

- [ ] **3.4** Create `src/components/CollapsibleSection.tsx` - wrapper using shadcn Collapsible with title, subtitle, `defaultOpen` prop
  - WHY: "Overheads" on Tabs 1 & 2 must be collapsed by default with a note.

- [ ] **3.5** Create `src/components/SaveLoadToolbar.tsx` - name input, Save, dropdown Select to load, Delete button
  - WHY: Both cost tabs need identical save/load for named machines.

---

## Phase 4: App Shell & Navigation

- [ ] **4.1** Create `src/main.tsx` entry point rendering `<App />` with React 18 `createRoot`
  - WHY: Standard React entry point required by Vite.

- [ ] **4.2** Create `index.html` with root div, title, and Vite script entry
  - WHY: HTML shell needed for Vite to serve the app.

- [ ] **4.3** Create `src/App.tsx` with shadcn Tabs for 4 tabs (Cost per Hectare, Cost per Hour, Compare Machines, Replacement Planner), active tab in primary green, 800px max-width centered
  - WHY: Top-level layout hosting all tab content; must exist before tabs render.

- [ ] **4.4** Add global header with "Farm Machinery Planner" title and Export/Import JSON buttons
  - WHY: Spec requires JSON export/import accessible from any tab.

---

## Phase 5: Tab 1 - Cost per Hectare

- [ ] **5.1** Create `src/components/CostPerHectare.tsx` with three input sections: "What Did You Pay?" (purchase price, sell after, sale price, hectares/year), "Running Costs" (work rate, labour, fuel price, fuel use, spares & repairs), "Overheads" (interest, insurance, storage - collapsed by default)
  - WHY: Primary tab and simplest calculator; validates shared components and calculation engine.

- [ ] **5.2** Wire inputs to React state (initialized from defaults) and call `calcCostPerHectare()` on every change for live results
  - WHY: Spec requires instant recalculation with no "Calculate" button.

- [ ] **5.3** Add "Contractor Comparison" section with contractor charge field
  - WHY: Own-vs-contractor comparison is the primary decision output.

- [ ] **5.4** Render Results: total cost/ha, fixed/running breakdown via `CostBreakdown`, contractor cost, `ResultBanner` with traffic-light (green if owning cheaper, red if contractor cheaper, amber if within 10%)
  - WHY: This is the answer the farmer came for.

- [ ] **5.5** Add "Help me estimate repairs" link next to Spares & Repairs field that opens RepairEstimator dialog
  - WHY: Spec places this helper inline for farmers who don't know their repair percentage.

- [ ] **5.6** Integrate `SaveLoadToolbar` for naming/saving/loading/deleting machines on this tab
  - WHY: Farmers need to cost multiple machines and switch between them.

- [ ] **5.7** Connect Tab 1 to auto-save hook for localStorage persistence
  - WHY: Data must survive closing the tab.

- [ ] **5.8** Handle division-by-zero: if hectares/year or work rate is 0, show friendly message instead of Infinity/NaN
  - WHY: Spec explicitly calls out this edge case.

---

## Phase 6: Tab 2 - Cost per Hour

- [ ] **6.1** Create `src/components/CostPerHour.tsx` with inputs per spec: purchase price (92,751), sell after (7), sale price (40,000), hours/year (700), ha/hr (4), fuel/hr (14 L/hr), fuel price (0.60), repairs (1%), labour (14/hr), collapsed Overheads
  - WHY: Same pattern as Tab 1 but hour-based; validates reusable components.

- [ ] **6.2** Wire inputs to state, call `calcCostPerHour()` for live results, render total/hr, breakdown, contractor comparison (45/hr), traffic-light `ResultBanner`
  - WHY: Live-update pattern using per-hour formulas.

- [ ] **6.3** Add "Help me estimate repairs" link opening RepairEstimator
  - WHY: Spec states repair estimator is available on both cost tabs.

- [ ] **6.4** Integrate `SaveLoadToolbar` for named machine save/load
  - WHY: Same save/load requirement as Tab 1 with its own machine list.

- [ ] **6.5** Connect to auto-save and handle zero-division edge cases (hours/year = 0)
  - WHY: Same persistence and safety requirements as Tab 1.

---

## Phase 7: Repair Cost Estimator (Shared Pop-up)

- [ ] **7.1** Create `src/components/RepairEstimator.tsx` as shadcn Dialog with machine type dropdown (9 AHDB categories) and annual hours input
  - WHY: Embedded helper tool referenced by Tabs 1 and 2.

- [ ] **7.2** Implement lookup/interpolation using `lookupRepairPct()`, display: "For a [type] used [X] hours/year, budget about **Y%** of purchase price for repairs"
  - WHY: Must interpolate between AHDB table values, handling different hour brackets.

- [ ] **7.3** Add "Use this value" button calling `onApply(pct)` callback to auto-fill parent tab's repairs field, then close dialog
  - WHY: One-click flow from estimator back to cost tab input.

---

## Phase 8: Tab 3 - Compare Two Machines

- [ ] **8.1** Create `src/components/CompareMachines.tsx` with side-by-side layout for Machine A & B, inputs: name, width, capacity, speed, application rate, transport time, filling time, field efficiency (spec defaults)
  - WHY: Different question (workrate comparison) with two-column layout.

- [ ] **8.2** Wire both machines to state, call `calcWorkrate()` for each, display spot rate and TRUE overall work rate
  - WHY: Live comparison is the core value.

- [ ] **8.3** Create `src/components/WorkrateBar.tsx` - horizontal stacked bar showing time breakdown (working/filling/transport) in distinct colors with labels
  - WHY: Spec requires visual time-breakdown bars per machine.

- [ ] **8.4** Render visual comparison: two `WorkrateBar` components, "X times faster" number, highlight winner
  - WHY: Visual output is the primary deliverable of this tab.

- [ ] **8.5** Stack two-column layout vertically on screens narrower than 640px
  - WHY: Spec requires responsive stacking on narrow screens.

- [ ] **8.6** Connect Tab 3 to auto-save via localStorage
  - WHY: Same persistence requirement.

---

## Phase 9: Tab 4 - Replacement Planner

- [ ] **9.1** Create `src/components/ReplacementPlanner.tsx` with editable table pre-populated with AHDB default rows (Tractor 1-4, Combine, SP Sprayer, Seed drill, Cultivator x2, Other), each with: name, use/year, time to change, current hours, price to change, current value
  - WHY: Most complex tab; building last means all shared infrastructure is proven.

- [ ] **9.2** Add "Add Machine" and per-row "Remove" buttons for dynamic row management
  - WHY: Spec states user can add/remove rows freely.

- [ ] **9.3** Compute derived columns: "Cost to budget" (price to change - current value) per row, "Annual investment" summing costs in their due year
  - WHY: Derived values feed the timeline and budget summary.

- [ ] **9.4** Create `src/components/TimelineChart.tsx` - Gantt-style timeline with machine rows, colored blocks at replacement year, plus annual spend bar chart
  - WHY: Visual timeline is the signature feature, showing lumpy spending years at a glance.

- [ ] **9.5** Set timeline year range dynamically: current year to latest "time to change" (minimum 6 years)
  - WHY: Timeline must adapt to the farmer's data.

- [ ] **9.6** Render Budget Summary: total spend, average annual cost, farm income input (default 350,000), cost as % of income, traffic-light banner (green <20%, amber 20-35%, red >35%)
  - WHY: Percentage-of-income is the key decision indicator for whole-farm strategy.

- [ ] **9.7** Connect Tab 4 to auto-save via localStorage
  - WHY: Most data entry of any tab; losing it would be devastating.

---

## Phase 10: Data Persistence Integration

- [ ] **10.1** On app load in `App.tsx`, call `loadState()` and hydrate all four tabs from localStorage, falling back to defaults
  - WHY: Values must survive browser refresh without explicit user action.

- [ ] **10.2** Wire global "Export to file" button to `exportToFile()` triggering `.json` download of full state
  - WHY: Backup mechanism and cross-device transfer.

- [ ] **10.3** Wire global "Import from file" button to `importFromFile()` reading `.json`, validating, overwriting localStorage, reloading state
  - WHY: Completes the backup/restore cycle; validation prevents corrupt data.

- [ ] **10.4** Add version field handling in `loadState()` for future schema migration
  - WHY: Without versioning, future schema changes would corrupt saved data.

---

## Phase 11: Polish & Responsive Design

- [ ] **11.1** Audit all inputs for consistent styling: label left, value center, unit right, `[?]` tooltip, 44px min tap target
  - WHY: Spec requires large touch targets for tablet use.

- [ ] **11.2** Ensure Overheads sections on Tabs 1 & 2 collapse by default with note "Most farmers leave these as they are"
  - WHY: Spec explicitly requires this to reduce cognitive load.

- [ ] **11.3** Test and fix responsive layout at 320px, 768px, and 1280px across all tabs
  - WHY: Spec lists these breakpoints as verification targets.

- [ ] **11.4** Add card shadows and section separators: white cards on `#FAFAFA`, grey background for Results sections
  - WHY: Visual separation between inputs and outputs.

- [ ] **11.5** Ensure all currency values show £ + commas, all percentages show 1 decimal place
  - WHY: Consistent formatting is critical for financial readability.

---

## Phase 12: Verification & Edge Cases

- [ ] **12.1** Verify Tab 1: AHDB defaults produce total = £30.27/ha, saving = -£54,880
  - WHY: Exact acceptance criteria from spec.

- [ ] **12.2** Verify Tab 2: AHDB defaults produce total = £65.56/hr, saving = £14,393.41
  - WHY: Exact acceptance criteria from spec.

- [ ] **12.3** Verify Tab 3: AHDB defaults produce Machine A = 1.40 ha/hr, Machine B = 9.64 ha/hr
  - WHY: Exact acceptance criteria from spec.
  - BUG: Spec inconsistency — formulas + defaults (capacity=2000) produce Machine B = 12.71 ha/hr, not 9.64. The value 9.64 requires capacity=1250. Machine A = 1.40 is correct.

- [ ] **12.4** Verify Repair Estimator: £69,000 tractor at 400 hrs yields 5% = £3,450
  - WHY: Validates interpolation logic against spec.

- [ ] **12.5** Test persistence: enter values, refresh browser, confirm restored
  - WHY: Core persistence requirement.

- [ ] **12.6** Test export/import cycle: export, clear localStorage, import, confirm restored
  - WHY: End-to-end backup/restore validation.

- [ ] **12.7** Test zero-value edge cases: hectares=0, hours=0, work rate=0, application rate=0 show friendly messages (no Infinity/NaN)
  - WHY: Spec explicitly requires graceful zero handling.

- [ ] **12.8** Test offline: `npm run build`, serve `dist/` folder, confirm full functionality
  - WHY: Spec requires no internet after initial setup.
