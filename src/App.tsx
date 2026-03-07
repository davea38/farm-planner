import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CostPerHectare } from '@/components/CostPerHectare'
import { CostPerHour } from '@/components/CostPerHour'

function App() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[800px] px-4 py-6">
          <h1 className="text-2xl font-bold text-center mb-6">
            Farm Machinery Planner
          </h1>

          <Tabs defaultValue="cost-per-hectare">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger
                value="cost-per-hectare"
                className="text-xs sm:text-sm py-2 data-active:bg-primary data-active:text-primary-foreground"
              >
                Cost per Hectare
              </TabsTrigger>
              <TabsTrigger
                value="cost-per-hour"
                className="text-xs sm:text-sm py-2 data-active:bg-primary data-active:text-primary-foreground"
              >
                Cost per Hour
              </TabsTrigger>
              <TabsTrigger
                value="compare-machines"
                className="text-xs sm:text-sm py-2 data-active:bg-primary data-active:text-primary-foreground"
              >
                Compare Machines
              </TabsTrigger>
              <TabsTrigger
                value="replacement-planner"
                className="text-xs sm:text-sm py-2 data-active:bg-primary data-active:text-primary-foreground"
              >
                Replacement Planner
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cost-per-hectare" className="mt-4">
              <CostPerHectare />
            </TabsContent>

            <TabsContent value="cost-per-hour" className="mt-4">
              <CostPerHour />
            </TabsContent>

            <TabsContent value="compare-machines" className="mt-4">
              <p className="text-muted-foreground text-center py-12">
                Compare Two Machines coming soon.
              </p>
            </TabsContent>

            <TabsContent value="replacement-planner" className="mt-4">
              <p className="text-muted-foreground text-center py-12">
                Replacement Planner coming soon.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default App
