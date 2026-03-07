export const FUEL_CONSUMPTION_FACTOR = 0.244 // L/hr per HP

export function estimateFuelConsumption(hp: number): number {
  return FUEL_CONSUMPTION_FACTOR * hp
}

export const HP_REFERENCE_POINTS = [
  { hp: 100, lPerHr: 24.4, label: "Small" },
  { hp: 200, lPerHr: 48.8, label: "Medium" },
  { hp: 400, lPerHr: 97.6, label: "Large" },
  { hp: 600, lPerHr: 146.4, label: "V. Large" },
  { hp: 800, lPerHr: 195.2, label: "Heavy" },
  { hp: 1000, lPerHr: 244.0, label: "Max" },
]
