import { useState, useEffect, useRef } from "react"
import type { MachineProfile, DepreciationCategory } from "@/lib/types"
import type { MachineCategory } from "@/lib/depreciation-data"
import { DEPRECIATION_PROFILES } from "@/lib/depreciation-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConnectedTabsFooter } from "@/components/ConnectedTabsFooter"

const MACHINE_TYPE_OPTIONS = Object.entries(DEPRECIATION_PROFILES) as [MachineCategory, (typeof DEPRECIATION_PROFILES)[MachineCategory]][]

interface MachinesTabProps {
  machines: MachineProfile[]
  selectedMachineIndex: number | null
  onSelectMachine: (index: number | null) => void
  onSaveMachine: (name: string, machineType: DepreciationCategory, editIndex: number | null) => void
  onDeleteMachine: (index: number) => void
}

interface MachineEntry {
  name: string
  machineType: DepreciationCategory
  costMode: string
  index: number
}

/** SVG icon per machine category */
export function MachineIcon({ type, size = 32, className = "" }: { type: string; size?: number; className?: string }) {
  const s = size
  const common = { xmlns: "http://www.w3.org/2000/svg", width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className }

  switch (type) {
    case "tractors_small":
    case "tractors_large":
      return (
        <svg {...common}>
          <circle cx="7" cy="17" r="3" />
          <circle cx="17.5" cy="15.5" r="4.5" />
          <path d="M7 14V8h5l4 4v3" />
          <path d="M3 17h1M12 8V5h2" />
        </svg>
      )
    case "combines":
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
      return (
        <svg {...common}>
          <path d="M4 8h16" />
          <path d="M6 8v8M10 8v10M14 8v8M18 8v10" />
          <path d="M6 16l-1 3M10 18l-1 3M14 16l-1 3M18 18l-1 3" />
          <path d="M4 8l2-4h12l2 4" />
        </svg>
      )
    case "drills":
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

// Pencil icon
function PencilIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    </svg>
  )
}

// Trash icon
function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}

// Plus icon
function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  )
}

// Check icon
function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

// X icon
function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  )
}

