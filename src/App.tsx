import { useState, useCallback, useRef, useEffect } from 'react'
import { useHashRoute } from '@/lib/useHashRoute'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { CostCalculator } from '@/components/CostCalculator'
import type { CostMode } from '@/components/CostCalculator'
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
import type { AppState, CostPerHectareInputs, CostPerHourInputs, WorkrateInputs, ReplacementPlannerState, ContractingIncomeState, DepreciationCategory } from '@/lib/types'

function App() {
  const [appState, setAppState] = useState<AppState>(loadState)
  const [unitPrefs, setUnitPrefs] = useState<UnitPreferences>(loadUnitPreferences)
  const [selectedMachine, setSelectedMachine] = useState<SelectedMachine | null>(null)
  const { activeTab, setActiveTab } = useHashRoute()

  useAutoSave(appState)

  const hasMachineSelected = selectedMachine !== null

  // Derive cost mode from hash route; default to hectare
  const [costMode, setCostMode] = useState<CostMode>(() => {
    const hash = window.location.hash.replace('#', '')
    return hash === 'cost-per-hour' ? 'hour' : 'hectare'
  })

  // Normalize tab value: map legacy cost routes and cost-calculator to one value
  const tabsValue = (activeTab === "cost-per-hectare" || activeTab === "cost-per-hour")
    ? "cost-calculator"
    : activeTab

  // Sync costMode when navigating via back/forward to a cost route
  useEffect(() => {
    if (activeTab === "cost-per-hour") setCostMode("hour")
    else if (activeTab === "cost-per-hectare") setCostMode("hectare")
  }, [activeTab])

  const handleCostModeChange = useCallback((mode: CostMode) => {
    setCostMode(mode)
    setActiveTab(mode === "hour" ? "cost-per-hour" : "cost-per-hectare")
  }, [setActiveTab])

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

          <Tabs value={tabsValue} onValueChange={(v) => {
            // Only allow switching to non-machines tabs if a machine is selected
            if (v !== "machines" && !hasMachineSelected) return
            if (v === "cost-calculator") {
              // Route to the correct cost hash based on current mode
              setActiveTab(costMode === "hour" ? "cost-per-hour" : "cost-per-hectare")
            } else {
              setActiveTab(v)
            }
          }}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="machines">
                Machines
              </TabsTrigger>
              <TabsTrigger
                value="cost-calculator"
                disabled={!hasMachineSelected}
              >
                <span className="sm:hidden">{costMode === 'hectare' ? (unitPrefs.area === 'acres' ? 'Cost/Acre' : 'Cost/Ha') : 'Cost/Hr'}</span>
                <span className="hidden sm:inline">{costMode === 'hectare' ? (unitPrefs.area === 'acres' ? 'Cost per acre' : 'Cost per hectare') : 'Cost per hour'}</span>
              </TabsTrigger>
              <TabsTrigger
                value="depreciation"
                disabled={!hasMachineSelected}
              >
                <span className="sm:hidden">Depreciation</span>
                <span className="hidden sm:inline">Depreciation</span>
              </TabsTrigger>
              <TabsTrigger
                value="compare-machines"
                disabled={!hasMachineSelected}
              >
                <span className="sm:hidden">Compare</span>
                <span className="hidden sm:inline">Which is better</span>
              </TabsTrigger>
              <TabsTrigger
                value="replacement-planner"
                disabled={!hasMachineSelected}
              >
                <span className="sm:hidden">Replace</span>
                <span className="hidden sm:inline">When to replace</span>
              </TabsTrigger>
              <TabsTrigger
                value="contracting-income"
                disabled={!hasMachineSelected}
              >
                <span className="sm:hidden">Contract</span>
                <span className="hidden sm:inline">Contracting pay</span>
              </TabsTrigger>
              <TabsTrigger
                value="profitability"
                disabled={!hasMachineSelected}
              >
                <span className="sm:hidden">Worth It</span>
                <span className="hidden sm:inline">Is it worth it</span>
              </TabsTrigger>
            </TabsList>

            {/* Selected machine banner — shown on select tabs only */}
            {!["compare-machines", "replacement-planner", "contracting-income", "profitability"].includes(activeTab) && (() => {
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

            <TabsContent value="cost-calculator" className="mt-4">
              <CostCalculator
                mode={costMode}
                onModeChange={handleCostModeChange}
                initialHectareInputs={appState.costPerHectare.current}
                initialHourInputs={appState.costPerHour.current}
                onHectareChange={onCostPerHectareChange}
                onHourChange={onCostPerHourChange}
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
              <ProfitabilityOverview appState={appState} onFarmIncomeChange={(value) => {
                setAppState((prev) => ({
                  ...prev,
                  replacementPlanner: { ...prev.replacementPlanner, farmIncome: value },
                }))
              }} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
    </UnitContext.Provider>
  )
}

export default App
