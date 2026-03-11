# Issues Found — AHDB Calculator Verification

**Date:** 2026-03-11

---

## Issue 1: Replacement Planner — Off-by-one in average annual cost

**Severity:** Low
**File:** `src/lib/calculations.ts:289–326`
**Function:** `calcReplacementSummary()`

### Description

The `averageAnnualCost` divides `totalSpend` by `annualCosts.length`, which includes year 0 (the current year). Year 0 always has zero cost because machines with `timeToChange <= 0` are skipped (line 307). This means the denominator is `effectiveSpan + 1` instead of `effectiveSpan`.

### Code

```typescript
// Line 301: loop includes year 0
for (let i = 0; i <= effectiveSpan; i++) {
  annualCosts.push({ year: startYear + i, cost: 0 });
}

// Line 307: year-0 machines are skipped
if (machine.timeToChange <= 0) continue;

// Line 316–317: average includes the zero-cost year 0
const numYears = annualCosts.length > 0 ? annualCosts.length : 1;
const averageAnnualCost = totalSpend / numYears;
```

### Example

If `effectiveSpan = 6` and total spend is £60,000:
- **Current behaviour:** `£60,000 / 7 = £8,571/yr` (divides by 7 because array has indices 0–6)
- **Expected behaviour:** `£60,000 / 6 = £10,000/yr` (divides by 6 actual future years)

This understates the average annual cost by `1/(effectiveSpan+1)` — roughly 14% for a 6-year span, declining for longer spans.

### Recommendation

Change the divisor to `effectiveSpan` (the number of future years), or start the loop at `i = 1`:

```typescript
// Option A: fix the divisor
const averageAnnualCost = effectiveSpan > 0 ? totalSpend / effectiveSpan : 0;

// Option B: start array at year 1
for (let i = 1; i <= effectiveSpan; i++) { ... }
```

Note: If the intent is to show the cost array starting from "this year" for charting purposes, Option A is simpler — keep the array for display but fix the average calculation.

---

## Issue 2: Hour Sheet — Fuel calculation uses different input model

**Severity:** Informational (not a bug)
**File:** `src/lib/calculations.ts:209`

### Description

The AHDB spreadsheet calculates fuel cost per hour from three inputs:

```
fuel/hr = (ha/hr) × (L/ha) × (£/L)
```

The web app simplifies to two inputs:

```
fuel/hr = (L/hr) × (ppl) / 100
```

This is mathematically valid since `(ha/hr) × (L/ha) = L/hr`. However, users familiar with the AHDB spreadsheet may expect to enter work rate and per-hectare fuel consumption separately.

### Recommendation

No code change required. Consider adding a tooltip or help text on the fuel consumption field noting: *"If you know your fuel use in L/ha, multiply by your work rate (ha/hr) to get L/hr."*

---

## Issue 3: Workrate Sheet D18 fix — improvement over spreadsheet

**Severity:** Informational (web app is correct)
**File:** `src/lib/calculations.ts:251–252`

### Description

The original AHDB spreadsheet cell D18 hardcodes a value instead of deriving it from the formula `60 × 100 = 6000` (where 60 converts minutes to hours and 100 accounts for field efficiency being expressed as a percentage). The web app uses the constant `6000` with a clear comment explaining the derivation.

This is documented for completeness — no action needed.

---

## Issue 4: Repair costs interpolation — improvement over spreadsheet

**Severity:** Informational (web app is correct)
**File:** `src/lib/repair-data.ts:80–99`

### Description

The AHDB spreadsheet provides repair cost percentages only at fixed hour brackets (e.g., 50, 100, 150, 200 hours). Users must manually select the nearest bracket. The web app adds:

1. **Linear interpolation** between bracket points (e.g., 75 hours returns a value between the 50-hour and 100-hour percentages)
2. **Extrapolation** beyond the maximum bracket using `perExtra100` rates derived from the table pattern

All bracket-point values match the spreadsheet exactly. The interpolation is a strict improvement.

---

## Summary Table

| # | Issue | Severity | Action Required |
|---|-------|----------|----------------|
| 1 | Replacement planner off-by-one average | Low | Fix recommended |
| 2 | Hour sheet fuel input model difference | Informational | Optional UX note |
| 3 | Workrate D18 hardcode fixed | Informational | None (improvement) |
| 4 | Repair costs interpolation added | Informational | None (improvement) |
