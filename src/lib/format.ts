/**
 * Format a number as GBP currency with £ prefix and commas.
 * Examples: formatGBP(126000) → "£126,000", formatGBP(30.27) → "£30.27"
 * Rounds to nearest integer for values >= 1000, otherwise shows 2 decimal places.
 */
export function formatGBP(value: number): string {
  if (!isFinite(value)) return "£—";
  if (Math.abs(value) >= 1000) {
    return "£" + Math.round(value).toLocaleString("en-GB");
  }
  return "£" + value.toFixed(2);
}

/**
 * Format a number as a percentage with 1 decimal place.
 * Examples: formatPct(25) → "25.0%", formatPct(2.5) → "2.5%"
 */
export function formatPct(value: number): string {
  if (!isFinite(value)) return "—%";
  return value.toFixed(1) + "%";
}

/**
 * Format a number with commas and optional decimal places.
 * Examples: formatNumber(1200) → "1,200", formatNumber(1.4, 2) → "1.40"
 */
export function formatNumber(value: number, decimals?: number): string {
  if (!isFinite(value)) return "—";
  if (decimals !== undefined) {
    return value.toLocaleString("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return value.toLocaleString("en-GB");
}
