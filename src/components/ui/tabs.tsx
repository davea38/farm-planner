import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-0 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list flex items-end text-muted-foreground",
  {
    variants: {
      variant: {
        default: "border-b-2 border-border/60 gap-0",
        segment: "bg-muted/70 rounded-lg p-1 gap-1 border-0 items-center",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        // Base
        "relative flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2.5 text-[13px] font-medium whitespace-nowrap transition-all duration-150 cursor-pointer select-none outline-none",
        // Default variant (underline style)
        "group-data-[variant=default]/tabs-list:text-muted-foreground/70 group-data-[variant=default]/tabs-list:mb-[-2px] group-data-[variant=default]/tabs-list:border-b-2 group-data-[variant=default]/tabs-list:border-transparent",
        "group-data-[variant=default]/tabs-list:hover:text-foreground/80 group-data-[variant=default]/tabs-list:hover:bg-muted/40",
        "group-data-[variant=default]/tabs-list:data-active:text-primary group-data-[variant=default]/tabs-list:data-active:border-primary group-data-[variant=default]/tabs-list:data-active:font-semibold",
        // Segment variant (pill / toggle style)
        "group-data-[variant=segment]/tabs-list:rounded-md group-data-[variant=segment]/tabs-list:text-muted-foreground group-data-[variant=segment]/tabs-list:py-1.5 group-data-[variant=segment]/tabs-list:text-xs group-data-[variant=segment]/tabs-list:font-medium",
        "group-data-[variant=segment]/tabs-list:hover:text-foreground/80",
        "group-data-[variant=segment]/tabs-list:data-active:bg-card group-data-[variant=segment]/tabs-list:data-active:text-foreground group-data-[variant=segment]/tabs-list:data-active:shadow-sm group-data-[variant=segment]/tabs-list:data-active:font-semibold",
        // Disabled
        "disabled:pointer-events-none disabled:opacity-35 disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:opacity-35",
        // Focus
        "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:rounded-sm",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
