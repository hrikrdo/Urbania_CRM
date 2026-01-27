"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  IconCheck,
  IconClock,
  IconDotsVertical,
  IconEye,
  IconFilter,
  IconSearch,
  IconX,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  usePayments,
  useConfirmPayment,
  useRejectPayment,
  type PaymentWithRelations,
} from "@/hooks/use-payments"
import {
  formatPaymentType,
  formatPaymentMethod,
  type PaymentStatus,
  type PaymentType,
} from "@/lib/services/payments"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(amount)
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof IconClock }
> = {
  pending: { label: "Pendiente", variant: "secondary", icon: IconClock },
  confirmed: { label: "Confirmado", variant: "default", icon: IconCheck },
  rejected: { label: "Rechazado", variant: "destructive", icon: IconX },
}

interface PaymentsListProps {
  onViewPayment?: (payment: PaymentWithRelations) => void
  currentUserId?: string
}

export function PaymentsList({
  onViewPayment,
  currentUserId,
}: PaymentsListProps) {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<PaymentType | "all">("all")
  const [searchTerm, setSearchTerm] = useState("")

  const { data: payments, isLoading } = usePayments({
    status: statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  })

  const confirmPayment = useConfirmPayment()
  const rejectPayment = useRejectPayment()

  const filteredPayments = (payments || []).filter((payment) => {
    if (!searchTerm) return true
    const leadName = payment.lead
      ? `${payment.lead.first_name || ""} ${payment.lead.last_name || ""}`.toLowerCase()
      : ""
    const unitNumber = payment.reservation?.unit?.unit_number?.toLowerCase() || ""
    const reference = payment.reference_number?.toLowerCase() || ""
    const search = searchTerm.toLowerCase()
    return leadName.includes(search) || unitNumber.includes(search) || reference.includes(search)
  })

  const handleConfirm = (payment: PaymentWithRelations) => {
    if (!currentUserId) return
    confirmPayment.mutate({ id: payment.id, confirmedBy: currentUserId })
  }

  const handleReject = (payment: PaymentWithRelations) => {
    rejectPayment.mutate(payment.id)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagos</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Pagos</CardTitle>
            <CardDescription>
              {filteredPayments.length} pago{filteredPayments.length !== 1 ? "s" : ""} registrado{filteredPayments.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as PaymentStatus | "all")}
              >
                <SelectTrigger className="w-36">
                  <IconFilter className="size-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="confirmed">Confirmados</SelectItem>
                  <SelectItem value="rejected">Rechazados</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as PaymentType | "all")}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="separation">Separación</SelectItem>
                  <SelectItem value="initial">Enganche</SelectItem>
                  <SelectItem value="monthly">Mensualidad</SelectItem>
                  <SelectItem value="notary">Escrituración</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredPayments.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No hay pagos que coincidan con los filtros
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const status = statusConfig[payment.status] || statusConfig.pending
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium">
                          {payment.lead
                            ? `${payment.lead.first_name || ""} ${payment.lead.last_name || ""}`
                            : "Sin cliente"}
                        </div>
                        {payment.reservation?.project?.name && (
                          <div className="text-xs text-muted-foreground">
                            {payment.reservation.project.name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.reservation?.unit?.unit_number || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatPaymentType(payment.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatPaymentMethod(payment.payment_method)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>
                          <status.icon className="size-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(payment.created_at), "dd MMM yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <IconDotsVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onViewPayment?.(payment)}
                            >
                              <IconEye className="size-4 mr-2" />
                              Ver detalles
                            </DropdownMenuItem>
                            {payment.status === "pending" && currentUserId && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleConfirm(payment)}
                                  disabled={confirmPayment.isPending}
                                >
                                  <IconCheck className="size-4 mr-2" />
                                  Confirmar pago
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleReject(payment)}
                                  disabled={rejectPayment.isPending}
                                  className="text-destructive"
                                >
                                  <IconX className="size-4 mr-2" />
                                  Rechazar pago
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
