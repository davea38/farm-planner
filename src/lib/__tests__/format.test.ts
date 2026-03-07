import { describe, it, expect } from "vitest"
import { formatGBP, formatPct, formatNumber } from "../format"

describe("formatGBP", () => {
  it("formats large values as rounded integers with commas", () => {
    expect(formatGBP(126000)).toBe("£126,000")
  })

  it("formats small values with 2 decimal places", () => {
    expect(formatGBP(30.27)).toBe("£30.27")
  })

  it("formats exactly 1000 as rounded integer", () => {
    expect(formatGBP(1000)).toBe("£1,000")
  })

  it("formats value just under 1000 with decimals", () => {
    expect(formatGBP(999.99)).toBe("£999.99")
  })

  it("handles negative large values", () => {
    expect(formatGBP(-5000)).toBe("£-5,000")
  })

  it("handles negative small values", () => {
    expect(formatGBP(-42.5)).toBe("£-42.50")
  })

  it("returns £— for Infinity", () => {
    expect(formatGBP(Infinity)).toBe("£—")
  })

  it("returns £— for NaN", () => {
    expect(formatGBP(NaN)).toBe("£—")
  })

  it("formats zero", () => {
    expect(formatGBP(0)).toBe("£0.00")
  })
})

describe("formatPct", () => {
  it("formats percentage with 1 decimal", () => {
    expect(formatPct(25)).toBe("25.0%")
  })

  it("formats decimal percentage", () => {
    expect(formatPct(2.5)).toBe("2.5%")
  })

  it("returns —% for Infinity", () => {
    expect(formatPct(Infinity)).toBe("—%")
  })

  it("returns —% for NaN", () => {
    expect(formatPct(NaN)).toBe("—%")
  })

  it("handles zero", () => {
    expect(formatPct(0)).toBe("0.0%")
  })
})

describe("formatNumber", () => {
  it("formats integer with commas", () => {
    expect(formatNumber(1200)).toBe("1,200")
  })

  it("formats with specified decimal places", () => {
    expect(formatNumber(1.4, 2)).toBe("1.40")
  })

  it("formats large number with decimals", () => {
    expect(formatNumber(12345.6, 1)).toBe("12,345.6")
  })

  it("returns — for Infinity", () => {
    expect(formatNumber(Infinity)).toBe("—")
  })

  it("returns — for NaN", () => {
    expect(formatNumber(NaN)).toBe("—")
  })

  it("returns — for Infinity with decimals", () => {
    expect(formatNumber(Infinity, 2)).toBe("—")
  })

  it("handles zero with no decimals", () => {
    expect(formatNumber(0)).toBe("0")
  })

  it("handles zero with decimals", () => {
    expect(formatNumber(0, 2)).toBe("0.00")
  })
})
