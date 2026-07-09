import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-xl font-extrabold uppercase tracking-tight text-bone sm:text-2xl",
        className
      )}
    >
      Game<span className="text-crimson">&middot;</span>Integrity
      <span className="text-crimson">&middot;</span>Journal
    </span>
  )
}
