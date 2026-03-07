"use client"

import {
  IconLayoutKanban,
  IconList,
  IconPlus,
  IconSearch,
  IconFilter,
  IconX,
  IconFlame,
  IconTemperature,
  IconSnowflake,
  IconClock,
  IconAlertTriangle,
  IconClockX,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

import { useLeadsStore } from "@/stores/leads-store"
import { useLeadStatuses, useUsers, useProjects } from "@/hooks/use-leads"
import { KanbanBoard } from "./kanban-board"
import { LeadsTable } from "./leads-table"
import { LeadDetailPanel } from "./lead-detail-panel"
import { CreateLeadDialog } from "./create-lead-dialog"

const temperatureOptions = [
  { value: "hot", label: "Caliente", icon: IconFlame, color: "text-chart-1" },
  { value: "warm", label: "Tibio", icon: IconTemperature, color: "text-chart-5" },
  { value: "cold", label: "Frío", icon: IconSnowflake, color: "text-chart-2" },
]

const timerStatusOptions = [
  { value: "active", label: "Timer activo", icon: IconClock, color: "text-muted-foreground" },
  { value: "expiring", label: "Por expirar", icon: IconAlertTriangle, color: "text-chart-4" },
  { value: "expired", label: "Expirado", icon: IconClockX, color: "text-destructive" },
]

const sourceOptions = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "google", label: "Google Ads" },
  { value: "referral", label: "Referido" },
  { value: "website", label: "Sitio Web" },
  { value: "walkin", label: "Walk-in" },
  { value: "other", label: "Otro" },
]

interface LeadsViewProps {
  module?: string
}

export function LeadsView({ module = "comercial" }: LeadsViewProps) {
  const {
    viewMode,
    setViewMode,
    filters,
    setFilter,
    clearFilters,
    openCreateModal,
  } = useLeadsStore()

  const { data: statuses } = useLeadStatuses(module)
  const { data: users } = useUsers()
  const { data: projects } = useProjects()

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== null && v !== ""
  ).length

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 shrink-0">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          {/* Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <IconFilter className="size-4 mr-2" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 size-5 p-0 justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros</h4>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-auto p-0 text-muted-foreground"
                      >
                        <IconX className="size-4 mr-1" />
                        Limpiar
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Estado */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Estado</label>
                      <Select
                        value={filters.status_id || ""}
                        onValueChange={(value) =>
                          setFilter("status_id", value === "__all__" ? null : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los estados" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos</SelectItem>
                          {statuses?.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="size-2 rounded-full"
                                  style={{ backgroundColor: status.color }}
                                />
                                {status.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Asignado a */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        Asignado a
                      </label>
                      <Select
                        value={filters.assigned_to || ""}
                        onValueChange={(value) =>
                          setFilter("assigned_to", value === "__all__" ? null : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los usuarios" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos</SelectItem>
                          {users?.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.first_name} {user.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Proyecto */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Proyecto</label>
                      <Select
                        value={filters.project_id || ""}
                        onValueChange={(value) =>
                          setFilter("project_id", value === "__all__" ? null : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los proyectos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos</SelectItem>
                          {projects?.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Temperatura */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Temperatura</label>
                      <Select
                        value={filters.temperature || ""}
                        onValueChange={(value) =>
                          setFilter("temperature", value === "__all__" ? null : value as "hot" | "warm" | "cold")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todas las temperaturas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todas</SelectItem>
                          {temperatureOptions.map((temp) => (
                            <SelectItem key={temp.value} value={temp.value}>
                              <div className="flex items-center gap-2">
                                <temp.icon className={`size-4 ${temp.color}`} />
                                {temp.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Fuente */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Fuente</label>
                      <Select
                        value={filters.source || ""}
                        onValueChange={(value) =>
                          setFilter("source", value === "__all__" ? null : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todas las fuentes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todas</SelectItem>
                          {sourceOptions.map((source) => (
                            <SelectItem key={source.value} value={source.value}>
                              {source.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Timer Status */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Estado del Timer</label>
                      <Select
                        value={filters.timer_status || ""}
                        onValueChange={(value) =>
                          setFilter("timer_status", value === "__all__" ? null : value as "active" | "expiring" | "expired")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los timers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos</SelectItem>
                          {timerStatusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center gap-2">
                                <status.icon className={`size-4 ${status.color}`} />
                                {status.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Quick filter badges for active filters */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-1">
              {filters.temperature && (
                <Badge variant="secondary" className="gap-1">
                  {temperatureOptions.find(t => t.value === filters.temperature)?.label}
                  <IconX
                    className="size-3 cursor-pointer"
                    onClick={() => setFilter("temperature", null)}
                  />
                </Badge>
              )}
              {filters.timer_status && (
                <Badge
                  variant={filters.timer_status === "expiring" ? "destructive" : "secondary"}
                  className="gap-1"
                >
                  {timerStatusOptions.find(t => t.value === filters.timer_status)?.label}
                  <IconX
                    className="size-3 cursor-pointer"
                    onClick={() => setFilter("timer_status", null)}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as "kanban" | "list")}
          >
            <ToggleGroupItem value="kanban" aria-label="Vista Kanban">
              <IconLayoutKanban className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Vista Lista">
              <IconList className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Add Lead Button */}
          <Button onClick={openCreateModal}>
            <IconPlus className="size-4 mr-2" />
            Nuevo Lead
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === "kanban" ? (
          <KanbanBoard module={module} />
        ) : (
          <LeadsTable
            filters={{
              search: filters.search || undefined,
              status_id: filters.status_id || undefined,
              assigned_to: filters.assigned_to || undefined,
              project_id: filters.project_id || undefined,
              temperature: filters.temperature || undefined,
              source: filters.source || undefined,
              timer_status: filters.timer_status || undefined,
            }}
          />
        )}
      </div>

      {/* Detail Panel */}
      <LeadDetailPanel />

      {/* Create Lead Dialog */}
      <CreateLeadDialog />
    </div>
  )
}
