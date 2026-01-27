"use client"

import { useState } from "react"
import {
  IconCalendarEvent,
  IconPlus,
  IconPhone,
  IconVideo,
  IconUsers,
  IconRefresh,
  IconDots,
  IconClock,
  IconCheck,
  IconX,
  IconUserOff,
} from "@tabler/icons-react"
import { format, isPast } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

import {
  useAppointmentsByLead,
  type AppointmentStatus,
  type AppointmentType,
} from "@/hooks/use-appointments"
import { CreateAppointmentDialog } from "./create-appointment-dialog"
import { AppointmentDetail } from "./appointment-detail"

const typeConfig: Record<
  AppointmentType,
  { label: string; icon: typeof IconCalendarEvent; color: string }
> = {
  visit: { label: "Visita", icon: IconCalendarEvent, color: "text-chart-2" },
  call: { label: "Llamada", icon: IconPhone, color: "text-chart-3" },
  video_call: { label: "Video", icon: IconVideo, color: "text-chart-5" },
  meeting: { label: "Reunión", icon: IconUsers, color: "text-chart-1" },
  follow_up: { label: "Seguimiento", icon: IconRefresh, color: "text-chart-4" },
  other: { label: "Otro", icon: IconDots, color: "text-muted-foreground" },
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

interface LeadAppointmentsSectionProps {
  leadId: string
}

export function LeadAppointmentsSection({ leadId }: LeadAppointmentsSectionProps) {
  const { data: appointments, isLoading } = useAppointmentsByLead(leadId)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)

  // Separate upcoming and past appointments
  const upcomingAppointments = appointments?.filter(
    (apt) =>
      !isPast(new Date(apt.scheduled_at)) ||
      apt.status === "scheduled" ||
      apt.status === "confirmed"
  )
  const pastAppointments = appointments?.filter(
    (apt) =>
      isPast(new Date(apt.scheduled_at)) &&
      apt.status !== "scheduled" &&
      apt.status !== "confirmed"
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconCalendarEvent className="size-5 text-muted-foreground" />
          <h3 className="font-semibold">Citas</h3>
          {appointments && appointments.length > 0 && (
            <Badge variant="secondary">{appointments.length}</Badge>
          )}
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <IconPlus className="size-4 mr-1" />
          Nueva Cita
        </Button>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments && upcomingAppointments.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Próximas</h4>
          {upcomingAppointments.map((appointment) => {
            const type = (appointment.type as AppointmentType) || "other"
            const status = (appointment.status as AppointmentStatus) || "scheduled"
            const typeConf = typeConfig[type]
            const statusConf = statusConfig[status]
            const TypeIcon = typeConf.icon
            const StatusIcon = statusConf.icon
            const scheduledDate = new Date(appointment.scheduled_at)
            const isOverdue = isPast(scheduledDate) && status === "scheduled"

            return (
              <Card
                key={appointment.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/30 transition-colors",
                  isOverdue && "border-destructive/50"
                )}
                onClick={() => setSelectedAppointmentId(appointment.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", statusConf.bgColor)}>
                        <TypeIcon className={cn("size-4", typeConf.color)} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {appointment.title || typeConf.label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(scheduledDate, "EEE d MMM, HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        isOverdue
                          ? "bg-destructive/10 text-destructive"
                          : cn(statusConf.bgColor, statusConf.color)
                      )}
                    >
                      <StatusIcon className="size-3 mr-1" />
                      {isOverdue ? "Atrasada" : statusConf.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Past Appointments */}
      {pastAppointments && pastAppointments.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Anteriores</h4>
          {pastAppointments.slice(0, 3).map((appointment) => {
            const type = (appointment.type as AppointmentType) || "other"
            const status = (appointment.status as AppointmentStatus) || "completed"
            const typeConf = typeConfig[type]
            const statusConf = statusConfig[status]
            const TypeIcon = typeConf.icon
            const scheduledDate = new Date(appointment.scheduled_at)

            return (
              <div
                key={appointment.id}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors opacity-70"
                onClick={() => setSelectedAppointmentId(appointment.id)}
              >
                <div className={cn("p-2 rounded-lg", statusConf.bgColor)}>
                  <TypeIcon className={cn("size-4", typeConf.color)} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {appointment.title || typeConf.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(scheduledDate, "d MMM yyyy", { locale: es })}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-xs", statusConf.color)}
                >
                  {statusConf.label}
                </Badge>
              </div>
            )
          })}
          {pastAppointments.length > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              +{pastAppointments.length - 3} citas anteriores
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {(!appointments || appointments.length === 0) && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <IconCalendarEvent className="size-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">Sin citas</p>
              <p className="text-xs mt-1">Este lead no tiene citas programadas</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                <IconPlus className="size-4 mr-1" />
                Agendar Cita
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Appointment Dialog */}
      <CreateAppointmentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        leadId={leadId}
        onSuccess={(id) => {
          setShowCreateDialog(false)
          setSelectedAppointmentId(id)
        }}
      />

      {/* Appointment Detail Sheet */}
      <Sheet
        open={!!selectedAppointmentId}
        onOpenChange={(open) => !open && setSelectedAppointmentId(null)}
      >
        <SheetContent className="w-full sm:max-w-lg p-0">
          {selectedAppointmentId && (
            <AppointmentDetail
              appointmentId={selectedAppointmentId}
              onClose={() => setSelectedAppointmentId(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
