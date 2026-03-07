# SPEC-05: Integration Tests & Visual Polish

## Goal

Verify end-to-end flows (click reference data → value fills input → results recalculate) across both cost tabs. Add source attribution, responsive checks, and accessibility.

## Depends On

SPEC-01 (test infra), SPEC-02 (fuel prices), SPEC-03 (fuel consumption), SPEC-04 (contractor rates).

## Integration Flows to Test

### Flow 1: Fuel Price → Input → Results (Cost per Hectare)

1. Render `<CostPerHectare>` with default inputs
2. Expand "AHDB Fuel Prices" panel
3. Click "Use red diesel price (74.91p)"
4. Verify fuel price input now shows 0.7491 (or 0.75 rounded)
5. Verify results recalculate (total cost per ha changes)

### Flow 2: Fuel Consumption → Input → Results (Cost per Hour)

1. Render `<CostPerHour>` with default inputs
2. Expand "Estimate Fuel Consumption" panel
3. Adjust HP slider to 200
4. Click "Use this estimate"
5. Verify fuel consumption input updates to 48.8

### Flow 3: Contractor Rate → Input → Results (Cost per Hectare)

1. Render `<CostPerHectare>` with default inputs
2. Expand "NAAC Contractor Rates" panel
3. Click "Drilling" category tab
4. Click "Use" on "Cereals (conventional)" row (£65.57)
5. Verify contractor charge input updates to 65.57
6. Verify annual saving recalculates

### Flow 4: Tractor Hire Rate → Input (Cost per Hour)

1. Render `<CostPerHour>` with default inputs
2. Expand "NAAC Contractor Rates" panel
3. Verify "Tractor Hire" category is shown (£/hr rates)
4. Click "Use" on "150–220 HP" (£58.17)
5. Verify contractor charge input updates to 58.17

## Visual Polish Checklist

### Source Attribution

Every reference panel must show:
```
Source: {name}  •  Data: {date}
```
- Fuel Prices: "Source: AHDB • Data: Feb 2026"
- Fuel Consumption: "Source: EU Efficient20 • Formula: 0.244 × HP"
- Contractor Rates: "Source: NAAC / Farmers Weekly 2025-26"

### Consistent Panel Styling

All three panels should share:
- Same `CollapsibleSection` wrapper
- Same padding/margin relative to the input field above
- Same font sizes for headers, values, and footers
- Same button style for "Use this value" actions

### Responsive Layout

At **320px** viewport:
- Price cards in fuel panel stack vertically (not side by side)
- Contractor rates table scrolls horizontally if needed
- HP slider remains usable (full width)

At **768px**:
- All panels render within the max-w-3xl container
- No horizontal overflow

At **1280px**:
- Panels have comfortable whitespace
- Sparkline has room to breathe

### Accessibility

- All `CollapsibleSection` triggers have `aria-expanded`
- All "Use" buttons have descriptive `aria-label` (e.g., "Use ploughing light rate £79.21")
- Sparkline SVG has `role="img"` and `aria-label="Red diesel price trend 2022-2026"`
- HP slider input has `aria-label="Tractor horsepower"`
- Traffic-light colors are NOT the only indicator — text/icons also convey meaning

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/__tests__/CostPerHectare.integration.test.tsx` | End-to-end flows 1 + 3 |
| `src/components/__tests__/CostPerHour.integration.test.tsx` | End-to-end flows 2 + 4 |

## Files to Modify (polish only)

| File | Change |
|------|--------|
| `src/components/FuelPricePanel.tsx` | Ensure source footer, responsive card layout, aria labels |
| `src/components/FuelConsumptionPanel.tsx` | Ensure source footer, aria on slider + SVG |
| `src/components/ContractorRatesPanel.tsx` | Ensure source footer, aria on buttons, responsive table |

## RED Tests

### Integration tests (`CostPerHectare.integration.test.tsx`)
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { CostPerHectare } from '@/components/CostPerHectare'

describe('CostPerHectare reference panel integration', () => {
  it('has fuel price panel', () => {
    render(<CostPerHectare {...defaultProps} />)
    expect(screen.getByText(/AHDB Fuel Prices/i)).toBeInTheDocument()
  })

  it('has fuel consumption panel', () => {
    render(<CostPerHectare {...defaultProps} />)
    expect(screen.getByText(/Estimate Fuel Consumption/i)).toBeInTheDocument()
  })

  it('has contractor rates panel', () => {
    render(<CostPerHectare {...defaultProps} />)
    expect(screen.getByText(/NAAC Contractor Rates/i)).toBeInTheDocument()
  })

  it('shows source attribution for AHDB', () => {
    render(<CostPerHectare {...defaultProps} />)
    expect(screen.getByText(/Source: AHDB/)).toBeInTheDocument()
  })

  it('shows source attribution for NAAC', () => {
    render(<CostPerHectare {...defaultProps} />)
    expect(screen.getByText(/NAAC/)).toBeInTheDocument()
  })
})
```

### Integration tests (`CostPerHour.integration.test.tsx`)
```typescript
describe('CostPerHour reference panel integration', () => {
  it('has fuel price panel', () => {
    render(<CostPerHour {...defaultProps} />)
    expect(screen.getByText(/AHDB Fuel Prices/i)).toBeInTheDocument()
  })

  it('shows tractor hire rates by default in contractor panel', () => {
    render(<CostPerHour {...defaultProps} />)
    // Tractor Hire category should be visible
    expect(screen.getByText(/Tractor Hire/i)).toBeInTheDocument()
  })

  it('fuel consumption panel shows L/hr (not L/ha)', () => {
    render(<CostPerHour {...defaultProps} />)
    expect(screen.getByText(/L\/hr/)).toBeInTheDocument()
  })
})
```

### Accessibility tests
```typescript
it('sparkline has aria-label', () => {
  render(<FuelPricePanel onApply={vi.fn()} />)
  const svg = screen.getByRole('img')
  expect(svg).toHaveAttribute('aria-label', expect.stringContaining('trend'))
})

it('use buttons have descriptive aria-labels', () => {
  render(<ContractorRatesPanel onApply={vi.fn()} />)
  const buttons = screen.getAllByRole('button', { name: /use/i })
  buttons.forEach(btn => {
    expect(btn.getAttribute('aria-label')).toBeTruthy()
  })
})
```

## GREEN Tests

All tests above pass.

## Acceptance Criteria

- [ ] All 4 integration flows work end-to-end
- [ ] Source attribution visible on every panel
- [ ] Consistent styling across all 3 panel types
- [ ] No horizontal overflow at 320px viewport
- [ ] All interactive elements keyboard-navigable
- [ ] Sparkline and buttons have appropriate aria attributes
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] All tests pass (unit + integration)
