export const CONVERSIONS = {
  haToAcres: 2.47105,
  kmToMiles: 0.621371,
} as const

export type AreaUnit = "ha" | "acres"
export type SpeedUnit = "km" | "miles"

export interface UnitPreferences {
  area: AreaUnit
  speed: SpeedUnit
}

export const DEFAULT_UNITS: UnitPreferences = { area: "ha", speed: "km" }

/**
 * Convert a metric value to display value based on unit preferences.
 * Units containing "ha" are area-converted; "km" are speed-converted.
 * Units like "L/ha" or "£/ha" use inverse conversion (÷ instead of ×).
 */
export function toDisplay(value: number, metricUnit: string, prefs: UnitPreferences): number {
  if (prefs.area === "acres") {
    if (metricUnit === "km/hr" && prefs.speed === "miles") {
      return value * CONVERSIONS.kmToMiles
    }
    // Per-hectare rates (L/ha, £/ha, kg/ha) — inverse: divide by factor
    if (metricUnit.includes("/ha")) {
      return value / CONVERSIONS.haToAcres
    }
    // Area quantities (ha, ha/hr) — multiply by factor
    if (metricUnit.includes("ha")) {
      return value * CONVERSIONS.haToAcres
    }
  }

  if (prefs.speed === "miles" && metricUnit === "km/hr") {
    return value * CONVERSIONS.kmToMiles
  }

  return value
}

/**
 * Convert a user-entered display value back to metric for storage.
 * Inverse of toDisplay.
 */
export function fromDisplay(value: number, metricUnit: string, prefs: UnitPreferences): number {
  if (prefs.area === "acres") {
    if (metricUnit === "km/hr" && prefs.speed === "miles") {
      return value / CONVERSIONS.kmToMiles
    }
    if (metricUnit.includes("/ha")) {
      return value * CONVERSIONS.haToAcres
    }
    if (metricUnit.includes("ha")) {
      return value / CONVERSIONS.haToAcres
    }
  }

  if (prefs.speed === "miles" && metricUnit === "km/hr") {
    return value / CONVERSIONS.kmToMiles
  }

  return value
}

/**
 * Convert a metric unit string to display unit string.
 */
export function displayUnit(metricUnit: string, prefs: UnitPreferences): string {
  if (prefs.speed === "miles" && metricUnit === "km/hr") {
    return "mph"
  }

  if (prefs.area === "acres") {
    // "ha" or "ha/hr" → plural "acres" / "acres/hr"
    if (metricUnit === "ha") return "acres"
    if (metricUnit === "ha/hr") return "acres/hr"
    // "L/ha", "£/ha", "kg/ha" → singular "acre" in denominator
    if (metricUnit.endsWith("/ha")) return metricUnit.slice(0, -2) + "acre"
  }

  return metricUnit
}
