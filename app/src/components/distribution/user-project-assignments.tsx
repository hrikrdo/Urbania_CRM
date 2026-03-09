"use client"

import { useState } from "react"
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconLoader2,
  IconUsers,
  IconBuildingSkyscraper,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Progress } from "@/components/ui/progress"

import {
  useUserProjects,
  useUsersByProject,
  useAssignUserToProject,
  useUpdateUserProject,
  useRemoveUserFromProject,
  type UserProjectWithRelations,
} from "@/hooks/use-lead-distribution"
import { useUsers, useProjects } from "@/hooks/use-leads"

interface UserProjectAssignmentsProps {
  projectId?: string // If provided, show assignments for specific project
  userId?: string // If provided, show projects for specific user
}

export function UserProjectAssignments({
  projectId,
  userId,
}: UserProjectAssignmentsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<UserProjectWithRelations | null>(null)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [maxLeadsPerDay, setMaxLeadsPerDay] = useState(20)

  const { data: assignments, isLoading } = projectId
    ? useUsersByProject(projectId)
    : useUserProjects(userId)

  const { data: allUsers } = useUsers()
  const { data: allProjects } = useProjects()

  const assignUser = useAssignUserToProject()
  const updateAssignment = useUpdateUserProject()
  const removeUser = useRemoveUserFromProject()

  const handleAdd = async () => {
    if (!selectedUserId || !selectedProjectId) {
      toast.error("Selecciona usuario y proyecto")
      return
    }

    try {
      await assignUser.mutateAsync({
        user_id: selectedUserId,
        project_id: selectedProjectId,
        max_leads_per_day: maxLeadsPerDay,
        is_active: true,
      })
      toast.success("Vendedor asignado al proyecto")
      setShowAddDialog(false)
      resetForm()
    } catch (error) {
      toast.error("Error al asignar vendedor")
    }
  }

  const handleUpdate = async () => {
    if (!editingAssignment) return

    try {
      await updateAssignment.mutateAsync({
        id: editingAssignment.id,
        updates: { max_leads_per_day: maxLeadsPerDay },
      })
      toast.success("Configuración actualizada")
      setEditingAssignment(null)
      resetForm()
    } catch (error) {
      toast.error("Error al actualizar")
    }
  }

  const handleRemove = async (assignment: UserProjectWithRelations) => {
    try {
      await removeUser.mutateAsync({
        userId: assignment.user_id,
        projectId: assignment.project_id,
      })
      toast.success("Vendedor removido del proyecto")
    } catch (error) {
      toast.error("Error al remover vendedor")
    }
  }

  const resetForm = () => {
    setSelectedUserId("")
    setSelectedProjectId("")
    setMaxLeadsPerDay(20)
  }

  const openEditDialog = (assignment: UserProjectWithRelations) => {
    setEditingAssignment(assignment)
    setMaxLeadsPerDay(assignment.max_leads_per_day)
  }

  // Filter out users already assigned to this project
  const availableUsers = projectId
    ? allUsers?.filter(
        (u) => !assignments?.some((a) => a.user_id === u.id)
      )
    : allUsers

  // Filter out projects user is already assigned to
  const availableProjects = userId
    ? allProjects?.filter(
        (p) => !assignments?.some((a) => a.project_id === p.id)
      )
    : allProjects

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {projectId ? (
                <>
                  <IconUsers className="size-5" />
                  Vendedores Asignados
                </>
              ) : (
                <>
                  <IconBuildingSkyscraper className="size-5" />
                  Proyectos Asignados
                </>
              )}
            </CardTitle>
            <CardDescription>
              {projectId
                ? "Vendedores que pueden recibir leads de este proyecto"
                : "Proyectos en los que este vendedor puede recibir leads"}
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <IconPlus className="size-4 mr-2" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {assignments && assignments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{projectId ? "Vendedor" : "Proyecto"}</TableHead>
                <TableHead>Leads Hoy</TableHead>
                <TableHead>Límite Diario</TableHead>
                <TableHead>Disponible</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => {
                const available = assignment.max_leads_per_day - assignment.leads_assigned_today
                const progress = (assignment.leads_assigned_today / assignment.max_leads_per_day) * 100

                return (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="font-medium">
                        {projectId
                          ? `${assignment.user?.first_name || ""} ${assignment.user?.last_name || ""}`
                          : assignment.project?.name}
                      </div>
                      {projectId && assignment.user?.email && (
                        <div className="text-xs text-muted-foreground">
                          {assignment.user.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {assignment.leads_assigned_today}
                      </Badge>
                    </TableCell>
                    <TableCell>{assignment.max_leads_per_day}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="w-16 h-2" />
                        <span
                          className={
                            available <= 0
                              ? "text-destructive text-sm"
                              : available <= 5
                                ? "text-chart-4 text-sm"
                                : "text-sm"
                          }
                        >
                          {available}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(assignment)}
                        >
                          <IconEdit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(assignment)}
                        >
                          <IconTrash className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <IconUsers className="size-10 mx-auto mb-2 opacity-40" />
            <p>No hay asignaciones</p>
            <p className="text-sm">
              {projectId
                ? "Agrega vendedores para que puedan recibir leads de este proyecto"
                : "Asigna proyectos a este vendedor"}
            </p>
          </div>
        )}
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Asignación</DialogTitle>
            <DialogDescription>
              {projectId
                ? "Selecciona un vendedor para asignar a este proyecto"
                : "Selecciona un proyecto para asignar a este vendedor"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!projectId && (
              <div className="space-y-2">
                <Label>Proyecto</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!userId && (
              <div className="space-y-2">
                <Label>Vendedor</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Máximo de leads por día</Label>
              <Input
                type="number"
                value={maxLeadsPerDay}
                onChange={(e) => setMaxLeadsPerDay(Number(e.target.value))}
                min={1}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                Límite de leads que puede recibir este vendedor por día
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAdd}
              disabled={assignUser.isPending || (!projectId && !selectedProjectId) || (!userId && !selectedUserId)}
            >
              {assignUser.isPending && <IconLoader2 className="size-4 mr-2 animate-spin" />}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Configuración</DialogTitle>
            <DialogDescription>
              Ajusta el límite diario de leads
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Máximo de leads por día</Label>
              <Input
                type="number"
                value={maxLeadsPerDay}
                onChange={(e) => setMaxLeadsPerDay(Number(e.target.value))}
                min={1}
                max={100}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAssignment(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateAssignment.isPending}>
              {updateAssignment.isPending && (
                <IconLoader2 className="size-4 mr-2 animate-spin" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
