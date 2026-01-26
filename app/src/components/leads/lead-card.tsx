"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconGripVertical,
  IconPhone,
  IconMail,
  IconCalendar,
  IconUser,
  IconFlame,
  IconSnowflake,
  IconTemperature,
} from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LeadWithRelations } from "@/lib/services/leads"
import { useLeadsStore } from "@/stores/leads-store"
import { LeadTimer, LeadTimerBar } from "./lead-timer"
import { useLeadTimer } from "@/hooks/use-lead-timer"

interface LeadCardProps {
  lead: LeadWithRelations
  isDragging?: boolean
}

const temperatureIcons = {
  hot: IconFlame,
  warm: IconTemperature,
  cold: IconSnowflake,
}

const temperatureColors = {
  hot: "text-chart-1",
  warm: "text-chart-5",
  cold: "text-chart-2",
}

export function LeadCard({ lead, isDragging }: LeadCardProps) {
  const { openDetail } = useLeadsStore()
  const TempIcon = temperatureIcons[lead.temperature as keyof typeof temperatureIcons] || IconTemperature
  const { status: timerStatus, isExpired } = useLeadTimer(lead.attention_deadline)
  const hasActiveTimer = lead.attention_deadline && !lead.attention_expired

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: lead.id,
    data: {
      type: "lead",
      lead,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ")
  const initials = [lead.first_name?.[0], lead.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase()

  // Border color based on timer status
  const timerBorderStyles = {
    active: "",
    warning: "ring-2 ring-chart-4/50",
    critical: "ring-2 ring-destructive/50 animate-pulse",
    expired: "ring-2 ring-destructive/30 opacity-75",
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md",
        isDragging && "opacity-50 shadow-lg",
        hasActiveTimer && timerBorderStyles[timerStatus]
      )}
      onClick={() => openDetail(lead)}
    >
      <CardContent className="p-3">
        {/* Timer bar at top if active */}
        {hasActiveTimer && (
          <LeadTimerBar
            attentionDeadline={lead.attention_deadline}
            className="mb-2 -mt-1"
          />
        )}
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground shrink-0 cursor-grab hover:bg-transparent"
            {...attributes}
            {...listeners}
          >
            <IconGripVertical />
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Avatar className="size-6">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm truncate">{fullName}</span>
              <TempIcon
                className={`size-4 shrink-0 ${
                  temperatureColors[lead.temperature as keyof typeof temperatureColors] || ""
                }`}
              />
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              {lead.phone && (
                <div className="flex items-center gap-1">
                  <IconPhone className="size-3" />
                  <span className="truncate">{lead.phone}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-1">
                  <IconMail className="size-3" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
            </div>

            {/* Timer badge when active */}
            {hasActiveTimer && (
              <div className="mt-2 pt-2 border-t">
                <LeadTimer
                  attentionDeadline={lead.attention_deadline}
                  variant="badge"
                />
              </div>
            )}

            <div className={cn(
              "flex items-center justify-between mt-2 pt-2 border-t",
              hasActiveTimer && "border-t-0 pt-0"
            )}>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <IconCalendar className="size-3" />
                <span>
                  {formatDistanceToNow(new Date(lead.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </div>

              {lead.assigned_user && (
                <div className="flex items-center gap-1">
                  <IconUser className="size-3 text-muted-foreground" />
                  <span className="text-xs truncate max-w-[80px]">
                    {lead.assigned_user.first_name}
                  </span>
                </div>
              )}
            </div>

            {lead.project && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {lead.project.name}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
