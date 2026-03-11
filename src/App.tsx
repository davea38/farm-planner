import { useState, useCallback, useRef } from 'react'
import { useHashRoute } from '@/lib/useHashRoute'
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
import { MachinesTab, MachineIcon } from '@/components/MachinesTab'
import type { SelectedMachine } from '@/components/MachinesTab'
import { DEPRECIATION_PROFILES } from '@/lib/depreciation-data'
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
  const [selectedMachine, setSelectedMachine] = useState<SelectedMachine | null>(null)
  const { activeTab, setActiveTab } = useHashRoute()

  useAutoSave(appState)

  const hasMachineSelected = selectedMachine !== null

  const handleUnitsChange = useCallback((prefs: UnitPreferences) => {
    setUnitPrefs(prefs)
    saveUnitPreferences(prefs)
  }, [])

  // When a machine is selected on the Machines tab, load its inputs into current
  const handleSelectMachine = useCallback((sel: SelectedMachine | null) => {
    setSelectedMachine(sel)
    if (!sel) return
    if (sel.costMode === "hectare") {
      setAppState((prev) => {
        const machine = prev.costPerHectare.savedMachines[sel.index]
        if (!machine) return prev
        return { ...prev, costPerHectare: { ...prev.costPerHectare, current: machine.inputs } }
      })
    } else {
      setAppState((prev) => {
        const machine = prev.costPerHour.savedMachines[sel.index]
        if (!machine) return prev
        return { ...prev, costPerHour: { ...prev.costPerHour, current: machine.inputs } }
      })
    }
  }, [])

  // Cost changes also update the selected saved machine
  const onCostPerHectareChange = useCallback((inputs: CostPerHectareInputs) => {
    setAppState((prev) => ({
      ...prev,
      costPerHectare: { ...prev.costPerHectare, current: inputs },
    }))
    // Also update the saved machine if one is selected
    setSelectedMachine((sel) => {
      if (sel?.costMode === "hectare") {
        setAppState((prev) => {
          const machines = prev.costPerHectare.savedMachines.map((m, i) =>
            i === sel.index ? { ...m, inputs } : m
          )
          return { ...prev, costPerHectare: { ...prev.costPerHectare, savedMachines: machines } }
        })
      }
      return sel
    })
  }, [])

  const onSaveCostPerHectareMachine = useCallback((name: string, machineType: DepreciationCategory, selectedIndex: number | null) => {
    setAppState((prev) => {
      const newMachine = { name, machineType, inputs: prev.costPerHectare.current }
      const machines = selectedIndex != null
        ? prev.costPerHectare.savedMachines.map((m, i) => i === selectedIndex ? newMachine : m)
        : [...prev.costPerHectare.savedMachines, newMachine]
      return {
        ...prev,
        costPerHectare: { ...prev.costPerHectare, savedMachines: machines },
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

  const onCostPerHourChange = useCallback((inputs: CostPerHourInputs) => {
    setAppState((prev) => ({
      ...prev,
      costPerHour: { ...prev.costPerHour, current: inputs },
    }))
    // Also update the saved machine if one is selected
    setSelectedMachine((sel) => {
      if (sel?.costMode === "hour") {
        setAppState((prev) => {
          const machines = prev.costPerHour.savedMachines.map((m, i) =>
            i === sel.index ? { ...m, inputs } : m
          )
          return { ...prev, costPerHour: { ...prev.costPerHour, savedMachines: machines } }
        })
      }
      return sel
    })
  }, [])

  const onSaveCostPerHourMachine = useCallback((name: string, machineType: DepreciationCategory, selectedIndex: number | null) => {
    setAppState((prev) => {
      const newMachine = { name, machineType, inputs: prev.costPerHour.current }
      const machines = selectedIndex != null
        ? prev.costPerHour.savedMachines.map((m, i) => i === selectedIndex ? newMachine : m)
        : [...prev.costPerHour.savedMachines, newMachine]
      return {
        ...prev,
        costPerHour: { ...prev.costPerHour, savedMachines: machines },
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

          <Tabs value={activeTab} onValueChange={(v) => {
            // Only allow switching to non-machines tabs if a machine is selected
            if (v !== "machines" && !hasMachineSelected) return
            setActiveTab(v)
          }}>
            <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8">
              <TabsTrigger value="machines">
                Machines
              </TabsTrigger>
              <TabsTrigger
                value="cost-per-hectare"
                disabled={!hasMachineSelected}
              >
                {unitPrefs.area === 'acres' ? 'Cost/Acre' : 'Cost/Ha'}
              </TabsTrigger>
              <TabsTrigger
                value="cost-per-hour"
                disabled={!hasMachineSelected}
              >
                Cost/Hr
              </TabsTrigger>
              <TabsTrigger
                value="depreciation"
                disabled={!hasMachineSelected}
              >
                Value Loss
              </TabsTrigger>
              <TabsTrigger
                value="compare-machines"
                disabled={!hasMachineSelected}
              >
                Compare
              </TabsTrigger>
              <TabsTrigger
                value="replacement-planner"
                disabled={!hasMachineSelected}
              >
                Replace
              </TabsTrigger>
              <TabsTrigger
                value="contracting-income"
                disabled={!hasMachineSelected}
              >
                Contract
              </TabsTrigger>
              <TabsTrigger
                value="profitability"
                disabled={!hasMachineSelected}
              >
                Worth It?
              </TabsTrigger>
            </TabsList>

            {/* Selected machine banner — shown on all tabs */}
            {(() => {
              if (!selectedMachine) {
                const hasMachines = appState.costPerHectare.savedMachines.length > 0 || appState.costPerHour.savedMachines.length > 0
                return (
                  <div className="mt-4 rounded-lg border-2 border-dashed border-farm-amber/50 bg-farm-amber/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-farm-amber/10 text-farm-amber shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-sm mb-0.5">No machine selected</div>
                        <p className="text-sm text-muted-foreground">
                          {hasMachines
                            ? "Select a machine on the Machines tab to unlock the other tabs."
                            : "Add your first machine on the Machines tab to get started."
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }
              const machine = selectedMachine.costMode === "hectare"
                ? appState.costPerHectare.savedMachines[selectedMachine.index]
                : appState.costPerHour.savedMachines[selectedMachine.index]
              if (!machine) return null
              const profile = DEPRECIATION_PROFILES[machine.machineType]
              return (
                <div className="mt-4 rounded-lg border-2 border-primary bg-primary/5 p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary shrink-0">
                      <MachineIcon type={machine.machineType} size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{machine.name}</div>
                      <div className="text-xs text-muted-foreground">{profile?.label ?? machine.machineType}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("machines")}
                      className="text-xs font-medium shrink-0 rounded-full px-3 py-1 border border-primary/30 text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all duration-150 cursor-pointer flex items-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Change
                    </button>
                  </div>
                </div>
              )
            })()}

            <TabsContent value="machines" className="mt-4">
              <MachinesTab
                hectareMachines={appState.costPerHectare.savedMachines}
                hourMachines={appState.costPerHour.savedMachines}
                selectedMachine={selectedMachine}
                onSelectMachine={handleSelectMachine}
                onSaveHectareMachine={onSaveCostPerHectareMachine}
                onSaveHourMachine={onSaveCostPerHourMachine}
                onDeleteHectareMachine={onDeleteCostPerHectareMachine}
                onDeleteHourMachine={onDeleteCostPerHourMachine}
              />
            </TabsContent>

            <TabsContent value="cost-per-hectare" className="mt-4">
              <CostPerHectare
                initialInputs={appState.costPerHectare.current}
                onChange={onCostPerHectareChange}
              />
            </TabsContent>

            <TabsContent value="cost-per-hour" className="mt-4">
              <CostPerHour
                initialInputs={appState.costPerHour.current}
                onChange={onCostPerHourChange}
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
