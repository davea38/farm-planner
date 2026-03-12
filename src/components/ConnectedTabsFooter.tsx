import { type TabId, TAB_LABELS, navigateToTab } from "@/lib/tab-navigation"

interface ConnectedTabsFooterProps {
  tabs: TabId[]
}

export function ConnectedTabsFooter({ tabs }: ConnectedTabsFooterProps) {
  if (tabs.length === 0) return null

  return (
    <div className="mt-6 pt-3 border-t border-border/40">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
        <svg className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 8h8M8 4v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <span>This data also appears on:</span>
        {tabs.map((tabId, i) => (
          <span key={tabId}>
            <button
              type="button"
              onClick={() => navigateToTab(tabId)}
              className="font-medium text-primary hover:underline cursor-pointer"
            >
              {TAB_LABELS[tabId]}
            </button>
            {i < tabs.length - 1 && <span className="text-muted-foreground/40">,</span>}
          </span>
        ))}
      </p>
    </div>
  )
}
