import type { TabId } from "@/lib/tab-navigation"
import { navigateToTab } from "@/lib/tab-navigation"

interface SourceBadgeProps {
  label: string
  className?: string
  /** When set, the badge becomes a clickable link that navigates to the given tab */
  navigateTo?: TabId
}

export function SourceBadge({ label, className = "", navigateTo }: SourceBadgeProps) {
  const isClickable = !!navigateTo
  const Tag = isClickable ? "button" : "span"

  return (
    <Tag
      type={isClickable ? "button" : undefined}
      onClick={isClickable ? () => navigateToTab(navigateTo) : undefined}
      className={`inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary leading-tight ${
        isClickable
          ? "cursor-pointer hover:bg-primary/20 hover:border-primary/40 transition-colors"
          : ""
      } ${className}`}
    >
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        {isClickable ? (
          // Arrow icon for clickable badges
          <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          // Plus icon for static badges
          <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        )}
      </svg>
      {label}
    </Tag>
  )
}
