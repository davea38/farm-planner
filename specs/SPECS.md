# Farm Machinery Planner - Specification

## What This Is

A locally-hosted web app that helps a farmer answer five big questions:

1. **"What does this machine actually cost me?"** - per hectare or per hour
2. **"Should I buy it or hire a contractor?"** - clear yes/no with the numbers
3. **"When should I replace my machines?"** - a whole-farm timeline planner
4. **"If I offer contracting services, will it make money?"** - per-service profitability with NAAC benchmarks
5. **"Overall, is owning all this machinery profitable?"** - combined income vs costs dashboard

Based on the AHDB Machinery Costing Calculator spreadsheet and the AHDB Machinery Replacement Planner (2025).

---

## Design Principles

- **Dead simple.** One question per screen. No jargon without a plain-English tooltip.
- **Big text, big buttons, big numbers.** This runs on a tablet in a farmhouse kitchen, not a Bloomberg terminal.
- **No account, no login, no cloud.** Runs locally. Data saved in the browser (localStorage) so it survives closing the tab.
- **Opinionated defaults.** Every field starts pre-filled with sensible UK farming defaults (from the AHDB examples). The farmer only changes what they know.
- **Traffic-light answers.** Green = good, amber = think about it, red = you're losing money. No ambiguity.

---

## Technology

- **React** (latest version) as the UI framework.
- **Tailwind CSS** (latest version) for all styling - no custom CSS files.
- **shadcn/ui** for pre-built, accessible UI components (tabs, inputs, cards, tooltips, collapsibles, banners, dropdowns, dialogs, etc.).
- **Vite** as the build tool / dev server.
- Runs locally via `npm run dev` during development, or `npm run build` to produce a static bundle that can be served with any simple HTTP server (e.g. `npx serve dist`).
- **No internet required** after initial `npm install` and build.
- **Data persistence** via `localStorage`. Optional export/import as JSON file for backup.

---

## Application Structure

The app has **7 tabs** across the top:

| Tab | Purpose |
|-----|---------|
| **Cost per Hectare** | "What does this machine cost me for every hectare it works?" |
| **Cost per Hour** | "What does this machine cost me for every hour it runs?" |
| **Depreciation** | "How fast does my machine lose value, and when's the sweet spot to sell?" |
| **Compare Two Machines** | "Which of these two machines gets more work done?" |
| **Replacement Planner** | "When do I need to replace each machine on my farm?" |
| **Contracting Income** | "If I offer my machinery as a service, will it make money?" (SPEC-10) |
| **Profitability** | "Overall, is owning all this machinery profitable or loss-making?" (SPEC-11) |

A **Repair Budget** mini-tool is embedded as a helper within the Cost tabs (not a separate tab).

---

## Tab 1: Cost per Hectare

### Purpose
Calculate the total cost of owning and running a machine per hectare, and compare it against hiring a contractor.

### Screen Layout

```
+----------------------------------------------------------+
|  COST PER HECTARE                              [?] Help   |
+----------------------------------------------------------+
|                                                           |
|  WHAT DID YOU PAY / WHAT WILL YOU GET?                    |
|  +-----------------------+----+                           |
|  | Purchase price        | £126,000 |                    |
|  | Sell after            | 8 years  |                    |
|  | Expected sale price   | £34,000  |                    |
|  | Hectares worked/year  | 1,200    |                    |
|  +-----------------------+----------+                    |
|                                                           |
|  RUNNING COSTS                                            |
|  +-----------------------+----------+                    |
|  | Work rate             | 4 ha/hr  |                    |
|  | Labour cost           | £14/hr   |                    |
|  | Fuel price            | 53p/litre|                    |
|  | Fuel use              | 20 L/ha  |                    |
|  | Spares & repairs      | 2%       |                    |
|  +-----------------------+----------+                    |
|                                                           |
|  OVERHEADS (usually leave these alone)    [collapsed]     |
|  +-----------------------+----------+                    |
|  | Interest rate         | 2%       |                    |
|  | Insurance             | 2%       |                    |
|  | Storage               | 1%       |                    |
|  +-----------------------+----------+                    |
|                                                           |
|  CONTRACTOR COMPARISON                                    |
|  +-----------------------+----------+                    |
|  | Contractor charges    | £76/ha   |                    |
|  +-----------------------+----------+                    |
|                                                           |
|  =================================================       |
|  RESULTS                                                  |
|  =================================================       |
|                                                           |
|  Your cost:        £30.27 per hectare                     |
|    Fixed costs:    £14.07/ha                              |
|    Running costs:  £16.20/ha                              |
|                                                           |
|  Contractor cost:  £76.00 per hectare                     |
|                                                           |
|  [GREEN BANNER]                                           |
|  YOU SAVE £54,880/year BY OWNING THIS MACHINE             |
|                                                           |
|  or [RED BANNER] if contractor is cheaper:                |
|  YOU WOULD SAVE £X,XXX/year USING A CONTRACTOR            |
|                                                           |
+----------------------------------------------------------+
```

