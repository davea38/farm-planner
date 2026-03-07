import { useState, useCallback, useRef } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { CostPerHectare } from '@/components/CostPerHectare'
import { CostPerHour } from '@/components/CostPerHour'
import { CompareMachines } from '@/components/CompareMachines'
import { ReplacementPlanner } from '@/components/ReplacementPlanner'
import { UnitToggle } from '@/components/UnitToggle'
import { UnitContext } from '@/lib/UnitContext'
import { loadState, useAutoSave, exportToFile, importFromFile, loadUnitPreferences, saveUnitPreferences } from '@/lib/storage'
import type { UnitPreferences } from '@/lib/units'
import type { AppState, CostPerHectareInputs, CostPerHourInputs, WorkrateInputs, ReplacementPlannerState } from '@/lib/types'

function App() {
  const [appState, setAppState] = useState<AppState>(loadState)
  const [unitPrefs, setUnitPrefs] = useState<UnitPreferences>(loadUnitPreferences)

  useAutoSave(appState)

  const handleUnitsChange = useCallback((prefs: UnitPreferences) => {
    setUnitPrefs(prefs)
    saveUnitPreferences(prefs)
  }, [])

  const onCostPerHectareChange = useCallback((inputs: CostPerHectareInputs) => {
    setAppState((prev) => ({
      ...prev,
      costPerHectare: { ...prev.costPerHectare, current: inputs },
    }))
  }, [])

  const onSaveCostPerHectareMachine = useCallback((name: string, inputs: CostPerHectareInputs) => {
    setAppState((prev) => ({
      ...prev,
      costPerHectare: {
        ...prev.costPerHectare,
        savedMachines: [...prev.costPerHectare.savedMachines, { name, inputs }],
      },
    }))
  }, [])

  const onDeleteCostPerHectareMachine = useCallback((index: number) => {
    setAppState((prev) => ({
      ...prev,
      costPerHectare: {
        ...prev.costPerHectare,
        savedMachines: prev.costPerHectare.savedMachines.filter((_, i) => i !== index),
      },
    }))
  }, [])

  const onCostPerHourChange = useCallback((inputs: CostPerHourInputs) => {
    setAppState((prev) => ({
      ...prev,
      costPerHour: { ...prev.costPerHour, current: inputs },
    }))
  }, [])

  const onSaveCostPerHourMachine = useCallback((name: string, inputs: CostPerHourInputs) => {
    setAppState((prev) => ({
      ...prev,
      costPerHour: {
        ...prev.costPerHour,
        savedMachines: [...prev.costPerHour.savedMachines, { name, inputs }],
      },
    }))
  }, [])

  const onDeleteCostPerHourMachine = useCallback((index: number) => {
    setAppState((prev) => ({
      ...prev,
      costPerHour: {
        ...prev.costPerHour,
        savedMachines: prev.costPerHour.savedMachines.filter((_, i) => i !== index),
      },
    }))
  }, [])

  const onCompareMachinesChange = useCallback((machineA: WorkrateInputs, machineB: WorkrateInputs) => {
    setAppState((prev) => ({
      ...prev,
      compareMachines: { machineA, machineB },
    }))
  }, [])

  const onReplacementPlannerChange = useCallback((state: ReplacementPlannerState) => {
    setAppState((prev) => ({
      ...prev,
      replacementPlanner: state,
    }))
  }, [])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = useCallback(() => {
    exportToFile(appState)
  }, [appState])

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importFromFile(file)
      setAppState(imported)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to import file')
    }
    // Reset input so the same file can be re-imported
    e.target.value = ''
  }, [])

  return (
    <UnitContext.Provider value={{ units: unitPrefs, setUnits: handleUnitsChange }}>
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[800px] px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold">
              Farm Machinery Planner
            </h1>
            <div className="flex flex-col items-end gap-2">
              <UnitToggle units={unitPrefs} onChange={handleUnitsChange} />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  Export JSON
                </Button>
                <Button variant="outline" size="sm" onClick={handleImport}>
                  Import JSON
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileSelected}
                />
              </div>
            </div>
          </div>

          <Tabs defaultValue="cost-per-hectare">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
              <TabsTrigger
                value="cost-per-hectare"
                className="text-xs sm:text-sm py-2 data-active:bg-primary data-active:text-primary-foreground"
              >
                {unitPrefs.area === 'acres' ? 'Cost per Acre' : 'Cost per Hectare'}
              </TabsTrigger>
              <TabsTrigger
                value="cost-per-hour"
                className="text-xs sm:text-sm py-2 data-active:bg-primary data-active:text-primary-foreground"
              >
                Cost per Hour
              </TabsTrigger>
              <TabsTrigger
                value="compare-machines"
                className="text-xs sm:text-sm py-2 data-active:bg-primary data-active:text-primary-foreground"
              >
                Compare Machines
              </TabsTrigger>
              <TabsTrigger
                value="replacement-planner"
                className="text-xs sm:text-sm py-2 data-active:bg-primary data-active:text-primary-foreground"
              >
                Replacement Planner
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cost-per-hectare" className="mt-4">
              <CostPerHectare
                initialInputs={appState.costPerHectare.current}
                onChange={onCostPerHectareChange}
                savedMachines={appState.costPerHectare.savedMachines}
                onSaveMachine={onSaveCostPerHectareMachine}
                onDeleteMachine={onDeleteCostPerHectareMachine}
              />
            </TabsContent>

            <TabsContent value="cost-per-hour" className="mt-4">
              <CostPerHour
                initialInputs={appState.costPerHour.current}
                onChange={onCostPerHourChange}
                savedMachines={appState.costPerHour.savedMachines}
                onSaveMachine={onSaveCostPerHourMachine}
                onDeleteMachine={onDeleteCostPerHourMachine}
              />
            </TabsContent>

            <TabsContent value="compare-machines" className="mt-4">
              <CompareMachines
                initialMachineA={appState.compareMachines.machineA}
                initialMachineB={appState.compareMachines.machineB}
                onChange={onCompareMachinesChange}
              />
            </TabsContent>

            <TabsContent value="replacement-planner" className="mt-4">
              <ReplacementPlanner
                initialState={appState.replacementPlanner}
                onChange={onReplacementPlannerChange}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
    </UnitContext.Provider>
  )
}

export default App
