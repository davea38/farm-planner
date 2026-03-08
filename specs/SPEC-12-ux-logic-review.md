# SPEC-12: UX & Logic Review — Agronomist / Business Manager Perspective

## Purpose

An exhaustive first-principles review of the Farm Machinery Planner from the perspective of a farm agronomist, land agent, or business manager — and critically, from the perspective of a working farmer who may not have a strong finance background. The goal: ensure every screen, calculation, label, and data flow is joined up, obvious, and correct.

---

## Findings Summary

| # | Severity | Area | Issue |
|---|----------|------|-------|
| 1 | BUG | SPECS.md | Fuel per hour formula in spec is wrong (implementation is correct) |
| 2 | CONFUSING | Cost per Hour | `haPerHr` field is displayed but never used in any calculation |
| 3 | CRITICAL-UX | Profitability | Farm income is buried in Replacement Planner — farmers won't find it |
| 4 | CRITICAL-UX | Profitability | Running costs only come from SAVED machines, not current inputs |
| 5 | LOGIC | Profitability | Contracting + own-use cost double-counting / cost-base mismatch |
| 6 | CONFUSING | Replacement Planner | "Cost to replace" label ambiguous (gross price vs net cost) |
| 7 | MISMATCH | Depreciation vs Replacement | Category lists don't align — no automatic linking |
| 8 | CONFUSING | Fuel prices | Three different default fuel prices across the app |
| 9 | MINOR | Cost tabs | No total annual cost displayed (only per-unit and saving) |
| 10 | CONFUSING | Profitability | "Contracting delivery costs" label misleading |
| 11 | LOGIC | Profitability | Traffic-light thresholds differ from Replacement Planner (different income base) |
| 12 | UX | Contracting Income | NAAC panel inside service cards not filtered by charge unit |
| 13 | UX | Compare Machines | Capacity/application rate units fixed to "kg" — wrong for sprayers |
| 14 | UX | Interest rate | Tooltip conflates bank savings rate with loan rate |
| 15 | UX | Replacement Planner | No link between machine rows and depreciation curves |
| 16 | UX | Save/Load | No visual indicator that saving machines feeds Profitability tab |
| 17 | SPEC | SPECS.md Tab 2 | Spec says fuel/hr = consumption × haPerHr × price — wrong formula |
| 18 | UX | Profitability | "With vs Without Contracting" can be misread |
| 19 | DATA | Defaults | Fuel price defaults (53p, 60p) are far below current AHDB price (74.91p) |
| 20 | UX | Replacement Planner | usePerYear and currentHours fields are informational-only — feels broken |
| 26 | DESIGN | All tabs | Tab names are technical labels, not farmer questions |
| 27 | DESIGN | Tabs 1, 2, 7 | Inputs-first layout buries the answer below the fold |
| 28 | DESIGN | Tabs 1, 2, 5, 7 | No visual breakdowns — results are text-only tables |
| 29 | DESIGN | App shell | No welcome/orientation for first-time users |
| 30 | DESIGN | Cross-tab | No visual cues showing how data flows between tabs |
| 31 | DESIGN | All tabs | Typography and colour palette feel corporate, not approachable |
| 32 | DESIGN | All tabs | Empty states are bare text with no illustration or encouragement |
| 33 | DESIGN | All tabs | Labels, tooltips, and section headers use technical/financial language |

---

## Detailed Findings

### 1. BUG: Fuel Per Hour Formula in SPECS.md Is Wrong

**Location:** `specs/SPECS.md` line 200
**Spec says:**
```
Fuel per hour = fuel_consumption_L_per_hr * ha_per_hr * fuel_price
```
**Implementation does (correctly):**
```typescript
const fuelPerHr = fuelConsumptionPerHr * fuelPrice  // calculations.ts:204
```

The spec formula would give: 14 L/hr × 4 ha/hr × £0.60 = £33.60/hr — nonsensical. If you burn 14 litres per hour and diesel costs 60p/litre, fuel cost is simply 14 × 0.60 = £8.40/hr. The `haPerHr` multiplier makes no sense here.

**The implementation is correct. The spec document needs fixing.**

**Action:** Fix the formula in SPECS.md to match the correct implementation.

---

### 2. CONFUSING: `haPerHr` Field on Cost Per Hour Tab Is Orphaned

**Location:** `src/components/CostPerHour.tsx:155-162`, `src/lib/calculations.ts:186`

The "Ha covered per hour" (or "Acres covered per hour") input field is displayed on the Cost per Hour tab but is **never used in any calculation on that tab**. The `haPerHr` value exists in `CostPerHourInputs` but `calcCostPerHour()` destructures it and then ignores it.

A farmer filling in this form would reasonably ask: "Why am I entering this if it doesn't change anything?" This erodes trust in the tool.

**Options:**
- **A) Remove it** — if it has no purpose, don't show it. Simpler form.
- **B) Use it** — show the annual area covered (haPerHr × hoursPerYear) as an informational output, so the farmer can cross-check against their Cost per Hectare tab.
- **C) Connect it** — use it to calculate a "cost per hectare equivalent" on the Cost per Hour results, bridging the two tabs.

**Recommendation:** Option B or C. For a farmer, knowing "this machine covers X hectares per year at Y cost/hr, which means Z cost/ha" is valuable cross-referencing.

---

### 3. CRITICAL-UX: Farm Income Is Buried in the Wrong Tab