### Inputs (user-editable fields)

| Field | Default | Unit | Help tooltip |
|-------|---------|------|--------------|
| Purchase price | 126,000 | £ | "What you paid (or would pay) for this machine" |
| Sell after | 8 | years | "How many years before you plan to sell or trade in" |
| Expected sale price | 34,000 | £ | "What you expect to get when you sell it" |
| Hectares worked/year | 1,200 | ha | "Total hectares this machine covers in a year" |
| Interest rate | 2 | % | "The rate you'd earn if the money was in the bank (or your loan rate)" |
| Insurance | 2 | % of purchase price | "Annual insurance as a percentage of what you paid" |
| Storage | 1 | % of purchase price | "Cost of keeping it under cover, as a percentage of what you paid" |
| Work rate | 4 | ha/hr | "How many hectares per hour this machine covers" |
| Labour cost | 14 | £/hr | "What you pay the operator per hour (including yourself)" |
| Fuel price | 0.53 | £/litre | "Current red diesel price per litre" |
| Fuel use | 20 | L/ha | "Litres of fuel burned per hectare" |
| Spares & repairs | 2 | % of purchase price | "Annual repair bill as a percentage of what you paid" |
| Contractor charge | 76 | £/ha | "What a contractor would charge you per hectare for the same job" |

### Calculations (all from the AHDB spreadsheet)

```
Average value           = (purchase_price + sale_price) / 2
Annual interest cost    = average_value * interest_rate / 100
Annual depreciation     = (purchase_price - sale_price) / years_owned
Annual insurance cost   = purchase_price * insurance_rate / 100
Annual storage cost     = purchase_price * storage_rate / 100

Total fixed cost/year   = interest + depreciation + insurance + storage
Fixed cost per hectare  = total_fixed_cost / hectares_per_year

Labour per hectare      = labour_cost_per_hr / work_rate_ha_per_hr
Fuel per hectare        = fuel_use_L_per_ha * fuel_price_per_L
Repairs per hectare     = (purchase_price * repairs_pct / 100) / hectares_per_year

TOTAL COST PER HECTARE  = fixed_cost_per_ha + labour_per_ha + fuel_per_ha + repairs_per_ha

Annual saving (own vs contractor) = (total_cost_per_ha - contractor_charge) * hectares_per_year
```

- If saving is **negative** (owning is cheaper): show GREEN banner "You save £X/year by owning"
- If saving is **positive** (contractor is cheaper): show RED banner "You'd save £X/year using a contractor"
- If saving is **within 10%** either way: show AMBER banner "It's roughly break-even - consider convenience"

### Live update
All results recalculate instantly as the user types. No "Calculate" button needed.

---

## Tab 2: Cost per Hour

### Purpose
Same idea as Tab 1, but for machines where you think in hours not hectares (e.g. a loader, a telehandler).

### Inputs (user-editable fields)

| Field | Default | Unit | Help tooltip |
|-------|---------|------|--------------|
| Purchase price | 92,751 | £ | "What you paid for this machine" |
| Sell after | 7 | years | "How many years before you sell or trade in" |
| Expected sale price | 40,000 | £ | "What you expect to get when you sell" |
| Hours worked/year | 700 | hrs | "Total hours this machine runs in a year" |
| Interest rate | 2 | % | "Bank rate or your loan rate" |
| Insurance | 2 | % of purchase price | |
| Storage | 1 | % of purchase price | |
| Ha covered per hour | 4 | ha/hr | "Area covered per hour (if applicable)" |
| Fuel consumption per hour | 14 | L/hr | "Litres of fuel burned per hour of work" |
| Fuel price | 0.60 | £/litre | "Current red diesel price" |
| Spares & repairs | 1 | % of purchase price | "Annual repair bill as % of what you paid" |
| Labour cost | 14 | £/hr | "Operator cost per hour" |
| Contractor charge | 45 | £/hr | "What a contractor charges per hour" |

