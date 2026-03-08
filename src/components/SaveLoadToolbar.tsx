import { useState, useEffect, useRef } from "react"
import type { SavedMachine } from "@/lib/types"
import type { MachineCategory } from "@/lib/depreciation-data"
import { DEPRECIATION_PROFILES } from "@/lib/depreciation-data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const MACHINE_TYPE_OPTIONS = Object.entries(DEPRECIATION_PROFILES) as [MachineCategory, (typeof DEPRECIATION_PROFILES)[MachineCategory]][]

interface SaveLoadToolbarProps<T> {
  savedMachines: SavedMachine<T>[]
  onSave: (name: string, machineType: MachineCategory, selectedIndex: number | null) => void
  onLoad: (index: number) => void
  onDelete: (index: number) => void
  onReset?: () => void
}

export function SaveLoadToolbar<T>({
  savedMachines,
  onSave,
  onLoad,
  onDelete,
  onReset,
}: SaveLoadToolbarProps<T>) {
  const [name, setName] = useState("")
  const [machineType, setMachineType] = useState<MachineCategory | "">("")
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
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

  // When a machine is loaded, update the machineType state
  const handleLoad = (index: number) => {
    const machine = savedMachines[index]
    if (machine) {
      setMachineType(machine.machineType)
      setName(machine.name)
    }
    setSelectedIndex(index)
    onLoad(index)
  }

  // Check for duplicate name (exclude the currently selected machine when editing)
  const trimmedName = name.trim().toLowerCase()
  const nameDuplicate = trimmedName !== "" && savedMachines.some((m, i) =>
    m.name.toLowerCase() === trimmedName && i !== selectedIndex
  )

  return (
    <div className="rounded-lg bg-card p-4 shadow-sm space-y-3">
      <h2 className="text-sm font-semibold">Saved Machines</h2>

      {/* Save confirmation toast */}
      {toast && (
        <div className="rounded-md bg-primary/10 border border-primary/30 px-3 py-2 text-sm text-primary animate-in fade-in slide-in-from-top-1 duration-200">
          {toast}
        </div>
      )}

      {/* Name + Machine type + Save row */}
      {nameDuplicate && (
        <p className="text-xs text-red-500">A machine with this name already exists.</p>
      )}
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <div>
          <label htmlFor="machine-name-input" className="text-xs font-medium text-muted-foreground block mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="machine-name-input"
            type="text"
            placeholder="Name this machine..."
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
        <Button
          onClick={() => {
            if (name.trim() && machineType && !nameDuplicate) {
              onSave(name.trim(), machineType, selectedIndex)
              if (selectedIndex !== null) {
                showToast(`Updated "${name.trim()}" — changes saved.`)
              } else {
                showToast(`Saved! This machine's costs now feed into the "Worth It?" overview.`)
              }
            }
          }}
          disabled={!name.trim() || !machineType || nameDuplicate}
          className="min-h-[44px]"
        >
          Save
        </Button>
      </div>

      {/* Load / Delete row */}
      {savedMachines.length > 0 ? (
        <div className="flex items-center gap-2">
          <Select
            value={selectedIndex !== null ? savedMachines[selectedIndex]?.name : undefined}
            onValueChange={(v) => {
              const idx = savedMachines.findIndex((m) => m.name === v)
              if (idx < 0) return
              handleLoad(idx)
              showToast(`Loaded "${v}" — inputs updated on this tab.`)
            }}
          >
            <SelectTrigger className="flex-1 min-h-[44px]">
              <SelectValue placeholder="Load a saved machine..." />
            </SelectTrigger>
            <SelectContent>
              {savedMachines.map((machine) => (
                <SelectItem key={machine.name} value={machine.name}>
                  {machine.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="destructive"
            onClick={() => {
              if (selectedIndex !== null) {
                const machineName = savedMachines[selectedIndex]?.name ?? "Machine"
                onDelete(selectedIndex)
                if (savedMachines.length > 1) {
                  const nextIndex = 0
                  const firstRemaining = savedMachines[selectedIndex === 0 ? 1 : 0]
                  setSelectedIndex(nextIndex)
                  setMachineType(firstRemaining?.machineType ?? "")
                  setName(firstRemaining?.name ?? "")
                  onLoad(nextIndex)
                  showToast(`Deleted "${machineName}" — loaded "${firstRemaining?.name}".`)
                } else {
                  setSelectedIndex(null)
                  setMachineType("")
                  setName("")
                  onReset?.()
                  showToast(`Deleted "${machineName}" — form reset to defaults.`)
                }
              }
            }}
            disabled={selectedIndex === null}
            className="min-h-[44px]"
          >
            Delete
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-md border border-dashed border-muted-foreground/30 px-4 py-3 text-sm text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          <span>Name and save your first machine above — it will appear in the "Worth It?" overview.</span>
        </div>
      )}
    </div>
  )
}
