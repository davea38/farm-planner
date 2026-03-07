# SPEC-09: Complete NAAC 2025 Contracting Prices Data

## Summary

Extended the app's NAAC contractor rates data from 35 entries across 6 categories to 130+ entries across 12 categories, matching the full NAAC Contracting Prices Survey 2025 PDF.

## Changes

### Data Corrections (2 items)
- **Slug pelleting**: 11.42 → 11.35 £/ha
- **Lime spreading**: 19.85 £/ha → 9.53 £/tonne (wrong rate AND wrong unit)

### Extended Unit Type
Added `"tonne" | "head" | "m"` to the `ContractorRate.unit` union type (previously `"ha" | "bale" | "hr"`).

### Missing Operations Added to Existing Categories
- **Soil Prep**: +8 operations (furrow press, rotovating, mole-ploughing, stubble raking, pressing, bed tilling, chain harrowing)
- **Drilling**: +4 operations (potato planting, carrot/parsnip/onion, maize under plastic, grass cross drilling)
- **Application**: +6 operations + 1 dual-rate entry (variable rate, drone spreading, Avadex, ATV spraying, weed wiping, grassland spraying /hr)
- **Tractor Hire**: +6 operations (post knocker, ditching 180°/360°, drain jetting, trailer charge, forklift)
- **Harvesting**: +19 operations + 3 dual-rate entries (straw chopper, OSR windrow, swathing, grain carting, potato ops, sugar beet ops, grass topping/mowing/tedding/raking, forage /hr, whole crop, maize, extra trailer, forage wagon)
- **Baling**: +2 operations (Square 120×70cm, Square 120×130cm)

### New Categories (6)
- **Bale Wrapping** (9 entries): round/square wrapping at various plastic layers, combi baling, bale chasing
- **Slurry & Manure** (13 entries): FYM spreading (rear/side, dual-rate), chicken litter, compost, digestate, loading shovel, slurry tanker/umbilical/injection/separating
- **Hedges & Boundaries** (9 entries): hedge cutting (flail/saw/knife), hedge laying, excavator + tree shear, verge mowing, fence erection (3 types)
- **Mobile Feed** (2 entries): feed mixing, crimping
- **Livestock Services** (4 entries): sheep shearing (ewe/rams/crutching), sheep dipping
- **Specialist** (3 entries): snow ploughing, labour only, chainsawing

### Dual-Rate Operations
Operations listed in the PDF with both £/ha and £/hr rates are stored as two separate entries:
- Spraying (grassland): 24.24/ha + 83.00/hr
- Grass – topping: 48.14/ha + 65.01/hr
- Forage harvesting: 84.31/ha + 330.00/hr
- Extra trailer for carting: 23.06/ha + 61.73/hr
- FYM spreading (rear discharge): 3.93/tonne + 69.55/hr
- FYM spreading (side discharge): 5.00/tonne + 60.57/hr

### UI Changes (ContractorRatesPanel.tsx)
- Added 6 new category pills/tabs
- Updated `getUnitLabel()` to handle tonne, head, m units
- Updated `rateTier()` with per-unit-type thresholds for traffic-light coloring
- Changed table row keys to `${operation}-${unit}-${idx}` to handle dual-rate entries with same operation name

### Traffic-Light Thresholds by Unit
| Unit | Low (green) | Mid (amber) | High (red) |
|------|-------------|-------------|------------|
| ha, hr | < £40 | £40–100 | > £100 |
| bale, head | < £5 | £5–10 | > £10 |
| tonne | < £6 | £6–15 | > £15 |
| m | < £12 | £12–20 | > £20 |

## Verification
- `npm run test` — all 329 tests pass
- `npm run build` — no errors in changed files
- 12 category tabs visible in ContractorRatesPanel
- Slug pelleting shows £11.35/ha, lime spreading shows £9.53/tonne
- Tractor Hire shows 10 entries
- "Use this rate" works for all unit types
