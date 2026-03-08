import { useState, useEffect, useRef } from "react"
import type { SavedMachine } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SaveLoadToolbarProps<T> {
  savedMachines: SavedMachine<T>[]
  onSave: (name: string) => void
  onLoad: (index: number) => void
  onDelete: (index: number) => void
}

export function SaveLoadToolbar<T>({
  savedMachines,
  onSave,
  onLoad,
  onDelete,
}: SaveLoadToolbarProps<T>) {
  const [name, setName] = useState("")
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

  return (
    <div className="rounded-lg bg-card p-4 shadow-sm space-y-3">
      <h2 className="text-sm font-semibold">Saved Machines</h2>

      {/* Save confirmation toast */}
      {toast && (
        <div className="rounded-md bg-primary/10 border border-primary/30 px-3 py-2 text-sm text-primary animate-in fade-in slide-in-from-top-1 duration-200">
          {toast}
        </div>
      )}

      {/* Save row */}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Name this machine..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-h-[44px]"
        />
        <Button
          onClick={() => {
            if (name.trim()) {
              onSave(name.trim())
              showToast(`Saved! This machine's costs now feed into the "Worth It?" overview.`)
              setName("")
            }
          }}
          disabled={!name.trim()}
          className="min-h-[44px]"
        >
          Save
        </Button>
      </div>

      {/* Load / Delete row */}
      {savedMachines.length > 0 && (
        <div className="flex items-center gap-2">
          <Select
            value={selectedIndex !== null ? String(selectedIndex) : null}
            onValueChange={(v) => {
              const idx = Number(v)
              setSelectedIndex(idx)
              onLoad(idx)
              const machineName = savedMachines[idx]?.name ?? "Machine"
              showToast(`Loaded "${machineName}" — inputs updated on this tab.`)
            }}
          >
            <SelectTrigger className="flex-1 min-h-[44px]">
              <SelectValue placeholder="Load a saved machine..." />
            </SelectTrigger>
            <SelectContent>
              {savedMachines.map((machine, idx) => (
                <SelectItem key={idx} value={String(idx)}>
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
                setSelectedIndex(null)
                showToast(`Deleted "${machineName}" — removed from "Worth It?" overview.`)
              }
            }}
            disabled={selectedIndex === null}
            className="min-h-[44px]"
          >
            Delete
          </Button>
        </div>
      )}
    </div>
  )
}