### Calculations

```
Average value           = (purchase_price + sale_price) / 2
Annual interest cost    = average_value * interest_rate / 100
Annual depreciation     = (purchase_price - sale_price) / years_owned
Annual insurance cost   = purchase_price * insurance_rate / 100
Annual storage cost     = purchase_price * storage_rate / 100

Total fixed cost/year   = interest + depreciation + insurance + storage
Fixed cost per hour     = total_fixed_cost / hours_per_year

Fuel per hour           = fuel_consumption_L_per_hr * fuel_price
Repairs per hour        = (purchase_price * repairs_pct / 100) / hours_per_year

TOTAL COST PER HOUR     = fixed_cost_per_hr + fuel_per_hr + repairs_per_hr + labour_per_hr

Annual saving (own vs contractor) = (total_cost_per_hr - contractor_charge) * hours_per_year
```

Same traffic-light banner as Tab 1.

---

## Tab 3: Depreciation

### Purpose
A standalone depreciation reference tool that shows farmers how fast their machine loses value over time, based on ASAE D497 depreciation curves. Helps answer: "How fast does my machine lose value, and when's the sweet spot to sell?"

This tab provides the same `DepreciationPanel` component that is embedded (collapsed) within the Cost per Hectare, Cost per Hour, and Replacement Planner tabs — but presented as a full standalone tab for independent research without needing to be in a costing context.

### Screen Layout

```
+----------------------------------------------------------+
|  DEPRECIATION                                    [?] Help  |
+----------------------------------------------------------+
|                                                            |
|  Machine type:  [Tractors (150+ HP)          ▼]           |
|  Purchase price: [£100,000]                                |
|                                                            |
|  ┌──────────────────────────────────────────────────┐     |
|  │  £100k ●                                         │     |
|  │         \                                        │     |
|  │          ·─·─·                                   │     |
|  │               ·─·─·─●── 5 yrs: £45k (45%)       │     |
|  │                      ·─·─·─·─·                   │     |
|  │                               ·─·─·──            │     |
|  │  Yr 0   2    4    6    8   10   12               │     |
|  └──────────────────────────────────────────────────┘     |
|                                                            |
|  Age (years): [=====●===============] 5                    |
|                                                            |
|  ┌──────────────────────────────────────────────┐         |
|  │  AFTER 5 YEARS                                │         |
|  │                                               │         |
|  │  Estimated value     £45,000                  │         |
|  │  Value lost          £55,000  (55%)           │         |
|  │  Avg depreciation    £11,000 / year           │         |
|  │                                               │         |
|  │  ███████████████████░░░░░░░░░░░░░░░░░░        │         |
|  │  55% lost ──────────────── 45% remaining      │         |
|  └──────────────────────────────────────────────┘         |
|                                                            |
|  Sweet spot: Year 5 — after this, annual                  |
|  depreciation slows below average. Consider               |
|  keeping the machine longer past this point.              |
|                                                            |
|  Source: ASAE D497 / Mississippi State Extension           |
|  Note: Based on auction values. Actual value varies.      |
+----------------------------------------------------------+
```

### Inputs

| Field | Default | Unit | Help tooltip |
|-------|---------|------|--------------|
| Machine type | Tractors (150+ HP) | dropdown | 8 categories: Tractors (80–149 HP), Tractors (150+ HP), Combine Harvesters, Forage Harvesters & Balers, Sprayers, Tillage Equipment, Drills & Planters, Other Equipment |
| Purchase price | 100,000 | £ | "What you paid (or would pay) for this machine" |
| Age slider | 5 | years (0–12) | Scrubs through the depreciation curve in real time |

### Visual Elements

1. **SVG depreciation curve** — line graph showing machine value (£) over 12 years with:
   - Filled area below the line (gradient)
   - Dot markers at each year
   - Shaded "steep zone" highlighting the years of fastest depreciation
   - Crosshair lines at the current age showing the "you are here" position
   - Y-axis: value in £; X-axis: age in years

