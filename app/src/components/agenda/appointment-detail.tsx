"use client"

import { useState } from "react"
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
  IconLoader2,
  IconUser,
  IconMail,
  IconBuilding,
  IconCalendarTime,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { format, isPast } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

import {
  useAppointment,
  useCancelAppointment,
  useConfirmAppointment,
  useCompleteAppointment,
  useMarkNoShow,
  type AppointmentStatus,
  type AppointmentType,
  type AppointmentOutcome,
} from "@/hooks/use-appointments"

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

const outcomeOptions: { value: AppointmentOutcome; label: string }[] = [
  { value: "interested", label: "Interesado" },
  { value: "not_interested", label: "No interesado" },
  { value: "needs_follow_up", label: "Requiere seguimiento" },
  { value: "closed", label: "Cerrado/Vendido" },
  { value: "rescheduled", label: "Reagendado" },
]

interface AppointmentDetailProps {
  appointmentId: string
  onClose: () => void
}

export function AppointmentDetail({
  appointmentId,
  onClose,
}: AppointmentDetailProps) {
  const { data: appointment, isLoading } = useAppointment(appointmentId)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [outcome, setOutcome] = useState<AppointmentOutcome>("interested")
  const [followUpNotes, setFollowUpNotes] = useState("")

  const cancelMutation = useCancelAppointment()
  const confirmMutation = useConfirmAppointment()
  const completeMutation = useCompleteAppointment()
  const noShowMutation = useMarkNoShow()

  if (isLoading || !appointment) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const type = (appointment.type as AppointmentType) || "other"
  const status = (appointment.status as AppointmentStatus) || "scheduled"
  const typeConf = typeConfig[type]
  const statusConf = statusConfig[status]
  const TypeIcon = typeConf.icon
  const StatusIcon = statusConf.icon
  const scheduledDate = new Date(appointment.scheduled_at)
  const isOverdue = isPast(scheduledDate) && status === "scheduled"
  const canTakeAction = status === "scheduled" || status === "confirmed"

  const handleCancel = async () => {
    await cancelMutation.mutateAsync(appointmentId)
    setShowCancelDialog(false)
  }

  const handleConfirm = async () => {
    await confirmMutation.mutateAsync(appointmentId)
  }

  const handleComplete = async () => {
    await completeMutation.mutateAsync({
      id: appointmentId,
      outcome,
      notes: followUpNotes || undefined,
    })
    setShowCompleteDialog(false)
  }

  const handleNoShow = async () => {
    await noShowMutation.mutateAsync(appointmentId)
  }

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-lg", statusConf.bgColor)}>
              <TypeIcon className={cn("size-6", typeConf.color)} />
            </div>
            <div>
              <SheetTitle>{appointment.title || typeConf.label}</SheetTitle>
              <SheetDescription>
                {appointment.lead?.first_name} {appointment.lead?.last_name}
              </SheetDescription>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn("text-sm", statusConf.bgColor, statusConf.color)}
          >
            <StatusIcon className="size-4 mr-1" />
            {statusConf.label}
          </Badge>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Alert for overdue */}
        {isOverdue && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <IconAlertTriangle className="size-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Cita atrasada</p>
              <p className="text-sm text-destructive/80">
                Esta cita ya pasó y requiere acción
              </p>
            </div>
          </div>
        )}

        {/* Date and Time */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <IconCalendarTime className="size-4" />
            Fecha y Hora
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Fecha</p>
              <p className="font-medium">
                {format(scheduledDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Hora</p>
              <p className="font-medium">{format(scheduledDate, "HH:mm")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Duración</p>
              <p className="font-medium">{appointment.duration_minutes} minutos</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tipo</p>
              <p className="font-medium">{typeConf.label}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Client Info */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <IconUser className="size-4" />
            Cliente
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                <IconUser className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  {appointment.lead?.first_name} {appointment.lead?.last_name}
                </p>
                {appointment.lead?.email && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <IconMail className="size-3" />
                    {appointment.lead.email}
                  </p>
                )}
                {appointment.lead?.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <IconPhone className="size-3" />
                    {appointment.lead.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        {appointment.location && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <IconMapPin className="size-4" />
                Ubicación
              </h4>
              <p className="text-sm">{appointment.location}</p>
            </div>
          </>
        )}

        {/* Project */}
        {appointment.project && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <IconBuilding className="size-4" />
                Proyecto
              </h4>
              <p className="text-sm">{appointment.project.name}</p>
            </div>
          </>
        )}

        {/* Description */}
        {appointment.description && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold">Notas</h4>
              <p className="text-sm text-muted-foreground">
                {appointment.description}
              </p>
            </div>
          </>
        )}

        {/* Confirmation Status */}
        {(status === "scheduled" || status === "confirmed") && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold">Estado de Confirmación</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Recordatorio enviado</span>
                  <Badge variant={appointment.reminder_sent ? "secondary" : "outline"}>
                    {appointment.reminder_sent ? "Sí" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Confirmación enviada</span>
                  <Badge variant={appointment.confirmation_sent ? "secondary" : "outline"}>
                    {appointment.confirmation_sent ? "Sí" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cliente confirmó</span>
                  <Badge
                    variant={appointment.client_confirmed ? "secondary" : "outline"}
                    className={
                      appointment.client_confirmed
                        ? "bg-chart-2/10 text-chart-2"
                        : ""
                    }
                  >
                    {appointment.client_confirmed ? "Confirmado" : "Pendiente"}
                  </Badge>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Outcome (for completed) */}
        {status === "completed" && appointment.outcome && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold">Resultado</h4>
              <Badge variant="secondary" className="text-sm">
                {outcomeOptions.find((o) => o.value === appointment.outcome)?.label ||
                  appointment.outcome}
              </Badge>
              {appointment.follow_up_notes && (
                <p className="text-sm text-muted-foreground">
                  {appointment.follow_up_notes}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {canTakeAction && (
        <div className="p-6 border-t space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {status === "scheduled" && (
              <Button
                variant="outline"
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? (
                  <IconLoader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <IconCheck className="size-4 mr-2" />
                )}
                Confirmar
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(true)}
            >
              <IconCheck className="size-4 mr-2" />
              Completar
            </Button>
            <Button
              variant="outline"
              onClick={handleNoShow}
              disabled={noShowMutation.isPending}
            >
              {noShowMutation.isPending ? (
                <IconLoader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <IconUserOff className="size-4 mr-2" />
              )}
              No asistió
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowCancelDialog(true)}
            >
              <IconX className="size-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la cita programada. El cliente será notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending && (
                <IconLoader2 className="size-4 mr-2 animate-spin" />
              )}
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Completar cita</AlertDialogTitle>
            <AlertDialogDescription>
              Registra el resultado de la cita
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resultado</Label>
              <Select
                value={outcome}
                onValueChange={(v) => setOutcome(v as AppointmentOutcome)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {outcomeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas de seguimiento</Label>
              <Textarea
                placeholder="Notas sobre la cita..."
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              {completeMutation.isPending && (
                <IconLoader2 className="size-4 mr-2 animate-spin" />
              )}
              Completar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
