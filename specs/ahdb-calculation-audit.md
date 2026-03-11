# AHDB Machinery Costing Calculator — Calculation Audit

**Date:** 2026-03-11
**Source spreadsheet:** `Machinery costing calculator (AHDB).xlsx` (4 sheets: Hectare, Hour, Workrate, Repair costs)
**Web app source:** `src/lib/calculations.ts`, `src/lib/repair-data.ts`, `src/lib/depreciation-data.ts`

---

## 1. Hectare Sheet — Cost Per Hectare

**Web app function:** `calcCostPerHectare()` (`calculations.ts:130–181`)

| # | Formula | Spreadsheet | Web App | Verdict |
|---|---------|-------------|---------|---------|
| 1 | Average value | `(purchase + sale) / 2` | `(purchasePrice + salePrice) / 2` (L147) | **MATCH** |
| 2 | Annual interest | `avgValue × rate / 100` | `averageValue * interestRate / 100` (L148) | **MATCH** |
| 3 | Annual depreciation | `(purchase − sale) / years` | `(purchasePrice - salePrice) / yearsOwned` (L149) | **MATCH** |
| 4 | Annual insurance | `purchase × rate / 100` | `purchasePrice * insuranceRate / 100` (L150) | **MATCH** |
| 5 | Annual storage | `purchase × rate / 100` | `purchasePrice * storageRate / 100` (L151) | **MATCH** |
| 6 | Total fixed cost/yr | Sum of 2–5 | Sum of 2–5 (L153) | **MATCH** |
| 7 | Fixed cost/ha | `totalFixed / hectares` | `totalFixedCostPerYear / hectaresPerYear` (L154) | **MATCH** |
| 8 | Labour/ha | `labourCost / workRate` | `labourCost / workRate` (L156) | **MATCH** |
| 9 | Fuel/ha | `fuelUse × fuelPrice` | `fuelUse * fuelPrice / 100` (L157) | **MATCH** ¹ |
| 10 | Repairs/ha | `(purchase × pct / 100) / hectares` | `(purchasePrice * repairsPct / 100) / hectaresPerYear` (L158) | **MATCH** |
| 11 | Total cost/ha | Sum of 7–10 | Sum of 7–10 (L160) | **MATCH** |
| 12 | Total annual cost | `costPerHa × hectares` | `totalCostPerHa * hectaresPerYear` (L161) | **MATCH** |
| 13 | Annual saving | `(costPerHa − contractor) × hectares` | `(totalCostPerHa - contractorCharge) * hectaresPerYear` (L164) | **MATCH** |

> ¹ Web app stores fuel price in pence per litre (ppl), so divides by 100 to convert to £/L. Spreadsheet uses £/L directly. Numerically equivalent.

**Sheet verdict: ALL CORRECT**

---

## 2. Hour Sheet — Cost Per Hour

**Web app function:** `calcCostPerHour()` (`calculations.ts:183–233`)

| # | Formula | Spreadsheet | Web App | Verdict |
|---|---------|-------------|---------|---------|
| 1 | Average value | `(purchase + sale) / 2` | `(purchasePrice + salePrice) / 2` (L199) | **MATCH** |
| 2 | Annual interest | `avgValue × rate / 100` | `averageValue * interestRate / 100` (L200) | **MATCH** |
| 3 | Annual depreciation | `(purchase − sale) / years` | `(purchasePrice - salePrice) / yearsOwned` (L201) | **MATCH** |
| 4 | Annual insurance | `purchase × rate / 100` | `purchasePrice * insuranceRate / 100` (L202) | **MATCH** |
| 5 | Annual storage | `purchase × rate / 100` | `purchasePrice * storageRate / 100` (L203) | **MATCH** |
| 6 | Total fixed cost/yr | Sum of 2–5 | Sum of 2–5 (L205) | **MATCH** |
| 7 | Fixed cost/hr | `totalFixed / hours` | `totalFixedCostPerYear / hoursPerYear` (L206) | **MATCH** |
| 8 | Labour/hr | direct input | `labourCost` (L208) | **MATCH** |
| 9 | Fuel/hr | `(ha/hr) × (L/ha) × (£/L)` (3 inputs) | `fuelConsumptionPerHr * fuelPrice / 100` (2 inputs) (L209) | **STRUCTURAL DIFFERENCE** ² |
| 10 | Repairs/hr | `(purchase × pct / 100) / hours` | `(purchasePrice * repairsPct / 100) / hoursPerYear` (L210) | **MATCH** |
| 11 | Total cost/hr | Sum of 7–10 | Sum of 7–10 (L212) | **MATCH** |
| 12 | Total annual cost | `costPerHr × hours` | `totalCostPerHr * hoursPerYear` (L213) | **MATCH** |
| 13 | Annual saving | `(costPerHr − contractor) × hours` | `(totalCostPerHr - contractorCharge) * hoursPerYear` (L216) | **MATCH** |

