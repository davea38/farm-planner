# SPEC-01: Test Infrastructure Bootstrap

## Goal

Install vitest + @testing-library/react + jsdom. Create a working test pipeline so all subsequent specs can use RED/GREEN testing.

## Why First

Every subsequent spec writes failing tests before implementation. Without a test runner, nothing else can begin.

## What to Install

```
devDependencies:
  vitest
  @testing-library/react
  @testing-library/jest-dom
  jsdom
```

## Files to Create

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest config with jsdom environment, path aliases matching `tsconfig` |
| `src/setupTests.ts` | Import `@testing-library/jest-dom` matchers |
| `src/lib/__tests__/calculations.test.ts` | First pure-logic test |
| `src/components/__tests__/ResultBanner.test.tsx` | First component render test |

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add `"test": "vitest run"`, `"test:watch": "vitest"` scripts; add devDependencies |
| `tsconfig.json` | Ensure `types: ["vitest/globals"]` if using globals |

## RED Tests (must fail before implementation)

### 1. `npm test` fails
```
$ npm test
> Error: missing script: "test"
```

### 2. Pure function test (`calculations.test.ts`)
```typescript
import { describe, it, expect } from 'vitest'
import { calcCostPerHectare } from '@/lib/calculations'
import { defaultCostPerHectareInputs } from '@/lib/defaults'

describe('calcCostPerHectare', () => {
  it('matches AHDB example: £30.27/ha total cost', () => {
    const result = calcCostPerHectare(defaultCostPerHectareInputs)
    expect(result.totalCostPerHa).toBeCloseTo(30.27, 1)
  })

  it('matches AHDB example: -£54,880 annual saving', () => {
    const result = calcCostPerHectare(defaultCostPerHectareInputs)
    expect(result.annualSaving).toBeCloseTo(-54880, -1)
  })
})
```

### 3. Component render test (`ResultBanner.test.tsx`)
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultBanner } from '@/components/ResultBanner'

describe('ResultBanner', () => {
  it('renders green banner text', () => {
    render(<ResultBanner type="green" main="You save £54,880" sub="per year" />)
    expect(screen.getByText(/You save/)).toBeInTheDocument()
  })
})
```

## GREEN Tests (must pass after implementation)

- `npm test` runs vitest and exits cleanly
- Calculation test confirms AHDB defaults produce £30.27/ha
- ResultBanner render test confirms text appears in DOM

## Acceptance Criteria

- [ ] `npm test` runs and passes with 0 failures
- [ ] At least 1 pure-function test + 1 component render test
- [ ] Path alias `@/` resolves correctly in test environment
- [ ] No changes to any production source code
