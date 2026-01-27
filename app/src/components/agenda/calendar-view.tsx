"use client"

import { useState, useMemo } from "react"
import {
  IconChevronLeft,
  IconChevronRight,
  IconCalendarEvent,
  IconPhone,
  IconVideo,
  IconUsers,
  IconRefresh,
  IconDots,
} from "@tabler/icons-react"
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  isToday,
} from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type {
  AppointmentWithRelations,
  AppointmentType,
  AppointmentStatus,
} from "@/hooks/use-appointments"

type CalendarViewMode = "day" | "week" | "month"

const typeConfig: Record<AppointmentType, { icon: typeof IconCalendarEvent; color: string }> = {
  visit: { icon: IconCalendarEvent, color: "bg-chart-2" },
  call: { icon: IconPhone, color: "bg-chart-3" },
  video_call: { icon: IconVideo, color: "bg-chart-5" },
  meeting: { icon: IconUsers, color: "bg-chart-1" },
  follow_up: { icon: IconRefresh, color: "bg-chart-4" },
  other: { icon: IconDots, color: "bg-muted" },
}

const statusColors: Record<AppointmentStatus, string> = {
  scheduled: "border-chart-4",
  confirmed: "border-chart-2",
  completed: "border-primary",
  cancelled: "border-destructive opacity-50",
  no_show: "border-destructive opacity-50",
}

interface CalendarViewProps {
  appointments: AppointmentWithRelations[]
  onSelectAppointment: (appointment: AppointmentWithRelations) => void
  onSelectDate?: (date: Date) => void
}

export function CalendarView({
  appointments,
  onSelectAppointment,
  onSelectDate,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week")

  // Navigation handlers
  const goToPrevious = () => {
    switch (viewMode) {
      case "day":
        setCurrentDate(subDays(currentDate, 1))
        break
      case "week":
        setCurrentDate(subWeeks(currentDate, 1))
        break
      case "month":
        setCurrentDate(subMonths(currentDate, 1))
        break
    }
  }

  const goToNext = () => {
    switch (viewMode) {
      case "day":
        setCurrentDate(addDays(currentDate, 1))
        break
      case "week":
        setCurrentDate(addWeeks(currentDate, 1))
        break
      case "month":
        setCurrentDate(addMonths(currentDate, 1))
        break
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get title based on view mode
  const getTitle = () => {
    switch (viewMode) {
      case "day":
        return format(currentDate, "EEEE d 'de' MMMM, yyyy", { locale: es })
      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
        return `${format(weekStart, "d MMM", { locale: es })} - ${format(weekEnd, "d MMM yyyy", { locale: es })}`
      case "month":
        return format(currentDate, "MMMM yyyy", { locale: es })
    }
  }

  // Get days to display
  const days = useMemo(() => {
    switch (viewMode) {
      case "day":
        return [currentDate]
      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
        return eachDayOfInterval({ start: weekStart, end: weekEnd })
      case "month":
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    }
  }, [currentDate, viewMode])

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, AppointmentWithRelations[]> = {}
    appointments.forEach((apt) => {
      const dateKey = format(new Date(apt.scheduled_at), "yyyy-MM-dd")
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(apt)
    })
    // Sort appointments by time
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      )
    })
    return grouped
  }, [appointments])

  // Time slots for day/week view
  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 8) // 8:00 to 19:00

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={goToPrevious}>
              <IconChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <IconChevronRight className="size-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoy
          </Button>
          <h2 className="text-lg font-semibold capitalize">{getTitle()}</h2>
        </div>

        <Select
          value={viewMode}
          onValueChange={(v) => setViewMode(v as CalendarViewMode)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Día</SelectItem>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="month">Mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar Grid */}
      {viewMode === "month" ? (
        <MonthView
          days={days}
          currentDate={currentDate}
          appointmentsByDate={appointmentsByDate}
          onSelectAppointment={onSelectAppointment}
          onSelectDate={onSelectDate}
        />
      ) : (
        <WeekDayView
          days={days}
          timeSlots={timeSlots}
          appointmentsByDate={appointmentsByDate}
          onSelectAppointment={onSelectAppointment}
          onSelectDate={onSelectDate}
          viewMode={viewMode}
        />
      )}
    </div>
  )
}

