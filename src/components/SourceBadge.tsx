interface SourceBadgeProps {
  label: string
  className?: string
}

export function SourceBadge({ label, className = "" }: SourceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary leading-tight ${className}`}
    >
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {label}
    </span>
  )
}
