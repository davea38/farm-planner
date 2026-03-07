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

- [x] **2.6** Add `calcReplacementSummary(machines[], farmIncome, startYear, yearSpan)` to `calculations.ts` returning per-year cost arrays, total spend, average annual cost, % of income
  - WHY: Tab 4 Gantt chart and budget summary consume this derived data.
  - NOTE: Computes net cost per machine (priceToChange - currentValue), places in replacement year, builds annualCosts array. Enforces minimum 6-year span or extends to latest timeToChange. Handles zero farmIncome and zero timeToChange gracefully.

- [x] **2.7** Create `src/lib/repair-data.ts` with AHDB repair cost lookup table and `lookupRepairPct(machineType, annualHours)` interpolation function (tractors use 500/750/1000/1500 brackets; others use 50/100/150/200)
  - WHY: Repair Cost Estimator pop-up depends on this data and interpolation logic.
  - NOTE: Exports MachineType union, machineTypes array (9 AHDB categories with labels), and lookupRepairPct(). Tractors use 500/750/1000/1500hr brackets (3%/3.5%/5%/7%), others use 50/100/150/200hr. Linear interpolation between brackets, extrapolation beyond last bracket using perExtra100 rate. Returns 0 for non-positive hours.
  - BUG: Spec verification says "£69,000 tractor at 400 hrs = 5%", but 400hrs is below the first tractor bracket (500hr = 3%). The lookup correctly returns 3% per the AHDB table data; the spec example may assume different brackets.

- [x] **2.8** Create `src/lib/format.ts` with `formatGBP()` (£ + commas), `formatPct()` (1 decimal), `formatNumber()`
  - WHY: Spec requires consistent GBP and percentage formatting across every tab.
  - NOTE: formatGBP rounds to integer for values >= £1,000, shows 2 decimals below. All functions handle non-finite values gracefully (show "—"). formatNumber supports optional decimal places via toLocaleString("en-GB").

- [x] **2.9** Create `src/lib/storage.ts` with `loadState()`, `saveState(data)`, `exportToFile()`, `importFromFile(file)` using localStorage key `farmPlanner` with version field
  - WHY: All four tabs auto-save to localStorage and share export/import.
  - NOTE: Uses STORAGE_KEY="farmPlanner", CURRENT_VERSION=1. loadState() returns defaults on missing/invalid data. saveState() stamps version+lastSaved. exportToFile() creates downloadable .json via Blob URL. importFromFile() validates, saves to localStorage, and returns parsed state. isValidState() performs structural validation.

- [x] **2.10** Add debounced auto-save hook `useAutoSave(data, delayMs=1000)` in storage module
  - WHY: Spec requires auto-save on every change, debounced to 1 second.
  - NOTE: Added useAutoSave React hook to storage.ts. Uses useRef for debounce timer and skips initial render to avoid redundant save on mount. Accepts AppState data and optional delay (default 1000ms).

---

## Phase 3: Shared UI Components

- [x] **3.1** Create `src/components/InputField.tsx` - labeled number input with unit suffix, optional `[?]` tooltip (shadcn Tooltip), onChange handler, min 44px tap target
  - WHY: Every tab has 8-13 identically styled inputs; shared component eliminates repetition.
  - NOTE: Uses shadcn v4 TooltipTrigger directly (no asChild prop in Base UI). Props: label, value, onChange, unit, tooltip, min, max, step. 44px min height enforced via min-h-[44px]. Input is right-aligned with tabular-nums for clean number display.

- [x] **3.2** Create `src/components/ResultBanner.tsx` - full-width colored banner with `type` (green/amber/red), `mainText`, `subText` (32px main, white/dark text per color)
  - WHY: Used by Tabs 1, 2, and 4 for the traffic-light verdict.
  - NOTE: Props: type ("green"|"amber"|"red"), mainText, subText (optional). Uses farm-green/farm-amber/farm-red Tailwind tokens. White text on green/red, foreground on amber. 32px bold main text, rounded-lg with padding.

