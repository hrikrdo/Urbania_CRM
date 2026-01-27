"use client"

import { useState } from "react"
import {
  IconTicket,
  IconSearch,
  IconFilter,
  IconX,
  IconPlus,
  IconBuilding,
  IconUser,
  IconCurrencyDollar,
  IconCheck,
  IconClock,
  IconBan,
} from "@tabler/icons-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import {
  useReservations,
  useReservationMetrics,
  type ReservationWithRelations,
  type ReservationStatus,
} from "@/hooks/use-inventory"
import { useProjects } from "@/hooks/use-leads"

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

interface ReservationsListProps {
  onSelectReservation?: (reservation: ReservationWithRelations) => void
  onCreateReservation?: () => void
  selectedReservationId?: string
}

export function ReservationsList({
  onSelectReservation,
  onCreateReservation,
  selectedReservationId,
}: ReservationsListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "__all__">("__all__")
  const [projectFilter, setProjectFilter] = useState<string | "__all__">("__all__")

  const { data: reservations, isLoading } = useReservations({
    status: statusFilter === "__all__" ? undefined : statusFilter,
    projectId: projectFilter === "__all__" ? undefined : projectFilter,
  })

  const { data: metrics } = useReservationMetrics()
  const { data: projects } = useProjects()

  // Filter by search
  const filteredReservations = reservations?.filter((res) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      res.lead?.first_name?.toLowerCase().includes(searchLower) ||
      res.lead?.last_name?.toLowerCase().includes(searchLower) ||
      res.unit?.unit_number?.toLowerCase().includes(searchLower) ||
      res.project?.name?.toLowerCase().includes(searchLower)
    )
  })

  const activeFiltersCount =
    (statusFilter !== "__all__" ? 1 : 0) + (projectFilter !== "__all__" ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-chart-4">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-chart-2">Confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.confirmed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.completed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics?.totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, unidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as ReservationStatus | "__all__")}
        >
          <SelectTrigger className="w-[160px]">
            <IconFilter className="size-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los estados</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <config.icon className={cn("size-4", config.color)} />
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={projectFilter}
          onValueChange={(val) => setProjectFilter(val)}
        >
          <SelectTrigger className="w-[180px]">
            <IconBuilding className="size-4 mr-2" />
            <SelectValue placeholder="Proyecto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los proyectos</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("__all__")
              setProjectFilter("__all__")
            }}
          >
            <IconX className="size-4 mr-1" />
            Limpiar ({activeFiltersCount})
          </Button>
        )}

        <div className="flex-1" />

        {onCreateReservation && (
          <Button onClick={onCreateReservation}>
            <IconPlus className="size-4 mr-2" />
            Nueva Reserva
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredReservations?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <IconTicket className="size-10 mb-2 opacity-40" />
                    <p>No hay reservaciones</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredReservations?.map((reservation) => {
                const status = (reservation.status as ReservationStatus) || "pending"
                const config = statusConfig[status]
                const StatusIcon = config.icon

                return (
                  <TableRow
                    key={reservation.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedReservationId === reservation.id && "bg-muted/50"
                    )}
                    onClick={() => onSelectReservation?.(reservation)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                          <IconUser className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {reservation.lead?.first_name} {reservation.lead?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {reservation.lead?.phone || reservation.lead?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{reservation.unit?.unit_number || "-"}</Badge>
                        {reservation.unit?.floor && (
                          <span className="text-xs text-muted-foreground">
                            Piso {reservation.unit.floor}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{reservation.project?.name || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconCurrencyDollar className="size-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatCurrency(reservation.unit_price)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn(config.bgColor, config.color)}>
                        <StatusIcon className="size-3 mr-1" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {reservation.created_at
                          ? format(new Date(reservation.created_at), "dd MMM yyyy", {
                              locale: es,
                            })
                          : "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
