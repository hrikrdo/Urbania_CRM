"use client"

import {
  IconCalendarEvent,
  IconPhone,
  IconVideo,
  IconUsers,
  IconRefresh,
  IconDots,
  IconClock,
  IconCheck,
  IconX,
  IconUserOff,
  IconMapPin,
  IconChevronRight,
} from "@tabler/icons-react"
import { format, isPast, isToday, isTomorrow, differenceInMinutes } from "date-fns"
import { es } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type {
  AppointmentWithRelations,
  AppointmentStatus,
  AppointmentType,
} from "@/hooks/use-appointments"

const typeConfig: Record<
  AppointmentType,
  { label: string; icon: typeof IconCalendarEvent; color: string }
> = {
  visit: {
    label: "Visita",
    icon: IconCalendarEvent,
    color: "text-chart-2",
  },
  call: {
    label: "Llamada",
    icon: IconPhone,
    color: "text-chart-3",
  },
  video_call: {
    label: "Video",
    icon: IconVideo,
    color: "text-chart-5",
  },
  meeting: {
    label: "Reunión",
    icon: IconUsers,
    color: "text-chart-1",
  },
  follow_up: {
    label: "Seguimiento",
    icon: IconRefresh,
    color: "text-chart-4",
  },
  other: {
    label: "Otro",
    icon: IconDots,
    color: "text-muted-foreground",
  },
}

const statusConfig: Record<
  AppointmentStatus,
  { label: string; icon: typeof IconClock; color: string; bgColor: string }
> = {
  scheduled: {
    label: "Programada",
    icon: IconClock,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
  confirmed: {
    label: "Confirmada",
    icon: IconCheck,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  completed: {
    label: "Completada",
    icon: IconCheck,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  cancelled: {
    label: "Cancelada",
    icon: IconX,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  no_show: {
    label: "No asistió",
    icon: IconUserOff,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
}

function formatDateLabel(date: Date): string {
  if (isToday(date)) {
    return "Hoy"
  }
  if (isTomorrow(date)) {
    return "Mañana"
  }
  return format(date, "EEE d MMM", { locale: es })
}

function getTimeUntil(date: Date): string {
  const now = new Date()
  const minutes = differenceInMinutes(date, now)

  if (minutes < 0) {
    return "Pasada"
  }
  if (minutes < 60) {
    return `En ${minutes} min`
  }
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60)
    return `En ${hours}h`
  }
  const days = Math.floor(minutes / 1440)
  return `En ${days}d`
}

interface AppointmentCardProps {
  appointment: AppointmentWithRelations
  onClick?: () => void
  compact?: boolean
}

export function AppointmentCard({
  appointment,
  onClick,
  compact = false,
}: AppointmentCardProps) {
  const type = (appointment.type as AppointmentType) || "other"
  const status = (appointment.status as AppointmentStatus) || "scheduled"
  const typeConf = typeConfig[type]
  const statusConf = statusConfig[status]
  const TypeIcon = typeConf.icon
  const StatusIcon = statusConf.icon
  const scheduledDate = new Date(appointment.scheduled_at)
  const isOverdue = isPast(scheduledDate) && status === "scheduled"

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors",
          isOverdue && "border-destructive/50"
        )}
        onClick={onClick}
      >
        <div
          className={cn(
            "p-2 rounded-lg",
            statusConf.bgColor
          )}
        >
          <TypeIcon className={cn("size-4", typeConf.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {appointment.lead?.first_name} {appointment.lead?.last_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(scheduledDate, "HH:mm")} - {typeConf.label}
          </p>
        </div>
        <div className="text-right">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              isOverdue ? "bg-destructive/10 text-destructive" : statusConf.bgColor,
              isOverdue ? "" : statusConf.color
            )}
          >
            {isOverdue ? "Atrasada" : getTimeUntil(scheduledDate)}
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <Card
      className={cn(
        "cursor-pointer hover:bg-muted/30 transition-colors",
        isOverdue && "border-destructive/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", statusConf.bgColor)}>
              <TypeIcon className={cn("size-5", typeConf.color)} />
            </div>
            <div>
              <p className="font-medium">
                {appointment.lead?.first_name} {appointment.lead?.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {appointment.title || typeConf.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn("text-xs", statusConf.bgColor, statusConf.color)}
            >
              <StatusIcon className="size-3 mr-1" />
              {statusConf.label}
            </Badge>
            <IconChevronRight className="size-4 text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <IconClock className="size-4" />
            <span>
              {formatDateLabel(scheduledDate)} {format(scheduledDate, "HH:mm")}
            </span>
          </div>
          {appointment.duration_minutes && (
            <span>({appointment.duration_minutes} min)</span>
          )}
        </div>

        {appointment.location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <IconMapPin className="size-4" />
            <span className="truncate">{appointment.location}</span>
          </div>
        )}

        {appointment.project?.name && (
          <p className="text-xs text-muted-foreground">
            Proyecto: {appointment.project.name}
          </p>
        )}

        {isOverdue && (
          <div className="mt-3 pt-3 border-t">
            <Badge variant="destructive" className="text-xs">
              Cita atrasada - requiere acción
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
