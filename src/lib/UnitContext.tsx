import { createContext, useContext } from 'react'
import type { UnitPreferences } from './units'
import { DEFAULT_UNITS } from './units'

interface UnitContextValue {
  units: UnitPreferences
  setUnits: (units: UnitPreferences) => void
}

const UnitContext = createContext<UnitContextValue>({
  units: DEFAULT_UNITS,
  setUnits: () => {},
})

export function useUnits(): UnitContextValue {
  return useContext(UnitContext)
}

export { UnitContext }
