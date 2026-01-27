"use client"

import {
  IconCurrencyDollar,
  IconCheck,
  IconClock,
  IconX,
  IconReceipt,
  IconDotsVertical,
} from "@tabler/icons-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import {
  useConfirmPayment,
  useRejectPayment,
} from "@/hooks/use-inventory"
import type { Database } from "@/types/database"

type Payment = Database["public"]["Tables"]["payments"]["Row"]

type PaymentType = "separation" | "initial" | "monthly" | "notary" | "other"
type PaymentStatus = "pending" | "confirmed" | "rejected"

const typeConfig: Record<PaymentType, { label: string; color: string }> = {
  separation: { label: "Separación", color: "text-chart-3" },
  initial: { label: "Abono Inicial", color: "text-chart-2" },
  monthly: { label: "Mensualidad", color: "text-chart-5" },
  notary: { label: "Notaría", color: "text-chart-1" },
  other: { label: "Otro", color: "text-muted-foreground" },
}

const statusConfig: Record<
  PaymentStatus,
  { label: string; icon: typeof IconClock; color: string; bgColor: string }
> = {
  pending: {
    label: "Pendiente",
    icon: IconClock,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
  confirmed: {
    label: "Confirmado",
    icon: IconCheck,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  rejected: {
    label: "Rechazado",
    icon: IconX,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "-"
  return new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

interface PaymentsListProps {
  reservationId: string
  payments: Payment[]
  currentUserId?: string
}

export function PaymentsList({ reservationId, payments, currentUserId }: PaymentsListProps) {
  const confirmPayment = useConfirmPayment()
  const rejectPayment = useRejectPayment()

  const handleConfirm = async (paymentId: string) => {
    if (!currentUserId) {
      toast.error("Usuario no identificado")
      return
    }

    try {
      await confirmPayment.mutateAsync({ id: paymentId, confirmedBy: currentUserId })
      toast.success("Pago confirmado")
    } catch {
      toast.error("Error al confirmar el pago")
    }
  }

  const handleReject = async (paymentId: string) => {
    try {
      await rejectPayment.mutateAsync(paymentId)
      toast.success("Pago rechazado")
    } catch {
      toast.error("Error al rechazar el pago")
    }
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <IconReceipt className="size-10 mb-2 opacity-40" />
            <p className="text-sm">No hay pagos registrados</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {payments.map((payment) => {
        const type = (payment.type as PaymentType) || "other"
        const status = (payment.status as PaymentStatus) || "pending"
        const typeStyle = typeConfig[type]
        const statusStyle = statusConfig[status]
        const StatusIcon = statusStyle.icon

        return (
          <Card key={payment.id}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                    <IconCurrencyDollar className={cn("size-5", typeStyle.color)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{typeStyle.label}</span>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", statusStyle.bgColor, statusStyle.color)}
                      >
                        <StatusIcon className="size-3 mr-1" />
                        {statusStyle.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>
                        {payment.created_at &&
                          format(new Date(payment.created_at), "dd MMM yyyy", { locale: es })}
                      </span>
                      {payment.payment_method && (
                        <span className="capitalize">{payment.payment_method}</span>
                      )}
                      {payment.reference_number && (
                        <span>Ref: {payment.reference_number}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{formatCurrency(payment.amount)}</span>

                  {status === "pending" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs">
                          <IconDotsVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleConfirm(payment.id)}
                          className="gap-2 cursor-pointer text-chart-2"
                          disabled={confirmPayment.isPending}
                        >
                          <IconCheck className="size-4" />
                          Confirmar Pago
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleReject(payment.id)}
                          className="gap-2 cursor-pointer text-destructive"
                          disabled={rejectPayment.isPending}
                        >
                          <IconX className="size-4" />
                          Rechazar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {payment.notes && (
                <p className="text-xs text-muted-foreground mt-2 pl-13">{payment.notes}</p>
              )}

              {status === "confirmed" && payment.confirmed_at && (
                <p className="text-xs text-chart-2 mt-2 pl-13 flex items-center gap-1">
                  <IconCheck className="size-3" />
                  Confirmado{" "}
                  {format(new Date(payment.confirmed_at), "dd MMM yyyy, HH:mm", { locale: es })}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
