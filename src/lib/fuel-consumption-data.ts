export const FUEL_CONSUMPTION_FACTOR = 0.244 // L/hr per HP

export function estimateFuelConsumption(hp: number): number {
  return FUEL_CONSUMPTION_FACTOR * hp
}

export const HP_REFERENCE_POINTS = [
  { hp: 75, lPerHr: 18.3, label: "Small" },
  { hp: 100, lPerHr: 24.4, label: "Medium" },
  { hp: 150, lPerHr: 36.6, label: "Large" },
  { hp: 200, lPerHr: 48.8, label: "Large+" },
  { hp: 250, lPerHr: 61.0, label: "V. Large" },
  { hp: 300, lPerHr: 73.2, label: "Heavy" },
]