**Location:** `src/components/ReplacementPlanner.tsx:391-398`, `src/components/ProfitabilityOverview.tsx:119`

The single most important number for the profitability picture — the farmer's annual income — is entered on the **Replacement Planner** tab. The Profitability Overview tab then reads it from there and labels it "Farm income (from Replacement Planner)".

**Problems:**
- A farmer opening the Profitability tab for the first time sees "Farm income: £350,000" and may not know where to change it
- The label "from Replacement Planner" is a developer's data-flow description, not farmer-friendly
- A farmer who hasn't used the Replacement Planner tab won't know their income is already defaulted to £350k
- Farm income is conceptually a farm-wide figure, not specific to replacement planning

**Recommendation:** Either:
- **A) Make farm income editable directly on the Profitability tab** (with bidirectional sync to Replacement Planner)
- **B) Move it to a "Farm Settings" section at the top of the app** that's visible across tabs
- **C) At minimum**, make the "Farm income (from Replacement Planner)" text a clickable link that navigates to the Replacement Planner tab, or add an inline edit capability

---

### 4. CRITICAL-UX: Profitability Running Costs Come Only from SAVED Machines

**Location:** `src/components/ProfitabilityOverview.tsx:54-68`

The Profitability tab calculates running costs from `savedMachines` arrays only. If a farmer has been working on the Cost per Hectare tab for 20 minutes but hasn't clicked "Save", their data doesn't appear on the Profitability tab.

**Problems:**
- The Profitability tab shows £0 running costs even though the farmer is actively costing a machine
- The empty state message says "Save machines on the Cost per Hectare and Cost per Hour tabs..." but a farmer may not understand the "save" workflow
- The "current" machine inputs (the one being actively edited) are never included

**Recommendation:**
- **A) Include the current (unsaved) machine** in the profitability calculation alongside saved machines, clearly labelled as "(current, unsaved)"
- **B) Auto-prompt to save** when the farmer navigates to the Profitability tab with unsaved changes
- **C) At minimum**, make the empty state message more prominent and action-oriented: a button that says "Go to Cost per Hectare to save your first machine"

---

### 5. LOGIC: Potential Double-Counting When Contracting Uses Same Machine

**Location:** Conceptual issue spanning Tabs 1, 6, and 7

**Scenario:** A farmer owns a combine. They:
1. Enter it on Cost per Hectare: 1,200 ha/year at £30.27/ha = £36,324/year running cost
2. Also offer combining as a contracting service: 400 ha/year for other farmers
3. Pull the combine's cost from Tab 1 into Tab 6 as "own cost per unit" = £30.27/ha

**The problem:** The £30.27/ha figure was calculated assuming the combine covers 1,200 ha. But the combine actually covers 1,600 ha total (1,200 own + 400 contracting). At 1,600 ha, the fixed costs per ha would be LOWER (fixed costs ÷ 1,600 instead of ÷ 1,200), so the true cost per ha is overstated.

**On the Profitability tab:**
- Running cost: 1,200 ha × £30.27 = £36,324
- Contracting cost: 400 ha × £30.27 = £12,108
- Total attributed cost: £48,432

**Reality:** The machine's true annual cost should be based on 1,600 total ha. Fixed costs are the same regardless, so the per-ha figure should be lower.

**This is a known simplification** in the AHDB approach, but it's worth flagging to the farmer. The contracting margin is understated because the own cost is overstated.

**Recommendation:**
- Add a note on the Contracting Income tab: "Note: Own cost per unit is based on your farm's usage alone. If the machine does significant additional work for contracting, your true cost per unit may be lower — and your margin higher."
- Alternatively, allow entering total hectares (own + contracting) on Tab 1 and letting the contracting tab subtract.

---

### 6. CONFUSING: "Cost to Replace" Label vs "Price to Change" in Spec

**Location:** `src/components/ReplacementPlanner.tsx:148-153` vs `specs/SPECS.md` line 354

The spec uses "Price to change" (what the replacement costs — the gross purchase price). The UI uses "Cost to replace". These sound different:
- "Price to change" = the sticker price of the new machine
- "Cost to replace" = could mean the NET cost (price minus trade-in)

The actual field is the gross price, and "Cost to budget" (shown below) is the net. But a farmer might enter the net figure in "Cost to replace", thinking that's what's being asked.

**Recommendation:** Use "Replacement price" — clearer that it's the price of the new machine. Keep "Cost to budget" as the net figure below. Add a tooltip: "What the replacement machine will cost to buy (before deducting trade-in value of your current machine)".

---

### 7. MISMATCH: Depreciation Categories Don't Match Replacement Planner Categories

**Depreciation categories** (`depreciation-data.ts`):
`tractors_small, tractors_large, combines, forage_harvesters, sprayers, tillage, drills, miscellaneous`

**Replacement Planner categories** (`types.ts`):
`tractor, combine, sprayer, drill, cultivator, trailer, handler, other`

**Mismatches:**
| Replacement | Depreciation | Issue |
|---|---|---|
| tractor | tractors_small OR tractors_large | No way to distinguish size |
| cultivator | tillage | Different names for overlapping concept |
| trailer | miscellaneous | No specific profile |
| handler | miscellaneous | No specific profile |
| other | miscellaneous | OK |
| — | forage_harvesters | Not available as a replacement category |

