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
  // Soil Preparation (£/ha)
  { category: "Soil Prep", operation: "Ploughing (light)", rate: 79.21, unit: "ha" },
  { category: "Soil Prep", operation: "Ploughing (heavy)", rate: 87.22, unit: "ha" },
  { category: "Soil Prep", operation: "Deep ploughing (30cm+)", rate: 96.57, unit: "ha" },
  { category: "Soil Prep", operation: "Add for furrow press on plough", rate: 9.47, unit: "ha" },
  { category: "Soil Prep", operation: "Subsoiling", rate: 79.47, unit: "ha" },
  { category: "Soil Prep", operation: "Disc harrowing", rate: 63.06, unit: "ha" },
  { category: "Soil Prep", operation: "Power harrowing (shallow)", rate: 71.04, unit: "ha" },
  { category: "Soil Prep", operation: "Power harrowing (deep)", rate: 82.00, unit: "ha" },
  { category: "Soil Prep", operation: "Rotovating (ploughed land/grass)", rate: 97.84, unit: "ha" },
  { category: "Soil Prep", operation: "Spring-tine harrowing", rate: 47.39, unit: "ha" },
  { category: "Soil Prep", operation: "One-pass tillage", rate: 83.63, unit: "ha" },
  { category: "Soil Prep", operation: "Mole-ploughing \u2013 Single leg", rate: 107.78, unit: "ha" },
  { category: "Soil Prep", operation: "Mole-ploughing \u2013 Twin leg", rate: 101.58, unit: "ha" },
  { category: "Soil Prep", operation: "Stubble raking", rate: 29.65, unit: "ha" },
  { category: "Soil Prep", operation: "Pressing (Rexustwin/Cultipress)", rate: 60.57, unit: "ha" },
  { category: "Soil Prep", operation: "Bed tilling", rate: 258.98, unit: "ha" },
  { category: "Soil Prep", operation: "Chain harrowing", rate: 33.90, unit: "ha" },
  { category: "Soil Prep", operation: "Rolling (flat)", rate: 35.11, unit: "ha" },
  { category: "Soil Prep", operation: "Rolling (ring)", rate: 25.83, unit: "ha" },

  // Drilling (£/ha)
  { category: "Drilling", operation: "Cereals (conventional)", rate: 65.57, unit: "ha" },
  { category: "Drilling", operation: "Cereals (combination)", rate: 84.72, unit: "ha" },
  { category: "Drilling", operation: "Cereals (direct)", rate: 77.63, unit: "ha" },
  { category: "Drilling", operation: "OSR (subsoiler)", rate: 94.80, unit: "ha" },
  { category: "Drilling", operation: "Sugar beet", rate: 75.28, unit: "ha" },
  { category: "Drilling", operation: "Maize (precision)", rate: 60.63, unit: "ha" },
  { category: "Drilling", operation: "Potato planting", rate: 248.55, unit: "ha" },
  { category: "Drilling", operation: "Carrot/parsnip/onion precision drilling", rate: 98.84, unit: "ha" },
  { category: "Drilling", operation: "Maize drilling under plastic", rate: 163.08, unit: "ha" },
  { category: "Drilling", operation: "Grass seed (broadcast)", rate: 34.59, unit: "ha" },
  { category: "Drilling", operation: "Grass seed (harrow)", rate: 52.14, unit: "ha" },
  { category: "Drilling", operation: "Grass seed \u2013 cross drilling (per pass)", rate: 68.09, unit: "ha" },

  // Application
  { category: "Application", operation: "Fertiliser (granular)", rate: 15.93, unit: "ha" },
  { category: "Application", operation: "Fertiliser (liquid)", rate: 16.48, unit: "ha" },
  { category: "Application", operation: "Extra for variable rate application", rate: 6.04, unit: "ha" },
  { category: "Application", operation: "Drone fertiliser spreading", rate: 37.06, unit: "ha" },
  { category: "Application", operation: "Spraying (arable)", rate: 16.52, unit: "ha" },
  { category: "Application", operation: "Spraying (grassland)", rate: 24.24, unit: "ha" },
  { category: "Application", operation: "Spraying (grassland)", rate: 83.00, unit: "hr" },
  { category: "Application", operation: "Avadex application", rate: 19.41, unit: "ha" },
  { category: "Application", operation: "ATV spraying", rate: 50.67, unit: "hr" },
  { category: "Application", operation: "Weed wiping", rate: 75.00, unit: "hr" },
  { category: "Application", operation: "Lime spreading", rate: 9.53, unit: "tonne" },
  { category: "Application", operation: "Slug pelleting", rate: 11.35, unit: "ha" },

  // Harvesting
  { category: "Harvesting", operation: "Combining cereals", rate: 119.34, unit: "ha" },
  { category: "Harvesting", operation: "Extra for straw chopper on combine", rate: 12.73, unit: "ha" },
  { category: "Harvesting", operation: "Combining OSR", rate: 119.44, unit: "ha" },
  { category: "Harvesting", operation: "Combining OSR \u2013 out of windrow", rate: 128.08, unit: "ha" },
  { category: "Harvesting", operation: "Swathing rape", rate: 65.07, unit: "ha" },
  { category: "Harvesting", operation: "Combining peas/beans", rate: 123.44, unit: "ha" },
  { category: "Harvesting", operation: "Grain maize", rate: 162.10, unit: "ha" },
  { category: "Harvesting", operation: "Grain carting to barn", rate: 58.56, unit: "hr" },
  { category: "Harvesting", operation: "Potato harvesting only", rate: 800.35, unit: "ha" },
  { category: "Harvesting", operation: "Potato harvesting and carting", rate: 1235.48, unit: "ha" },
  { category: "Harvesting", operation: "Potato \u2013 de-stoning land", rate: 345.63, unit: "ha" },
  { category: "Harvesting", operation: "Sugar beet harvesting \u2013 harvesting only", rate: 291.57, unit: "ha" },
  { category: "Harvesting", operation: "Sugar beet harvesting \u2013 harvesting and carting", rate: 325.31, unit: "ha" },
  { category: "Harvesting", operation: "Topping margins/flail mowing", rate: 52.34, unit: "ha" },
  { category: "Harvesting", operation: "Grass \u2013 topping", rate: 48.14, unit: "ha" },
  { category: "Harvesting", operation: "Grass \u2013 topping", rate: 65.01, unit: "hr" },
  { category: "Harvesting", operation: "Grass \u2013 mowing", rate: 38.35, unit: "ha" },
  { category: "Harvesting", operation: "Grass \u2013 tedding", rate: 23.82, unit: "ha" },
  { category: "Harvesting", operation: "Grass \u2013 raking", rate: 24.24, unit: "ha" },
  { category: "Harvesting", operation: "Forage harvesting", rate: 84.31, unit: "ha" },
  { category: "Harvesting", operation: "Forage harvesting", rate: 330.00, unit: "hr" },
  { category: "Harvesting", operation: "Whole crop forage harvesting, cart & clamping", rate: 208.38, unit: "ha" },
  { category: "Harvesting", operation: "Complete service \u2013 mow, rake, forage, cart & clamp", rate: 196.93, unit: "ha" },
  { category: "Harvesting", operation: "Maize harvesting incl. carting & clamping", rate: 229.62, unit: "ha" },
  { category: "Harvesting", operation: "Extra trailer for carting silage/maize/whole crop", rate: 23.06, unit: "ha" },
  { category: "Harvesting", operation: "Extra trailer for carting silage/maize/whole crop", rate: 61.73, unit: "hr" },
  { category: "Harvesting", operation: "Forage wagon", rate: 131.75, unit: "hr" },

  // Baling (£/bale)
  { category: "Baling", operation: "Small conventional", rate: 1.14, unit: "bale" },
  { category: "Baling", operation: "Round 1.2m", rate: 4.16, unit: "bale" },
  { category: "Baling", operation: "Round 1.5m", rate: 4.75, unit: "bale" },
  { category: "Baling", operation: "Square 80\u00d790cm", rate: 4.72, unit: "bale" },
  { category: "Baling", operation: "Square 120\u00d790cm", rate: 7.52, unit: "bale" },
  { category: "Baling", operation: "Square 120\u00d770cm", rate: 5.93, unit: "bale" },
  { category: "Baling", operation: "Square 120\u00d7130cm", rate: 8.78, unit: "bale" },

  // Bale Wrapping (£/bale)
  { category: "Bale Wrapping", operation: "Round 120cm (6 layers plastic)", rate: 7.09, unit: "bale" },
  { category: "Bale Wrapping", operation: "Round 120cm (4 layers plastic)", rate: 6.23, unit: "bale" },
  { category: "Bale Wrapping", operation: "Round 120cm (without plastic)", rate: 3.26, unit: "bale" },
  { category: "Bale Wrapping", operation: "Square 80\u00d790cm (6 layers plastic)", rate: 7.25, unit: "bale" },
  { category: "Bale Wrapping", operation: "Square 120\u00d770cm (6 layers plastic)", rate: 8.87, unit: "bale" },
  { category: "Bale Wrapping", operation: "Square 120\u00d770cm (4 layers plastic)", rate: 7.96, unit: "bale" },
  { category: "Bale Wrapping", operation: "Square 120\u00d770cm (without plastic)", rate: 3.62, unit: "bale" },
  { category: "Bale Wrapping", operation: "Combi baling and wrapping (6 layers plastic)", rate: 10.96, unit: "bale" },
  { category: "Bale Wrapping", operation: "Bale chasing (per bale)", rate: 3.25, unit: "bale" },

  // Tractor Hire (£/hr)
  { category: "Tractor Hire", operation: "100\u2013150 HP", rate: 50.75, unit: "hr" },
  { category: "Tractor Hire", operation: "150\u2013220 HP", rate: 58.17, unit: "hr" },
  { category: "Tractor Hire", operation: "220\u2013300 HP", rate: 70.25, unit: "hr" },
  { category: "Tractor Hire", operation: "300+ HP", rate: 91.00, unit: "hr" },
  { category: "Tractor Hire", operation: "Tractor + post knocker + man", rate: 57.63, unit: "hr" },
  { category: "Tractor Hire", operation: "Ditching using 180 degree digger", rate: 49.33, unit: "hr" },
  { category: "Tractor Hire", operation: "Ditching using 360 degree digger", rate: 56.50, unit: "hr" },
  { category: "Tractor Hire", operation: "Drain jetting", rate: 60.00, unit: "hr" },
  { category: "Tractor Hire", operation: "Additional charge for trailer", rate: 15.35, unit: "hr" },
  { category: "Tractor Hire", operation: "Forklift/telehandler + man", rate: 57.36, unit: "hr" },

  // Slurry & Manure
  { category: "Slurry & Manure", operation: "FYM spreading (rear discharge)", rate: 3.93, unit: "tonne" },
  { category: "Slurry & Manure", operation: "FYM spreading (rear discharge)", rate: 69.55, unit: "hr" },
  { category: "Slurry & Manure", operation: "FYM spreading (side discharge)", rate: 5.00, unit: "tonne" },
  { category: "Slurry & Manure", operation: "FYM spreading (side discharge)", rate: 60.57, unit: "hr" },
  { category: "Slurry & Manure", operation: "Loading & spreading chicken litter", rate: 6.11, unit: "tonne" },
  { category: "Slurry & Manure", operation: "Loading & spreading FYM, Compost", rate: 3.50, unit: "tonne" },
  { category: "Slurry & Manure", operation: "Loading & spreading digestate fibre", rate: 5.50, unit: "tonne" },
  { category: "Slurry & Manure", operation: "Loading shovel", rate: 72.69, unit: "hr" },
  { category: "Slurry & Manure", operation: "Slurry spreading (tanker trailing shoe/dribble bar)", rate: 75.61, unit: "hr" },
  { category: "Slurry & Manure", operation: "Slurry spreading (umbilical)", rate: 142.50, unit: "hr" },
  { category: "Slurry & Manure", operation: "Slurry spreading (extra pump)", rate: 73.00, unit: "hr" },
  { category: "Slurry & Manure", operation: "Slurry injection", rate: 136.00, unit: "hr" },
  { category: "Slurry & Manure", operation: "Slurry Separating Service (~100m\u00b3/hr)", rate: 140.00, unit: "hr" },

  // Hedges & Boundaries
  { category: "Hedges & Boundaries", operation: "Hedge cutting \u2013 flail", rate: 53.74, unit: "hr" },
  { category: "Hedges & Boundaries", operation: "Hedge cutting \u2013 saw blade", rate: 70.63, unit: "hr" },
  { category: "Hedges & Boundaries", operation: "Hedge cutting \u2013 reciprocating knife", rate: 66.00, unit: "hr" },
  { category: "Hedges & Boundaries", operation: "Hedge laying", rate: 17.00, unit: "m" },
  { category: "Hedges & Boundaries", operation: "360 Excavator (7.5t) and tree shear", rate: 80.16, unit: "hr" },
  { category: "Hedges & Boundaries", operation: "Verge bank mowing", rate: 57.67, unit: "hr" },
  { category: "Hedges & Boundaries", operation: "Fence erection \u2013 post and 4 Barb", rate: 8.50, unit: "m" },
  { category: "Hedges & Boundaries", operation: "Fence erection \u2013 post, stock net & 2 Barb", rate: 11.38, unit: "m" },
  { category: "Hedges & Boundaries", operation: "Fence erection \u2013 post and 3 rails", rate: 25.43, unit: "m" },

  // Mobile Feed
  { category: "Mobile Feed", operation: "Mobile feed mixing and processing", rate: 28.00, unit: "tonne" },
  { category: "Mobile Feed", operation: "Crimping", rate: 15.50, unit: "tonne" },

  // Livestock Services
  { category: "Livestock Services", operation: "Sheep shearing \u2013 ewe", rate: 1.81, unit: "head" },
  { category: "Livestock Services", operation: "Sheep shearing \u2013 rams", rate: 3.80, unit: "head" },
  { category: "Livestock Services", operation: "Sheep shearing \u2013 crutching", rate: 0.85, unit: "head" },
  { category: "Livestock Services", operation: "Sheep dipping", rate: 1.50, unit: "head" },

  // Specialist
  { category: "Specialist", operation: "Snow ploughing/clearing", rate: 84.58, unit: "hr" },
  { category: "Specialist", operation: "Labour only", rate: 20.70, unit: "hr" },
  { category: "Specialist", operation: "Chainsawing with operator", rate: 35.43, unit: "hr" },
]

export function getRatesByCategory(category: string): ContractorRate[] {
  return NAAC_RATES.filter(r => r.category === category)
}

export function getRatesByUnit(unit: "ha" | "hr" | "bale" | "tonne" | "head" | "m"): ContractorRate[] {
  return NAAC_RATES.filter(r => r.unit === unit)
}
