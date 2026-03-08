import { useMemo, useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CollapsibleSection } from "@/components/CollapsibleSection"
import { ContractorRatesPanel } from "@/components/ContractorRatesPanel"
import { ResultBanner } from "@/components/ResultBanner"
import { formatGBP, formatPct } from "@/lib/format"
import {
  calculateContractingService,
  calculateContractingSummary,
} from "@/lib/calculations"
import { calcCostPerHectare, calcCostPerHour } from "@/lib/calculations"
import type {
  ContractingIncomeState,
  ContractingService,
  ChargeUnit,
  SavedMachine,
  CostPerHectareInputs,
  CostPerHourInputs,
} from "@/lib/types"

interface ContractingIncomePlannerProps {
  initialState: ContractingIncomeState
  onChange: (state: ContractingIncomeState) => void
  savedHectareMachines: SavedMachine<CostPerHectareInputs>[]
  savedHourMachines: SavedMachine<CostPerHourInputs>[]
}

const CHARGE_UNITS: { value: ChargeUnit; label: string }[] = [
  { value: "ha", label: "ha" },
  { value: "hr", label: "hr" },
  { value: "bale", label: "bale" },
  { value: "tonne", label: "tonne" },
  { value: "head", label: "head" },
  { value: "m", label: "m" },
]

function getMarginBanner(marginPct: number): {
  type: "green" | "amber" | "red"
  mainText: string
} {
  if (marginPct > 20) {
    return {
      type: "green",
      mainText: `Profitable service — ${formatPct(marginPct)} margin`,
    }
  }
  if (marginPct >= 0) {
    return {
      type: "amber",
      mainText: `Marginal — only ${formatPct(marginPct)} margin, review your costs`,
    }
  }
  return {
    type: "red",
    mainText: "Loss-making — you're spending more than you earn",
  }
}

function getSummaryBanner(marginPct: number): {
  type: "green" | "amber" | "red"
  mainText: string
} {
  if (marginPct > 20) {
    return {
      type: "green",
      mainText: `Contracting is profitable overall — ${formatPct(marginPct)} margin`,
    }
  }
  if (marginPct >= 0) {
    return {
      type: "amber",
      mainText: `Marginal overall — only ${formatPct(marginPct)} margin`,
    }
  }
  return {
    type: "red",
    mainText: "Contracting is loss-making overall",
  }
}

