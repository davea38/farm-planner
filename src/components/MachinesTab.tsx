import { useState, useEffect, useRef } from "react"
import type { SavedMachine, CostPerHectareInputs, CostPerHourInputs, DepreciationCategory } from "@/lib/types"
import type { MachineCategory } from "@/lib/depreciation-data"
import { DEPRECIATION_PROFILES } from "@/lib/depreciation-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const MACHINE_TYPE_OPTIONS = Object.entries(DEPRECIATION_PROFILES) as [MachineCategory, (typeof DEPRECIATION_PROFILES)[MachineCategory]][]

export type CostMode = "hectare" | "hour"

export interface SelectedMachine {
  costMode: CostMode
  index: number
}

interface MachinesTabProps {
  hectareMachines: SavedMachine<CostPerHectareInputs>[]
  hourMachines: SavedMachine<CostPerHourInputs>[]
  selectedMachine: SelectedMachine | null
  onSelectMachine: (sel: SelectedMachine | null) => void
  onSaveHectareMachine: (name: string, machineType: DepreciationCategory, selectedIndex: number | null) => void
  onSaveHourMachine: (name: string, machineType: DepreciationCategory, selectedIndex: number | null) => void
  onDeleteHectareMachine: (index: number) => void
  onDeleteHourMachine: (index: number) => void
}

interface MachineEntry {
  name: string
  machineType: DepreciationCategory
  costMode: CostMode
  index: number
}

/** SVG icon per machine category */
export function MachineIcon({ type, size = 32, className = "" }: { type: string; size?: number; className?: string }) {
  const s = size
  const common = { xmlns: "http://www.w3.org/2000/svg", width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className }

  switch (type) {
    case "tractors_small":
    case "tractors_large":
      // Tractor
      return (
        <svg {...common}>
          <circle cx="7" cy="17" r="3" />
          <circle cx="17.5" cy="15.5" r="4.5" />
          <path d="M7 14V8h5l4 4v3" />
          <path d="M3 17h1M12 8V5h2" />
        </svg>
      )
    case "combines":
      // Combine harvester
      return (
        <svg {...common}>
          <rect x="6" y="6" width="12" height="10" rx="2" />
          <circle cx="9" cy="19" r="2" />
          <circle cx="17" cy="19" r="2" />
          <path d="M2 12h4M6 9h12" />
          <path d="M11 16v-4" />
        </svg>
      )
    case "forage_harvesters":
      // Forage / baler
      return (
        <svg {...common}>
          <rect x="4" y="8" width="14" height="8" rx="2" />
          <circle cx="7" cy="19" r="2" />
          <circle cx="15" cy="19" r="2" />
          <path d="M18 12h3v4h-3" />
          <path d="M4 11h14M11 8v8" />
        </svg>
      )
    case "sprayers":
      // Sprayer
      return (
        <svg {...common}>
          <rect x="8" y="6" width="8" height="8" rx="1" />
          <circle cx="10" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path d="M3 14h5M3 14v4M5 18v-4" />
          <path d="M3 20v-2M5 20v-2M7 14v6" />
        </svg>
      )
    case "tillage":
      // Cultivator / tillage
      return (
        <svg {...common}>
          <path d="M4 8h16" />
          <path d="M6 8v8M10 8v10M14 8v8M18 8v10" />
          <path d="M6 16l-1 3M10 18l-1 3M14 16l-1 3M18 18l-1 3" />
          <path d="M4 8l2-4h12l2 4" />
        </svg>
      )
    case "drills":
      // Seed drill
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="6" rx="2" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path d="M6 12v4M10 12v6M14 12v6M18 12v4" />
          <path d="M8 6v-2h8v2" />
        </svg>
      )
    default:
      // Miscellaneous / generic equipment
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="8" rx="2" />
          <circle cx="7" cy="19" r="2" />
          <circle cx="17" cy="19" r="2" />
          <path d="M10 8V5h4v3" />
          <path d="M3 12h18" />
        </svg>
      )
  }
}

