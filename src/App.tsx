import { useState, useCallback, useRef, useEffect } from 'react'
import { useHashRoute } from '@/lib/useHashRoute'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { CostCalculator } from '@/components/CostCalculator'
import type { CostMode } from '@/lib/types'
import { CompareMachines } from '@/components/CompareMachines'
import { ReplacementPlanner } from '@/components/ReplacementPlanner'
import { DepreciationPanel } from '@/components/DepreciationPanel'
import { ContractingIncomePlanner } from '@/components/ContractingIncomePlanner'
import { ProfitabilityOverview } from '@/components/ProfitabilityOverview'
import { MachinesTab, MachineIcon } from '@/components/MachinesTab'
import { DEPRECIATION_PROFILES } from '@/lib/depreciation-data'
import { UnitToggle } from '@/components/UnitToggle'
import { WelcomePanel } from '@/components/WelcomePanel'
import { UnitContext } from '@/lib/UnitContext'
import { loadState, useAutoSave, exportToFile, importFromFile, loadUnitPreferences, saveUnitPreferences } from '@/lib/storage'
import type { UnitPreferences } from '@/lib/units'
import type { AppState, CostPerHectareInputs, CostPerHourInputs, WorkrateInputs, ReplacementPlannerState, ContractingIncomeState, DepreciationCategory, MachineProfile } from '@/lib/types'
import { createDefaultMachineProfile } from '@/lib/defaults'