- [x] **3.3** Create `src/components/CostBreakdown.tsx` - breakdown table showing labeled cost rows with formatted values
  - WHY: Both cost tabs display an itemized breakdown below the main result.
  - NOTE: Takes array of CostRow objects ({label, value, unit, bold?}). Bold rows for totals, indented muted rows for line items. Uses formatGBP for values and appends /unit suffix.

- [x] **3.4** Create `src/components/CollapsibleSection.tsx` - wrapper using shadcn Collapsible with title, subtitle, `defaultOpen` prop
  - WHY: "Overheads" on Tabs 1 & 2 must be collapsed by default with a note.
  - NOTE: Uses @base-ui/react Collapsible primitives. Props: title, subtitle, defaultOpen (false by default), children. Chevron icon rotates on open. 44px min tap target on trigger. Inline SVG chevron avoids extra icon dependency.

- [x] **3.5** Create `src/components/SaveLoadToolbar.tsx` - name input, Save, dropdown Select to load, Delete button
  - WHY: Both cost tabs need identical save/load for named machines.
  - NOTE: Generic component accepting SavedMachine<T>[] with onSave/onLoad/onDelete callbacks. Uses shadcn Input, Button, Select. Name input + Save button in first row; Select dropdown + Delete button in second row (shown only when saved machines exist). 44px min tap targets.

---

## Phase 4: App Shell & Navigation

- [x] **4.1** Create `src/main.tsx` entry point rendering `<App />` with React 18 `createRoot`
  - WHY: Standard React entry point required by Vite.
  - NOTE: Already created by Vite scaffolding in 1.1. Uses StrictMode + createRoot.

- [x] **4.2** Create `index.html` with root div, title, and Vite script entry
  - WHY: HTML shell needed for Vite to serve the app.
  - NOTE: Already created by Vite scaffolding in 1.1. Title set to "Farm Machinery Planner".

- [x] **4.3** Create `src/App.tsx` with shadcn Tabs for 4 tabs (Cost per Hectare, Cost per Hour, Compare Machines, Replacement Planner), active tab in primary green, 800px max-width centered
  - WHY: Top-level layout hosting all tab content; must exist before tabs render.
  - NOTE: Uses base-ui value-based tabs with string values. Active tab styled with primary green via data-active:bg-primary. TooltipProvider wraps entire app. 4-column grid TabsList with responsive text sizing. Tab content panels have placeholder text until tab components are built.

- [x] **4.4** Add global header with "Farm Machinery Planner" title and Export/Import JSON buttons
  - WHY: Spec requires JSON export/import accessible from any tab.
  - NOTE: Header uses flex layout with title left-aligned and Export/Import outline buttons right-aligned. Export triggers JSON download via exportToFile(). Import uses hidden file input with .json accept filter, calls importFromFile() and updates app state on success, shows alert on error. Also completes 10.2 and 10.3.

---

## Phase 5: Tab 1 - Cost per Hectare

- [x] **5.1** Create `src/components/CostPerHectare.tsx` with three input sections: "What Did You Pay?" (purchase price, sell after, sale price, hectares/year), "Running Costs" (work rate, labour, fuel price, fuel use, spares & repairs), "Overheads" (interest, insurance, storage - collapsed by default)
  - WHY: Primary tab and simplest calculator; validates shared components and calculation engine.
  - NOTE: All three sections implemented with InputField components inside white cards. Overheads collapsed by default with "Most farmers leave these as they are" subtitle. Wired into App.tsx replacing placeholder.

- [x] **5.2** Wire inputs to React state (initialized from defaults) and call `calcCostPerHectare()` on every change for live results
  - WHY: Spec requires instant recalculation with no "Calculate" button.
  - NOTE: useState initialized from defaultCostPerHectare, useMemo calls calcCostPerHectare on every input change. Generic update helper avoids repetitive handlers.