export function MachinesTab({
  machines,
  selectedMachineIndex,
  onSelectMachine,
  onSaveMachine,
  onDeleteMachine,
}: MachinesTabProps) {
  // Inline edit state (which machine card is being edited)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editType, setEditType] = useState<MachineCategory | "">("")

  // Add New form state
  const [addNewOpen, setAddNewOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newMachineType, setNewMachineType] = useState<MachineCategory | "">("")
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
  const allMachines: MachineEntry[] = machines.map((m, i) => ({
    name: m.name,
    machineType: m.machineType,
    costMode: m.costMode,
    index: i,
  }))

  const hasMachines = allMachines.length > 0

  // Duplicate check for add-new form
  const trimmedNewName = newName.trim().toLowerCase()
  const newNameDuplicate = trimmedNewName !== "" && allMachines.some((m) => m.name.toLowerCase() === trimmedNewName)

  // Duplicate check for inline edit
  const trimmedEditName = editName.trim().toLowerCase()
  const editNameDuplicate = trimmedEditName !== "" && allMachines.some((m) => {
    const key = String(m.index)
    if (key === editingKey) return false
    return m.name.toLowerCase() === trimmedEditName
  })

  const profileLabel = (type: string) => {
    const found = MACHINE_TYPE_OPTIONS.find(([key]) => key === type)
    return found ? found[1].label : type
  }

  const entryKey = (e: MachineEntry) => String(e.index)

  const handleSelect = (entry: MachineEntry) => {
    onSelectMachine(entry.index)
  }

  const startEditing = (entry: MachineEntry) => {
    setEditingKey(entryKey(entry))
    setEditName(entry.name)
    setEditType(entry.machineType)
  }

  const cancelEditing = () => {
    setEditingKey(null)
    setEditName("")
    setEditType("")
  }

  const saveEdit = (entry: MachineEntry) => {
    if (!editName.trim() || !editType || editNameDuplicate) return
    onSaveMachine(editName.trim(), editType, entry.index)
    showToast(`Updated "${editName.trim()}" — changes will reflect in the "Worth It?" overview.`)
    setEditingKey(null)
  }

  const [confirmDelete, setConfirmDelete] = useState<MachineEntry | null>(null)

  const handleDelete = (entry: MachineEntry) => {
    setConfirmDelete(entry)
  }

  const confirmDeleteAction = () => {
    if (!confirmDelete) return
    onDeleteMachine(confirmDelete.index)
    if (selectedMachineIndex === confirmDelete.index) {
      onSelectMachine(null)
    }
    if (editingKey === entryKey(confirmDelete)) {
      cancelEditing()
    }
    showToast(`Deleted "${confirmDelete.name}".`)
    setConfirmDelete(null)
  }

  const handleSaveNew = () => {
    if (!newName.trim() || !newMachineType || newNameDuplicate) return
    onSaveMachine(newName.trim(), newMachineType, null)
    onSelectMachine(machines.length)
    showToast(`Saved "${newName.trim()}" — edit its costs on the other tabs. It'll feed into the "Worth It?" overview.`)
    setNewName("")
    setNewMachineType("")
    setAddNewOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="rounded-lg bg-primary/10 border border-primary/30 px-4 py-2.5 text-sm text-primary animate-in fade-in slide-in-from-top-1 duration-200">
          {toast}
        </div>
      )}

      {/* Guidance banner — shown only when no machine is selected and machines exist */}
      {hasMachines && selectedMachineIndex === null && (
        <div className="rounded-lg border border-farm-amber/40 bg-farm-amber/8 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="shrink-0 text-farm-amber">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <p className="text-sm text-foreground/80">
              <span className="font-medium">Select a machine</span> below to unlock the cost analysis tabs.
            </p>
          </div>
        </div>
      )}

      {/* Add Machine button / form */}
      <div className="rounded-lg bg-card shadow-sm overflow-hidden">
        {!addNewOpen ? (
          <button
            type="button"
            onClick={() => setAddNewOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors cursor-pointer border-2 border-dashed border-primary/30 rounded-lg"
          >
            <PlusIcon size={18} />
            Add New Machine
          </button>
        ) : (
          <div className="border-2 border-primary/20 rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
              <h3 className="text-sm font-semibold">New Machine</h3>
              <button
                type="button"
                onClick={() => { setAddNewOpen(false); setNewName(""); setNewMachineType("") }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {newNameDuplicate && (
                <p className="text-xs text-destructive">A machine with this name already exists.</p>
              )}

              <div className="grid grid-cols-[1fr_1fr] gap-3">
                <div>
                  <label htmlFor="new-machine-name-input" className="text-xs font-medium text-muted-foreground block mb-1">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="new-machine-name-input"
                    type="text"
                    placeholder="e.g. John Deere 6150R"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="min-h-[44px]"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="new-machine-type-select" className="text-xs font-medium text-muted-foreground block mb-1">
                    Machine type <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="new-machine-type-select"
                    value={newMachineType}
                    onChange={(e) => setNewMachineType(e.target.value as MachineCategory | "")}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm min-h-[44px]"
                    required
                  >
                    <option value="" disabled>Please select...</option>
                    {MACHINE_TYPE_OPTIONS.map(([key, p]) => (
                      <option key={key} value={key}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleSaveNew}
                disabled={!newName.trim() || !newMachineType || newNameDuplicate}
                className="w-full min-h-[44px]"
              >
                Save Machine
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Machine list */}
      {hasMachines && (
        <div className="rounded-lg bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Your Machines</h2>
              <span className="inline-flex items-center justify-center rounded-full bg-primary/12 text-primary px-2 py-0.5 text-[11px] font-semibold leading-none tabular-nums">
                {allMachines.length}
              </span>
            </div>
          </div>

          <div className="divide-y divide-border/40">
            {allMachines.map((entry) => {
              const key = entryKey(entry)
              const isSelected = selectedMachineIndex === entry.index
              const isBeingEdited = editingKey === key

              return (
                <div key={key}>
                  {/* Machine row */}
                  <div
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      isSelected
                        ? "bg-primary/6"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    {/* Radio-style selector */}
                    <button
                      type="button"
                      onClick={() => handleSelect(entry)}
                      className={`shrink-0 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40 hover:border-primary/60"
                      }`}
                      title={isSelected ? "Selected" : "Select this machine"}
                    >
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>

                    {/* Machine icon */}
                    <div className={`shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                      <MachineIcon type={entry.machineType} size={24} />
                    </div>

                    {/* Machine info */}
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left"
                      onClick={() => handleSelect(entry)}
                    >
                      <div className="font-medium text-sm truncate">{entry.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {profileLabel(entry.machineType)}
                      </div>
                    </button>

                    {/* Action buttons */}
                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isBeingEdited) {
                            cancelEditing()
                          } else {
                            startEditing(entry)
                          }
                        }}
                        className={`p-1.5 rounded-md transition-colors ${
                          isBeingEdited
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        }`}
                        title="Edit name &amp; type"
                      >
                        <PencilIcon size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(entry)
                        }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isBeingEdited && (
                    <div className="px-4 pb-3 pt-1 bg-muted/20 border-t border-border/30">
                      <div className="space-y-2.5">
                        {editNameDuplicate && (
                          <p className="text-xs text-destructive">A machine with this name already exists.</p>
                        )}
                        <div className="grid grid-cols-[1fr_1fr] gap-2">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Name</label>
                            <Input
                              type="text"
                              placeholder="e.g. John Deere 6150R"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="min-h-[40px] text-sm"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Type</label>
                            <select
                              value={editType}
                              onChange={(e) => setEditType(e.target.value as MachineCategory | "")}
                              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm min-h-[40px]"
                            >
                              <option value="" disabled>Please select...</option>
                              {MACHINE_TYPE_OPTIONS.map(([k, p]) => (
                                <option key={k} value={k}>{p.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEditing}
                            className="min-h-[36px] gap-1.5"
                          >
                            <XIcon size={14} />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveEdit(entry)}
                            disabled={!editName.trim() || !editType || editNameDuplicate}
                            className="min-h-[36px] gap-1.5"
                          >
                            <CheckIcon size={14} />
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasMachines && !addNewOpen && (
        <div className="rounded-lg bg-card shadow-sm p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-3">
            <MachineIcon type="tractors_large" size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No machines yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-[280px] mx-auto">
            Add your first machine to start analysing ownership costs across the other tabs.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddNewOpen(true)}
            className="min-h-[40px] gap-1.5"
          >
            <PlusIcon size={16} />
            Add your first machine
          </Button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmDelete(null)}>
          <div className="rounded-lg bg-card p-6 shadow-lg max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-sm">Delete &ldquo;{confirmDelete.name}&rdquo;?</h3>
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
      {machines.length > 0 && (
        <ConnectedTabsFooter tabs={["cost-calculator", "profitability"]} />
      )}
    </div>
  )
}