2. **Summary card** — estimated value (£), value lost (£ and %), and average annual depreciation (£/year)

3. **Percentage bar** — horizontal split bar showing % lost (red) vs % remaining (green)

4. **Sweet spot callout** — identifies the year where marginal annual depreciation drops below the average annual depreciation, indicating the optimal hold period

5. **Source attribution** — ASAE D497 / Mississippi State Extension with caveat about actual values

### Standalone vs Embedded Behaviour

| Aspect | Standalone (this tab) | Embedded (Tabs 1, 2, 5) |
|--------|----------------------|--------------------------|
| Purchase price input | Visible, user-editable | Hidden (uses parent form's value) |
| "Use as sale price" button | Not shown | Shown — fills the parent form's expected sale price |
| Machine category | User-selectable | Can be pre-selected from parent context |
| Age/years | Slider with internal state | Synced with parent form's "years owned" |

### Data Source

Remaining value percentages from ASAE D497 via Mississippi State Extension (P3543), cross-referenced with Farmers Weekly UK tractor auction data. See `src/lib/depreciation-data.ts` for the full dataset and SPEC-07 for detailed methodology.

### Live update
All results recalculate instantly as the user changes the machine type, purchase price, or age slider.

---

## Tab 4: Compare Two Machines (Workrate)

### Purpose
Compare the actual field performance of two machines side-by-side. Answers: "Is the bigger/newer one really faster once you count filling, transport, and efficiency?"

### Screen Layout

```
+----------------------------------------------------------+
|  COMPARE TWO MACHINES                          [?] Help   |
+----------------------------------------------------------+
|                                                           |
|             | MACHINE A        | MACHINE B               |
|  Name       | [Old sprayer   ] | [New sprayer          ]  |
|  Width      | 4 m              | 30 m                    |
|  Tank/hopper| 800 kg           | 2,000 kg                |
|  Speed      | 6 km/hr          | 12 km/hr                |
|  App. rate  | 180 kg/ha        | 250 kg/ha               |
|  Travel time| 5 min            | 5 min                   |
|  Fill time  | 10 min           | 10 min                  |
|  Efficiency | 65%              | 75%                     |
|                                                           |
|  ================================================        |
|  RESULTS                                                  |
|  ================================================        |
|                                                           |
|             | MACHINE A        | MACHINE B               |
|  Spot rate  | 2.4 ha/hr        | 36.0 ha/hr              |
|  TRUE rate  | 1.4 ha/hr        | 9.6 ha/hr               |
|  (includes filling & travel)                              |
|                                                           |
|  [VISUAL BAR CHART comparing the two TRUE rates]          |
|                                                           |
|  Time breakdown per load:                                 |
|  A: [====WORKING 90%====][F5%][T5%]                       |
|  B: [WORKING 36%][==FILLING 32%==][==TRAVEL 32%==]        |
|                                                           |
|  Machine B is 6.9x faster in practice                     |
|                                                           |
+----------------------------------------------------------+
```

### Inputs (per machine)

| Field | Default A | Default B | Unit | Help tooltip |
|-------|-----------|-----------|------|--------------|
| Name | Machine A | Machine B | text | "Give it a name so you remember" |
| Implement width | 4 | 30 | metres | "Working width of the implement" |
| Capacity | 800 | 2,000 | kg or litres | "How much the tank or hopper holds" |
| Forward speed | 6 | 12 | km/hr | "Speed when working in the field" |
| Application rate | 180 | 250 | kg/ha or L/ha | "How much product per hectare" |
| Transport time (one way) | 5 | 5 | minutes | "Time to drive from yard to field" |
| Filling time | 10 | 10 | minutes | "Time to refill the tank or hopper" |
| Field efficiency | 65 | 75 | % | "How much time is actual work vs turns, overlaps. 65-80% is normal" |

### Calculations (from AHDB Workrate sheet)

```
Area per load           = capacity / application_rate
Filling rate            = capacity / filling_time
Spot work rate          = (width * speed) / 10                    [ha/hr]
Application time/load   = (6000 * area_per_load) / (spot_rate * efficiency)   [minutes]
Total time per load     = filling_time + (2 * transport_time) + application_time
Overall work rate       = (60 * area_per_load) / total_time_per_load   [ha/hr]
Overall efficiency      = 100 * overall_work_rate / spot_work_rate     [%]

Time breakdown percentages:
  Application %         = 100 * application_time / total_time
  Filling %             = 100 * filling_time / total_time
  Transport %           = 100 * (2 * transport_time) / total_time
```

### Visual output
- Horizontal stacked bar per machine showing time split (working / filling / transport) in different colours
- Big "X times faster" comparison number
- Highlight which machine wins

---

## Tab 5: Replacement Planner

### Purpose
A whole-farm view of all major machines, when they need replacing, and what it will cost. Based on the AHDB Replacement Planner PDF.

### Screen Layout

```
+----------------------------------------------------------------------+
|  REPLACEMENT PLANNER                                      [?] Help   |
+----------------------------------------------------------------------+
|                                                                      |
|  [+ Add Machine]                                                     |
|                                                                      |
|  MACHINE        | USE/yr | REPLACE | HOURS  | COST TO  | CURRENT    |
|                 |        | IN      | NOW    | REPLACE  | VALUE      |
|  ---------------+--------+---------+--------+----------+----------- |
|  Tractor 1      | 800 hr | 3 yrs   | 4,200  | £95,000  | £40,000   |
|  Tractor 2      | 500 hr | 5 yrs   | 1,500  | £85,000  | £55,000   |
|  Combine        | 200 hr | 2 yrs   | 1,800  | £280,000 | £120,000  |
|  Sprayer         | 300 hr | 4 yrs   | 900    | £65,000  | £30,000   |
|  [+ Add Machine]                                                     |
|                                                                      |
|  ================================================================    |
|  TIMELINE                                                            |
|  ================================================================    |
|                                                                      |
|  Year:  2025    2026    2027    2028    2029    2030                  |
|         ----    ----    ----    ----    ----    ----                  |
|  T1                     [###]                                        |
|  T2                                     [###]                        |
|  Comb           [###]                                                |
|  Spray                          [###]                                |
|                                                                      |
|  Cost:  £0    £280k    £95k    £65k    £85k     £0                   |
|                                                                      |
|  ================================================================    |
|  BUDGET SUMMARY                                                      |
|  ================================================================    |
|                                                                      |
|  Total replacement spend over 6 years:     £525,000                  |
|  Average annual replacement cost:          £87,500                   |
|                                                                      |
|  Your 5-year average farm income:  [£350,000]                        |
|  Machinery cost as % of income:    25%                               |
|                                                                      |
|  [GREEN]  Under 20% - comfortable                                   |
|  [AMBER]  20-35% - keep an eye on it                                 |
|  [RED]    Over 35% - machinery is eating your profits                |
|                                                                      |
+----------------------------------------------------------------------+
```

### Inputs

**Per machine row:**

| Field | Unit | Help tooltip |
|-------|------|--------------|
| Machine name | text | "e.g. Tractor 1, Combine, SP Sprayer" |
| Use per year | hours or ha | "How much you use it each year" |
| Time to change | years | "How many years until you plan to replace it" |
| Current hours | hours | "Hours on the clock right now" |
| Price to change | £ | "What the replacement will cost" |
| Current value | £ | "What this one is worth today" |

**Farm-level:**

| Field | Unit | Help tooltip |
|-------|------|--------------|
| 5-year average farm income | £ | "Your average annual farm income over the last 5 years" |

The planner starts with the machine categories from the PDF pre-filled as empty rows:
- Tractor 1, Tractor 2, Tractor 3, Tractor 4
- Combine
- SP Sprayer
- Seed drill
- Cultivator, Cultivator
- Other

The user can add/remove rows freely.

### Calculations

```
Annual investment           = SUM of (price_to_change) for each machine, placed in the year it's due
Cost to budget per machine  = price_to_change - current_value   (net cost)
Average annual cost         = total_replacement_spend / number_of_years_in_view
Replacement % of income     = (average_annual_cost / farm_income) * 100
```

### Visual output
- **Gantt-style timeline** showing replacement year for each machine (horizontal bar chart)
- **Bar chart** of annual spend by year so the farmer can see lumpy years
- Colour-coded percentage indicator vs income

---

## Embedded Helper: Repair Cost Estimator

Available as a pop-up/drawer from Tabs 1 and 2, accessed via a "Help me estimate repairs" link next to the Spares & Repairs field.

### Purpose
Uses the AHDB Table 1 data to look up a sensible repair cost percentage based on machine type and annual usage.

### Inputs

| Field | Options |
|-------|---------|
| Machine type | Dropdown: Tractors / Combine harvesters & SP harvesters / Trailed harvesters & balers / Ploughs & cultivators / Rotary cultivators & mowers / Disc harrows, spreaders & sprayers / Drills & tedders / Cereal drills & loaders / Grain dryers & cleaners |
| Annual usage | Hours per year (number input) |

### Lookup Table (from AHDB Repair Costs sheet)

| Machine type | 50 hr | 100 hr | 150 hr | 200 hr | per extra 100 hr |
|---|---|---|---|---|---|
| Tractors | - | - | - | - | - |
| *Tractors (500/750/1000/1500 hr)* | 3% | 3.5% | 5% | 7% | +0.5% |
| Combine harvesters, SP forage/potato | 1.5% | 2.5% | 3.5% | 4.5% | +2% |
| Trailed harvesters, balers | 3% | 5% | 6% | 7% | +2% |
| Ploughs, cultivators, toothed harrows | 4.5% | 8% | 11% | 14% | +6% |
| Rotary cultivators, mowers | 4% | 7% | 9.5% | 12% | +5% |
| Disc harrows, spreaders, sprayers | 3% | 5.5% | 7.5% | 9.5% | +4% |
| Tedders, unit drills, planters | 2.5% | 4.5% | 6.5% | 8.5% | +4% |
| Cereal drills, loaders | 2% | 4% | 5.5% | 7% | +3% |
| Grain dryers, cleaners, rolls | 1.5% | 2% | 2.5% | 3% | +0.5% |

Note: Tractors use hour brackets 500/750/1000/1500 while other machinery uses 50/100/150/200.

### Behaviour
- User picks type and enters hours.
- App looks up or interpolates the percentage.
- Shows: "For a [type] used [X] hours/year, budget about **[Y]%** of purchase price for repairs."
- A "Use this value" button auto-fills the repairs % field back on the parent Cost tab.

---

## Data Persistence

### localStorage schema

```json
{
  "farmPlanner": {
    "version": 2,
    "lastSaved": "2025-03-06T10:30:00Z",
    "costPerHectare": {
      "savedMachines": [
        {
          "name": "6m Drill",
          "purchasePrice": 126000,
          "yearsOwned": 8,
          "salePrice": 34000,
          "hectaresPerYear": 1200,
          "interestRate": 2,
          "insuranceRate": 2,
          "storageRate": 1,
          "workRate": 4,
          "labourCost": 14,
          "fuelPrice": 0.53,
          "fuelUse": 20,
          "repairsPct": 2,
          "contractorCharge": 76
        }
      ]
    },
    "costPerHour": {
      "savedMachines": [ ... ]
    },
    "workrateComparisons": {
      "saved": [ ... ]
    },
    "replacementPlanner": {
      "machines": [ ... ],
      "farmIncome": 350000
    },
    "contractingIncome": {
      "services": [
        {
          "id": "abc-123",
          "name": "Combining cereals",
          "chargeRate": 119.34,
          "chargeUnit": "ha",
          "annualVolume": 400,
          "ownCostPerUnit": 85,
          "additionalCosts": 2000,
          "linkedMachineSource": "hectare:0"
        }
      ]
    }
  }
}
```

### Save/Load
- Auto-saves to localStorage on every change (debounced 1 second).
- "Save to file" button exports the full JSON to a `.json` download.
- "Load from file" button imports a `.json` file and overwrites localStorage.
- Each Cost tab lets the user **name and save multiple machines**, then pick from a dropdown to load them back. This way the farmer can cost out "6m Drill", "Sprayer", "New Tractor" etc. and come back to them.

---

## UI/UX Details

### Layout
- **Max width 800px**, centred. Comfortable on a laptop, readable on a tablet.
- **Tab bar** across the top with 7 clearly-labelled tabs.
- Active tab highlighted in green.

### Typography
- Large sans-serif font (18px base, 24px for results, 32px for the big verdict banner).
- All currency values formatted with `£` prefix and commas (e.g. `£126,000`).
- All percentages shown with one decimal place.

### Inputs
- Every input field is a plain number input with:
  - A clear label to the left
  - The unit to the right (£, %, ha, hrs, L, etc.)
  - A `[?]` icon that shows a plain-English tooltip on hover/tap
- Fields grouped under collapsible sections with bold headers.
- "Overheads" section (interest, insurance, storage) is **collapsed by default** with a note: "Most farmers leave these as they are."

### Results
- Results section has a light grey background to visually separate it from inputs.
- The main verdict (own vs contractor) is a full-width coloured banner:
  - **Green background, white text**: owning is cheaper
  - **Red background, white text**: contractor is cheaper
  - **Amber background, dark text**: roughly break-even
- Breakdown shown below the banner in smaller text.

### Colours
- Primary: `#2E7D32` (farm green)
- Accent: `#1565C0` (AHDB blue - used for editable fields)
- Traffic lights: `#2E7D32` green, `#F9A825` amber, `#C62828` red
- Background: `#FAFAFA` light grey
- Cards/sections: `#FFFFFF` white with subtle shadow

### Mobile
- Responsive. On narrow screens, the two-machine comparison stacks vertically.
- All tap targets at least 44px.

---

## What This Does NOT Include

- User accounts or authentication
- Server-side logic or database
- Printing / PDF export (the browser's print function is sufficient)
- Historical price tracking
- Integration with dealer websites or fuel price APIs
- Multi-currency support (GBP only)
- Tax calculations (VAT, capital allowances)

---

## File Structure

```
farm-planner/
  index.html
  package.json
  tailwind.config.js
  vite.config.js
  tsconfig.json
  components.json              -- shadcn/ui config
  public/
    favicon.ico                -- tractor icon
  src/
    main.tsx                   -- React entry point
    App.tsx                    -- top-level layout, tab routing
    lib/
      utils.ts                 -- shadcn/ui cn() helper
      calculations.ts          -- all AHDB formulas + contracting + profitability (pure functions, no UI)
      repair-data.ts           -- AHDB repair cost lookup table
      contractor-data.ts       -- NAAC contractor rates data (SPEC-04, SPEC-09)
      depreciation-data.ts     -- depreciation profiles by machine category (SPEC-07)
      storage.ts               -- localStorage read/write, JSON export/import, version migrations
    components/
      ui/                      -- shadcn/ui primitives (tabs, input, card, tooltip, etc.)
      CostPerHectare.tsx       -- Tab 1
      CostPerHour.tsx          -- Tab 2
      DepreciationPanel.tsx    -- Tab 3 (SPEC-07)
      CompareMachines.tsx      -- Tab 4
      ReplacementPlanner.tsx   -- Tab 5
      ContractingIncomePlanner.tsx  -- Tab 6 (SPEC-10)
      ProfitabilityOverview.tsx    -- Tab 7 (SPEC-11)
      RepairEstimator.tsx      -- pop-up helper used by Tabs 1 & 2
      ContractorRatesPanel.tsx -- NAAC rate browser (SPEC-04, SPEC-09), used by Tabs 1, 2 & 6
      ResultBanner.tsx         -- green/amber/red verdict banner (shared)
      CostBreakdown.tsx        -- breakdown table used by Tabs 1 & 2
      TimelineChart.tsx        -- Gantt-style replacement timeline
      WorkrateBar.tsx          -- stacked horizontal bar for Tab 4
      DepreciationCurve.tsx    -- SVG depreciation chart (SPEC-07)
```

---

## Verification / Testing

1. **Calculation accuracy**: Enter the AHDB example values from the spreadsheet defaults and confirm the app produces identical results:
   - Hectare tab: Total cost = £30.27/ha, annual saving = -£54,880
   - Hour tab: Total cost = £65.56/hr, annual saving = £14,393.41
   - Workrate: Machine A overall rate = 1.40 ha/hr, Machine B = 9.64 ha/hr
   - Repair estimator: £69,000 tractor at 1000 hrs, 5% = £3,450
2. **Save/load**: Enter values, refresh browser, confirm values persist.
3. **Export/import**: Export JSON, clear localStorage, import JSON, confirm values restored.
4. **Responsive**: Check all tabs render correctly at 320px, 768px, and 1280px widths.
5. **Edge cases**: Zero in hours/hectares fields should show a friendly message, not Infinity or NaN.