function App() {
  const [appState, setAppState] = useState<AppState>(loadState)
  const [unitPrefs, setUnitPrefs] = useState<UnitPreferences>(loadUnitPreferences)
  const [selectedMachineIndex, setSelectedMachineIndex] = useState<number | null>(null)
  const [machinePickerOpen, setMachinePickerOpen] = useState(false)
  const { activeTab, setActiveTab } = useHashRoute()

  useAutoSave(appState)

  const hasMachineSelected = selectedMachineIndex !== null
  const selectedMachine: MachineProfile | null = selectedMachineIndex !== null
    ? appState.savedMachines[selectedMachineIndex] ?? null
    : null

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

  // When a machine is selected — just track the index
  const handleSelectMachine = useCallback((index: number | null) => {
    setSelectedMachineIndex(index)
  }, [])

  // Field-level updaters for CostCalculator (controlled component)
  const onHectareFieldChange = useCallback((field: keyof CostPerHectareInputs, value: number) => {
    setAppState((prev) => {
      const idx = selectedMachineIndex
      if (idx === null || !prev.savedMachines[idx]) return prev
      return {
        ...prev,
        savedMachines: prev.savedMachines.map((m, i) =>
          i === idx ? { ...m, costPerHectare: { ...m.costPerHectare, [field]: value } } : m
        ),
      }
    })
  }, [selectedMachineIndex])

  const onHourFieldChange = useCallback((field: keyof CostPerHourInputs, value: number) => {
    setAppState((prev) => {
      const idx = selectedMachineIndex
      if (idx === null || !prev.savedMachines[idx]) return prev
      return {
        ...prev,
        savedMachines: prev.savedMachines.map((m, i) =>
          i === idx ? { ...m, costPerHour: { ...m.costPerHour, [field]: value } } : m
        ),
      }
    })
  }, [selectedMachineIndex])

  // Unified save/delete machine callbacks
  const onSaveMachine = useCallback((name: string, machineType: DepreciationCategory, editIndex: number | null) => {
    setAppState((prev) => {
      if (editIndex != null) {
        return {
          ...prev,
          savedMachines: prev.savedMachines.map((m, i) =>
            i === editIndex ? { ...m, name, machineType } : m
          ),
        }
      }
      const newMachine = createDefaultMachineProfile(name, machineType)
      return {
        ...prev,
        savedMachines: [...prev.savedMachines, newMachine],
      }
    })
  }, [])

  const onDeleteMachine = useCallback((index: number) => {
    setAppState((prev) => ({
      ...prev,
      savedMachines: prev.savedMachines.filter((_, i) => i !== index),
    }))
    setSelectedMachineIndex((prev) => {
      if (prev === null) return null
      if (prev === index) return null
      if (prev > index) return prev - 1
      return prev
    })
  }, [])

  // Compare machines — per-machine data
  const onCompareMachinesChange = useCallback((machineA: WorkrateInputs, machineB: WorkrateInputs) => {
    setAppState((prev) => {
      const idx = selectedMachineIndex
      if (idx === null || !prev.savedMachines[idx]) return prev
      return {
        ...prev,
        savedMachines: prev.savedMachines.map((m, i) =>
          i === idx ? { ...m, compareMachines: { machineA, machineB } } : m
        ),
      }
    })
  }, [selectedMachineIndex])

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
      setSelectedMachineIndex(null)
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
            if (v !== "machines" && !hasMachineSelected) return
            setMachinePickerOpen(false)
            if (v === "cost-calculator") {
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

            {/* Selected machine banner — shown on all tabs except the Machines tab itself */}
            {activeTab !== "machines" && (() => {
              const allPickerMachines = appState.savedMachines.map((m, i) => ({
                name: m.name, machineType: m.machineType, costMode: m.costMode, index: i,
              }))

              if (selectedMachineIndex === null) {
                const hasMachines = allPickerMachines.length > 0
                return (
                  <div className="mt-4 space-y-0">
                    <div className="rounded-lg border-2 border-dashed border-farm-amber/50 bg-farm-amber/5 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-farm-amber/10 text-farm-amber shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm mb-0.5">No machine selected</div>
                          <p className="text-sm text-muted-foreground">
                            {hasMachines
                              ? "Select a machine below or on the Machines tab to unlock the other tabs."
                              : "Add your first machine on the Machines tab to get started."
                            }
                          </p>
                        </div>
                        {hasMachines && (
                          <button
                            type="button"
                            onClick={() => setMachinePickerOpen(!machinePickerOpen)}
                            className="text-xs font-medium shrink-0 rounded-full px-3 py-1 border border-farm-amber/40 text-farm-amber bg-farm-amber/10 hover:bg-farm-amber hover:text-white active:scale-95 transition-all duration-150 cursor-pointer flex items-center gap-1.5"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m6 9 6 6 6-6"/>
                            </svg>
                            Select
                          </button>
                        )}
                      </div>
                    </div>
                    {machinePickerOpen && hasMachines && (
                      <div className="mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="px-3 py-2 border-b border-border/50 bg-muted/30 flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select a machine</span>
                          <button type="button" onClick={() => setMachinePickerOpen(false)} className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </div>
                        <div className="max-h-[240px] overflow-y-auto divide-y divide-border/30">
                          {allPickerMachines.map((entry) => {
                            const profile = DEPRECIATION_PROFILES[entry.machineType]
                            return (
                              <button
                                key={entry.index}
                                type="button"
                                onClick={() => {
                                  handleSelectMachine(entry.index)
                                  setMachinePickerOpen(false)
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-primary/5 active:bg-primary/10 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-muted-foreground shrink-0">
                                  <MachineIcon type={entry.machineType} size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{entry.name}</div>
                                  <div className="text-xs text-muted-foreground">{profile?.label ?? entry.machineType}</div>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40 shrink-0"><path d="m9 18 6-6-6-6"/></svg>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
              const machine = appState.savedMachines[selectedMachineIndex]
              if (!machine) return null
              const profile = DEPRECIATION_PROFILES[machine.machineType]
              return (
                <div className="mt-4 space-y-0">
                  <div className={`rounded-lg border-2 border-primary bg-primary/5 p-3 shadow-sm ${machinePickerOpen ? "rounded-b-none border-b-0" : ""}`}>
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
                        onClick={() => setMachinePickerOpen(!machinePickerOpen)}
                        className="text-xs font-medium shrink-0 rounded-full px-3 py-1 border border-primary/30 text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all duration-150 cursor-pointer flex items-center gap-1.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {machinePickerOpen
                            ? <path d="m18 15-6-6-6 6"/>
                            : <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>
                          }
                        </svg>
                        {machinePickerOpen ? "Close" : "Change"}
                      </button>
                    </div>
                  </div>
                  {machinePickerOpen && (
                    <div className="rounded-b-lg border-2 border-t-0 border-primary bg-card shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-3 py-2 border-b border-border/50 bg-muted/30">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Switch machine</span>
                      </div>
                      <div className="max-h-[280px] overflow-y-auto divide-y divide-border/30">
                        {allPickerMachines.map((entry) => {
                          const entryProfile = DEPRECIATION_PROFILES[entry.machineType]
                          const isCurrent = selectedMachineIndex === entry.index
                          return (
                            <button
                              key={entry.index}
                              type="button"
                              onClick={() => {
                                if (!isCurrent) handleSelectMachine(entry.index)
                                setMachinePickerOpen(false)
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                                isCurrent ? "bg-primary/8" : "hover:bg-primary/5 active:bg-primary/10"
                              }`}
                            >
                              <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                                isCurrent ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                              }`}>
                                <MachineIcon type={entry.machineType} size={22} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium text-sm truncate ${isCurrent ? "text-primary" : ""}`}>{entry.name}</div>
                                <div className="text-xs text-muted-foreground">{entryProfile?.label ?? entry.machineType}</div>
                              </div>
                              {isCurrent ? (
                                <div className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                </div>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40 shrink-0"><path d="m9 18 6-6-6-6"/></svg>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            <TabsContent value="machines" className="mt-4">
              <MachinesTab
                machines={appState.savedMachines}
                selectedMachineIndex={selectedMachineIndex}
                onSelectMachine={handleSelectMachine}
                onSaveMachine={onSaveMachine}
                onDeleteMachine={onDeleteMachine}
              />
            </TabsContent>

            <TabsContent value="cost-calculator" className="mt-4">
              {selectedMachine && (
                <CostCalculator
                  mode={costMode}
                  onModeChange={handleCostModeChange}
                  hectareInputs={selectedMachine.costPerHectare}
                  hourInputs={selectedMachine.costPerHour}
                  onHectareFieldChange={onHectareFieldChange}
                  onHourFieldChange={onHourFieldChange}
                />
              )}
            </TabsContent>

            <TabsContent value="depreciation" className="mt-4">
              <DepreciationPanel
                category={selectedMachine?.machineType}
                purchasePrice={selectedMachine?.costPerHectare.purchasePrice ?? selectedMachine?.costPerHour.purchasePrice}
              />
            </TabsContent>

            <TabsContent value="compare-machines" className="mt-4">
              <CompareMachines
                initialMachineA={selectedMachine?.compareMachines.machineA}
                initialMachineB={selectedMachine?.compareMachines.machineB}
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
                savedMachines={appState.savedMachines}
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
