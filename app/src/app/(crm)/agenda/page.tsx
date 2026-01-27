"use client"

import { useState, useMemo } from "react"
import {
  IconCalendarEvent,
  IconPlus,
  IconClock,
  IconCheck,
  IconUsers,
  IconTrendingUp,
  IconLoader2,
} from "@tabler/icons-react"
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  CalendarView,
  AppointmentCard,
  CreateAppointmentDialog,
} from "@/components/agenda"
import {
  useAppointments,
  useAppointmentMetrics,
  useTodayAppointments,
  useUpcomingAppointments,
  type AppointmentStatus,
  type AppointmentType,
} from "@/hooks/use-appointments"
import { useUsers } from "@/hooks/use-leads"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useLeadsStore } from "@/stores/leads-store"
import { ModuleHeader } from "@/components/module-header"

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<AppointmentType | "all">("all")
  const [assignedFilter, setAssignedFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const { data: currentUser } = useCurrentUser()
  const { data: users } = useUsers()

  // Use unified lead detail panel
  const { openDetailById } = useLeadsStore()

  // Get date range for current month view
  const dateFrom = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    return startOfWeek(monthStart, { weekStartsOn: 1 }).toISOString()
  }, [currentDate])

  const dateTo = useMemo(() => {
    const monthEnd = endOfMonth(currentDate)
    return endOfWeek(monthEnd, { weekStartsOn: 1 }).toISOString()
  }, [currentDate])

  // Fetch appointments
  const { data: appointments, isLoading } = useAppointments({
    dateFrom,
    dateTo,
    status: statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    assignedTo: assignedFilter !== "all" ? assignedFilter : undefined,
  })

  const { data: metrics } = useAppointmentMetrics({
    dateFrom: startOfMonth(currentDate).toISOString(),
    dateTo: endOfMonth(currentDate).toISOString(),
  })

  const { data: todayAppointments } = useTodayAppointments(
    currentUser?.id
  )

  const { data: upcomingAppointments } = useUpcomingAppointments(
    currentUser?.id,
    5
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <ModuleHeader
        title="Agenda"
        description="Gestiona tus citas y visitas con clientes"
      >
        <Button onClick={() => setShowCreateDialog(true)}>
          <IconPlus className="size-4 mr-2" />
          Nueva Cita
        </Button>
      </ModuleHeader>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hoy
            </CardTitle>
            <IconCalendarEvent className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayAppointments?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              citas programadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
            <IconClock className="size-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics?.scheduled || 0) + (metrics?.confirmed || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              por atender este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completadas
            </CardTitle>
            <IconCheck className="size-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Asistencia
            </CardTitle>
            <IconTrendingUp className="size-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.attendanceRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              tasa de asistencia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card className="h-[700px]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <IconCalendarEvent className="size-5" />
                  Calendario
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as AppointmentStatus | "all")}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="scheduled">Programadas</SelectItem>
                      <SelectItem value="confirmed">Confirmadas</SelectItem>
                      <SelectItem value="completed">Completadas</SelectItem>
                      <SelectItem value="cancelled">Canceladas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={typeFilter}
                    onValueChange={(v) => setTypeFilter(v as AppointmentType | "all")}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="visit">Visitas</SelectItem>
                      <SelectItem value="call">Llamadas</SelectItem>
                      <SelectItem value="video_call">Video</SelectItem>
                      <SelectItem value="meeting">Reuniones</SelectItem>
                      <SelectItem value="follow_up">Seguimiento</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={assignedFilter}
                    onValueChange={setAssignedFilter}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Asignado a" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <CalendarView
                  appointments={appointments || []}
                  onSelectAppointment={(apt) => {
                    if (apt.lead_id) {
                      openDetailById(apt.lead_id, "appointments")
                    }
                  }}
                  onSelectDate={(date) => {
                    setCurrentDate(date)
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Upcoming Appointments */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IconClock className="size-4" />
                Próximas Citas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingAppointments && upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    onClick={() => {
                      if (apt.lead_id) {
                        openDetailById(apt.lead_id, "appointments")
                      }
                    }}
                    compact
                  />
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <IconCalendarEvent className="size-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No hay citas próximas</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IconUsers className="size-4" />
                Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayAppointments && todayAppointments.length > 0 ? (
                <div className="space-y-3">
                  {todayAppointments.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onClick={() => {
                        if (apt.lead_id) {
                          openDetailById(apt.lead_id, "appointments")
                        }
                      }}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <IconCheck className="size-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Sin citas para hoy</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Appointment Dialog */}
      <CreateAppointmentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false)
        }}
      />
    </div>
  )
}
