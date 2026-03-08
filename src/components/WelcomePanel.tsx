import { useState } from "react"

const DISMISSED_KEY = "farmPlannerWelcomeDismissed"

export function WelcomePanel() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(DISMISSED_KEY) === "1"
  })

  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1")
    setDismissed(true)
  }

  return (
    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-5 space-y-3 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-base font-semibold">Welcome to Farm Machinery Planner</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Work out whether it's cheaper to own a machine or hire a contractor.
            Start on the <strong>Cost / Hectare</strong> or <strong>Cost / Hour</strong> tab,
            fill in the numbers for one of your machines, then save it.
            Your saved machines feed into the <strong>Worth It?</strong> tab
            so you can see the full picture.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-none">
            <li><strong>Cost / Hectare</strong> and <strong>Cost / Hour</strong> — compare owning vs contracting</li>
            <li><strong>Value Loss</strong> — see how machines depreciate over time</li>
            <li><strong>Replacements</strong> — plan when to replace and budget for it</li>
            <li><strong>Contracting</strong> — track income from contracting work you do for others</li>
            <li><strong>Worth It?</strong> — your overall profitability picture</li>
          </ul>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        Got it, let's start
      </button>
    </div>
  )
}
