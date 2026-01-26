"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { IconCalendar, IconFilter, IconX } from "@tabler/icons-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProjects, useUsers } from "@/hooks/use-leads"
import { useDashboardStore } from "@/stores/dashboard-store"
import { cn } from "@/lib/utils"

export function DashboardFilters() {
  const { filters, setFilter, clearFilters } = useDashboardStore()
  const { data: projects } = useProjects()
  const { data: users } = useUsers()

  const dateRange: DateRange | undefined = filters.date_from && filters.date_to
    ? {
        from: new Date(filters.date_from),
        to: new Date(filters.date_to),
      }
    : undefined

  const handleDateSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      setFilter("date_from", range.from.toISOString())
    }
    if (range?.to) {
      setFilter("date_to", range.to.toISOString())
    }
  }

  const hasActiveFilters = filters.project_id || filters.assigned_to

  return (
    <div className="flex items-center gap-2">
      {/* Project Filter */}
      <Select
        value={filters.project_id || "__all__"}
        onValueChange={(value) =>
          setFilter("project_id", value === "__all__" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos los proyectos" />
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

      {/* Seller/User Filter */}
      <Select
        value={filters.assigned_to || "__all__"}
        onValueChange={(value) =>
          setFilter("assigned_to", value === "__all__" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos los vendedores" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todos los vendedores</SelectItem>
          {users?.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.first_name} {user.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <IconCalendar className="mr-2 size-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd MMM", { locale: es })} -{" "}
                  {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                </>
              ) : (
                format(dateRange.from, "dd MMM yyyy", { locale: es })
              )
            ) : (
              <span>Seleccionar fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearFilters}
          title="Limpiar filtros"
        >
          <IconX className="size-4" />
        </Button>
      )}
    </div>
  )
}
