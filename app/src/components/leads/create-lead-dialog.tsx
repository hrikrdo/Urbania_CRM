"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { IconLoader2 } from "@tabler/icons-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { useLeadsStore } from "@/stores/leads-store"
import { useCreateLead, useLeadStatuses, useProjects } from "@/hooks/use-leads"

const createLeadSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  status_id: z.string().min(1, "El estado es requerido"),
  project_id: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  temperature: z.enum(["cold", "warm", "hot"]),
})

type CreateLeadForm = z.infer<typeof createLeadSchema>

export function CreateLeadDialog() {
  const { isCreateModalOpen, closeCreateModal } = useLeadsStore()
  const { data: statuses } = useLeadStatuses()
  const { data: projects } = useProjects()
  const createLead = useCreateLead()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateLeadForm>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      temperature: "cold",
      status_id: "",
    },
  })

  const onSubmit = async (data: CreateLeadForm) => {
    try {
      await createLead.mutateAsync({
        first_name: data.first_name,
        last_name: data.last_name || null,
        email: data.email || null,
        phone: data.phone || null,
        status_id: data.status_id,
        project_id: data.project_id || null,
        source: data.source || null,
        notes: data.notes || null,
        temperature: data.temperature,
      })
      toast.success("Lead creado correctamente")
      reset()
      closeCreateModal()
    } catch {
      toast.error("Error al crear el lead")
    }
  }

  const handleClose = () => {
    reset()
    closeCreateModal()
  }

  // Set default status when statuses load
  const statusId = watch("status_id")
  if (statuses && statuses.length > 0 && !statusId) {
    setValue("status_id", statuses[0].id)
  }

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Lead</DialogTitle>
          <DialogDescription>
            Ingresa la información del nuevo lead.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre *</Label>
              <Input
                id="first_name"
                placeholder="Juan"
                {...register("first_name")}
              />
              {errors.first_name && (
                <p className="text-xs text-destructive">
                  {errors.first_name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input
                id="last_name"
                placeholder="Pérez"
                {...register("last_name")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              placeholder="+507 6000-0000"
              {...register("phone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="juan@ejemplo.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status_id">Estado *</Label>
              <Select
                value={watch("status_id")}
                onValueChange={(value) => setValue("status_id", value)}
              >
                <SelectTrigger id="status_id">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
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
              {errors.status_id && (
                <p className="text-xs text-destructive">
                  {errors.status_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperatura</Label>
              <Select
                value={watch("temperature")}
                onValueChange={(value: "cold" | "warm" | "hot") =>
                  setValue("temperature", value)
                }
              >
                <SelectTrigger id="temperature">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold">Frío</SelectItem>
                  <SelectItem value="warm">Tibio</SelectItem>
                  <SelectItem value="hot">Caliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_id">Proyecto</Label>
            <Select
              value={watch("project_id") || "__none__"}
              onValueChange={(value) => setValue("project_id", value === "__none__" ? undefined : value)}
            >
              <SelectTrigger id="project_id">
                <SelectValue placeholder="Sin proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin proyecto</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Fuente</Label>
            <Select
              value={watch("source") || "__none__"}
              onValueChange={(value) => setValue("source", value === "__none__" ? undefined : value)}
            >
              <SelectTrigger id="source">
                <SelectValue placeholder="Seleccionar fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin especificar</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
                <SelectItem value="website">Sitio Web</SelectItem>
                <SelectItem value="referral">Referido</SelectItem>
                <SelectItem value="walk-in">Walk-in</SelectItem>
                <SelectItem value="call">Llamada</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales..."
              rows={3}
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending && (
                <IconLoader2 className="size-4 mr-2 animate-spin" />
              )}
              Crear Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