// Month View Component
function MonthView({
  days,
  currentDate,
  appointmentsByDate,
  onSelectAppointment,
  onSelectDate,
}: {
  days: Date[]
  currentDate: Date
  appointmentsByDate: Record<string, AppointmentWithRelations[]>
  onSelectAppointment: (apt: AppointmentWithRelations) => void
  onSelectDate?: (date: Date) => void
}) {
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  return (
    <div className="flex-1 overflow-auto pt-4">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd")
          const dayAppointments = appointmentsByDate[dateKey] || []
          const isCurrentMonth = isSameMonth(day, currentDate)

          return (
            <div
              key={dateKey}
              className={cn(
                "min-h-[100px] p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                !isCurrentMonth && "opacity-40",
                isToday(day) && "border-primary"
              )}
              onClick={() => onSelectDate?.(day)}
            >
              <div
                className={cn(
                  "text-sm font-medium mb-1",
                  isToday(day) && "text-primary"
                )}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((apt) => {
                  const type = (apt.type as AppointmentType) || "other"
                  const status = (apt.status as AppointmentStatus) || "scheduled"
                  const config = typeConfig[type]

                  return (
                    <div
                      key={apt.id}
                      className={cn(
                        "text-xs p-1 rounded truncate border-l-2",
                        "bg-muted/50 hover:bg-muted cursor-pointer",
                        statusColors[status]
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectAppointment(apt)
                      }}
                    >
                      <span className="font-medium">
                        {format(new Date(apt.scheduled_at), "HH:mm")}
                      </span>{" "}
                      {apt.lead?.first_name}
                    </div>
                  )
                })}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-muted-foreground pl-1">
                    +{dayAppointments.length - 3} más
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Week/Day View Component
function WeekDayView({
  days,
  timeSlots,
  appointmentsByDate,
  onSelectAppointment,
  onSelectDate,
  viewMode,
}: {
  days: Date[]
  timeSlots: number[]
  appointmentsByDate: Record<string, AppointmentWithRelations[]>
  onSelectAppointment: (apt: AppointmentWithRelations) => void
  onSelectDate?: (date: Date) => void
  viewMode: "day" | "week"
}) {
  return (
    <div className="flex-1 overflow-auto pt-4">
      <div className="flex">
        {/* Time column */}
        <div className="w-16 flex-shrink-0">
          <div className="h-12" /> {/* Header spacer */}
          {timeSlots.map((hour) => (
            <div
              key={hour}
              className="h-16 text-xs text-muted-foreground text-right pr-2 pt-0"
            >
              {hour.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Days columns */}
        <div className={cn("flex-1 grid", viewMode === "day" ? "grid-cols-1" : "grid-cols-7")}>
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd")
            const dayAppointments = appointmentsByDate[dateKey] || []

            return (
              <div key={dateKey} className="border-l first:border-l-0">
                {/* Day header */}
                <div
                  className={cn(
                    "h-12 flex flex-col items-center justify-center border-b cursor-pointer hover:bg-muted/50",
                    isToday(day) && "bg-primary/5"
                  )}
                  onClick={() => onSelectDate?.(day)}
                >
                  <div className="text-xs text-muted-foreground">
                    {format(day, "EEE", { locale: es })}
                  </div>
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isToday(day) && "text-primary"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                </div>

                {/* Time slots */}
                <div className="relative">
                  {timeSlots.map((hour) => (
                    <div
                      key={hour}
                      className="h-16 border-b border-dashed border-muted"
                    />
                  ))}

                  {/* Appointments */}
                  {dayAppointments.map((apt) => {
                    const aptTime = new Date(apt.scheduled_at)
                    const hours = aptTime.getHours()
                    const minutes = aptTime.getMinutes()
                    const type = (apt.type as AppointmentType) || "other"
                    const status = (apt.status as AppointmentStatus) || "scheduled"
                    const config = typeConfig[type]
                    const TypeIcon = config.icon

                    // Calculate position (8:00 is 0)
                    const top = ((hours - 8) * 64) + (minutes / 60) * 64
                    const height = Math.max(32, (apt.duration_minutes / 60) * 64)

                    // Skip if outside visible range
                    if (hours < 8 || hours >= 20) return null

                    return (
                      <div
                        key={apt.id}
                        className={cn(
                          "absolute left-1 right-1 rounded-md p-1 cursor-pointer",
                          "border-l-2 bg-background shadow-sm hover:shadow-md transition-shadow",
                          statusColors[status]
                        )}
                        style={{ top: `${top}px`, minHeight: `${height}px` }}
                        onClick={() => onSelectAppointment(apt)}
                      >
                        <div className="flex items-center gap-1">
                          <div className={cn("size-2 rounded-full", config.color)} />
                          <span className="text-xs font-medium truncate">
                            {format(aptTime, "HH:mm")}
                          </span>
                        </div>
                        <p className="text-xs truncate">
                          {apt.lead?.first_name} {apt.lead?.last_name}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
