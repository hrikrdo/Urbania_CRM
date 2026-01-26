"use client"

import { IconClock, IconAlertTriangle, IconClockX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { useLeadTimer, type TimerStatus } from "@/hooks/use-lead-timer"

interface LeadTimerProps {
  attentionDeadline: string | null
  className?: string
  showIcon?: boolean
  variant?: "default" | "compact" | "badge"
}

const statusStyles: Record<TimerStatus, { bg: string; text: string; icon: string }> = {
  active: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    icon: "text-muted-foreground",
  },
  warning: {
    bg: "bg-chart-4/10",
    text: "text-chart-4",
    icon: "text-chart-4",
  },
  critical: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    icon: "text-destructive",
  },
  expired: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    icon: "text-destructive",
  },
}

const statusIcons: Record<TimerStatus, typeof IconClock> = {
  active: IconClock,
  warning: IconAlertTriangle,
  critical: IconAlertTriangle,
  expired: IconClockX,
}

export function LeadTimer({
  attentionDeadline,
  className,
  showIcon = true,
  variant = "default",
}: LeadTimerProps) {
  const { formattedTime, status, isExpired } = useLeadTimer(attentionDeadline)

  if (!attentionDeadline) return null

  const styles = statusStyles[status]
  const Icon = statusIcons[status]

  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
          styles.bg,
          styles.text,
          className
        )}
      >
        {showIcon && <Icon className="size-3" />}
        {formattedTime}
      </span>
    )
  }

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs",
          styles.text,
          className
        )}
      >
        {showIcon && <Icon className="size-3" />}
        {formattedTime}
      </span>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1",
        styles.bg,
        className
      )}
    >
      {showIcon && <Icon className={cn("size-4", styles.icon)} />}
      <div className="flex flex-col">
        <span className={cn("text-xs font-medium", styles.text)}>
          {isExpired ? "Tiempo agotado" : "Tiempo restante"}
        </span>
        <span className={cn("text-sm font-semibold tabular-nums", styles.text)}>
          {formattedTime}
        </span>
      </div>
    </div>
  )
}

// Progress bar variant for more visual feedback
export function LeadTimerBar({
  attentionDeadline,
  className,
  totalMinutes = 60,
}: {
  attentionDeadline: string | null
  className?: string
  totalMinutes?: number
}) {
  const { remainingMinutes, status, isExpired } = useLeadTimer(attentionDeadline)

  if (!attentionDeadline) return null

  const percentage = isExpired
    ? 0
    : Math.min(100, (remainingMinutes / totalMinutes) * 100)

  const barColor = {
    active: "bg-chart-2",
    warning: "bg-chart-4",
    critical: "bg-destructive",
    expired: "bg-destructive",
  }[status]

  return (
    <div className={cn("w-full", className)}>
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000", barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