- [x] **5.3** Add "Contractor Comparison" section with contractor charge field
  - WHY: Own-vs-contractor comparison is the primary decision output.
  - NOTE: Separate card section with contractor charge input (default £76/ha).

- [x] **5.4** Render Results: total cost/ha, fixed/running breakdown via `CostBreakdown`, contractor cost, `ResultBanner` with traffic-light (green if owning cheaper, red if contractor cheaper, amber if within 10%)
  - WHY: This is the answer the farmer came for.
  - NOTE: Results in muted background section. CostBreakdown shows your cost (total, fixed, running) and contractor cost. Traffic-light banner: green when owning saves money, red when contractor cheaper, amber within 10% threshold of contractor total annual cost.

- [x] **5.5** Add "Help me estimate repairs" link next to Spares & Repairs field that opens RepairEstimator dialog
  - WHY: Spec places this helper inline for farmers who don't know their repair percentage.
  - NOTE: Added RepairEstimator component inline below the Spares & repairs InputField. "Help me estimate repairs" link opens the dialog, "Use this value" auto-fills the repairsPct field.

- [x] **5.6** Integrate `SaveLoadToolbar` for naming/saving/loading/deleting machines on this tab
  - WHY: Farmers need to cost multiple machines and switch between them.
  - NOTE: SaveLoadToolbar rendered at top of CostPerHectare tab. App.tsx passes savedMachines array and onSave/onDelete callbacks. Loading a machine updates local inputs state directly. Saved machines persist via auto-save through AppState.

- [x] **5.7** Connect Tab 1 to auto-save hook for localStorage persistence
  - WHY: Data must survive closing the tab.
  - NOTE: Handled centrally via App.tsx state management in 10.1.

- [x] **5.8** Handle division-by-zero: if hectares/year or work rate is 0, show friendly message instead of Infinity/NaN
  - WHY: Spec explicitly calls out this edge case.
  - NOTE: All three calculator tabs (CostPerHectare, CostPerHour, CompareMachines) now detect zero values in critical divisor fields (hectares/year, work rate, years owned, hours/year, application rate, width, speed, field efficiency) and show an amber-tinted warning message ("Enter a value for X to see results") instead of the results section. Calculation functions already returned 0 for zero divisors; this adds the UI-level friendly message the spec requires.

---

## Phase 6: Tab 2 - Cost per Hour

- [x] **6.1** Create `src/components/CostPerHour.tsx` with inputs per spec: purchase price (92,751), sell after (7), sale price (40,000), hours/year (700), ha/hr (4), fuel/hr (14 L/hr), fuel price (0.60), repairs (1%), labour (14/hr), collapsed Overheads
  - WHY: Same pattern as Tab 1 but hour-based; validates reusable components.
  - NOTE: Follows identical pattern to CostPerHectare. All input sections: "What Did You Pay", "Running Costs", collapsed "Overheads", "Contractor Comparison". Units changed to /hr throughout.

- [x] **6.2** Wire inputs to state, call `calcCostPerHour()` for live results, render total/hr, breakdown, contractor comparison (45/hr), traffic-light `ResultBanner`
  - WHY: Live-update pattern using per-hour formulas.
  - NOTE: useState + useMemo for live calculation. CostBreakdown shows total/hr, fixed/hr, running/hr. Traffic-light: green if owning cheaper, red if contractor cheaper, amber within 10% of contractor annual cost. Default £65.56/hr total, £14,393/year saving.

- [x] **6.3** Add "Help me estimate repairs" link opening RepairEstimator
  - WHY: Spec states repair estimator is available on both cost tabs.
  - NOTE: Same pattern as 5.5 — RepairEstimator component below Spares & repairs field with onApply callback.

- [x] **6.4** Integrate `SaveLoadToolbar` for named machine save/load
  - WHY: Same save/load requirement as Tab 1 with its own machine list.
  - NOTE: Mirrored CostPerHectare pattern. Added onSaveCostPerHourMachine/onDeleteCostPerHourMachine callbacks in App.tsx, passed savedMachines + callbacks as props. CostPerHour renders SaveLoadToolbar with handleLoad updating local inputs state.

