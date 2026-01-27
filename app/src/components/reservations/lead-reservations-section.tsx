"use client"

import { useState } from "react"
import {
  IconTicket,
  IconPlus,
  IconHome,
  IconCurrencyDollar,
  IconCheck,
  IconClock,
  IconBan,
  IconChevronRight,
} from "@tabler/icons-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

import {
  useReservationsByLead,
  usePaymentsSummary,
  type ReservationStatus,
} from "@/hooks/use-inventory"
import { CreateReservationDialog } from "./create-reservation-dialog"
import { CreatePaymentDialog } from "./create-payment-dialog"
import { ReservationDetail } from "./reservation-detail"

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

interface LeadReservationsSectionProps {
  leadId: string
}

function ReservationCard({
  reservation,
  onClick,
}: {
  reservation: {
    id: string
    status: string | null
    unit_price: number | null
    created_at: string
    separation_amount: number | null
    initial_payment: number | null
    notary_costs: number | null
    unit?: { unit_number: string | null; floor: number | null } | null
    project?: { name: string } | null
  }
  onClick: () => void
}) {
  const status = (reservation.status as ReservationStatus) || "pending"
  const config = statusConfig[status]
  const StatusIcon = config.icon

  const { data: summary } = usePaymentsSummary(reservation.id)

  const totalRequired =
    (reservation.separation_amount || 0) +
    (reservation.initial_payment || 0) +
    (reservation.notary_costs || 0)
  const totalPaid = summary?.totalPaid || 0
  const progressPercent = totalRequired > 0 ? Math.min(100, (totalPaid / totalRequired) * 100) : 0

  return (
    <Card
      className="cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <IconHome className={cn("size-4", config.color)} />
            </div>
            <div>
              <p className="font-medium">
                Unidad {reservation.unit?.unit_number || "-"}
              </p>
              <p className="text-xs text-muted-foreground">
                {reservation.project?.name}
                {reservation.unit?.floor && ` - Piso ${reservation.unit.floor}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn("text-xs", config.bgColor, config.color)}>
              <StatusIcon className="size-3 mr-1" />
              {config.label}
            </Badge>
            <IconChevronRight className="size-4 text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-muted-foreground">Precio</span>
          <span className="font-bold">{formatCurrency(reservation.unit_price)}</span>
        </div>

        {status !== "cancelled" && totalRequired > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Pagos</span>
              <span>
                {formatCurrency(totalPaid)} / {formatCurrency(totalRequired)}
              </span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-3">
          Creada {format(new Date(reservation.created_at), "dd MMM yyyy", { locale: es })}
        </p>
      </CardContent>
    </Card>
  )
}

export function LeadReservationsSection({ leadId }: LeadReservationsSectionProps) {
  const { data: reservations, isLoading } = useReservationsByLead(leadId)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)

  // Find active reservation (non-cancelled, non-completed)
  const activeReservation = reservations?.find(
    (r) => r.status !== "cancelled" && r.status !== "completed"
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
          <IconTicket className="size-5 text-muted-foreground" />
          <h3 className="font-semibold">Reservaciones</h3>
          {reservations && reservations.length > 0 && (
            <Badge variant="secondary">{reservations.length}</Badge>
          )}
        </div>
        {!activeReservation && (
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <IconPlus className="size-4 mr-1" />
            Nueva Reserva
          </Button>
        )}
      </div>

      {/* Reservations List */}
      {reservations && reservations.length > 0 ? (
        <div className="space-y-3">
          {reservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onClick={() => setSelectedReservationId(reservation.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <IconTicket className="size-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">Sin reservaciones</p>
              <p className="text-xs mt-1">Este lead no tiene reservaciones activas</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                <IconPlus className="size-4 mr-1" />
                Crear Reservación
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Reservation Dialog */}
      <CreateReservationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        leadId={leadId}
        onSuccess={(id) => {
          setShowCreateDialog(false)
          setSelectedReservationId(id)
        }}
      />

      {/* Reservation Detail Sheet */}
      <Sheet
        open={!!selectedReservationId}
        onOpenChange={(open) => !open && setSelectedReservationId(null)}
      >
        <SheetContent className="w-full sm:max-w-lg p-0">
          {selectedReservationId && (
            <ReservationDetail
              reservationId={selectedReservationId}
              onClose={() => setSelectedReservationId(null)}
              onAddPayment={() => setShowPaymentDialog(true)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Create Payment Dialog */}
      {selectedReservationId && (
        <CreatePaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          reservationId={selectedReservationId}
          leadId={leadId}
          onSuccess={() => setShowPaymentDialog(false)}
        />
      )}
    </div>
  )
}