**Impact:** A farmer can't automatically see the depreciation curve for a machine in their replacement plan. They have to manually select "Tillage Equipment" when they've entered a "Cultivator". And tractors don't distinguish small from large.

**Recommendation:**
- Unify the category lists, or create a mapping
- Add "Forage harvester" as a replacement planner category
- Split "Tractor" into "Tractor (80-149 HP)" and "Tractor (150+ HP)" on the replacement planner, or add an HP field
- Per replacement machine row, add a "View depreciation" button that auto-selects the right category

---

### 8. CONFUSING: Three Different Default Fuel Prices

| Location | Default | Notes |
|---|---|---|
| Cost per Hectare | £0.53/L | Well below current |
| Cost per Hour | £0.60/L | Closer but still below |
| AHDB Panel | £0.7491/L | Current red diesel price |

A farmer opening the app sees 53p/litre as the default, but the AHDB data panel (collapsed by default) shows 74.91p. The defaults were presumably from the original AHDB spreadsheet examples but are now outdated.

**Recommendation:**
- Update both defaults to match the current AHDB red diesel price (74.91p = £0.7491)
- Or auto-fill from the AHDB data constant so defaults stay current when the data is updated
- At minimum, show a visual alert when the entered fuel price differs significantly from the AHDB reference price

---

### 9. MINOR: No Total Annual Cost Displayed on Cost Tabs

**Location:** `src/components/CostPerHectare.tsx:271-288`, `src/components/CostPerHour.tsx:271-288`

The results section shows:
- Your cost: £30.27 per hectare
- Fixed costs: £14.07/ha
- Running costs: £16.20/ha
- Annual saving vs contractor

**Missing:** The total annual ownership cost (£30.27 × 1,200 ha = £36,324/year). A farmer thinking in annual budgets would find this immediately useful. The saving vs contractor IS shown annually, but the absolute cost isn't.

**Recommendation:** Add a "Total annual cost: £36,324/year" line to the results breakdown, between the per-unit costs and the contractor comparison.

---

### 10. CONFUSING: "Contracting Delivery Costs" Label

**Location:** `src/components/ProfitabilityOverview.tsx:162-166`

On the Profitability tab, the contracting costs line reads "Contracting delivery costs". But this is actually the total own cost of providing contracting services (ownCostPerUnit × volume + additionalCosts), which includes fuel, labour, wear, and overhead — not just "delivery".

To a farmer or land agent, "delivery costs" suggests haulage/transport, which is misleading.

**Recommendation:** Change to "Contracting operating costs" or "Cost of contracting services" — clearer that it's the total cost of doing the contracting work.

---

### 11. LOGIC: Traffic-Light Thresholds Use Different Income Bases

**Replacement Planner:** `pctOfIncome = averageAnnualCost / farmIncome × 100`
- Uses farm income only
- Only counts replacement costs (not running costs)

**Profitability Overview:** `machineryCostPctOfIncome = totalCosts / totalIncome × 100`
- Uses farm income + contracting income
- Counts replacement + running + contracting costs

Both use the same thresholds (green <20%, amber 20-35%, red >35%), but they're measuring fundamentally different things. A farmer could see "25% — amber" on the Replacement Planner and "18% — green" on the Profitability tab. Or vice versa.

**Problems:**
- The Replacement Planner % only counts replacement costs, not running costs. A farm spending 15% on replacements but 30% on running costs would show "green" on replacement but be spending 45% total.
- The Profitability % inflates the income base with contracting revenue, making the ratio look better.

**Recommendation:**
- **Replacement Planner:** Clarify the label: "Replacement cost as % of farm income" (not "Machinery cost as % of income")
- **Profitability:** Consider showing two percentages:
  - "Machinery costs as % of farm income: X%" (apples-to-apples with Replacement Planner)
  - "All costs as % of total income: Y%" (including contracting)
- Add a note explaining the difference

---

### 12. UX: NAAC Panel in Contracting Service Cards Not Filtered

**Location:** `src/components/ContractingIncomePlanner.tsx:346-352`

On Tabs 1 and 2, the NAAC panel is filtered by unit (`unitFilter="ha"` or `unitFilter="hr"`). But inside each contracting service card, the NAAC panel has no `unitFilter`. This means a farmer who has set their service to charge per bale still sees all 130+ rates including per-hectare soil prep and per-hour tractor hire.

**Recommendation:** Pass `unitFilter={service.chargeUnit}` or at least set `defaultCategory` to the most relevant category for the selected charge unit. For example, if chargeUnit is "bale", default to the "Baling" category.

---

### 13. UX: Compare Machines — Capacity/Application Rate Units Fixed to "kg"

**Location:** `src/components/CompareMachines.tsx:206-226`

The capacity field shows "kg" and application rate shows "kg/ha". But sprayers use litres, not kilograms. The SPECS.md spec says "kg or litres" for capacity, but the implementation uses only "kg".

A farmer comparing two sprayers would see "Tank / hopper: 800 kg" when they mean 800 litres. For a sprayer, application rate should be "L/ha" not "kg/ha".

**Recommendation:**
- Add a "Machine type" selector (spreader/sprayer) that switches units between kg and L
- Or change the unit label to "kg / L" to indicate both are acceptable
- Or add a tooltip: "Enter in kg for dry product or litres for liquid"

---

### 14. UX: Interest Rate Tooltip Conflates Two Very Different Rates

**Location:** Both cost tabs, interest rate tooltip

Current tooltip: "The rate you'd earn if the money was in the bank (or your loan rate)"

