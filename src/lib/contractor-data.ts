export interface ContractorRate {
  category: string
  operation: string
  rate: number
  unit: "ha" | "bale" | "hr"
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
  { category: "Soil Prep", operation: "Subsoiling", rate: 79.47, unit: "ha" },
  { category: "Soil Prep", operation: "Disc harrowing", rate: 63.06, unit: "ha" },
  { category: "Soil Prep", operation: "Power harrowing (shallow)", rate: 71.04, unit: "ha" },
  { category: "Soil Prep", operation: "Power harrowing (deep)", rate: 82.00, unit: "ha" },
  { category: "Soil Prep", operation: "Spring-tine harrowing", rate: 47.39, unit: "ha" },
  { category: "Soil Prep", operation: "One-pass tillage", rate: 83.63, unit: "ha" },
  { category: "Soil Prep", operation: "Rolling (flat)", rate: 35.11, unit: "ha" },
  { category: "Soil Prep", operation: "Rolling (ring)", rate: 25.83, unit: "ha" },

  // Drilling (£/ha)
  { category: "Drilling", operation: "Cereals (conventional)", rate: 65.57, unit: "ha" },
  { category: "Drilling", operation: "Cereals (combination)", rate: 84.72, unit: "ha" },
  { category: "Drilling", operation: "Cereals (direct)", rate: 77.63, unit: "ha" },
  { category: "Drilling", operation: "OSR (subsoiler)", rate: 94.80, unit: "ha" },
  { category: "Drilling", operation: "Sugar beet", rate: 75.28, unit: "ha" },
  { category: "Drilling", operation: "Maize (precision)", rate: 60.63, unit: "ha" },
  { category: "Drilling", operation: "Grass seed (broadcast)", rate: 34.59, unit: "ha" },
  { category: "Drilling", operation: "Grass seed (harrow)", rate: 52.14, unit: "ha" },

  // Application (£/ha)
  { category: "Application", operation: "Fertiliser (granular)", rate: 15.93, unit: "ha" },
  { category: "Application", operation: "Fertiliser (liquid)", rate: 16.48, unit: "ha" },
  { category: "Application", operation: "Spraying (arable)", rate: 16.52, unit: "ha" },
  { category: "Application", operation: "Spraying (grassland)", rate: 24.24, unit: "ha" },
  { category: "Application", operation: "Lime spreading", rate: 19.85, unit: "ha" },
  { category: "Application", operation: "Slug pelleting", rate: 11.42, unit: "ha" },

  // Harvesting (£/ha)
  { category: "Harvesting", operation: "Combining cereals", rate: 119.34, unit: "ha" },
  { category: "Harvesting", operation: "Combining OSR", rate: 119.44, unit: "ha" },
  { category: "Harvesting", operation: "Combining peas/beans", rate: 123.44, unit: "ha" },
  { category: "Harvesting", operation: "Grain maize", rate: 162.10, unit: "ha" },
  { category: "Harvesting", operation: "Forage harvesting", rate: 84.31, unit: "ha" },

  // Baling (£/bale)
  { category: "Baling", operation: "Small conventional", rate: 1.14, unit: "bale" },
  { category: "Baling", operation: "Round 1.2m", rate: 4.16, unit: "bale" },
  { category: "Baling", operation: "Round 1.5m", rate: 4.75, unit: "bale" },
  { category: "Baling", operation: "Square 80×90cm", rate: 4.72, unit: "bale" },
  { category: "Baling", operation: "Square 120×90cm", rate: 7.52, unit: "bale" },

  // Tractor Hire (£/hr)
  { category: "Tractor Hire", operation: "100\u2013150 HP", rate: 50.75, unit: "hr" },
  { category: "Tractor Hire", operation: "150\u2013220 HP", rate: 58.17, unit: "hr" },
  { category: "Tractor Hire", operation: "220\u2013300 HP", rate: 70.25, unit: "hr" },
  { category: "Tractor Hire", operation: "300+ HP", rate: 91.00, unit: "hr" },
]

export function getRatesByCategory(category: string): ContractorRate[] {
  return NAAC_RATES.filter(r => r.category === category)
}

export function getRatesByUnit(unit: "ha" | "hr" | "bale"): ContractorRate[] {
  return NAAC_RATES.filter(r => r.unit === unit)
}