export function MachinesTab({
  hectareMachines,
  hourMachines,
  selectedMachine,
  onSelectMachine,
  onSaveHectareMachine,
  onSaveHourMachine,
  onDeleteHectareMachine,
  onDeleteHourMachine,
}: MachinesTabProps) {
  const [name, setName] = useState("")
  const [machineType, setMachineType] = useState<MachineCategory | "">("")
  const [costMode, setCostMode] = useState<CostMode>("hectare")
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  // Build unified list
  const allMachines: MachineEntry[] = [
    ...hectareMachines.map((m, i) => ({ name: m.name, machineType: m.machineType, costMode: "hectare" as CostMode, index: i })),
    ...hourMachines.map((m, i) => ({ name: m.name, machineType: m.machineType, costMode: "hour" as CostMode, index: i })),
  ]

  // When editing a selected machine, populate the form
  const isEditing = selectedMachine !== null
  const editingEntry = isEditing
    ? allMachines.find((m) => m.costMode === selectedMachine.costMode && m.index === selectedMachine.index)
    : null

  // Sync form when selection changes
  useEffect(() => {
    if (editingEntry) {
      setName(editingEntry.name)
      setMachineType(editingEntry.machineType)
      setCostMode(editingEntry.costMode)
    }
  }, [selectedMachine?.costMode, selectedMachine?.index]) // eslint-disable-line react-hooks/exhaustive-deps

  // Duplicate check across both lists, excluding the selected machine
  const trimmedName = name.trim().toLowerCase()
  const nameDuplicate = trimmedName !== "" && allMachines.some((m) => {
    if (isEditing && m.costMode === selectedMachine.costMode && m.index === selectedMachine.index) return false
    return m.name.toLowerCase() === trimmedName
  })

  const handleSave = () => {
    if (!name.trim() || !machineType || nameDuplicate) return

    if (isEditing) {
      if (selectedMachine.costMode === "hectare") {
        onSaveHectareMachine(name.trim(), machineType, selectedMachine.index)
      } else {
        onSaveHourMachine(name.trim(), machineType, selectedMachine.index)
      }
      showToast(`Updated "${name.trim()}" — changes saved.`)
    } else {
      if (costMode === "hectare") {
        onSaveHectareMachine(name.trim(), machineType, null)
        const newIndex = hectareMachines.length
        onSelectMachine({ costMode: "hectare", index: newIndex })
      } else {
        onSaveHourMachine(name.trim(), machineType, null)
        const newIndex = hourMachines.length
        onSelectMachine({ costMode: "hour", index: newIndex })
      }
      showToast(`Saved "${name.trim()}" — now edit its costs on the other tabs.`)
    }
  }

  const handleSelect = (entry: MachineEntry) => {
    onSelectMachine({ costMode: entry.costMode, index: entry.index })
    setName(entry.name)
    setMachineType(entry.machineType)
    setCostMode(entry.costMode)
  }

  const [confirmDelete, setConfirmDelete] = useState<MachineEntry | null>(null)

  const handleDelete = (entry: MachineEntry) => {
    setConfirmDelete(entry)
  }

  const confirmDeleteAction = () => {
    if (!confirmDelete) return
    if (confirmDelete.costMode === "hectare") {
      onDeleteHectareMachine(confirmDelete.index)
    } else {
      onDeleteHourMachine(confirmDelete.index)
    }
    if (selectedMachine && selectedMachine.costMode === confirmDelete.costMode && selectedMachine.index === confirmDelete.index) {
      onSelectMachine(null)
      setName("")
      setMachineType("")
    }
    showToast(`Deleted "${confirmDelete.name}".`)
    setConfirmDelete(null)
  }

  const profileLabel = (type: string) => {
    const found = MACHINE_TYPE_OPTIONS.find(([key]) => key === type)
    return found ? found[1].label : type
  }

  return (
    <div className="space-y-6">
      {/* Create / Edit form */}
      <div className="rounded-lg bg-card p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold">Machine Details</h2>

        {toast && (
          <div className="rounded-md bg-primary/10 border border-primary/30 px-3 py-2 text-sm text-primary animate-in fade-in slide-in-from-top-1 duration-200">
            {toast}
          </div>
        )}

        {nameDuplicate && (
          <p className="text-xs text-red-500">A machine with this name already exists.</p>
        )}

        <div className="grid grid-cols-[1fr_1fr] gap-2">
          <div>
            <label htmlFor="machine-name-input" className="text-xs font-medium text-muted-foreground block mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="machine-name-input"
              type="text"
              placeholder="e.g. John Deere 6150R"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-[44px]"
            />
          </div>
          <div>
            <label htmlFor="machine-type-select" className="text-xs font-medium text-muted-foreground block mb-1">
              Machine type <span className="text-red-500">*</span>
            </label>
            <select
              id="machine-type-select"
              value={machineType}
              onChange={(e) => setMachineType(e.target.value as MachineCategory | "")}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm min-h-[44px]"
              required
            >
              <option value="" disabled>
                Please select...
              </option>
              {MACHINE_TYPE_OPTIONS.map(([key, p]) => (
                <option key={key} value={key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={!name.trim() || !machineType || nameDuplicate}
          className="w-full min-h-[44px]"
        >
          Save
        </Button>
      </div>

      {/* Machine list */}
      <div className="rounded-lg bg-card p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold">Your Machines</h2>

        {allMachines.length === 0 ? (
          <div className="flex items-center gap-3 rounded-md border border-dashed border-muted-foreground/30 px-4 py-3 text-sm text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <span>Add your first machine above to get started.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {allMachines.map((entry) => {
              const isSelected = selectedMachine?.costMode === entry.costMode && selectedMachine?.index === entry.index
              return (
                <div
                  key={`${entry.costMode}-${entry.index}`}
                  className={`flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => handleSelect(entry)}
                >
                  <div className={`shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                    <MachineIcon type={entry.machineType} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{entry.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {profileLabel(entry.machineType)}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-xs font-medium text-primary shrink-0">Selected</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(entry)
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmDelete(null)}>
          <div className="rounded-lg bg-card p-6 shadow-lg max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-sm">Delete "{confirmDelete.name}"?</h3>
            <p className="text-sm text-muted-foreground">This will permanently remove this machine and its saved data.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(null)} className="min-h-[44px]">
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteAction} className="min-h-[44px]">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
