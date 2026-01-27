"use client"

import { useState, useEffect } from "react"
import {
  IconTicket,
  IconUser,
  IconBuilding,
  IconHome,
  IconCurrencyDollar,
  IconSearch,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import { useCreateReservation, useAvailableUnits } from "@/hooks/use-inventory"
import { useProjects, useLeads } from "@/hooks/use-leads"
import type { Database } from "@/types/database"

type ReservationInsert = Database["public"]["Tables"]["reservations"]["Insert"]

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "-"
  return new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface CreateReservationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId?: string
  onSuccess?: (reservationId: string) => void
}

export function CreateReservationDialog({
  open,
  onOpenChange,
  leadId: initialLeadId,
  onSuccess,
}: CreateReservationDialogProps) {
  const [projectId, setProjectId] = useState<string>("")
  const [unitId, setUnitId] = useState<string>("")
  const [leadId, setLeadId] = useState<string>(initialLeadId || "")
  const [leadSearchOpen, setLeadSearchOpen] = useState(false)
  const [leadSearch, setLeadSearch] = useState("")

  const [separationAmount, setSeparationAmount] = useState("")
  const [initialPayment, setInitialPayment] = useState("")
  const [notaryCosts, setNotaryCosts] = useState("")

  const { data: projects } = useProjects()
  const { data: leads } = useLeads()
  const { data: availableUnits, isLoading: unitsLoading } = useAvailableUnits(projectId)
  const createReservation = useCreateReservation()

  // Reset unit when project changes
  useEffect(() => {
    setUnitId("")
  }, [projectId])

  // Filter leads by search
  const filteredLeads = leads?.filter((lead) => {
    if (!leadSearch) return true
    const searchLower = leadSearch.toLowerCase()
    return (
      lead.first_name?.toLowerCase().includes(searchLower) ||
      lead.last_name?.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.phone?.includes(leadSearch)
    )
  })

  const selectedLead = leads?.find((l) => l.id === leadId)
  const selectedUnit = availableUnits?.find((u) => u.id === unitId)
  const selectedProject = projects?.find((p) => p.id === projectId)

  const handleSubmit = async () => {
    if (!leadId) {
      toast.error("Selecciona un cliente")
      return
    }
    if (!projectId) {
      toast.error("Selecciona un proyecto")
      return
    }
    if (!unitId) {
      toast.error("Selecciona una unidad")
      return
    }

    const reservation: ReservationInsert = {
      lead_id: leadId,
      project_id: projectId,
      unit_id: unitId,
      unit_price: selectedUnit?.price || 0,
      separation_amount: separationAmount ? parseFloat(separationAmount) : null,
      initial_payment: initialPayment ? parseFloat(initialPayment) : null,
      notary_costs: notaryCosts ? parseFloat(notaryCosts) : null,
      status: "pending",
    }

    try {
      const result = await createReservation.mutateAsync(reservation)
      toast.success("Reservación creada exitosamente")
      onOpenChange(false)
      onSuccess?.(result.id)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear la reservación")
    }
  }

  const resetForm = () => {
    setProjectId("")
    setUnitId("")
    setLeadId(initialLeadId || "")
    setSeparationAmount("")
    setInitialPayment("")
    setNotaryCosts("")
    setLeadSearch("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconTicket className="size-5" />
            Nueva Reservación
          </DialogTitle>
          <DialogDescription>
            Crea una nueva reservación seleccionando el cliente, proyecto y unidad.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Lead Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <IconUser className="size-4" />
              Cliente
            </Label>
            <Popover open={leadSearchOpen} onOpenChange={setLeadSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={leadSearchOpen}
                  className="w-full justify-between"
                >
                  {selectedLead ? (
                    <span>
                      {selectedLead.first_name} {selectedLead.last_name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Seleccionar cliente...</span>
                  )}
                  <IconSearch className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={leadSearch}
                    onValueChange={setLeadSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                    <CommandGroup>
                      {filteredLeads?.slice(0, 10).map((lead) => (
                        <CommandItem
                          key={lead.id}
                          value={lead.id}
                          onSelect={() => {
                            setLeadId(lead.id)
                            setLeadSearchOpen(false)
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {lead.first_name} {lead.last_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {lead.phone || lead.email}
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

          {/* Project Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <IconBuilding className="size-4" />
              Proyecto
            </Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proyecto..." />
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

          {/* Unit Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <IconHome className="size-4" />
              Unidad
            </Label>
            <Select value={unitId} onValueChange={setUnitId} disabled={!projectId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !projectId
                      ? "Selecciona un proyecto primero"
                      : unitsLoading
                        ? "Cargando unidades..."
                        : "Seleccionar unidad..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableUnits?.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No hay unidades disponibles en este proyecto
                  </div>
                ) : (
                  availableUnits?.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          Unidad {unit.unit_number}
                          {unit.floor && ` - Piso ${unit.floor}`}
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {formatCurrency(unit.price)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Unit Info */}
          {selectedUnit && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Precio de la Unidad</span>
                <span className="text-lg font-bold">{formatCurrency(selectedUnit.price)}</span>
              </div>
              {selectedUnit.area_m2 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Área</span>
                  <span>{selectedUnit.area_m2} m²</span>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Financial Details */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <IconCurrencyDollar className="size-4" />
              Detalles Financieros
            </Label>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="separation" className="text-xs text-muted-foreground">
                  Separación
                </Label>
                <Input
                  id="separation"
                  type="number"
                  placeholder="0.00"
                  value={separationAmount}
                  onChange={(e) => setSeparationAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial" className="text-xs text-muted-foreground">
                  Abono Inicial
                </Label>
                <Input
                  id="initial"
                  type="number"
                  placeholder="0.00"
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notary" className="text-xs text-muted-foreground">
                  Costos Escritura
                </Label>
                <Input
                  id="notary"
                  type="number"
                  placeholder="0.00"
                  value={notaryCosts}
                  onChange={(e) => setNotaryCosts(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createReservation.isPending}>
            {createReservation.isPending ? "Creando..." : "Crear Reservación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
