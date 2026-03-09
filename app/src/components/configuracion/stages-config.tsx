"use client"

import { useState } from "react"
import {
  IconPlus,
  IconGripVertical,
  IconEdit,
  IconTrash,
  IconListDetails,
  IconChevronRight,
} from "@tabler/icons-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

// TODO: Replace with real data from lead_stages table
const mockStages = [
  { id: "1", name: "Nuevo", slug: "nuevo", order: 1, color: "#3B82F6", isDefault: true },
  { id: "2", name: "Contactado", slug: "contactado", order: 2, color: "#8B5CF6", isDefault: false },
  { id: "3", name: "Cita Agendada", slug: "cita_agendada", order: 3, color: "#F59E0B", isDefault: false },
  { id: "4", name: "Visita Realizada", slug: "visita_realizada", order: 4, color: "#10B981", isDefault: false },
  { id: "5", name: "Negociación", slug: "negociacion", order: 5, color: "#EC4899", isDefault: false },
  { id: "6", name: "Apartado", slug: "apartado", order: 6, color: "#6366F1", isDefault: false },
  { id: "7", name: "Ganado", slug: "ganado", order: 7, color: "#22C55E", isDefault: false },
  { id: "8", name: "Perdido", slug: "perdido", order: 8, color: "#EF4444", isDefault: false },
]

const colorOptions = [
  { label: "Azul", value: "#3B82F6" },
  { label: "Morado", value: "#8B5CF6" },
  { label: "Índigo", value: "#6366F1" },
  { label: "Rosa", value: "#EC4899" },
  { label: "Amarillo", value: "#F59E0B" },
  { label: "Verde", value: "#22C55E" },
  { label: "Teal", value: "#10B981" },
  { label: "Rojo", value: "#EF4444" },
  { label: "Gris", value: "#6B7280" },
]

export function StagesConfig() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedStage, setSelectedStage] = useState<typeof mockStages[0] | null>(null)
  const [newStage, setNewStage] = useState({
    name: "",
    color: "#3B82F6",
  })

  const handleAddStage = () => {
    // TODO: Implement stage creation with Supabase
    console.log("Creating stage:", newStage)
    setShowAddDialog(false)
    setNewStage({ name: "", color: "#3B82F6" })
  }

  const handleEditStage = () => {
    // TODO: Implement stage update with Supabase
    if (selectedStage) {
      console.log("Updating stage:", selectedStage)
    }
    setShowEditDialog(false)
    setSelectedStage(null)
  }

  const handleDeleteStage = (id: string) => {
    // TODO: Implement stage deletion with Supabase
    console.log("Deleting stage:", id)
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stages List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Etapas del Pipeline</CardTitle>
                <CardDescription>
                  Define las etapas por las que pasan los leads
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddDialog(true)}>
                <IconPlus className="mr-2 size-4" />
                Nueva Etapa
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockStages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                >
                  <IconGripVertical className="size-4 cursor-grab text-muted-foreground" />
                  <div
                    className="size-4 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stage.name}</span>
                      {stage.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Por defecto
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Orden: {stage.order}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedStage(stage)
                        setShowEditDialog(true)
                      }}
                    >
                      <IconEdit className="size-4" />
                    </Button>
                    {!stage.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStage(stage.id)}
                      >
                        <IconTrash className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vista Previa del Pipeline</CardTitle>
            <CardDescription>
              Así se verá el flujo de ventas en el Kanban
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {mockStages.slice(0, 6).map((stage, index) => (
                <div key={stage.id} className="relative">
                  <div className="flex items-center gap-3 py-2">
                    <div
                      className="flex size-8 items-center justify-center rounded-full text-white text-sm font-medium"
                      style={{ backgroundColor: stage.color }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{stage.name}</span>
                    </div>
                    {index < mockStages.slice(0, 6).length - 1 && (
                      <IconChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  {index < mockStages.slice(0, 6).length - 1 && (
                    <div
                      className="absolute left-4 top-10 h-4 w-0.5"
                      style={{ backgroundColor: stage.color }}
                    />
                  )}
                </div>
              ))}
              <Separator className="my-4" />
              <div className="flex gap-4">
                {mockStages.slice(6).map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-center gap-2 rounded-lg border p-2"
                  >
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-sm">{stage.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Stage Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Etapa</DialogTitle>
            <DialogDescription>
              Agrega una nueva etapa al pipeline de ventas.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="stage-name">Nombre de la Etapa</Label>
              <Input
                id="stage-name"
                value={newStage.name}
                onChange={(e) => setNewStage({ ...newStage, name: e.target.value })}
                placeholder="Ej: En Seguimiento"
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`size-8 rounded-full border-2 transition-all ${
                      newStage.color === color.value
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewStage({ ...newStage, color: color.value })}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddStage}>Crear Etapa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Stage Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Etapa</DialogTitle>
            <DialogDescription>
              Modifica los detalles de esta etapa.
            </DialogDescription>
          </DialogHeader>

          {selectedStage && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-stage-name">Nombre de la Etapa</Label>
                <Input
                  id="edit-stage-name"
                  value={selectedStage.name}
                  onChange={(e) =>
                    setSelectedStage({ ...selectedStage, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`size-8 rounded-full border-2 transition-all ${
                        selectedStage.color === color.value
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() =>
                        setSelectedStage({ ...selectedStage, color: color.value })
                      }
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditStage}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