- [x] **6.5** Connect to auto-save and handle zero-division edge cases (hours/year = 0)
  - WHY: Same persistence and safety requirements as Tab 1.
  - NOTE: Auto-save handled centrally via App.tsx in 10.1. Zero-division already handled in calcCostPerHour.

---

## Phase 7: Repair Cost Estimator (Shared Pop-up)

- [x] **7.1** Create `src/components/RepairEstimator.tsx` as shadcn Dialog with machine type dropdown (9 AHDB categories) and annual hours input
  - WHY: Embedded helper tool referenced by Tabs 1 and 2.
  - NOTE: Uses shadcn Dialog with Select dropdown for 9 machine types and number input for annual hours. Self-contained open/close state management.

- [x] **7.2** Implement lookup/interpolation using `lookupRepairPct()`, display: "For a [type] used [X] hours/year, budget about **Y%** of purchase price for repairs"
  - WHY: Must interpolate between AHDB table values, handling different hour brackets.
  - NOTE: Uses useMemo to call lookupRepairPct on machineType/annualHours changes. Result displayed in highlighted banner with formatPct formatting.

- [x] **7.3** Add "Use this value" button calling `onApply(pct)` callback to auto-fill parent tab's repairs field, then close dialog
  - WHY: One-click flow from estimator back to cost tab input.
  - NOTE: Button in DialogFooter calls onApply(repairPct) then setOpen(false). Parent tabs pass update("repairsPct") as onApply callback.

---

## Phase 8: Tab 3 - Compare Two Machines

- [x] **8.1** Create `src/components/CompareMachines.tsx` with side-by-side layout for Machine A & B, inputs: name, width, capacity, speed, application rate, transport time, filling time, field efficiency (spec defaults)
  - WHY: Different question (workrate comparison) with two-column layout.
  - NOTE: Implemented complete Tab 3 in a single component including 8.2-8.5 below. Side-by-side input cards on sm+ screens, stacking on narrow. Name is a text input, all others use InputField. MachineInputs extracted as a local component for reuse.

- [x] **8.2** Wire both machines to state, call `calcWorkrate()` for each, display spot rate and TRUE overall work rate
  - WHY: Live comparison is the core value.
  - NOTE: useState + useMemo for each machine. Results table shows spot rate and TRUE rate with winner highlighted in primary green.

