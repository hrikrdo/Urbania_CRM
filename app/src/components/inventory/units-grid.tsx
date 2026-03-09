"use client"

import { useState } from "react"
import {
  IconHome,
  IconLock,
  IconCheck,
  IconClock,
  IconPlus,
  IconFilter,
  IconEdit,
  IconTrash,
  IconUser,
} from "@tabler/icons-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import {
  useUnitsByProject,
  useUnitTypes,
  useProjectFloors,
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
  useReleaseUnit,
  useToggleUnitBlock,
  type UnitWithRelations,
  type UnitStatus,
} from "@/hooks/use-inventory"
import type { Database } from "@/types/database"

type Unit = Database["public"]["Tables"]["units"]["Row"]

const statusConfig: Record<
  UnitStatus,
  { label: string; color: string; bgColor: string; icon: typeof IconHome }
> = {
  available: {
    label: "Disponible",
    color: "text-chart-2",
    bgColor: "bg-chart-2/10 hover:bg-chart-2/20 border-chart-2/30",
    icon: IconHome,
  },
  reserved: {
    label: "Reservada",
    color: "text-chart-4",
    bgColor: "bg-chart-4/10 hover:bg-chart-4/20 border-chart-4/30",
    icon: IconClock,
  },
  sold: {
    label: "Vendida",
    color: "text-chart-1",
    bgColor: "bg-chart-1/10 border-chart-1/30",
    icon: IconCheck,
  },
  blocked: {
    label: "Bloqueada",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50 border-muted",
    icon: IconLock,
  },
}

interface UnitsGridProps {
  projectId: string
  projectName: string
}