Bank savings rate (~2-4%) and loan rate (~6-8%) are very different. The field represents the **opportunity cost of capital** — what you'd earn if you invested the money elsewhere instead of buying the machine. This is typically the savings rate, not the loan rate.

If a farmer enters their loan rate (say 7%), the cost will be significantly overstated. If they're comparing "own vs contractor", this could swing the decision.

**Recommendation:** Change tooltip to: "The return you could earn if you invested the money instead of buying this machine. Usually 2-4%. If you borrowed to buy the machine, use your loan interest rate instead."

---

### 15. UX: No Link Between Replacement Planner Machines and Depreciation

**Location:** `src/components/ReplacementPlanner.tsx:408-413`

The Replacement Planner has a standalone DepreciationPanel at the bottom of the page, but there's no connection between individual machine rows and the depreciation tool. A farmer with 10 machines has to manually select the matching depreciation category for each one.

**Recommendation:** Add a small "View depreciation" icon/button on each machine row that opens or scrolls to the depreciation panel with the matching category pre-selected. This requires the category mapping from finding #7.

---

### 16. UX: No Visual Indicator That Saving Machines Feeds Other Tabs

**Location:** `src/components/SaveLoadToolbar.tsx`, both cost tabs

When a farmer saves a machine on Tab 1, there's no indication that this data now feeds into Tab 6 (Contracting Income's "Pull from saved machine" dropdown) and Tab 7 (Profitability Overview's running cost calculation).

This is a critical workflow gap. The Profitability tab might show £0 for running costs, and the farmer doesn't know why.

**Recommendation:**
- After saving, show a brief toast/note: "Saved! This machine's costs now appear on the Profitability tab."
- On the Profitability tab, if running costs are £0 but the current tab has non-zero inputs, show: "You have unsaved machines on the Cost per Hectare tab. Save them to include their running costs here."
- Consider adding a count badge on the Profitability tab: "3 machines"

---

### 17. SPEC BUG: SPECS.md Tab 2 Fuel Formula

**Location:** `specs/SPECS.md` line 200

Same as finding #1 but explicitly noting this is a spec document error that should be corrected to prevent future confusion if anyone implements from the spec.

**Current (wrong):**
```
Fuel per hour = fuel_consumption_L_per_hr * ha_per_hr * fuel_price
```

**Should be:**
```
Fuel per hour = fuel_consumption_L_per_hr * fuel_price
```

---

### 18. UX: "With vs Without Contracting" Table Can Be Misread

**Location:** `src/components/ProfitabilityOverview.tsx:222-301`

The comparison table shows:

|  | Without Contracting | With Contracting |
|---|---|---|
| Income | £350,000 | £432,500 |
| Costs | £169,716 | £230,916 |
| Net | £180,284 | £201,584 |

"Without Contracting" could be misread as "without owning any machinery" rather than "without offering contracting services to others". A farmer unfamiliar with the term might think "Without Contracting" means "without hiring a contractor" (the opposite of the intended meaning).

**Recommendation:** Change column headers to:
- "Farm Only" (just your own farm operations)
- "Farm + Contracting" (your farm + offering services to others)

And add a one-line explainer: "What does adding contracting services do for your bottom line?"

---

### 19. DATA: Default Fuel Prices Are Outdated

**Location:** `src/lib/defaults.ts:19,35`

See finding #8. Both default fuel prices (53p and 60p) are significantly below the current AHDB price of 74.91p. Since fuel is a major component of running costs, this means default results will understate costs.

**Recommendation:** Update defaults to use the AHDB constant:
```typescript
import { FUEL_PRICES } from './fuel-data'
const currentRedDiesel = FUEL_PRICES.redDiesel.current / 100 // ppl to £/L
```

---

### 20. UX: Replacement Planner "Use Per Year" and "Current Hours" Feel Broken

**Location:** `src/components/ReplacementPlanner.tsx:122-145`

These fields are displayed and editable but don't affect any calculation. The replacement summary is based entirely on `timeToChange`, `priceToChange`, and `currentValue`.

A farmer entering 800 hrs/year and 4,200 current hours would expect the app to do something with this information — perhaps suggest replacement timing, or estimate remaining life, or calculate annual running cost. It does nothing.

**Recommendation:**
- **Option A:** Use these fields to auto-suggest `timeToChange` based on typical machine lifespans (e.g., a combine with 1,800 hours at 200 hrs/year, typical life 2,000 hours → suggest replace in 1 year)
- **Option B:** Connect to depreciation data — show estimated current value based on age/hours
- **Option C:** If they're purely informational for the farmer's reference, label them as such: add "(for your reference)" to the tooltip
- **Option D:** Remove them if they serve no purpose

---

## Additional Observations (Lower Priority)

### 21. Insurance on Purchase Price vs Current Value
Insurance is calculated as `purchasePrice × insuranceRate%`. In practice, insurance is based on current market value, not what you paid. A 10-year-old machine worth £30k shouldn't be insured for the same percentage of its £126k purchase price. This follows the AHDB spreadsheet methodology, but a note explaining this simplification would help.

### 22. No Handling of Negative Replacement "Cost to Budget"
If `currentValue > priceToChange` (downsizing — replacing with a cheaper machine), the cost to budget is negative. The calculation handles this correctly, but the UI doesn't explain it. A farmer might think it's an error.

**Recommendation:** When cost to budget is negative, show: "You'll receive £X,XXX when you swap (trade-in exceeds replacement cost)".

### 23. Depreciation Panel Standalone Tab (Tab 3) Not in Original Spec
SPEC-07 specified the depreciation panel as an embedded collapsible within Tabs 1, 2, and 5. The standalone Tab 3 was added beyond the spec. This is actually a good addition — having a standalone depreciation reference is useful for a farmer doing research without being in a specific costing context. But the spec should be updated to document it.

### 24. Workrate Formula Constant 6000
The `6000` constant in the workrate formula (`(6000 * areaPerLoad) / (spotRate * fieldEfficiency)`) is `60 × 100` — 60 to convert hours to minutes, 100 because field efficiency is a percentage not a decimal. This is not documented anywhere and would confuse anyone auditing the formulas.

**Recommendation:** Add a comment in `calculations.ts`:
```typescript
// 6000 = 60 min/hr × 100 (efficiency is %, not decimal)
```

### 25. Tab Order for Natural Farmer Workflow
Current order: Cost/ha → Cost/hr → Depreciation → Compare → Replacement → Contracting → Profitability

Suggested order for a farmer's natural workflow:
1. **Depreciation** — "How fast does this lose value?" (research phase)
2. **Cost per Hectare** — "What does it cost me per hectare?"
3. **Cost per Hour** — "What does it cost me per hour?"
4. **Compare Machines** — "Which machine is better?"
5. **Replacement Planner** — "When do I need to replace everything?"
6. **Contracting Income** — "Can I earn from offering services?"
7. **Profitability** — "Overall, is it worth it?"

The current order puts the costing tabs first, which is reasonable for a "jump straight in" approach. This is subjective — the current order works fine.

---

## Product Owner Decisions (Answered)

1. **Should the current (unsaved) machine on Tabs 1/2 be included in Profitability calculations?**
   **DECISION: Yes.** Always include the current (unsaved) machine in profitability calculations, labelled as "(current, unsaved)".

2. **Should farm income be editable on the Profitability tab directly?**
   **DECISION: Yes.** Add an inline editable farm income field on the Profitability tab with bidirectional sync to the Replacement Planner.

3. **Is the `haPerHr` field on the Cost per Hour tab intentional?**
   **DECISION: Remove it.** Remove the orphaned field from the UI and data model. Less clutter for the farmer.

4. **Should default fuel prices auto-sync with the AHDB reference data?**
   **DECISION: Yes.** Set defaults to pull from the FUEL_PRICES constant so they stay current when data is updated. Both tabs default to current red diesel price.

## Open Questions (Unanswered — Lower Priority)

5. **Should the contracting cost base account for shared machine usage?** Currently, pulling a machine's cost per ha into contracting uses the farmer's own-use hectares as the divisor, overstating the per-ha cost when the machine does additional contracting work.

6. **Should the Replacement Planner's "Use per year" and "Current hours" fields drive any calculation?** Currently they're display-only. Should they auto-suggest replacement timing?

7. **Should depreciation categories and replacement planner categories be unified?** The current mismatch prevents automatic linking.

---

## Implementation Priority

Decisions marked with [APPROVED] have product owner sign-off.

### Must Fix (affects correctness or trust)
1. [APPROVED] Fix SPECS.md fuel per hour formula (finding #1, #17) — correct spec to match implementation
2. [APPROVED] Remove `haPerHr` orphaned field from Cost per Hour tab and data model (finding #2)
   - Files: `src/lib/types.ts`, `src/lib/defaults.ts`, `src/components/CostPerHour.tsx`, `src/lib/calculations.ts`, `src/lib/storage.ts` (migration v2→v3)
   - Note: Contracting Income's "Pull from saved machine" for hour machines currently works without haPerHr. No impact.
3. [APPROVED] Make farm income editable on Profitability tab with bidirectional sync (finding #3)
   - Files: `src/components/ProfitabilityOverview.tsx` (add InputField + onChange callback), `src/App.tsx` (wire bidirectional state)
   - ProfitabilityOverview must gain an `onFarmIncomeChange` prop
4. [APPROVED] Include current (unsaved) machine in Profitability running costs (finding #4)
   - Files: `src/components/ProfitabilityOverview.tsx` — add `appState.costPerHectare.current` and `appState.costPerHour.current` to running cost sums, labelled "(current, unsaved)"
   - Show separately from saved machines so the farmer can see the distinction
5. [APPROVED] Auto-sync default fuel prices from AHDB data constant (finding #8, #19)
   - Files: `src/lib/defaults.ts` — import `FUEL_PRICES` from `fuel-data.ts`, set both `fuelPrice` defaults to `FUEL_PRICES.redDiesel.current / 100`

### Should Fix (significant UX improvement)
6. Show total annual cost on cost tabs (finding #9)
7. Clarify "Cost to replace" → "Replacement price" label (finding #6)
8. Fix "Contracting delivery costs" → "Contracting operating costs" label (finding #10)
9. Add save-machine-feeds-profitability indicator (finding #16)
10. Filter NAAC panel by charge unit in contracting cards (finding #12)
11. Rename "With/Without Contracting" → "Farm Only" / "Farm + Contracting" (finding #18)

### Nice to Have (polish)
12. Unify depreciation and replacement planner categories (finding #7)
13. Add machine type selector to Compare Machines for unit switching (finding #13)
14. Improve interest rate tooltip (finding #14)
15. Link replacement machine rows to depreciation curves (finding #15)
16. Make usePerYear/currentHours functional or clearly informational (finding #20)
17. Add Profitability % breakdown (finding #11)
18. Add contracting cost-base note (finding #5)
19. Document the 6000 constant (finding #24)

---

## Phase 2: Design Enhancement Findings

A second-pass review focused on **design-level uplift** — making the app genuinely approachable for non-technical, visual-thinking UK farmers. These findings address navigation, warmth, visual communication, and farmer-friendly language rather than mechanical bugs or logic errors.

### Findings Summary (Phase 2)

| # | Severity | Area | Issue |
|---|----------|------|-------|
| 26 | DESIGN | All tabs | Tab names are technical labels, not farmer questions |
| 27 | DESIGN | Tabs 1, 2, 7 | Inputs-first layout buries the answer below the fold |
| 28 | DESIGN | Tabs 1, 2, 5, 7 | No visual breakdowns — results are text-only tables |
| 29 | DESIGN | App shell | No welcome/orientation for first-time users |
| 30 | DESIGN | Cross-tab | No visual cues showing how data flows between tabs |
| 31 | DESIGN | All tabs | Typography and colour palette feel corporate, not approachable |
| 32 | DESIGN | All tabs | Empty states are bare text with no illustration or encouragement |
| 33 | DESIGN | All tabs | Labels, tooltips, and section headers use technical/financial language |

---

### 26. DESIGN: Tab Names Are Technical Labels, Not Farmer Questions

**Severity:** DESIGN
**Location:** App shell tab bar, `src/App.tsx`

**Problem:**
The current tab names ("Cost per Hectare", "Depreciation", "Profitability") read like spreadsheet column headers. They tell the farmer what the tool *calculates* but not what *question it answers*. A non-finance farmer scanning the tabs doesn't immediately know which one to click to answer "should I buy this machine or hire someone?"

**Current → Proposed Mapping:**

| Current Name | Question-Based Name | Short (for narrow screens) |
|---|---|---|
| Cost per Hectare | What does it cost per hectare? | Cost / Hectare |
| Cost per Hour | What does it cost per hour? | Cost / Hour |
| Depreciation | How fast does it lose value? | Value Loss |
| Compare Two Machines | Which machine is better? | Compare |
| Replacement Planner | When do I replace things? | Replacements |
| Contracting Income | Will contracting pay? | Contracting |
| Profitability | Is it all worth it? | Worth It? |

**Recommendation:**
- Use the question-based names as primary tab labels
- On narrow/mobile screens, fall back to the short versions
- Keep the question as the page heading when the tab is active, reinforcing that the tool answers *their* question

---

### 27. DESIGN: Inputs-First Layout Buries the Answer Below the Fold

**Severity:** DESIGN
**Location:** Tabs 1 (Cost per Hectare), 2 (Cost per Hour), 7 (Profitability)

**Problem:**
On Tabs 1 and 2, the farmer must scroll past 13+ input fields before seeing the result. The most important information — "your cost is £30.27/ha and you save £54,880/year" — is hidden below the fold. A farmer visiting for the first time may not even realise there *are* results until they scroll.

The Profitability tab has a similar issue: the verdict is below income/cost breakdowns.

**Recommendation — Results-First Layout:**
- **Move the results/verdict section to the TOP** of each tab, immediately visible on load
- Place inputs below in **collapsible sections** (expanded by default on first visit, collapsible thereafter):
  - "Purchase & Ownership" (price, years, sale price, area/hours)
  - "Running Costs" (fuel, labour, repairs)
  - "Overheads" (interest, insurance, storage) — collapsed by default as now
  - "Contractor Comparison" (contractor rate)
- Results update live as inputs change — the farmer sees the answer *moving* as they adjust numbers
- The big verdict banner stays pinned at top with a subtle shadow to separate it from the input sections below

**Layout Pattern (Tabs 1 & 2):**
```
┌─────────────────────────────────────────────────────┐
│  WHAT DOES IT COST PER HECTARE?                     │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  YOUR COST          £30.27 / hectare          │  │
│  │  ▸ Fixed: £14.07    ▸ Running: £16.20         │  │
│  │                                               │  │
│  │  [🟢 YOU SAVE £54,880/YEAR vs CONTRACTOR]     │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │ 🍩 COST BREAKDOWN        📊 OWN vs HIRE │  │  │
│  │  │ [donut chart]            [comparison bar]│  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ▾ Purchase & Ownership                             │
│    Purchase price ............ £126,000              │
│    Sell after ................ 8 years               │
│    Expected sale price ....... £34,000               │
│    Hectares worked/year ...... 1,200                 │
│                                                     │
│  ▾ Running Costs                                    │
│    ...                                              │
│                                                     │
│  ▸ Overheads (most farmers leave these alone)       │
│    ...                                              │
│                                                     │
│  ▾ Contractor Comparison                            │
│    ...                                              │
└─────────────────────────────────────────────────────┘
```

---

### 28. DESIGN: No Visual Breakdowns — Results Are Text-Only

**Severity:** DESIGN
**Location:** Tabs 1, 2, 5, 7

**Problem:**
All results are presented as plain text tables. For a visual-thinking farmer, a number like "£30.27/ha" is less immediately meaningful than a donut chart showing "47% fixed costs, 53% running costs" or a bar showing their cost vs the contractor's cost side by side.

The Compare Machines tab (Tab 4) already has stacked bars — but the cost tabs and profitability tab have no charts at all.

**Recommendation — Visual Enrichment:**

| Tab | Visual Element | Purpose |
|---|---|---|
| Tabs 1 & 2 | **Donut chart** — cost breakdown | Shows fixed vs running cost split at a glance. Segments: depreciation, interest, insurance, storage, fuel, labour, repairs |
| Tabs 1 & 2 | **Comparison bar** — own vs contractor | Side-by-side horizontal bars: "Your cost" vs "Contractor cost" with the difference highlighted |
| Tab 5 | **Sparkline per machine** — depreciation trajectory | Small inline chart next to each machine row showing value decline |
| Tab 7 | **Stacked bar** — income vs costs | Stacked horizontal bar: farm income, contracting income, then costs stacked against it |
| Tab 7 | **Donut chart** — cost category split | Shows where the money goes: replacements, running costs, contracting costs |
| Tab 7 | **Before/after bars** — with vs without contracting | Two grouped bars showing profit with and without contracting services |

**Implementation notes:**
- Use lightweight inline SVG charts (no charting library needed — the DepreciationCurve.tsx pattern already works well)
- Keep charts compact — they supplement the numbers, not replace them
- Use the existing colour palette: green for income/savings, red for costs, amber for neutral
- Charts should be responsive and work on tablet screens

---

### 29. DESIGN: No Welcome or Orientation for First-Time Users

**Severity:** DESIGN
**Location:** App shell / landing state

**Problem:**
When a farmer opens the app for the first time, they land on Tab 1 with 13 pre-filled fields and no context. There's no greeting, no explanation of what the tool does, and no guidance on where to start. A farmer unfamiliar with AHDB costing methodology might feel lost.

**Recommendation:**
Add a brief **welcome/hero section** that appears on first visit (dismissable, stored in localStorage):

```
┌─────────────────────────────────────────────────────┐
│  🚜  Farm Machinery Planner                         │
│                                                     │
│  Work out what your machines really cost you,       │
│  whether to buy or hire, and when to replace them.  │
│                                                     │
│  Start with a question:                             │
│                                                     │
│  [What does it cost    ] [What does it cost ]       │
│  [ per hectare? ▸      ] [ per hour? ▸      ]       │
│                                                     │
│  [How fast does it     ] [Which machine     ]       │
│  [ lose value? ▸       ] [ is better? ▸     ]       │
│                                                     │
│  Based on AHDB methodology • No login required      │
│  Your data stays on this device                     │
│                                                     │
│                              [Get started ▸]        │
└─────────────────────────────────────────────────────┘
```

- Show only on first visit (track `hasSeenWelcome` in localStorage)
- Clicking a question card navigates to the relevant tab
- "Get started" dismisses the hero and shows Tab 1
- Keep it brief — farmers don't read long introductions

---

### 30. DESIGN: No Visual Cues Showing Data Flow Between Tabs

**Severity:** DESIGN
**Location:** Cross-tab navigation, save/load workflow

**Problem:**
The app has invisible data dependencies: saving a machine on Tab 1 feeds Tab 6's "pull from saved" dropdown and Tab 7's running cost calculation. Farm income entered on Tab 5 flows to Tab 7. None of these connections are visible to the farmer.

A farmer who enters data on Tab 1 but never saves, then checks Tab 7, sees £0 running costs and thinks the tool is broken.

**Recommendation — Inter-Tab Wayfinding:**

1. **Save confirmation with data-flow hint:**
   After saving a machine, show a brief toast: "Saved! This feeds into your Profitability overview."

2. **Data-source badges on receiving tabs:**
   On Tab 7, show small badges next to each data source:
   - "Running costs: £36,324 ← 3 saved machines" (clickable, navigates to Tab 1)
   - "Farm income: £350,000 ← Replacement Planner" (clickable, navigates to Tab 5)

3. **"Unsaved work" indicator:**
   If the farmer has non-default inputs on Tab 1/2 but hasn't saved, show a subtle dot/badge on the tab: "unsaved changes"

4. **Connected-tabs footer:**
   At the bottom of Tabs 1, 2, and 5, show a small "This data also appears on:" line with linked tab names

---

### 31. DESIGN: Typography and Colour Palette Feel Corporate

**Severity:** DESIGN
**Location:** Global styles, all tabs

**Problem:**
The current design uses a standard corporate palette (flat greys, sharp shadows, uniform sizing). While clean and functional, it doesn't feel warm or approachable for a farmer using the tool in their kitchen. The result numbers don't have enough visual weight to stand out from the surrounding inputs.

**Recommendation — Typography & Warmth:**

1. **Result numbers — make them unmissable:**
   - Primary result (e.g. "£30.27/ha"): 36-40px, bold, dark green on light green background
   - Secondary results (breakdown): 20-24px, medium weight
   - Verdict banner: 28-32px, white on green/red/amber, with slight rounded corners

2. **Warmer colour accents:**
   - Keep `#2E7D32` farm green as primary
   - Add a warm accent: `#8B6914` (harvest gold) for highlights, callouts, and interactive elements
   - Soften the background from `#FAFAFA` to `#F5F0E8` (warm off-white, like parchment)
   - Card backgrounds: `#FFFDF7` (warm white) instead of pure `#FFFFFF`

3. **Section headers — friendlier tone:**
   - Use sentence case, not ALL CAPS: "Purchase & ownership" not "PURCHASE & OWNERSHIP"
   - Add subtle bottom borders instead of sharp card edges
   - Use slightly rounded card corners (8-12px radius)

4. **Input fields — less clinical:**
   - Slightly larger input text (18px → 20px)
   - Warmer border colour (`#D4C5A9` instead of `#E5E7EB`)
   - Focus state: warm gold border instead of blue

5. **Spacing — more breathing room:**
   - Increase vertical spacing between sections (24px → 32px)
   - Add generous padding inside result cards (16px → 24px)

---

### 32. DESIGN: Empty States Are Bare Text With No Encouragement

**Severity:** DESIGN
**Location:** All tabs (empty saved machines list, empty replacement planner, empty contracting services, empty profitability)

**Problem:**
When a tab has no data, the farmer sees a plain text message like "No saved machines. Save machines on the Cost per Hectare tab." This is functional but cold — it doesn't encourage the farmer or make the next step obvious.

**Recommendation — Warm, Actionable Empty States:**

Each empty state should have:
1. **A simple illustration or icon** (tractor silhouette, field pattern, etc.)
2. **A friendly headline** in the farmer's language
3. **One sentence** explaining what this tab does
4. **A prominent action button** that takes them to the right place

**Examples:**

| Tab | Current Empty State | Proposed |
|---|---|---|
| Tab 7 (Profitability) | "No saved machines. Save machines on the Cost per Hectare and Cost per Hour tabs to see your profitability overview." | Icon: clipboard with tractor. Headline: "Let's see if your machines are earning their keep." Body: "Save a machine on the costing tabs first, then come back here for the full picture." Button: [Cost a machine ▸] |
| Tab 6 (Contracting) | "No contracting services added." | Icon: handshake. Headline: "Could your machines earn more?" Body: "If you do work for other farmers, add your services here to see if it's profitable." Button: [Add a service ▸] |
| Tab 5 (Replacement) | Empty table rows | Icon: calendar with tractor. Headline: "Plan your replacements." Body: "Add your machines to see when each one needs replacing and what it'll cost." (Table rows already exist, but make the first-visit state friendlier) |

---

### 33. DESIGN: Labels, Tooltips, and Section Headers Use Technical Language

**Severity:** DESIGN
**Location:** All tabs — input labels, section headers, tooltip text

**Problem:**
Many labels assume familiarity with financial or agricultural business terminology. Examples:
- "Interest rate" → a farmer might not know this means opportunity cost of capital
- "Field efficiency" → percentages of working time feel abstract
- "Average value" → which average? Of what?
- "Spares & repairs (% of purchase price)" → expressing repairs as a percentage of purchase price is non-intuitive

While tooltips exist for most fields, the labels themselves should be as self-explanatory as possible — tooltips are a safety net, not the primary explanation.

**Recommendation — Language Audit:**

| Current Label | Proposed Label | Tooltip (revised) |
|---|---|---|
| Interest rate | Money tied up (%) | "If you didn't buy this machine, you could invest that money elsewhere. 2-4% is typical for savings, 6-8% for a loan." |
| Insurance | Insurance (% of price) | "What you pay each year to insure it, as a percentage of what you paid." |
| Storage | Shed costs (% of price) | "The cost of keeping it under cover — usually about 1% of what you paid." |
| Spares & repairs | Repairs (% of price) | "Your annual repair bill as a percentage of purchase price. Use the estimator below if you're unsure." |
| Field efficiency | Time actually working (%) | "What percentage of your time in the field is productive work, vs turning, overlapping, or waiting. 65-80% is normal." |
| Work rate | Ground covered (ha/hr) | "How many hectares this machine gets through in an hour of actual work." |
| Expected sale price | What you'll get when you sell | "What you expect to receive when you sell or trade in this machine." |
| Sell after | Years before selling | "How many years you plan to keep this machine before selling or trading in." |
| Ha covered per hour | (removed — see finding #2) | — |
| Contractor charge | Contractor quote (£/ha) | "What a local contractor would charge you per hectare for the same job." |
| Farm income (from Replacement Planner) | Your farm income | "Your average annual farm income — this is used to show machinery costs as a percentage of your income." |

**Section headers:**

| Current | Proposed |
|---|---|
| WHAT DID YOU PAY / WHAT WILL YOU GET? | Purchase & ownership |
| RUNNING COSTS | Running costs |
| OVERHEADS (usually leave these alone) | Overheads (most farmers leave these as-is) |
| CONTRACTOR COMPARISON | Compare with a contractor |
| RESULTS | Your answer |
| BUDGET SUMMARY | Your budget |

---

### Phase 2: Implementation Priority

| Priority | Finding | Impact |
|---|---|---|
| **High** | #27 Results-first layout | Biggest single UX improvement — answer visible immediately |
| **High** | #26 Question-based tab names | Reframes the entire app around farmer questions |
| **High** | #28 Visual breakdowns (donut + bars) | Makes numbers meaningful to visual thinkers |
| **Medium** | #33 Language audit | Reduces confusion, builds trust |
| **Medium** | #30 Inter-tab wayfinding | Prevents "where did my data go?" confusion |
| **Medium** | #32 Empty state improvements | Better first-visit experience |
| **Low** | #29 Welcome/orientation | Nice for first visit, only seen once |
| **Low** | #31 Typography & warmth | Polish — can be done incrementally |
