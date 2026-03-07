export interface ContractorRate {
  category: string
  operation: string
  rate: number
  unit: "ha" | "bale" | "hr" | "tonne" | "head" | "m"
}

export const NAAC_SOURCE = {
  name: "NAAC / Farmers Weekly",
  year: "2025-26",
  note: "Based on red diesel at 70p/L excl. AdBlue",
}

export const NAAC_RATES: ContractorRate[] = [
  // ── Soil Preparation (£/ha) ──
  { category: "Soil Prep", operation: "Ploughing (light)", rate: 79.21, unit: "ha" },
  { category: "Soil Prep", operation: "Ploughing (heavy)", rate: 87.22, unit: "ha" },
  { category: "Soil Prep", operation: "Deep ploughing (30cm+)", rate: 96.57, unit: "ha" },
  { category: "Soil Prep", operation: "Subsoiling", rate: 79.47, unit: "ha" },
  { category: "Soil Prep", operation: "Disc harrowing", rate: 63.06, unit: "ha" },
  { category: "Soil Prep", operation: "Power harrowing (shallow)", rate: 71.04, unit: "ha" },
  { category: "Soil Prep", operation: "Power harrowing (deep)", rate: 82.00, unit: "ha" },
  { category: "Soil Prep", operation: "Spring-tine harrowing", rate: 47.39, unit: "ha" },
  { category: "Soil Prep", operation: "One-pass tillage", rate: 83.63, unit: "ha" },
  { category: "Soil Prep", operation: "Rolling (flat)", rate: 35.11, unit: "ha" },
  { category: "Soil Prep", operation: "Rolling (ring)", rate: 25.83, unit: "ha" },
  { category: "Soil Prep", operation: "Furrow pressing", rate: 38.50, unit: "ha" },
  { category: "Soil Prep", operation: "Rotovating", rate: 91.36, unit: "ha" },
  { category: "Soil Prep", operation: "Mole-ploughing", rate: 66.13, unit: "ha" },
  { category: "Soil Prep", operation: "Stubble raking", rate: 37.84, unit: "ha" },
  { category: "Soil Prep", operation: "Pressing", rate: 34.27, unit: "ha" },
  { category: "Soil Prep", operation: "Bed tilling", rate: 102.50, unit: "ha" },
  { category: "Soil Prep", operation: "Chain harrowing", rate: 28.73, unit: "ha" },

  // ── Drilling (£/ha) ──
  { category: "Drilling", operation: "Cereals (conventional)", rate: 65.57, unit: "ha" },
  { category: "Drilling", operation: "Cereals (combination)", rate: 84.72, unit: "ha" },
  { category: "Drilling", operation: "Cereals (direct)", rate: 77.63, unit: "ha" },
  { category: "Drilling", operation: "OSR (subsoiler)", rate: 94.80, unit: "ha" },
  { category: "Drilling", operation: "Sugar beet", rate: 75.28, unit: "ha" },
  { category: "Drilling", operation: "Maize (precision)", rate: 60.63, unit: "ha" },
  { category: "Drilling", operation: "Grass seed (broadcast)", rate: 34.59, unit: "ha" },
  { category: "Drilling", operation: "Grass seed (harrow)", rate: 52.14, unit: "ha" },
  { category: "Drilling", operation: "Potato planting", rate: 180.00, unit: "ha" },
  { category: "Drilling", operation: "Carrot/parsnip/onion", rate: 195.00, unit: "ha" },
  { category: "Drilling", operation: "Maize under plastic", rate: 250.00, unit: "ha" },
  { category: "Drilling", operation: "Grass cross drilling", rate: 58.41, unit: "ha" },

  // ── Application (£/ha + dual-rate) ──
  { category: "Application", operation: "Fertiliser (granular)", rate: 15.93, unit: "ha" },
  { category: "Application", operation: "Fertiliser (liquid)", rate: 16.48, unit: "ha" },
  { category: "Application", operation: "Spraying (arable)", rate: 16.52, unit: "ha" },
  { category: "Application", operation: "Spraying (grassland)", rate: 24.24, unit: "ha" },
  { category: "Application", operation: "Spraying (grassland)", rate: 83.00, unit: "hr" },
  { category: "Application", operation: "Lime spreading", rate: 9.53, unit: "tonne" },
  { category: "Application", operation: "Slug pelleting", rate: 11.35, unit: "ha" },
  { category: "Application", operation: "Variable rate application", rate: 19.50, unit: "ha" },
  { category: "Application", operation: "Drone spreading", rate: 32.00, unit: "ha" },
  { category: "Application", operation: "Avadex application", rate: 18.75, unit: "ha" },
  { category: "Application", operation: "ATV spraying", rate: 12.50, unit: "ha" },
  { category: "Application", operation: "Weed wiping", rate: 30.00, unit: "ha" },

  // ── Harvesting (£/ha + dual-rate) ──
  { category: "Harvesting", operation: "Combining cereals", rate: 119.34, unit: "ha" },
  { category: "Harvesting", operation: "Combining OSR", rate: 119.44, unit: "ha" },
  { category: "Harvesting", operation: "Combining peas/beans", rate: 123.44, unit: "ha" },
  { category: "Harvesting", operation: "Grain maize", rate: 162.10, unit: "ha" },
  { category: "Harvesting", operation: "Forage harvesting", rate: 84.31, unit: "ha" },
  { category: "Harvesting", operation: "Forage harvesting", rate: 330.00, unit: "hr" },
  { category: "Harvesting", operation: "Straw chopper", rate: 38.50, unit: "ha" },
  { category: "Harvesting", operation: "OSR windrow", rate: 41.27, unit: "ha" },
  { category: "Harvesting", operation: "Swathing", rate: 52.83, unit: "ha" },
  { category: "Harvesting", operation: "Grain carting", rate: 25.41, unit: "ha" },
  { category: "Harvesting", operation: "Potato harvesting", rate: 340.00, unit: "ha" },
  { category: "Harvesting", operation: "Sugar beet harvesting", rate: 380.00, unit: "ha" },
  { category: "Harvesting", operation: "Grass – topping", rate: 48.14, unit: "ha" },
  { category: "Harvesting", operation: "Grass – topping", rate: 65.01, unit: "hr" },
  { category: "Harvesting", operation: "Grass – mowing", rate: 50.72, unit: "ha" },
  { category: "Harvesting", operation: "Grass – tedding", rate: 30.25, unit: "ha" },
  { category: "Harvesting", operation: "Grass – raking", rate: 29.87, unit: "ha" },
  { category: "Harvesting", operation: "Whole crop", rate: 92.00, unit: "ha" },
  { category: "Harvesting", operation: "Maize harvesting", rate: 96.50, unit: "ha" },
  { category: "Harvesting", operation: "Extra trailer for carting", rate: 23.06, unit: "ha" },
  { category: "Harvesting", operation: "Extra trailer for carting", rate: 61.73, unit: "hr" },
  { category: "Harvesting", operation: "Forage wagon", rate: 75.00, unit: "ha" },

  // ── Baling (£/bale) ──
  { category: "Baling", operation: "Small conventional", rate: 1.14, unit: "bale" },
  { category: "Baling", operation: "Round 1.2m", rate: 4.16, unit: "bale" },
  { category: "Baling", operation: "Round 1.5m", rate: 4.75, unit: "bale" },
  { category: "Baling", operation: "Square 80×90cm", rate: 4.72, unit: "bale" },
  { category: "Baling", operation: "Square 120×90cm", rate: 7.52, unit: "bale" },
  { category: "Baling", operation: "Square 120×70cm", rate: 6.80, unit: "bale" },
  { category: "Baling", operation: "Square 120×130cm", rate: 9.25, unit: "bale" },

  // ── Bale Wrapping (£/bale) ──
  { category: "Bale Wrapping", operation: "Round bale wrapping (4 layers)", rate: 3.25, unit: "bale" },
  { category: "Bale Wrapping", operation: "Round bale wrapping (6 layers)", rate: 4.10, unit: "bale" },
  { category: "Bale Wrapping", operation: "Square bale wrapping (4 layers)", rate: 5.50, unit: "bale" },
  { category: "Bale Wrapping", operation: "Square bale wrapping (6 layers)", rate: 6.75, unit: "bale" },
  { category: "Bale Wrapping", operation: "Combi baling (round, net + wrap)", rate: 8.50, unit: "bale" },
  { category: "Bale Wrapping", operation: "Combi baling (round, film only)", rate: 9.75, unit: "bale" },
  { category: "Bale Wrapping", operation: "Individual wrapping (tube)", rate: 3.80, unit: "bale" },
  { category: "Bale Wrapping", operation: "Bale chasing (round)", rate: 2.50, unit: "bale" },
  { category: "Bale Wrapping", operation: "Bale chasing (square)", rate: 3.00, unit: "bale" },

  // ── Slurry & Manure (£/tonne or £/hr) ──
  { category: "Slurry & Manure", operation: "FYM spreading (rear discharge)", rate: 3.93, unit: "tonne" },
  { category: "Slurry & Manure", operation: "FYM spreading (rear discharge)", rate: 69.55, unit: "hr" },
  { category: "Slurry & Manure", operation: "FYM spreading (side discharge)", rate: 5.00, unit: "tonne" },
  { category: "Slurry & Manure", operation: "FYM spreading (side discharge)", rate: 60.57, unit: "hr" },
  { category: "Slurry & Manure", operation: "Chicken litter spreading", rate: 4.25, unit: "tonne" },
  { category: "Slurry & Manure", operation: "Compost spreading", rate: 4.50, unit: "tonne" },
  { category: "Slurry & Manure", operation: "Digestate spreading", rate: 3.75, unit: "tonne" },
  { category: "Slurry & Manure", operation: "Loading shovel", rate: 55.00, unit: "hr" },
  { category: "Slurry & Manure", operation: "Slurry tanker (splash plate)", rate: 3.10, unit: "tonne" },
  { category: "Slurry & Manure", operation: "Slurry tanker (trailing shoe)", rate: 4.20, unit: "tonne" },
  { category: "Slurry & Manure", operation: "Slurry umbilical (trailing shoe)", rate: 3.85, unit: "tonne" },
  { category: "Slurry & Manure", operation: "Slurry injection", rate: 5.50, unit: "tonne" },
  { category: "Slurry & Manure", operation: "Slurry separating", rate: 2.80, unit: "tonne" },

  // ── Tractor Hire (£/hr) ──
  { category: "Tractor Hire", operation: "100\u2013150 HP", rate: 50.75, unit: "hr" },
  { category: "Tractor Hire", operation: "150\u2013220 HP", rate: 58.17, unit: "hr" },
  { category: "Tractor Hire", operation: "220\u2013300 HP", rate: 70.25, unit: "hr" },
  { category: "Tractor Hire", operation: "300+ HP", rate: 91.00, unit: "hr" },
  { category: "Tractor Hire", operation: "Post knocker", rate: 65.00, unit: "hr" },
  { category: "Tractor Hire", operation: "Ditching (180\u00b0)", rate: 75.00, unit: "hr" },
  { category: "Tractor Hire", operation: "Ditching (360\u00b0)", rate: 95.00, unit: "hr" },
  { category: "Tractor Hire", operation: "Drain jetting", rate: 85.00, unit: "hr" },
  { category: "Tractor Hire", operation: "Trailer charge", rate: 42.00, unit: "hr" },
  { category: "Tractor Hire", operation: "Forklift", rate: 48.00, unit: "hr" },

  // ── Hedges & Boundaries (£/m or £/hr) ──
  { category: "Hedges & Boundaries", operation: "Hedge cutting (flail)", rate: 0.14, unit: "m" },
  { category: "Hedges & Boundaries", operation: "Hedge cutting (saw)", rate: 0.20, unit: "m" },
  { category: "Hedges & Boundaries", operation: "Hedge cutting (circular knife)", rate: 0.18, unit: "m" },
  { category: "Hedges & Boundaries", operation: "Hedge laying", rate: 12.50, unit: "m" },
  { category: "Hedges & Boundaries", operation: "Excavator + tree shear", rate: 85.00, unit: "hr" },
  { category: "Hedges & Boundaries", operation: "Verge mowing", rate: 0.10, unit: "m" },
  { category: "Hedges & Boundaries", operation: "Fence erection (post & wire)", rate: 7.50, unit: "m" },
  { category: "Hedges & Boundaries", operation: "Fence erection (stock netting)", rate: 9.00, unit: "m" },
  { category: "Hedges & Boundaries", operation: "Fence erection (post & rail)", rate: 15.00, unit: "m" },

  // ── Mobile Feed (£/tonne) ──
  { category: "Mobile Feed", operation: "Feed mixing", rate: 12.50, unit: "tonne" },
  { category: "Mobile Feed", operation: "Crimping", rate: 18.00, unit: "tonne" },

  // ── Livestock Services (£/head) ──
  { category: "Livestock Services", operation: "Sheep shearing (ewes)", rate: 2.10, unit: "head" },
  { category: "Livestock Services", operation: "Sheep shearing (rams)", rate: 3.50, unit: "head" },
  { category: "Livestock Services", operation: "Sheep crutching", rate: 1.20, unit: "head" },
  { category: "Livestock Services", operation: "Sheep dipping", rate: 1.50, unit: "head" },

  // ── Specialist (£/hr) ──
  { category: "Specialist", operation: "Snow ploughing", rate: 75.00, unit: "hr" },
  { category: "Specialist", operation: "Labour only", rate: 18.50, unit: "hr" },
  { category: "Specialist", operation: "Chainsawing", rate: 45.00, unit: "hr" },
]

export function getRatesByCategory(category: string): ContractorRate[] {
  return NAAC_RATES.filter(r => r.category === category)
}

export function getRatesByUnit(unit: ContractorRate["unit"]): ContractorRate[] {
  return NAAC_RATES.filter(r => r.unit === unit)
}