export function UnitsGrid({ projectId, projectName }: UnitsGridProps) {
  const [filters, setFilters] = useState<{
    status?: UnitStatus
    floor?: number
    unitTypeId?: string
  }>({})
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<UnitWithRelations | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<UnitWithRelations | null>(null)

  const { data: units, isLoading } = useUnitsByProject(projectId, filters)
  const { data: unitTypes } = useUnitTypes(projectId)
  const { data: floors } = useProjectFloors(projectId)

  // Group units by floor
  const unitsByFloor = units?.reduce(
    (acc, unit) => {
      const floor = unit.floor || 0
      if (!acc[floor]) acc[floor] = []
      acc[floor].push(unit)
      return acc
    },
    {} as Record<number, UnitWithRelations[]>
  )

  const sortedFloors = Object.keys(unitsByFloor || {})
    .map(Number)
    .sort((a, b) => b - a) // Descending (highest floor first)

  // Calculate stats
  const stats = units?.reduce(
    (acc, unit) => {
      acc.total++
      acc[unit.status as UnitStatus]++
      return acc
    },
    { total: 0, available: 0, reserved: 0, sold: 0, blocked: 0 }
  ) || { total: 0, available: 0, reserved: 0, sold: 0, blocked: 0 }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-8 gap-2">
          {[...Array(32)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        {(Object.entries(statusConfig) as [UnitStatus, typeof statusConfig.available][]).map(
          ([status, config]) => (
            <button type="button"
              key={status}
              onClick={() =>
                setFilters((f) =>
                  f.status === status ? { ...f, status: undefined } : { ...f, status }
                )
              }
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md border transition-colors",
                filters.status === status
                  ? config.bgColor
                  : "bg-background hover:bg-muted/50"
              )}
            >
              <config.icon className={cn("size-4", config.color)} />
              <span className="text-sm font-medium">
                {stats[status]} {config.label}
              </span>
            </button>
          )
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <IconFilter className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros:</span>
        </div>

        <Select
          value={filters.floor?.toString() || "all"}
          onValueChange={(val) =>
            setFilters((f) => ({
              ...f,
              floor: val === "all" ? undefined : Number(val),
            }))
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Piso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {floors?.map((floor) => (
              <SelectItem key={floor} value={floor.toString()}>
                Piso {floor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.unitTypeId || "all"}
          onValueChange={(val) =>
            setFilters((f) => ({
              ...f,
              unitTypeId: val === "all" ? undefined : val,
            }))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {unitTypes?.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name || `${type.bedrooms} Rec.`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <IconPlus className="size-4" />
              Agregar Unidad
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <UnitForm
              projectId={projectId}
              unitTypes={unitTypes || []}
              onClose={() => setIsCreateOpen(false)}
              onSuccess={() => {
                setIsCreateOpen(false)
                toast.success("Unidad creada")
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Units Grid by Floor */}
      {sortedFloors.length > 0 ? (
        <div className="space-y-6">
          {sortedFloors.map((floor) => (
            <div key={floor} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Piso {floor}
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {unitsByFloor?.[floor]
                  ?.sort((a, b) => a.unit_number.localeCompare(b.unit_number))
                  .map((unit) => (
                    <UnitCard
                      key={unit.id}
                      unit={unit}
                      onClick={() => setSelectedUnit(unit)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <IconHome className="mx-auto size-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No hay unidades</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsCreateOpen(true)}
            >
              Agregar primera unidad
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Unit Detail Dialog */}
      <Dialog open={!!selectedUnit} onOpenChange={() => setSelectedUnit(null)}>
        <DialogContent className="max-w-md">
          {selectedUnit && (
            <UnitDetail
              unit={selectedUnit}
              projectName={projectName}
              unitTypes={unitTypes || []}
              onClose={() => setSelectedUnit(null)}
              onEdit={() => {
                setEditingUnit(selectedUnit)
                setSelectedUnit(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog */}
      <Dialog open={!!editingUnit} onOpenChange={() => setEditingUnit(null)}>
        <DialogContent className="sm:max-w-lg">
          {editingUnit && (
            <UnitForm
              projectId={projectId}
              unit={editingUnit}
              unitTypes={unitTypes || []}
              onClose={() => setEditingUnit(null)}
              onSuccess={() => {
                setEditingUnit(null)
                toast.success("Unidad actualizada")
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UnitCard({
  unit,
  onClick,
}: {
  unit: UnitWithRelations
  onClick: () => void
}) {
  const status = statusConfig[unit.status as UnitStatus] || statusConfig.available
  const StatusIcon = status.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button"
            onClick={onClick}
            className={cn(
              "p-2 rounded-md border text-center transition-all cursor-pointer",
              status.bgColor,
              unit.status === "sold" && "cursor-default opacity-60"
            )}
          >
            <StatusIcon className={cn("size-4 mx-auto mb-1", status.color)} />
            <p className="text-xs font-medium truncate">{unit.unit_number}</p>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p className="font-medium">Unidad {unit.unit_number}</p>
            <p>{status.label}</p>
            {unit.area_m2 && <p>{unit.area_m2} m²</p>}
            <p>${unit.price?.toLocaleString()}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function UnitDetail({
  unit,
  projectName,
  unitTypes,
  onClose,
  onEdit,
}: {
  unit: UnitWithRelations
  projectName: string
  unitTypes: Database["public"]["Tables"]["unit_types"]["Row"][]
  onClose: () => void
  onEdit: () => void
}) {
  const releaseUnit = useReleaseUnit()
  const toggleBlock = useToggleUnitBlock()
  const deleteUnit = useDeleteUnit()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const status = statusConfig[unit.status as UnitStatus] || statusConfig.available
  const unitType = unitTypes.find((t) => t.id === unit.unit_type_id)

  const handleRelease = async () => {
    try {
      await releaseUnit.mutateAsync(unit.id)
      toast.success("Reserva liberada")
      onClose()
    } catch {
      toast.error("Error al liberar unidad")
    }
  }

  const handleToggleBlock = async () => {
    try {
      await toggleBlock.mutateAsync({
        unitId: unit.id,
        blocked: unit.status !== "blocked",
      })
      toast.success(unit.status === "blocked" ? "Unidad desbloqueada" : "Unidad bloqueada")
      onClose()
    } catch {
      toast.error("Error al cambiar estado")
    }
  }

  const handleDelete = async () => {
    try {
      await deleteUnit.mutateAsync({ id: unit.id, projectId: unit.project_id })
      toast.success("Unidad eliminada")
      onClose()
    } catch {
      toast.error("Error al eliminar unidad")
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <status.icon className={cn("size-5", status.color)} />
          Unidad {unit.unit_number}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{status.label}</Badge>
          <span className="text-sm text-muted-foreground">{projectName}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Piso</p>
            <p className="font-medium">{unit.floor || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tipo</p>
            <p className="font-medium">{unitType?.name || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Área</p>
            <p className="font-medium">{unit.area_m2 ? `${unit.area_m2} m²` : "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Vista</p>
            <p className="font-medium capitalize">{unit.view || "-"}</p>
          </div>
        </div>

        <div className="p-3 rounded-md bg-muted/50">
          <p className="text-xs text-muted-foreground">Precio</p>
          <p className="text-xl font-semibold">${unit.price?.toLocaleString()}</p>
        </div>

        {unit.reserved_lead && (
          <div className="p-3 rounded-md border border-chart-4/30 bg-chart-4/5">
            <div className="flex items-center gap-2 mb-2">
              <IconUser className="size-4 text-chart-4" />
              <span className="text-sm font-medium">Reservado por</span>
            </div>
            <p className="text-sm">
              {unit.reserved_lead.first_name} {unit.reserved_lead.last_name}
            </p>
            {unit.reserved_lead.phone && (
              <p className="text-xs text-muted-foreground">{unit.reserved_lead.phone}</p>
            )}
          </div>
        )}

        {unit.notes && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Notas</p>
            <p className="text-sm">{unit.notes}</p>
          </div>
        )}
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        {unit.status === "reserved" && (
          <Button
            variant="outline"
            onClick={handleRelease}
            disabled={releaseUnit.isPending}
          >
            Liberar Reserva
          </Button>
        )}

        {unit.status !== "sold" && (
          <Button
            variant="outline"
            onClick={handleToggleBlock}
            disabled={toggleBlock.isPending}
          >
            {unit.status === "blocked" ? "Desbloquear" : "Bloquear"}
          </Button>
        )}

        <Button variant="outline" onClick={onEdit}>
          <IconEdit className="size-4 mr-2" />
          Editar
        </Button>

        {unit.status === "available" && (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <IconTrash className="size-4" />
          </Button>
        )}
      </DialogFooter>

      {/* Delete confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Eliminar Unidad</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la unidad {unit.unit_number}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteUnit.isPending}
            >
              {deleteUnit.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function UnitForm({
  projectId,
  unit,
  unitTypes,
  onClose,
  onSuccess,
}: {
  projectId: string
  unit?: UnitWithRelations
  unitTypes: Database["public"]["Tables"]["unit_types"]["Row"][]
  onClose: () => void
  onSuccess: () => void
}) {
  const createUnit = useCreateUnit()
  const updateUnit = useUpdateUnit()
  const [formData, setFormData] = useState({
    unit_number: unit?.unit_number || "",
    floor: unit?.floor?.toString() || "",
    unit_type_id: unit?.unit_type_id || "",
    area_m2: unit?.area_m2?.toString() || "",
    price: unit?.price?.toString() || "",
    view: unit?.view || "",
    status: unit?.status || "available",
    notes: unit?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      project_id: projectId,
      unit_number: formData.unit_number,
      floor: formData.floor ? Number(formData.floor) : null,
      unit_type_id: formData.unit_type_id || null,
      area_m2: formData.area_m2 ? Number(formData.area_m2) : null,
      price: Number(formData.price),
      view: formData.view || null,
      status: formData.status,
      notes: formData.notes || null,
    }

    try {
      if (unit) {
        await updateUnit.mutateAsync({ id: unit.id, updates: data })
      } else {
        await createUnit.mutateAsync(data)
      }
      onSuccess()
    } catch {
      toast.error("Error al guardar unidad")
    }
  }

  const isLoading = createUnit.isPending || updateUnit.isPending

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{unit ? "Editar Unidad" : "Nueva Unidad"}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="unit_number">Número *</Label>
            <Input
              id="unit_number"
              value={formData.unit_number}
              onChange={(e) =>
                setFormData({ ...formData, unit_number: e.target.value })
              }
              placeholder="Ej: 101"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="floor">Piso</Label>
            <Input
              id="floor"
              type="number"
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              placeholder="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="unit_type_id">Tipo</Label>
            <Select
              value={formData.unit_type_id || "none"}
              onValueChange={(val) =>
                setFormData({ ...formData, unit_type_id: val === "none" ? "" : val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin tipo</SelectItem>
                {unitTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name || `${type.bedrooms} Recámaras`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="area_m2">Área (m²)</Label>
            <Input
              id="area_m2"
              type="number"
              step="0.01"
              value={formData.area_m2}
              onChange={(e) => setFormData({ ...formData, area_m2: e.target.value })}
              placeholder="85.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Precio ($) *</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="250000"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="view">Vista</Label>
            <Select
              value={formData.view || "none"}
              onValueChange={(val) =>
                setFormData({ ...formData, view: val === "none" ? "" : val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin especificar</SelectItem>
                <SelectItem value="mar">Mar</SelectItem>
                <SelectItem value="ciudad">Ciudad</SelectItem>
                <SelectItem value="piscina">Piscina</SelectItem>
                <SelectItem value="jardín">Jardín</SelectItem>
                <SelectItem value="interior">Interior</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {unit && (
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(val) => setFormData({ ...formData, status: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="reserved">Reservada</SelectItem>
                <SelectItem value="sold">Vendida</SelectItem>
                <SelectItem value="blocked">Bloqueada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <Input
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notas adicionales..."
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !formData.unit_number || !formData.price}
        >
          {isLoading ? "Guardando..." : unit ? "Actualizar" : "Crear"}
        </Button>
      </DialogFooter>
    </form>
  )
}
