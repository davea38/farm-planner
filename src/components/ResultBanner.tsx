import { cn } from "@/lib/utils"

type BannerType = "green" | "amber" | "red"

interface ResultBannerProps {
  type: BannerType
  mainText: string
  subText?: string
}

const bannerStyles: Record<BannerType, string> = {
  green: "bg-farm-green text-white",
  amber: "bg-farm-amber text-foreground",
  red: "bg-farm-red text-white",
}

export function ResultBanner({ type, mainText, subText }: ResultBannerProps) {
  return (
    <div
      className={cn(
        "w-full rounded-lg px-6 py-4 text-center",
        bannerStyles[type]
      )}
    >
      <p className="text-xl sm:text-2xl md:text-[32px] font-bold leading-tight">{mainText}</p>
      {subText && (
        <p className="mt-1 text-base opacity-90">{subText}</p>
      )}
    </div>
  )
}
