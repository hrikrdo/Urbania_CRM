"use client"

import { useState, useEffect } from "react"
import {
  IconCalendarEvent,
  IconPhone,
  IconVideo,
  IconUsers,
  IconRefresh,
  IconDots,
  IconLoader2,
  IconSearch,
} from "@tabler/icons-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"

import { useCreateAppointment, type AppointmentType } from "@/hooks/use-appointments"
import { useLeads, useProjects, useUsers } from "@/hooks/use-leads"

const typeOptions: { value: AppointmentType; label: string; icon: typeof IconCalendarEvent }[] = [
  { value: "visit", label: "Visita presencial", icon: IconCalendarEvent },
  { value: "call", label: "Llamada telefónica", icon: IconPhone },
  { value: "video_call", label: "Video llamada", icon: IconVideo },
  { value: "meeting", label: "Reunión", icon: IconUsers },
  { value: "follow_up", label: "Seguimiento", icon: IconRefresh },
  { value: "other", label: "Otro", icon: IconDots },
]

const durationOptions = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1.5 horas" },
  { value: 120, label: "2 horas" },
]

interface CreateAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId?: string
  onSuccess?: (id: string) => void
}

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  leadId,
  onSuccess,
}: CreateAppointmentDialogProps) {
  const [selectedLeadId, setSelectedLeadId] = useState(leadId || "")
  const [leadSearchOpen, setLeadSearchOpen] = useState(false)
  const [type, setType] = useState<AppointmentType>("visit")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined)
  const [scheduledTime, setScheduledTime] = useState("")
  const [duration, setDuration] = useState(30)
  const [projectId, setProjectId] = useState("")
  const [assignedTo, setAssignedTo] = useState("")

  const { data: leads } = useLeads()
  const { data: projects } = useProjects()
  const { data: users } = useUsers()
  const createAppointment = useCreateAppointment()

  // Set default date/time
  useEffect(() => {
    if (open) {
      const now = new Date()
      now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15)
      setScheduledDate(now)
      setScheduledTime(format(now, "HH:mm"))
    }
  }, [open])

  // Update selected lead if prop changes
  useEffect(() => {
    if (leadId) {
      setSelectedLeadId(leadId)
    }
  }, [leadId])

  const selectedLead = leads?.find((l) => l.id === selectedLeadId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedLeadId || !scheduledDate || !scheduledTime) return

    const [hours, minutes] = scheduledTime.split(":").map(Number)
    const scheduledAt = new Date(scheduledDate)
    scheduledAt.setHours(hours, minutes, 0, 0)

    try {
      const result = await createAppointment.mutateAsync({
        lead_id: selectedLeadId,
        type,
        title: title || undefined,
        description: description || undefined,
        location: location || undefined,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: duration,
        project_id: projectId || undefined,
        assigned_to: assignedTo || undefined,
      })

      // Reset form
      setSelectedLeadId(leadId || "")
      setType("visit")
      setTitle("")
      setDescription("")
      setLocation("")
      setProjectId("")
      setAssignedTo("")

      onOpenChange(false)
      onSuccess?.(result.id)
    } catch (error) {
      console.error("Error creating appointment:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Cita</DialogTitle>
          <DialogDescription>
            Programa una cita con un cliente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lead Selection */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Popover open={leadSearchOpen} onOpenChange={setLeadSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={leadSearchOpen}
                  className="w-full justify-between"
                  disabled={!!leadId}
                >
                  {selectedLead ? (
                    <span>
                      {selectedLead.first_name} {selectedLead.last_name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Seleccionar cliente...
                    </span>
                  )}
                  <IconSearch className="size-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                    <CommandGroup>
                      {leads?.map((lead) => (
                        <CommandItem
                          key={lead.id}
                          value={`${lead.first_name} ${lead.last_name}`}
                          onSelect={() => {
                            setSelectedLeadId(lead.id)
                            setLeadSearchOpen(false)
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {lead.first_name} {lead.last_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {lead.email || lead.phone}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Tipo de cita *</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as AppointmentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <opt.icon className="size-4" />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <DatePicker
                value={scheduledDate}
                onChange={setScheduledDate}
                placeholder="Seleccionar fecha"
              />
            </div>
            <div className="space-y-2">
              <Label>Hora *</Label>
              <Select value={scheduledTime} onValueChange={setScheduledTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar hora" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Array.from({ length: 24 * 4 }).map((_, i) => {
                    const hour = Math.floor(i / 4)
                    const minute = (i % 4) * 15
                    const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
                    return (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duración</Label>
            <Select
              value={String(duration)}
              onValueChange={(v) => setDuration(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title (optional) */}
          <div className="space-y-2">
            <Label>Título (opcional)</Label>
            <Input
              placeholder="Ej: Visita a proyecto Marina Bay"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Location */}
          {(type === "visit" || type === "meeting") && (
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input
                placeholder="Dirección o lugar de la cita"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}

          {/* Project */}
          <div className="space-y-2">
            <Label>Proyecto (opcional)</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label>Asignar a (opcional)</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar usuario" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              placeholder="Notas adicionales sobre la cita..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                !selectedLeadId ||
                !scheduledDate ||
                !scheduledTime ||
                createAppointment.isPending
              }
            >
              {createAppointment.isPending && (
                <IconLoader2 className="size-4 mr-2 animate-spin" />
              )}
              Crear Cita
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
