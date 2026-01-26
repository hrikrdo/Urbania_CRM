"use client"

import { useState } from "react"
import {
  IconPlus,
  IconCheck,
  IconClock,
  IconTrash,
  IconAlertTriangle,
  IconDotsVertical,
  IconCalendar,
  IconUser,
} from "@tabler/icons-react"
import { format, formatDistanceToNow, isPast, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

import {
  useTasksByLead,
  useCreateTask,
  useCompleteTask,
  useDeleteTask,
} from "@/hooks/use-tasks"
import { useUsers } from "@/hooks/use-leads"
import type { TaskWithRelations, TaskPriority } from "@/lib/services/tasks"

interface TasksListProps {
  leadId: string
  currentUserId?: string
}

const priorityConfig: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: "Baja", color: "text-muted-foreground", bgColor: "bg-muted" },
  medium: { label: "Media", color: "text-chart-4", bgColor: "bg-chart-4/10" },
  high: { label: "Alta", color: "text-chart-1", bgColor: "bg-chart-1/10" },
  urgent: { label: "Urgente", color: "text-destructive", bgColor: "bg-destructive/10" },
}

function TaskItem({
  task,
  onComplete,
  onDelete,
}: {
  task: TaskWithRelations
  onComplete: () => void
  onDelete: () => void
}) {
  const isCompleted = task.status === "completed"
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isCompleted
  const isDueToday = task.due_date && isToday(new Date(task.due_date))
  const priority = (task.priority || "medium") as TaskPriority
  const priorityStyle = priorityConfig[priority]

  return (
    <Card className={cn(
      "transition-all",
      isCompleted && "opacity-60",
      isOverdue && "border-destructive/50"
    )}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => !isCompleted && onComplete()}
            className="mt-1"
            disabled={isCompleted}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "text-sm font-medium",
                isCompleted && "line-through text-muted-foreground"
              )}>
                {task.title}
              </span>
              <Badge variant="secondary" className={cn("text-xs", priorityStyle.bgColor, priorityStyle.color)}>
                {priorityStyle.label}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <IconAlertTriangle className="size-3" />
                  Vencida
                </Badge>
              )}
              {isDueToday && !isOverdue && (
                <Badge variant="outline" className="text-xs text-chart-4 border-chart-4/50">
                  Hoy
                </Badge>
              )}
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {task.due_date && (
                <span className={cn("flex items-center gap-1", isOverdue && "text-destructive")}>
                  <IconCalendar className="size-3" />
                  {format(new Date(task.due_date), "dd MMM", { locale: es })}
                </span>
              )}
              {task.assigned_user && (
                <span className="flex items-center gap-1">
                  <IconUser className="size-3" />
                  {task.assigned_user.first_name}
                </span>
              )}
              {isCompleted && task.completed_at && (
                <span className="flex items-center gap-1">
                  <IconCheck className="size-3" />
                  Completada {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true, locale: es })}
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" className="shrink-0">
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isCompleted && (
                <DropdownMenuItem onClick={onComplete} className="gap-2 cursor-pointer">
                  <IconCheck className="size-4" />
                  Completar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
                <IconTrash className="size-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

export function TasksList({ leadId, currentUserId }: TasksListProps) {
  const { data: tasks, isLoading } = useTasksByLead(leadId)
  const { data: users } = useUsers()
  const createTask = useCreateTask()
  const completeTask = useCompleteTask()
  const deleteTask = useDeleteTask()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    due_date: undefined as Date | undefined,
    due_time: "09:00",
    assigned_to: currentUserId || "",
  })

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("El título es requerido")
      return
    }

    // Combine date and time if both are provided
    let dueDateTime: string | null = null
    if (newTask.due_date) {
      const [hours, minutes] = newTask.due_time.split(":").map(Number)
      const combinedDate = new Date(newTask.due_date)
      combinedDate.setHours(hours, minutes, 0, 0)
      dueDateTime = combinedDate.toISOString()
    }

    try {
      await createTask.mutateAsync({
        lead_id: leadId,
        title: newTask.title,
        description: newTask.description || null,
        priority: newTask.priority,
        due_date: dueDateTime,
        assigned_to: newTask.assigned_to || null,
        created_by: currentUserId || null,
        status: "pending",
      })
      toast.success("Tarea creada")
      setIsDialogOpen(false)
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        due_date: undefined,
        due_time: "09:00",
        assigned_to: currentUserId || "",
      })
    } catch {
      toast.error("Error al crear la tarea")
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask.mutateAsync(taskId)
      toast.success("Tarea completada")
    } catch {
      toast.error("Error al completar la tarea")
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId)
      toast.success("Tarea eliminada")
    } catch {
      toast.error("Error al eliminar la tarea")
    }
  }

  // Separate pending and completed tasks
  const pendingTasks = tasks?.filter((t) => t.status !== "completed") || []
  const completedTasks = tasks?.filter((t) => t.status === "completed") || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconClock className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          Tareas ({pendingTasks.length} pendientes)
        </h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <IconPlus className="size-4" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nueva Tarea</DialogTitle>
              <DialogDescription>
                Crea una tarea para este lead. Completa los campos requeridos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Ej: Llamar al cliente"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Detalles adicionales..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(val) => setNewTask({ ...newTask, priority: val as TaskPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Asignar a</Label>
                  <Select
                    value={newTask.assigned_to || "__none__"}
                    onValueChange={(val) => setNewTask({ ...newTask, assigned_to: val === "__none__" ? "" : val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin asignar</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fecha y hora límite</Label>
                <div className="flex gap-2">
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !newTask.due_date && "text-muted-foreground"
                        )}
                      >
                        <IconCalendar className="mr-2 size-4" />
                        {newTask.due_date ? (
                          format(newTask.due_date, "PPP", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newTask.due_date}
                        onSelect={(date) => {
                          setNewTask({ ...newTask, due_date: date })
                          setIsCalendarOpen(false)
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Select
                    value={newTask.due_time}
                    onValueChange={(val) => setNewTask({ ...newTask, due_time: val })}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue placeholder="Hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, "0")
                        return (
                          <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                            {hour}:00
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTask} disabled={createTask.isPending}>
                {createTask.isPending ? "Creando..." : "Crear Tarea"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 ? (
        <div className="space-y-2">
          {pendingTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={() => handleCompleteTask(task.id)}
              onDelete={() => handleDeleteTask(task.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <IconCheck className="size-8 mb-2 opacity-40" />
          <p className="text-sm">No hay tareas pendientes</p>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground">
            Completadas ({completedTasks.length})
          </h4>
          {completedTasks.slice(0, 5).map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={() => {}}
              onDelete={() => handleDeleteTask(task.id)}
            />
          ))}
          {completedTasks.length > 5 && (
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
              Ver {completedTasks.length - 5} más
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
