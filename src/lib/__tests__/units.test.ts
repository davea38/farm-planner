import { toDisplay, fromDisplay, displayUnit, CONVERSIONS } from '@/lib/units'

describe('CONVERSIONS', () => {
  it('has correct ha to acres factor', () => {
    expect(CONVERSIONS.haToAcres).toBe(2.47105)
  })

  it('has correct km to miles factor', () => {
    expect(CONVERSIONS.kmToMiles).toBe(0.621371)
  })
})

describe('toDisplay', () => {
  it('converts ha to acres', () => {
    expect(toDisplay(100, 'ha', { area: 'acres', speed: 'km' }))
      .toBeCloseTo(247.105, 1)
  })

  it('converts ha/hr to acres/hr', () => {
    expect(toDisplay(4, 'ha/hr', { area: 'acres', speed: 'km' }))
      .toBeCloseTo(9.884, 1)
  })

  it('converts L/ha to L/acre (inverse)', () => {
    expect(toDisplay(20, 'L/ha', { area: 'acres', speed: 'km' }))
      .toBeCloseTo(8.094, 1)
  })

  it('converts £/ha to £/acre (inverse)', () => {
    expect(toDisplay(76, '£/ha', { area: 'acres', speed: 'km' }))
      .toBeCloseTo(30.76, 0)
  })

  it('converts km/hr to mph', () => {
    expect(toDisplay(12, 'km/hr', { area: 'ha', speed: 'miles' }))
      .toBeCloseTo(7.456, 1)
  })

  it('returns unchanged value when units match metric', () => {
    expect(toDisplay(100, 'ha', { area: 'ha', speed: 'km' })).toBe(100)
  })

  it('does not convert non-area/speed units', () => {
    expect(toDisplay(14, '£/hr', { area: 'acres', speed: 'miles' })).toBe(14)
  })

  it('converts km/hr to mph when both area and speed are imperial', () => {
    expect(toDisplay(10, 'km/hr', { area: 'acres', speed: 'miles' }))
      .toBeCloseTo(6.214, 1)
  })
})

describe('fromDisplay', () => {
  it('converts acres input back to ha for storage', () => {
    expect(fromDisplay(247.105, 'ha', { area: 'acres', speed: 'km' }))
      .toBeCloseTo(100, 1)
  })

  it('converts acres/hr back to ha/hr', () => {
    expect(fromDisplay(9.884, 'ha/hr', { area: 'acres', speed: 'km' }))
      .toBeCloseTo(4, 1)
  })

  it('converts L/acre back to L/ha', () => {
    expect(fromDisplay(8.094, 'L/ha', { area: 'acres', speed: 'km' }))
      .toBeCloseTo(20, 1)
  })

  it('converts mph back to km/hr', () => {
    expect(fromDisplay(7.456, 'km/hr', { area: 'ha', speed: 'miles' }))
      .toBeCloseTo(12, 1)
  })

  it('round-trips correctly for ha', () => {
    const prefs = { area: 'acres' as const, speed: 'miles' as const }
    const original = 1200
    const displayed = toDisplay(original, 'ha', prefs)
    const roundTripped = fromDisplay(displayed, 'ha', prefs)
    expect(roundTripped).toBeCloseTo(original, 2)
  })

  it('round-trips correctly for L/ha', () => {
    const prefs = { area: 'acres' as const, speed: 'km' as const }
    const original = 15.5
    const displayed = toDisplay(original, 'L/ha', prefs)
    const roundTripped = fromDisplay(displayed, 'L/ha', prefs)
    expect(roundTripped).toBeCloseTo(original, 2)
  })

  it('round-trips correctly for km/hr', () => {
    const prefs = { area: 'ha' as const, speed: 'miles' as const }
    const original = 8
    const displayed = toDisplay(original, 'km/hr', prefs)
    const roundTripped = fromDisplay(displayed, 'km/hr', prefs)
    expect(roundTripped).toBeCloseTo(original, 2)
  })

  it('returns unchanged value for non-convertible units', () => {
    expect(fromDisplay(50, '£', { area: 'acres', speed: 'miles' })).toBe(50)
  })
})

describe('displayUnit', () => {
  it('ha → acres', () => {
    expect(displayUnit('ha', { area: 'acres', speed: 'km' })).toBe('acres')
  })

  it('ha/hr → acres/hr', () => {
    expect(displayUnit('ha/hr', { area: 'acres', speed: 'km' })).toBe('acres/hr')
  })

  it('L/ha → L/acre', () => {
    expect(displayUnit('L/ha', { area: 'acres', speed: 'km' })).toBe('L/acre')
  })

  it('£/ha → £/acre', () => {
    expect(displayUnit('£/ha', { area: 'acres', speed: 'km' })).toBe('£/acre')
  })

  it('km/hr → mph', () => {
    expect(displayUnit('km/hr', { area: 'ha', speed: 'miles' })).toBe('mph')
  })

  it('unchanged when metric selected', () => {
    expect(displayUnit('ha', { area: 'ha', speed: 'km' })).toBe('ha')
  })

  it('£/hr unchanged (not area or speed)', () => {
    expect(displayUnit('£/hr', { area: 'acres', speed: 'miles' })).toBe('£/hr')
  })

  it('kg/ha → kg/acre', () => {
    expect(displayUnit('kg/ha', { area: 'acres', speed: 'km' })).toBe('kg/acre')
  })
})