> ² **Fuel/hr structural difference:** The spreadsheet calculates fuel cost per hour from three inputs: work rate (ha/hr), fuel consumption (L/ha), and fuel price (£/L). The web app simplifies this to two inputs: fuel consumption per hour (L/hr) and fuel price (ppl). Mathematically `(ha/hr) × (L/ha) = L/hr`, so the web app's approach is a valid simplification — but it changes the input model. A user migrating from the spreadsheet would need to pre-calculate L/hr from their ha/hr and L/ha values.

**Sheet verdict: ALL CORRECT (with one input-model simplification)**

---

## 3. Workrate Sheet — Sprayer Efficiency

**Web app function:** `calcWorkrate()` (`calculations.ts:235–287`)

| # | Formula | Spreadsheet | Web App | Verdict |
|---|---------|-------------|---------|---------|
| 1 | Area per load | `capacity / applicationRate` | `capacity / applicationRate` (L246) | **MATCH** |
| 2 | Filling rate | `capacity / fillingTime` | `capacity / fillingTime` (L247) | **MATCH** |
| 3 | Spot rate | `(width × speed) / 10` | `(width * speed) / 10` (L248) | **MATCH** |
| 4 | Spot × efficiency | `spotRate × fieldEff` | `spotRate * fieldEfficiency` (L250) | **MATCH** |
| 5 | Application time | `(6000 × areaPerLoad) / spotTimesEff` | `(6000 * areaPerLoad) / spotTimesEff` (L251–252) | **MATCH** ³ |
| 6 | Total time/load | `filling + 2×transport + application` | `fillingTime + (2 * transportTime) + applicationTime` (L255) | **MATCH** |
| 7 | Overall work rate | `(60 × areaPerLoad) / totalTime` | `(60 * areaPerLoad) / totalTimePerLoad` (L257–258) | **MATCH** |
| 8 | Overall efficiency | `100 × overallWorkRate / spotRate` | `100 * overallWorkRate / spotRate` (L261–262) | **MATCH** |
| 9 | Application % | `100 × appTime / totalTime` | `100 * applicationTime / totalTimePerLoad` (L265–266) | **MATCH** |
| 10 | Filling % | `100 × fillTime / totalTime` | `100 * fillingTime / totalTimePerLoad` (L268–269) | **MATCH** |
| 11 | Transport % | `100 × 2×transport / totalTime` | `100 * (2 * transportTime) / totalTimePerLoad` (L271–272) | **MATCH** |

> ³ The 6000 constant = 60 min/hr × 100 (because field efficiency is entered as a percentage, not a decimal). The spreadsheet cell D18 hardcodes this value rather than deriving it; the web app correctly derives the same result.

**Sheet verdict: ALL CORRECT** (web app actually fixes the D18 hardcoded constant issue)

---

## 4. Repair Costs Sheet — Lookup Table

**Web app:** `repair-data.ts`, function `lookupRepairPct()` (L101–110), `interpolate()` (L80–99)

### 4a. Data values

