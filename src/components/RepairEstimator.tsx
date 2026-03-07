import { useState, useMemo } from "react"
import { lookupRepairPct, machineTypes, type MachineType } from "@/lib/repair-data"
import { formatPct } from "@/lib/format"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface RepairEstimatorProps {
  onApply: (pct: number) => void
}

export function RepairEstimator({ onApply }: RepairEstimatorProps) {
  const [open, setOpen] = useState(false)
  const [machineType, setMachineType] = useState<MachineType>("tractors")
  const [annualHours, setAnnualHours] = useState(500)

  const repairPct = useMemo(
    () => lookupRepairPct(machineType, annualHours),
    [machineType, annualHours]
  )

  const selectedLabel = machineTypes.find((m) => m.type === machineType)?.label ?? "Tractors"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="text-xs text-primary hover:underline cursor-pointer font-medium"
      >
        Help me estimate repairs
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Repair Cost Estimator</DialogTitle>
          <DialogDescription>
            Use AHDB data to estimate your annual repair cost as a percentage of purchase price.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Machine type</label>
            <Select value={machineType} onValueChange={(v) => setMachineType(v as MachineType)}>
              <SelectTrigger className="w-full">
                <SelectValue>{selectedLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {machineTypes.map((mt) => (
                  <SelectItem key={mt.type} value={mt.type}>
                    {mt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Annual usage</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={annualHours}
                onChange={(e) => setAnnualHours(Number(e.target.value))}
                min={0}
                className="w-28 text-right tabular-nums"
              />
              <span className="text-sm text-muted-foreground">hours/year</span>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            For a <strong>{selectedLabel.toLowerCase()}</strong> used{" "}
            <strong>{annualHours}</strong> hours/year, budget about{" "}
            <strong className="text-primary text-base">{formatPct(repairPct)}</strong>{" "}
            of purchase price for repairs.
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              onApply(repairPct)
              setOpen(false)
            }}
          >
            Use this value
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