export function ContractingIncomePlanner({
  initialState,
  onChange,
  savedHectareMachines,
  savedHourMachines,
}: ContractingIncomePlannerProps) {
  const { services } = initialState
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

  const serviceResults = useMemo(
    () =>
      services.map((s) =>
        calculateContractingService(
          s.chargeRate,
          s.annualVolume,
          s.ownCostPerUnit,
          s.additionalCosts,
        ),
      ),
    [services],
  )

  const summary = useMemo(
    () => calculateContractingSummary(serviceResults),
    [serviceResults],
  )

  const addService = () => {
    const newService: ContractingService = {
      id: crypto.randomUUID(),
      name: "New Service",
      chargeRate: 0,
      chargeUnit: "ha",
      annualVolume: 0,
      ownCostPerUnit: 0,
      additionalCosts: 0,
      linkedMachineSource: null,
    }
    onChange({ services: [...services, newService] })
  }

  const deleteService = (id: string) => {
    onChange({ services: services.filter((s) => s.id !== id) })
  }

  const updateService = (id: string, updates: Partial<ContractingService>) => {
    onChange({
      services: services.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })
  }

  const handlePullFromMachine = (
    serviceId: string,
    sourceKey: string,
  ) => {
    const [tab, indexStr] = sourceKey.split(":")
    const index = parseInt(indexStr, 10)

    if (tab === "hectare") {
      const machine = savedHectareMachines[index]
      if (!machine) return
      const results = calcCostPerHectare(machine.inputs)
      updateService(serviceId, {
        ownCostPerUnit: Math.round(results.totalCostPerHa * 100) / 100,
        chargeUnit: "ha",
        linkedMachineSource: sourceKey,
      })
      showToast(`Pulled costs from "${machine.name}" — cost per hectare applied.`)
    } else if (tab === "hour") {
      const machine = savedHourMachines[index]
      if (!machine) return
      const results = calcCostPerHour(machine.inputs)
      updateService(serviceId, {
        ownCostPerUnit: Math.round(results.totalCostPerHr * 100) / 100,
        chargeUnit: "hr",
        linkedMachineSource: sourceKey,
      })
      showToast(`Pulled costs from "${machine.name}" — cost per hour applied.`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">
          Will contracting pay?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Model income from offering your machinery to others.
        </p>
        <p className="text-xs text-muted-foreground italic">
          Note: Own cost per unit is based on your farm's usage alone. If the
          machine does significant additional work for contracting, your true
          cost per unit may be lower — and your margin higher.
        </p>
      </CardHeader>
      {toast && (
        <div className="mx-6 rounded-md bg-primary/10 border border-primary/30 px-3 py-2 text-sm text-primary animate-in fade-in slide-in-from-top-1 duration-200">
          {toast}
        </div>
      )}
      <CardContent className="space-y-6">
        <Button onClick={addService} variant="outline">
          + Add Service
        </Button>

        {services.map((service, idx) => {
          const results = serviceResults[idx]
          const banner = getMarginBanner(results.marginPct)
          const hasResults = service.chargeRate > 0 && service.annualVolume > 0

          return (
            <Card key={service.id} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Service {idx + 1}
                  </CardTitle>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteService(service.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Service name */}
                <div className="space-y-1">
                  <Label>Service name</Label>
                  <Input
                    value={service.name}
                    onChange={(e) =>
                      updateService(service.id, {
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Pull from saved machine */}
                {(savedHectareMachines.length > 0 ||
                  savedHourMachines.length > 0) && (
                  <div className="space-y-1">
                    <Label>Pull from saved machine</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={service.linkedMachineSource ?? ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          handlePullFromMachine(service.id, e.target.value)
                        }
                      }}
                    >
                      <option value="">Select...</option>
                      {savedHectareMachines.length > 0 && (
                        <optgroup label="Cost / Hectare">
                          {savedHectareMachines.map((m, i) => {
                            const r = calcCostPerHectare(m.inputs)
                            return (
                              <option key={`hectare:${i}`} value={`hectare:${i}`}>
                                {m.name} ({formatGBP(r.totalCostPerHa)}/ha)
                              </option>
                            )
                          })}
                        </optgroup>
                      )}
                      {savedHourMachines.length > 0 && (
                        <optgroup label="Cost / Hour">
                          {savedHourMachines.map((m, i) => {
                            const r = calcCostPerHour(m.inputs)
                            return (
                              <option key={`hour:${i}`} value={`hour:${i}`}>
                                {m.name} ({formatGBP(r.totalCostPerHr)}/hr)
                              </option>
                            )
                          })}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}

                {/* Charge rate + unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Charge rate (£)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={service.chargeRate || ""}
                      onChange={(e) =>
                        updateService(service.id, {
                          chargeRate: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>per</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={service.chargeUnit}
                      onChange={(e) =>
                        updateService(service.id, {
                          chargeUnit: e.target.value as ChargeUnit,
                        })
                      }
                    >
                      {CHARGE_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Annual volume */}
                <div className="space-y-1">
                  <Label>
                    Work you&apos;ll do per year ({service.chargeUnit})
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={service.annualVolume || ""}
                    onChange={(e) =>
                      updateService(service.id, {
                        annualVolume: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                {/* Own cost per unit */}
                <div className="space-y-1">
                  <Label>
                    Your cost per {service.chargeUnit} (£)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={service.ownCostPerUnit || ""}
                    onChange={(e) =>
                      updateService(service.id, {
                        ownCostPerUnit: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  {service.linkedMachineSource && service.ownCostPerUnit > 0 && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-1">
                      ⚠ This cost is based on your farm's usage alone. If this
                      machine also does contracting work, the true per-unit cost
                      is lower (fixed costs spread over more{" "}
                      {service.chargeUnit === "ha" ? "hectares" : "hours"}).
                      Your actual margin may be higher than shown.
                    </p>
                  )}
                </div>

                {/* Additional costs */}
                <div className="space-y-1">
                  <Label>Additional costs (£/year)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={service.additionalCosts || ""}
                    onChange={(e) =>
                      updateService(service.id, {
                        additionalCosts: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                {/* NAAC Rates Panel */}
                <CollapsibleSection
                  title="NAAC Rates (what others charge)"
                  defaultOpen={false}
                >
                  <ContractorRatesPanel
                    onApply={(rate) =>
                      updateService(service.id, { chargeRate: rate })
                    }
                    currentRate={service.chargeRate}
                    unitFilter={service.chargeUnit}
                  />
                </CollapsibleSection>

                {/* Results */}
                {hasResults && (
                  <div className="mt-4 space-y-3 rounded-lg bg-muted/50 p-4">
                    <h4 className="font-semibold text-sm uppercase tracking-wide">
                      Results
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">
                        Gross income:
                      </span>
                      <span className="font-medium text-right">
                        {formatGBP(results.grossIncome)}/year
                      </span>

                      <span className="text-muted-foreground">
                        Total costs:
                      </span>
                      <span className="font-medium text-right">
                        {formatGBP(results.totalOwnCost)}/year
                      </span>

                      <span className="text-muted-foreground">
                        Profit/unit:
                      </span>
                      <span className="font-medium text-right">
                        {formatGBP(results.profitPerUnit)}/{service.chargeUnit}
                      </span>

                      <span className="text-muted-foreground">
                        Annual profit:
                      </span>
                      <span className="font-medium text-right">
                        {formatGBP(results.annualProfit)}
                      </span>

                      <span className="text-muted-foreground">Margin:</span>
                      <span className="font-medium text-right">
                        {formatPct(results.marginPct)}
                      </span>
                    </div>
                    <div data-banner={banner.type}>
                      <ResultBanner
                        type={banner.type}
                        mainText={banner.mainText}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {services.length > 0 && (
          <Button onClick={addService} variant="outline">
            + Add Service
          </Button>
        )}

        {/* Overall Summary */}
        {services.length >= 1 && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg uppercase tracking-wide">
                Overall Contracting Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Total services:</span>
                <span className="font-medium text-right">
                  {summary.serviceCount}
                </span>

                <span className="text-muted-foreground">
                  Total gross income:
                </span>
                <span className="font-medium text-right">
                  {formatGBP(summary.totalGrossIncome)}/year
                </span>

                <span className="text-muted-foreground">Total costs:</span>
                <span className="font-medium text-right">
                  {formatGBP(summary.totalCosts)}/year
                </span>

                <span className="text-muted-foreground">Total profit:</span>
                <span className="font-medium text-right">
                  {formatGBP(summary.totalProfit)}/year
                </span>

                <span className="text-muted-foreground">Overall margin:</span>
                <span className="font-medium text-right">
                  {formatPct(summary.overallMarginPct)}
                </span>
              </div>
              {(() => {
                const b = getSummaryBanner(summary.overallMarginPct)
                return (
                  <div data-banner={b.type}>
                    <ResultBanner type={b.type} mainText={b.mainText} />
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