- [x] **8.3** Create `src/components/WorkrateBar.tsx` - horizontal stacked bar showing time breakdown (working/filling/transport) in distinct colors with labels
  - WHY: Spec requires visual time-breakdown bars per machine.
  - NOTE: Implemented as WorkrateBar local component within CompareMachines.tsx. Uses primary green for working, AHDB blue (#1565C0) for filling, farm-amber for transport. Percentages shown in bar when segment is >= 15% wide.

- [x] **8.4** Render visual comparison: two `WorkrateBar` components, "X times faster" number, highlight winner
  - WHY: Visual output is the primary deliverable of this tab.
  - NOTE: Speed ratio calculated from overall work rates. Winner name shown with "Xх faster in practice" in a green-tinted banner.

- [x] **8.5** Stack two-column layout vertically on screens narrower than 640px
  - WHY: Spec requires responsive stacking on narrow screens.
  - NOTE: Uses grid-cols-1 sm:grid-cols-2 for responsive stacking.

- [x] **8.6** Connect Tab 3 to auto-save via localStorage
  - WHY: Same persistence requirement.
  - NOTE: Handled centrally via App.tsx state management in 10.1.

---

## Phase 9: Tab 4 - Replacement Planner

- [x] **9.1** Create `src/components/ReplacementPlanner.tsx` with editable table pre-populated with AHDB default rows (Tractor 1-4, Combine, SP Sprayer, Seed drill, Cultivator x2, Other), each with: name, use/year, time to change, current hours, price to change, current value
  - WHY: Most complex tab; building last means all shared infrastructure is proven.
  - NOTE: Each machine rendered as a card with inline text name input, 2-column grid of InputFields, and a derived "Cost to budget" display. Uses createDefaultReplacementMachines() for unique IDs.

- [x] **9.2** Add "Add Machine" and per-row "Remove" buttons for dynamic row management
  - WHY: Spec states user can add/remove rows freely.
  - NOTE: "Remove" button per card, dashed "+ Add Machine" button at bottom. New machines get crypto.randomUUID() ids.

- [x] **9.3** Compute derived columns: "Cost to budget" (price to change - current value) per row, "Annual investment" summing costs in their due year
  - WHY: Derived values feed the timeline and budget summary.
  - NOTE: Cost to budget shown inline per machine card. Annual costs computed via calcReplacementSummary().

- [x] **9.4** Create `src/components/TimelineChart.tsx` - Gantt-style timeline with machine rows, colored blocks at replacement year, plus annual spend bar chart
  - WHY: Visual timeline is the signature feature, showing lumpy spending years at a glance.
  - NOTE: Implemented as TimelineChart local component within ReplacementPlanner.tsx. CSS grid layout with year columns, green blocks at replacement years showing net cost, and proportional bar chart for annual spend below.

- [x] **9.5** Set timeline year range dynamically: current year to latest "time to change" (minimum 6 years)
  - WHY: Timeline must adapt to the farmer's data.
  - NOTE: Handled by calcReplacementSummary() which enforces Math.max(yearSpan, latestTimeToChange, 6). Timeline uses current year from Date.

- [x] **9.6** Render Budget Summary: total spend, average annual cost, farm income input (default 350,000), cost as % of income, traffic-light banner (green <20%, amber 20-35%, red >35%)
  - WHY: Percentage-of-income is the key decision indicator for whole-farm strategy.
  - NOTE: Budget summary section with total/average stats, farm income InputField, percentage display, and ResultBanner with traffic-light thresholds.

- [x] **9.7** Connect Tab 4 to auto-save via localStorage
  - WHY: Most data entry of any tab; losing it would be devastating.
  - NOTE: Handled centrally via App.tsx state management in 10.1.

---

## Phase 10: Data Persistence Integration

- [x] **10.1** On app load in `App.tsx`, call `loadState()` and hydrate all four tabs from localStorage, falling back to defaults
  - WHY: Values must survive browser refresh without explicit user action.
  - NOTE: App.tsx now calls loadState() as useState initializer, passes initial data to each tab via props, receives changes via onChange callbacks, and assembles full AppState for useAutoSave (1s debounce). Each tab component accepts optional initialInputs/onChange props, initializes useState from props (falling back to defaults), and notifies parent on changes via useEffect (skipping first render to avoid redundant save).

- [x] **10.2** Wire global "Export to file" button to `exportToFile()` triggering `.json` download of full state
  - WHY: Backup mechanism and cross-device transfer.
  - NOTE: Implemented as part of 4.4 — Export JSON button in global header calls exportToFile(appState).

- [x] **10.3** Wire global "Import from file" button to `importFromFile()` reading `.json`, validating, overwriting localStorage, reloading state
  - WHY: Completes the backup/restore cycle; validation prevents corrupt data.
  - NOTE: Implemented as part of 4.4 — Import JSON button triggers hidden file input, calls importFromFile(), updates appState on success, shows error alert on failure.

- [x] **10.4** Add version field handling in `loadState()` for future schema migration
  - WHY: Without versioning, future schema changes would corrupt saved data.
  - NOTE: Implemented sequential migration framework in storage.ts. `migrateState()` applies migrations from detected version to CURRENT_VERSION. Handles unversioned data (version 0→1), future versions (rejected gracefully), and re-persists migrated data. `importFromFile()` also runs migration so imported older exports are upgraded. To add a future migration: increment CURRENT_VERSION and push a v(N)→v(N+1) function to the migrations array.

---

## Phase 11: Polish & Responsive Design

- [x] **11.1** Audit all inputs for consistent styling: label left, value center, unit right, `[?]` tooltip, 44px min tap target
  - WHY: Spec requires large touch targets for tablet use.
  - NOTE: Full audit completed. All numeric inputs use InputField consistently: label left (flex-1 text-sm font-medium), value right-aligned (w-28 text-right tabular-nums), unit right (w-12 shrink-0), tooltip via [?] icon, 44px min-h on all rows. Text inputs (machine names) intentionally use distinct styling. SaveLoadToolbar, RepairEstimator also audited — all tap targets meet 44px minimum.

- [x] **11.2** Ensure Overheads sections on Tabs 1 & 2 collapse by default with note "Most farmers leave these as they are"
  - WHY: Spec explicitly requires this to reduce cognitive load.
  - NOTE: Already implemented during Phase 5/6. Both CostPerHectare and CostPerHour use `<CollapsibleSection title="Overheads" subtitle="Most farmers leave these as they are" defaultOpen={false}>`. Verified correct.

- [x] **11.3** Test and fix responsive layout at 320px, 768px, and 1280px across all tabs
  - WHY: Spec lists these breakpoints as verification targets.
  - NOTE: Comprehensive responsive audit and fixes applied. Header stacks vertically on mobile (flex-col sm:flex-row). Tab bar uses 2x2 grid on mobile (grid-cols-2 sm:grid-cols-4). InputField inputs shrink on mobile (w-20 sm:w-28). ResultBanner text scales down (text-xl sm:text-2xl md:text-[32px]). CompareMachines results grid uses auto-width first column, responsive gaps, and smaller speed comparison text. ReplacementPlanner MachineRow grid stacks on mobile (grid-cols-1 sm:grid-cols-2). Timeline chart reduced min-width to 320px and machine name column to 80px. Legend uses flex-wrap with smaller gaps. CostBreakdown uses responsive gap (gap-2 sm:gap-4).

- [x] **11.4** Add card shadows and section separators: white cards on `#FAFAFA`, grey background for Results sections
  - WHY: Visual separation between inputs and outputs.
  - NOTE: Already implemented during Phase 5-9. Cards use `rounded-lg bg-card p-4 shadow-sm` (white with subtle shadow). Results sections use `rounded-lg bg-muted/50 p-4` (grey background). App background is `bg-background` (#FAFAFA). Verified consistent across all tabs.

- [x] **11.5** Ensure all currency values show £ + commas, all percentages show 1 decimal place
  - WHY: Consistent formatting is critical for financial readability.
  - NOTE: Already implemented via format.ts. formatGBP() adds £ prefix with commas (rounds to integer >= £1,000, 2 decimals below). formatPct() always shows 1 decimal place. Both used consistently across CostPerHectare, CostPerHour, ReplacementPlanner, and CostBreakdown. Handles non-finite values with "—".

---

## Phase 12: Verification & Edge Cases

- [x] **12.1** Verify Tab 1: AHDB defaults produce total = £30.27/ha, saving = -£54,880
  - WHY: Exact acceptance criteria from spec.
  - NOTE: Verified programmatically. Total £30.27/ha (fixed £14.07 + running £16.20), annual saving -£54,880 — both match spec exactly. TypeScript compiles clean, Vite build succeeds.

- [x] **12.2** Verify Tab 2: AHDB defaults produce total = £65.56/hr, saving = £14,393.41
  - WHY: Exact acceptance criteria from spec.
  - NOTE: Verified programmatically. Total £65.56/hr (fixed £16.64 + labour £14.00 + fuel £33.60 + repairs £1.33), annual saving £14,393.41 — both match spec exactly. TypeScript compiles clean, Vite build succeeds.

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
