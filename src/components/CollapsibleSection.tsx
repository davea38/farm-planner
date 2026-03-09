import { useState } from "react"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"

interface CollapsibleSectionProps {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  /** Controlled open state (overrides defaultOpen) */
  open?: boolean
  /** Callback when the open state changes */
  onOpenChange?: (open: boolean) => void
  /** Visual variant */
  variant?: "default" | "muted"
  children: React.ReactNode
}

export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  open: propOpen,
  onOpenChange,
  variant = "default",
  children,
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const open = propOpen ?? internalOpen
  const setOpen = (value: boolean) => {
    if (propOpen !== undefined) {
      onOpenChange?.(value)
    } else {
      setInternalOpen(value)
    }
  }

  const triggerClasses = variant === "muted"
    ? "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 min-h-[44px] hover:bg-muted/60 transition-colors cursor-pointer"
    : "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 min-h-[44px] hover:bg-muted/60 transition-colors cursor-pointer"

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className={triggerClasses}>
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center justify-center w-5 h-5 rounded transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
            <svg
              className="h-4 w-4 shrink-0 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-sm font-semibold leading-tight">{title}</span>
            {subtitle && (
              <span className="text-[11px] text-muted-foreground leading-tight">{subtitle}</span>
            )}
          </div>
        </div>
        {!open && (
          <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
            Show
          </span>
        )}
      </CollapsibleTrigger>
      <div className={`overflow-hidden transition-all ${open ? "mt-1" : ""}`}>
        <CollapsibleContent className="px-3 pt-1 pb-2">
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