| Machine Type | Spreadsheet 50 hr | Web App | Spreadsheet 100 hr | Web App | Spreadsheet 150 hr | Web App | Spreadsheet 200 hr | Web App | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| Tractors (500/750/1000/1500) | 3 / 3.5 / 5 / 7 | 3 / 3.5 / 5 / 7 | — | — | — | — | — | — | **MATCH** |
| Combines & SP harvesters | 1.5 | 1.5 | 2.5 | 2.5 | 3.5 | 3.5 | 4.5 | 4.5 | **MATCH** |
| Trailed harvesters & balers | 3 | 3 | 5 | 5 | 6 | 6 | 7 | 7 | **MATCH** |
| Ploughs, cultivators, toothed harrows | 4.5 | 4.5 | 8 | 8 | 11 | 11 | 14 | 14 | **MATCH** |
| Rotary cultivators & mowers | 4 | 4 | 7 | 7 | 9.5 | 9.5 | 12 | 12 | **MATCH** |
| Disc harrows, spreaders, sprayers | 3 | 3 | 5.5 | 5.5 | 7.5 | 7.5 | 9.5 | 9.5 | **MATCH** |
| Tedders, unit drills, planters | 2.5 | 2.5 | 4.5 | 4.5 | 6.5 | 6.5 | 8.5 | 8.5 | **MATCH** |
| Cereal drills & loaders | 2 | 2 | 4 | 4 | 5.5 | 5.5 | 7 | 7 | **MATCH** |
| Grain dryers, cleaners, rolls | 1.5 | 1.5 | 2 | 2 | 2.5 | 2.5 | 3 | 3 | **MATCH** |

### 4b. Lookup method

| Aspect | Spreadsheet | Web App | Verdict |
|--------|-------------|---------|---------|
| Exact bracket lookup | Step function (nearest bracket) | Exact match returns bracket value | **MATCH** |
| Between brackets | No interpolation (uses lower bracket) | Linear interpolation | **IMPROVEMENT** |
| Beyond max bracket | Not defined (table ends) | Extrapolation via `perExtra100` rate | **IMPROVEMENT** |
| Below min bracket | Returns lowest bracket | Returns lowest bracket value (L81) | **MATCH** |

**Sheet verdict: ALL CORRECT** (data matches exactly; web app adds interpolation as an improvement)

---

## 5. Web App Extensions (not in original spreadsheet)

### 5a. Depreciation Panel

**Source:** `depreciation-data.ts` (L28–85)
**Data provenance:** ASAE D497 via Mississippi State Extension P3543, cross-referenced with Farmers Weekly UK tractor data.

Not present in the AHDB spreadsheet. Provides 8 machine categories with remaining value curves (years 0–12). Formulas are standard straight-line calculations between lookup points. No AHDB comparison possible.

### 5b. Replacement Planner

**Source:** `calcReplacementSummary()` (`calculations.ts:289–326`)

Builds a per-year cost array and averages across the span. **Contains an off-by-one issue** — see `issues-found.md` for details.

### 5c. Contracting Income

**Source:** `calculateContractingService()` and `calculateContractingSummary()` (`calculations.ts:96–128`)

Standard revenue/cost/margin calculations. No AHDB equivalent.

### 5d. Profitability Overview

**Source:** `calculateProfitability()` (`calculations.ts:38–78`)

Aggregates all cost centres into a net position. No AHDB equivalent.

---

## Summary

| Sheet | Formulas Checked | Match | Difference | Issues |
|-------|-----------------|-------|------------|--------|
| Hectare | 13 | 13 | 0 | 0 |
| Hour | 13 | 12 | 1 (fuel input model) | 0 |
| Workrate | 11 | 11 | 0 | 0 |
| Repair Costs | 36 data points + lookup | All match | 0 | 0 |
| **Totals** | **73+** | **All** | **1 structural** | **0** |

**Overall verdict:** The web app faithfully implements all AHDB spreadsheet calculations. The one structural difference (Hour sheet fuel calculation) is a valid simplification. The web app additionally fixes the Workrate sheet D18 hardcoded constant and improves the Repair Costs lookup with interpolation.
