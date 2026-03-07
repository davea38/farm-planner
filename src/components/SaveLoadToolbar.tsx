import { useState } from "react"
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

  return (
    <div className="rounded-lg bg-card p-4 shadow-sm space-y-3">
      <h2 className="text-sm font-semibold">Saved Machines</h2>

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
                onDelete(selectedIndex)
                setSelectedIndex(null)
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
