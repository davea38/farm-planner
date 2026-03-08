import { useState, useCallback, useRef } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { CostPerHectare } from '@/components/CostPerHectare'
import { CostPerHour } from '@/components/CostPerHour'
import { CompareMachines } from '@/components/CompareMachines'
import { ReplacementPlanner } from '@/components/ReplacementPlanner'
import { DepreciationPanel } from '@/components/DepreciationPanel'
import { ContractingIncomePlanner } from '@/components/ContractingIncomePlanner'
import { ProfitabilityOverview } from '@/components/ProfitabilityOverview'
import { UnitToggle } from '@/components/UnitToggle'
import { WelcomePanel } from '@/components/WelcomePanel'
import { UnitContext } from '@/lib/UnitContext'
import { loadState, useAutoSave, exportToFile, importFromFile, loadUnitPreferences, saveUnitPreferences } from '@/lib/storage'
import type { UnitPreferences } from '@/lib/units'
import { defaultCostPerHectare, defaultCostPerHour } from '@/lib/defaults'
import type { AppState, CostPerHectareInputs, CostPerHourInputs, WorkrateInputs, ReplacementPlannerState, ContractingIncomeState, DepreciationCategory } from '@/lib/types'

function App() {
  const [appState, setAppState] = useState<AppState>(loadState)
  const [unitPrefs, setUnitPrefs] = useState<UnitPreferences>(loadUnitPreferences)
  const [dirtyTabs, setDirtyTabs] = useState<Record<string, boolean>>({})

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

  const onSaveCostPerHectareMachine = useCallback((name: string, machineType: DepreciationCategory, inputs: CostPerHectareInputs) => {
    setAppState((prev) => ({
      ...prev,
      costPerHectare: {
        ...prev.costPerHectare,
        savedMachines: [...prev.costPerHectare.savedMachines, { name, machineType, inputs }],
      },
    }))
  }, [])

  const onLoadCostPerHectareMachine = useCallback((index: number) => {
    setAppState((prev) => {
      const machine = prev.costPerHectare.savedMachines[index]
      if (!machine) return prev
      return {
        ...prev,
        costPerHectare: { ...prev.costPerHectare, current: machine.inputs },
      }
    })
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

  const onResetCostPerHectare = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      costPerHectare: { ...prev.costPerHectare, current: defaultCostPerHectare },
    }))
  }, [])

  const onCostPerHourChange = useCallback((inputs: CostPerHourInputs) => {
    setAppState((prev) => ({
      ...prev,
      costPerHour: { ...prev.costPerHour, current: inputs },
    }))
  }, [])

  const onSaveCostPerHourMachine = useCallback((name: string, machineType: DepreciationCategory, inputs: CostPerHourInputs) => {
    setAppState((prev) => ({
      ...prev,
      costPerHour: {
        ...prev.costPerHour,
        savedMachines: [...prev.costPerHour.savedMachines, { name, machineType, inputs }],
      },
    }))
  }, [])

  const onLoadCostPerHourMachine = useCallback((index: number) => {
    setAppState((prev) => {
      const machine = prev.costPerHour.savedMachines[index]
      if (!machine) return prev
      return {
        ...prev,
        costPerHour: { ...prev.costPerHour, current: machine.inputs },
      }
    })
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

  const onResetCostPerHour = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      costPerHour: { ...prev.costPerHour, current: defaultCostPerHour },
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

  const onContractingIncomeChange = useCallback((state: ContractingIncomeState) => {
    setAppState((prev) => ({
      ...prev,
      contractingIncome: state,
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

          <WelcomePanel />

          <Tabs defaultValue="cost-per-hectare">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-7 h-auto gap-1">
              <TabsTrigger
                value="cost-per-hectare"
                className="text-xs sm:text-sm py-2 data-active:bg-primary data-active:text-primary-foreground"
              >
                {unitPrefs.area === 'acres' ? 'Cost / Acre' : 'Cost / Hectare'}
                {dirtyTabs['cost-per-hectare'] && (
                  <span className="ml-1 inline-block h-2 w-2 rounded-full bg-farm-amber" aria-label="unsaved changes" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="cost-per-hour"
                className="text-xs sm:text-sm py-2 data-active:bg-primary data-active:text-primary-foreground"
              >
                Cost / Hour
                {dirtyTabs['cost-per-hour'] && (
                  <span className="ml-1 inline-block h-2 w-2 rounded-full bg-farm-amber" aria-label="unsaved changes" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="depreciation"
                className="text-xs sm:text-sm py-2 data-active:bg-primary data-active:text-primary-foreground"
              >
                Value Loss
              </TabsTrigger>
              <TabsTrigger
                value="compare-machines"
                className="text-xs sm:text-sm py-2 data-active:bg-primary data-active:text-primary-foreground"
              >
                Compare
              </TabsTrigger>
              <TabsTrigger
                value="replacement-planner"
                className="text-xs sm:text-sm py-2 data-active:bg-primary data-active:text-primary-foreground"
              >
                Replacements
              </TabsTrigger>
              <TabsTrigger
                value="contracting-income"
                className="text-xs sm:text-sm py-2 data-active:bg-primary data-active:text-primary-foreground"
              >
                Contracting
              </TabsTrigger>
              <TabsTrigger
                value="profitability"
                className="text-xs sm:text-sm py-2 data-active:bg-primary data-active:text-primary-foreground"
              >
                Worth It?
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cost-per-hectare" className="mt-4">
              <CostPerHectare
                initialInputs={appState.costPerHectare.current}
                onChange={onCostPerHectareChange}
                onDirtyChange={(dirty) => setDirtyTabs((prev) => ({ ...prev, 'cost-per-hectare': dirty }))}
                savedMachines={appState.costPerHectare.savedMachines}
                onSaveMachine={onSaveCostPerHectareMachine}
                onLoadMachine={onLoadCostPerHectareMachine}
                onDeleteMachine={onDeleteCostPerHectareMachine}
                onResetMachine={onResetCostPerHectare}
              />
            </TabsContent>

            <TabsContent value="cost-per-hour" className="mt-4">
              <CostPerHour
                initialInputs={appState.costPerHour.current}
                onChange={onCostPerHourChange}
                onDirtyChange={(dirty) => setDirtyTabs((prev) => ({ ...prev, 'cost-per-hour': dirty }))}
                savedMachines={appState.costPerHour.savedMachines}
                onSaveMachine={onSaveCostPerHourMachine}
                onLoadMachine={onLoadCostPerHourMachine}
                onDeleteMachine={onDeleteCostPerHourMachine}
                onResetMachine={onResetCostPerHour}
              />
            </TabsContent>

            <TabsContent value="depreciation" className="mt-4">
              <DepreciationPanel />
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

            <TabsContent value="contracting-income" className="mt-4">
              <ContractingIncomePlanner
                initialState={appState.contractingIncome}
                onChange={onContractingIncomeChange}
                savedHectareMachines={appState.costPerHectare.savedMachines}
                savedHourMachines={appState.costPerHour.savedMachines}
              />
            </TabsContent>

            <TabsContent value="profitability" className="mt-4">
              <ProfitabilityOverview appState={appState} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
    </UnitContext.Provider>
  )
}

export default App
