"use client"

import {
  IconTicket,
  IconUser,
  IconBuilding,
  IconHome,
  IconCurrencyDollar,
  IconCheck,
  IconClock,
  IconBan,
  IconPhone,
  IconMail,
  IconCalendar,
  IconFileText,
  IconX,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

import {
  useReservation,
  usePaymentsByReservation,
  usePaymentsSummary,
  useCancelReservation,
  useCompleteReservation,
  type ReservationStatus,
} from "@/hooks/use-inventory"
import { PaymentsList } from "./payments-list"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const statusConfig: Record<
  ReservationStatus,
  { label: string; icon: typeof IconClock; color: string; bgColor: string }
> = {
  pending: {
    label: "Pendiente",
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
    icon: IconTicket,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  cancelled: {
    label: "Cancelada",
    icon: IconBan,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "-"
  return new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface ReservationDetailProps {
  reservationId: string
  onClose?: () => void
  onAddPayment?: () => void
  currentUserId?: string
}

export function ReservationDetail({
  reservationId,
  onClose,
  onAddPayment,
  currentUserId,
}: ReservationDetailProps) {
  const { data: reservation, isLoading } = useReservation(reservationId)
  const { data: payments } = usePaymentsByReservation(reservationId)
  const { data: summary } = usePaymentsSummary(reservationId)
  const cancelReservation = useCancelReservation()
  const completeReservation = useCompleteReservation()

  const [cancelReason, setCancelReason] = useState("")
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  if (isLoading || !reservation) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  const status = (reservation.status as ReservationStatus) || "pending"
  const config = statusConfig[status]
  const StatusIcon = config.icon

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Por favor ingresa el motivo de cancelación")
      return
    }

    try {
      await cancelReservation.mutateAsync({ id: reservationId, reason: cancelReason })
      toast.success("Reservación cancelada")
      setShowCancelDialog(false)
      setCancelReason("")
    } catch {
      toast.error("Error al cancelar la reservación")
    }
  }

  const handleComplete = async () => {
    try {
      await completeReservation.mutateAsync(reservationId)
      toast.success("Venta completada")
    } catch {
      toast.error("Error al completar la venta")
    }
  }

  // Calculate payment progress
  const totalRequired =
    (reservation.separation_amount || 0) +
    (reservation.initial_payment || 0) +
    (reservation.notary_costs || 0)
  const totalPaid = summary?.totalPaid || 0
  const progressPercent = totalRequired > 0 ? Math.min(100, (totalPaid / totalRequired) * 100) : 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", config.bgColor)}>
            <IconTicket className={cn("size-5", config.color)} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Reservación</h2>
            <p className="text-sm text-muted-foreground">
              {reservation.unit?.unit_number} - {reservation.project?.name}
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <IconX className="size-5" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={cn("text-sm py-1 px-3", config.bgColor, config.color)}>
            <StatusIcon className="size-4 mr-2" />
            {config.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {reservation.created_at &&
              format(new Date(reservation.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
          </span>
        </div>

        {/* Client Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconUser className="size-4" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="font-medium">
              {reservation.lead?.first_name} {reservation.lead?.last_name}
            </div>
            {reservation.lead?.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconPhone className="size-4" />
                {reservation.lead.phone}
              </div>
            )}
            {reservation.lead?.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconMail className="size-4" />
                {reservation.lead.email}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unit Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconHome className="size-4" />
              Unidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Número</p>
                <p className="font-medium">{reservation.unit?.unit_number || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Piso</p>
                <p className="font-medium">{reservation.unit?.floor || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Área</p>
                <p className="font-medium">
                  {reservation.unit?.area_m2 ? `${reservation.unit.area_m2} m²` : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Proyecto</p>
                <p className="font-medium">{reservation.project?.name || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconCurrencyDollar className="size-4" />
              Información Financiera
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Precio Unidad</span>
              <span className="font-bold text-lg">{formatCurrency(reservation.unit_price)}</span>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Separación</span>
                <div className="flex items-center gap-2">
                  <span>{formatCurrency(reservation.separation_amount)}</span>
                  {reservation.separation_paid ? (
                    <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 text-xs">
                      <IconCheck className="size-3 mr-1" />
                      Pagado
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-chart-4/10 text-chart-4 text-xs">
                      Pendiente
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Abono Inicial</span>
                <div className="flex items-center gap-2">
                  <span>{formatCurrency(reservation.initial_payment)}</span>
                  {reservation.initial_payment_paid ? (
                    <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 text-xs">
                      <IconCheck className="size-3 mr-1" />
                      Pagado
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-chart-4/10 text-chart-4 text-xs">
                      Pendiente
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Costos Escritura</span>
                <span>{formatCurrency(reservation.notary_costs)}</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progreso de Pagos</span>
                <span className="text-muted-foreground">
                  {formatCurrency(totalPaid)} / {formatCurrency(totalRequired)}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Bank Disbursement */}
        {reservation.bank_disbursement_amount && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IconBuilding className="size-4" />
                Desembolso Bancario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monto</span>
                <span className="font-medium">
                  {formatCurrency(reservation.bank_disbursement_amount)}
                </span>
              </div>
              {reservation.bank_disbursement_date && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-muted-foreground">Fecha</span>
                  <span className="flex items-center gap-1">
                    <IconCalendar className="size-4" />
                    {format(new Date(reservation.bank_disbursement_date), "dd MMM yyyy", {
                      locale: es,
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delivery Info */}
        {(reservation.delivery_scheduled_at || reservation.delivery_completed_at) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IconFileText className="size-4" />
                Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reservation.delivery_scheduled_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Programada</span>
                  <span>
                    {format(new Date(reservation.delivery_scheduled_at), "dd MMM yyyy", {
                      locale: es,
                    })}
                  </span>
                </div>
              )}
              {reservation.delivery_completed_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completada</span>
                  <span className="flex items-center gap-1 text-chart-2">
                    <IconCheck className="size-4" />
                    {format(new Date(reservation.delivery_completed_at), "dd MMM yyyy", {
                      locale: es,
                    })}
                  </span>
                </div>
              )}
              {reservation.delivery_notes && (
                <p className="text-sm text-muted-foreground mt-2">{reservation.delivery_notes}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cancellation Info */}
        {status === "cancelled" && (
          <Card className="border-destructive/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                <IconAlertTriangle className="size-4" />
                Cancelación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reservation.cancelled_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fecha</span>
                  <span>
                    {format(new Date(reservation.cancelled_at), "dd MMM yyyy", { locale: es })}
                  </span>
                </div>
              )}
              {reservation.cancellation_reason && (
                <div>
                  <span className="text-sm text-muted-foreground">Motivo:</span>
                  <p className="text-sm mt-1">{reservation.cancellation_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Historial de Pagos</h3>
            {status !== "cancelled" && status !== "completed" && onAddPayment && (
              <Button size="sm" variant="outline" onClick={onAddPayment}>
                <IconCurrencyDollar className="size-4 mr-1" />
                Registrar Pago
              </Button>
            )}
          </div>
          <PaymentsList
            reservationId={reservationId}
            payments={payments || []}
            currentUserId={currentUserId}
          />
        </div>
      </div>

      {/* Footer Actions */}
      {status !== "cancelled" && status !== "completed" && (
        <div className="p-4 border-t flex items-center justify-between gap-2">
          <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <IconBan className="size-4 mr-2" />
                Cancelar Reserva
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar Reservación</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción liberará la unidad y marcará la reservación como cancelada. Esta
                  acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Label htmlFor="cancel-reason">Motivo de cancelación</Label>
                <Input
                  id="cancel-reason"
                  placeholder="Ej: Cliente desistió de la compra"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-2"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Volver</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={cancelReservation.isPending}
                >
                  {cancelReservation.isPending ? "Cancelando..." : "Confirmar Cancelación"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {status === "confirmed" && (
            <Button onClick={handleComplete} disabled={completeReservation.isPending}>
              <IconCheck className="size-4 mr-2" />
              {completeReservation.isPending ? "Procesando..." : "Completar Venta"}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
