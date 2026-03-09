"use client"

import { useState } from "react"
import Link from "next/link"
import {
  IconBuilding,
  IconMapPin,
  IconHome,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

import {
  useProjects,
  useProjectsMetrics,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  type ProjectWithStats,
} from "@/hooks/use-inventory"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "Activo", variant: "default" },
  coming_soon: { label: "Próximamente", variant: "secondary" },
  sold_out: { label: "Agotado", variant: "outline" },
  archived: { label: "Archivado", variant: "destructive" },
}

export function ProjectsList() {
  const { data: projects, isLoading, error } = useProjects()
  const { data: metrics } = useProjectsMetrics()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null)
  const [deleteProject, setDeleteProject] = useState<ProjectWithStats | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6 text-center text-destructive">
          Error al cargar proyectos
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="p-4">
            <p className="text-xs text-muted-foreground">Total Proyectos</p>
            <p className="text-2xl font-semibold">{metrics?.totalProjects || 0}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <p className="text-xs text-muted-foreground">Unidades Totales</p>
            <p className="text-2xl font-semibold">{metrics?.totalUnits || 0}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <p className="text-xs text-muted-foreground">Disponibles</p>
            <p className="text-2xl font-semibold text-chart-2">
              {metrics?.availableUnits || 0}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <p className="text-xs text-muted-foreground">Vendidas</p>
            <p className="text-2xl font-semibold text-chart-1">
              {metrics?.soldUnits || 0}
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Proyectos</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <IconPlus className="size-4" />
              Nuevo Proyecto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <ProjectForm
              onClose={() => setIsCreateOpen(false)}
              onSuccess={() => {
                setIsCreateOpen(false)
                toast.success("Proyecto creado")
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => setEditingProject(project)}
              onDelete={() => setDeleteProject(project)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <IconBuilding className="mx-auto size-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No hay proyectos</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsCreateOpen(true)}
            >
              Crear primer proyecto
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent className="sm:max-w-lg">
          {editingProject && (
            <ProjectForm
              project={editingProject}
              onClose={() => setEditingProject(null)}
              onSuccess={() => {
                setEditingProject(null)
                toast.success("Proyecto actualizado")
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Eliminar Proyecto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar "{deleteProject?.name}"? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProject(null)}>
              Cancelar
            </Button>
            <DeleteProjectButton
              projectId={deleteProject?.id || ""}
              onSuccess={() => {
                setDeleteProject(null)
                toast.success("Proyecto eliminado")
              }}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: ProjectWithStats
  onEdit: () => void
  onDelete: () => void
}) {
  const status = statusConfig[project.status] || statusConfig.active

  return (
    <Card className="group hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link
              href={`/proyectos/${project.id}`}
              className="hover:underline"
            >
              <CardTitle className="text-base truncate">{project.name}</CardTitle>
            </Link>
            {project.address && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <IconMapPin className="size-3" />
                <span className="truncate">{project.address}</span>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <IconEdit className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <IconEdit className="size-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <IconTrash className="size-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          {project.type && (
            <Badge variant="outline" className="capitalize">
              {project.type}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-md bg-muted/50">
            <p className="text-lg font-semibold">{project.units_count || 0}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="p-2 rounded-md bg-chart-2/10">
            <p className="text-lg font-semibold text-chart-2">
              {project.available_count || 0}
            </p>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </div>
          <div className="p-2 rounded-md bg-chart-1/10">
            <p className="text-lg font-semibold text-chart-1">
              {project.sold_count || 0}
            </p>
            <p className="text-xs text-muted-foreground">Vendidas</p>
          </div>
        </div>

        {(project.price_from || project.price_to) && (
          <div className="text-sm">
            <span className="text-muted-foreground">Desde </span>
            <span className="font-medium">
              ${project.price_from?.toLocaleString() || "N/A"}
            </span>
            {project.price_to && (
              <>
                <span className="text-muted-foreground"> hasta </span>
                <span className="font-medium">
                  ${project.price_to.toLocaleString()}
                </span>
              </>
            )}
          </div>
        )}

        <Link href={`/proyectos/${project.id}`}>
          <Button variant="outline" size="sm" className="w-full gap-2">
            <IconHome className="size-4" />
            Ver Unidades
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function ProjectForm({
  project,
  onClose,
  onSuccess,
}: {
  project?: ProjectWithStats
  onClose: () => void
  onSuccess: () => void
}) {
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    address: project?.address || "",
    city: project?.city || "",
    type: project?.type || "residencial",
    status: project?.status || "active",
    price_from: project?.price_from?.toString() || "",
    price_to: project?.price_to?.toString() || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      name: formData.name,
      description: formData.description || null,
      address: formData.address || null,
      city: formData.city || null,
      type: formData.type || null,
      status: formData.status,
      price_from: formData.price_from ? Number(formData.price_from) : null,
      price_to: formData.price_to ? Number(formData.price_to) : null,
    }

    try {
      if (project) {
        await updateProject.mutateAsync({ id: project.id, updates: data })
      } else {
        await createProject.mutateAsync(data)
      }
      onSuccess()
    } catch {
      toast.error("Error al guardar proyecto")
    }
  }

  const isLoading = createProject.isPending || updateProject.isPending

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>
          {project ? "Editar Proyecto" : "Nuevo Proyecto"}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Torre Central"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(val) => setFormData({ ...formData, type: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residencial">Residencial</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="mixto">Mixto</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="coming_soon">Próximamente</SelectItem>
                <SelectItem value="sold_out">Agotado</SelectItem>
                <SelectItem value="archived">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Ej: Av. Balboa, Punta Pacífica"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Ej: Panamá"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price_from">Precio Desde ($)</Label>
            <Input
              id="price_from"
              type="number"
              value={formData.price_from}
              onChange={(e) =>
                setFormData({ ...formData, price_from: e.target.value })
              }
              placeholder="150000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price_to">Precio Hasta ($)</Label>
            <Input
              id="price_to"
              type="number"
              value={formData.price_to}
              onChange={(e) =>
                setFormData({ ...formData, price_to: e.target.value })
              }
              placeholder="500000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Descripción del proyecto..."
            rows={3}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !formData.name}>
          {isLoading ? "Guardando..." : project ? "Actualizar" : "Crear"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function DeleteProjectButton({
  projectId,
  onSuccess,
}: {
  projectId: string
  onSuccess: () => void
}) {
  const deleteProject = useDeleteProject()

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(projectId)
      onSuccess()
    } catch {
      toast.error("Error al eliminar proyecto")
    }
  }

  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
      disabled={deleteProject.isPending}
    >
      {deleteProject.isPending ? "Eliminando..." : "Eliminar"}
    </Button>
  )
}
