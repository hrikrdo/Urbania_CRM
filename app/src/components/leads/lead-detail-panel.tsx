"use client"

import { useState, useEffect } from "react"
import {
  IconCalendar,
  IconCheck,
  IconFlame,
  IconMail,
  IconPhone,
  IconSnowflake,
  IconTemperature,
  IconBrandWhatsapp,
  IconCalendarEvent,
  IconNotes,
  IconHistory,
  IconUser,
  IconMapPin,
  IconCurrencyDollar,
  IconAd2,
  IconSparkles,
  IconChevronDown,
  IconFolder,
  IconRefresh,
  IconLoader2,
  IconId,
} from "@tabler/icons-react"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import { useLeadsStore, type LeadDetailTab } from "@/stores/leads-store"
import {
  useUpdateLead,
  useAssignLead,
  useLeadStatuses,
  useUsers,
  useProjects,
  useLead,
} from "@/hooks/use-leads"
import { TasksList } from "@/components/tasks"
import { LeadCreditCheckSection } from "@/components/tramites"
import { LeadReservationsSection } from "@/components/reservations/lead-reservations-section"
import { LeadAppointmentsSection } from "@/components/agenda/lead-appointments-section"
import { LeadAssignmentHistory } from "@/components/distribution"
import { WhatsAppChatModal } from "@/components/leads/whatsapp-chat-modal"

const temperatureConfig = {
  hot: { icon: IconFlame, color: "text-chart-1", label: "Caliente" },
  warm: { icon: IconTemperature, color: "text-chart-5", label: "Tibio" },
  cold: { icon: IconSnowflake, color: "text-chart-2", label: "Frío" },
}

export function LeadDetailPanel() {
  const {
    selectedLead,
    isDetailOpen,
    closeDetail,
    defaultTab,
    pendingLeadId,
    setSelectedLead,
    setPendingLeadId,
  } = useLeadsStore()

  const { data: statuses } = useLeadStatuses()
  const { data: users } = useUsers()
  const { data: projects } = useProjects()
  const updateLead = useUpdateLead()
  const assignLead = useAssignLead()

  // Load lead by ID if pendingLeadId is set
  const { data: loadedLead, isLoading: isLoadingLead } = useLead(pendingLeadId || "")

  const [newNote, setNewNote] = useState("")
  const [activities, setActivities] = useState<{id:string,type:string,title:string,description:string,created_at:string}[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [activeTab, setActiveTab] = useState<LeadDetailTab>(defaultTab)
  const [showWhatsAppChat, setShowWhatsAppChat] = useState(false)

  // Cargar actividades reales de la DB (antes de cualquier early return)
  useEffect(() => {
    if (!selectedLead?.id) return
    setLoadingActivities(true)
    fetch(`/api/leads/activities?lead_id=${selectedLead.id}`)
      .then(r => r.json())
      .then(d => setActivities(d.activities || []))
      .catch(() => setActivities([]))
      .finally(() => setLoadingActivities(false))
  }, [selectedLead?.id])

  // Update active tab when defaultTab changes (from store)
  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  // When lead is loaded by ID, set it as selectedLead
  useEffect(() => {
    if (loadedLead && pendingLeadId) {
      setSelectedLead(loadedLead)
      setPendingLeadId(null)
    }
  }, [loadedLead, pendingLeadId, setSelectedLead, setPendingLeadId])

  // Show loading state when loading lead by ID
  if (isDetailOpen && pendingLeadId && isLoadingLead) {
    return (
      <Sheet open={isDetailOpen} onOpenChange={(open) => !open && closeDetail()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[1200px] p-0 flex flex-col gap-0 overflow-x-hidden"
        >
          <div className="flex items-center justify-center h-full">
            <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (!selectedLead) return null

  const fullName = [selectedLead.first_name, selectedLead.last_name]
    .filter(Boolean)
    .join(" ")
  const initials = [selectedLead.first_name?.[0], selectedLead.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase()

  const handleStatusChange = async (statusId: string) => {
    try {
      await updateLead.mutateAsync({
        id: selectedLead.id,
        updates: { status_id: statusId },
      })
      toast.success("Estado actualizado")
    } catch {
      toast.error("Error al actualizar estado")
    }
  }

  const handleAssign = async (userId: string) => {
    try {
      await assignLead.mutateAsync({
        leadId: selectedLead.id,
        userId: userId || null,
      })
      toast.success(userId ? "Lead asignado correctamente" : "Lead desasignado")
    } catch {
      toast.error("Error al asignar")
    }
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return

    const currentNotes = selectedLead.notes || ""
    const timestamp = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })
    const updatedNotes = `[${timestamp}] ${newNote}\n\n${currentNotes}`

    updateLead.mutate({
      id: selectedLead.id,
      updates: { notes: updatedNotes },
    })

    setNewNote("")
    toast.success("Nota agregada")
  }

  const handleTemperatureChange = async (temperature: "hot" | "warm" | "cold") => {
    try {
      await updateLead.mutateAsync({
        id: selectedLead.id,
        updates: { temperature },
      })
      toast.success("Temperatura actualizada")
    } catch {
      toast.error("Error al actualizar temperatura")
    }
  }

  // Calculate AI score based on lead engagement and response
  const calculateAIScore = () => {
    let score = 20 // Base score

    // Cédula verificada = señal más fuerte de interés real
    if (selectedLead.cedula) score += 50

    // Temperature contributes significantly
    if (selectedLead.temperature === "hot") score += 25
    else if (selectedLead.temperature === "warm") score += 15
    else if (selectedLead.temperature === "cold") score += 5

    // Client response is the strongest indicator of interest
    if (selectedLead.last_response_at) {
      const daysSinceResponse = Math.floor(
        (Date.now() - new Date(selectedLead.last_response_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceResponse < 1) score += 30 // Responded today
      else if (daysSinceResponse < 3) score += 25
      else if (daysSinceResponse < 7) score += 15
      else score += 5 // Responded but long ago
    }

    // Contact attempts - moderate effect
    const totalAttempts = (selectedLead.call_attempts || 0) + (selectedLead.chat_attempts || 0)
    if (totalAttempts > 0 && totalAttempts <= 3) score += 10
    else if (totalAttempts > 3 && totalAttempts <= 6) score += 5
    // Many attempts without response = lower score (already handled by lack of response)

    // Recent contact activity
    if (selectedLead.last_contact_at) {
      const daysSinceContact = Math.floor(
        (Date.now() - new Date(selectedLead.last_contact_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceContact < 1) score += 10
      else if (daysSinceContact < 3) score += 5
    }

    return Math.min(score, 100)
  }

  // Generate AI summary based on lead data
  const generateAISummary = () => {
    // Usar el resumen generado por IA si está guardado en notes
    if (selectedLead.notes && selectedLead.notes.length > 30 && !selectedLead.notes.startsWith("Ingreso familiar") && !selectedLead.notes.startsWith("Chat Chatwoot")) {
      return selectedLead.notes
    }

    // Fallback basado en datos disponibles
    const hasCedula = !!selectedLead.cedula
    const hasEmail = !!selectedLead.email
    const temp = selectedLead.temperature

    if (hasCedula) {
      return `Lead con alto interés confirmado — cédula verificada. ${selectedLead.project?.name ? `Interesado en ${selectedLead.project.name}.` : ""} ${selectedLead.budget_min ? `Ingreso declarado: $${selectedLead.budget_min}/mes.` : ""} Iniciar proceso de precalificación bancaria.`
    }
    if (hasEmail && temp === "warm") {
      return `Lead interesado que compartió correo electrónico. ${selectedLead.project?.name ? `Proyecto de interés: ${selectedLead.project.name}.` : ""} Continuar seguimiento para obtener cédula e iniciar proceso.`
    }
    if (temp === "hot") {
      return "Lead con alto nivel de engagement activo. Recomendamos contacto inmediato para agendar visita al proyecto."
    }
    if (temp === "warm") {
      return "Lead con interés moderado. Continuar seguimiento con información del proyecto y requisitos de aplicación."
    }
    return "Lead reciente ingresado por WhatsApp. Iniciar secuencia de seguimiento según protocolo."
  }

  const aiScore = calculateAIScore()
  const scoreColor = aiScore >= 70 ? "text-chart-2" : aiScore >= 40 ? "text-chart-4" : "text-chart-1"
  const scoreBgColor = aiScore >= 70 ? "bg-chart-2" : aiScore >= 40 ? "bg-chart-4" : "bg-chart-1"
  const scoreLabel = aiScore >= 70 ? "Alto interés" : aiScore >= 40 ? "Interés moderado" : "Bajo interés"

  return (
    <>
    <Sheet open={isDetailOpen} onOpenChange={(open) => !open && closeDetail()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[1200px] p-0 flex flex-col gap-0 overflow-x-hidden"
      >
        {/* Header */}
        <header className="shrink-0 px-6 py-4 border-b flex items-center justify-between pr-16">
          <div className="flex items-center gap-4">
            <Avatar className="size-12 border-2 border-background shadow-sm">
              <AvatarFallback className="text-base font-semibold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex gap-1 items-center -ml-1">
                <input
                  className="h-8 text-xl font-semibold bg-transparent border border-transparent hover:border-input focus:border-input focus:outline-none rounded px-1 w-28"
                  defaultValue={selectedLead.first_name || ""}
                  placeholder="Nombre"
                  onBlur={(e) => {
                    if (e.target.value !== selectedLead.first_name) {
                      updateLead.mutate({ id: selectedLead.id, updates: { first_name: e.target.value } })
                      toast.success("Nombre actualizado")
                    }
                  }}
                />
                <input
                  className="h-8 text-xl font-semibold bg-transparent border border-transparent hover:border-input focus:border-input focus:outline-none rounded px-1 w-32"
                  defaultValue={selectedLead.last_name || ""}
                  placeholder="Apellido"
                  onBlur={(e) => {
                    if (e.target.value !== selectedLead.last_name) {
                      updateLead.mutate({ id: selectedLead.id, updates: { last_name: e.target.value || null } })
                      toast.success("Apellido actualizado")
                    }
                  }}
                />
              </div>
              <div className="flex items-center gap-2 mt-1">
                {selectedLead.project && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedLead.project.name}
                  </Badge>
                )}
                {selectedLead.email && (
                  <span className="text-sm text-muted-foreground">{selectedLead.email}</span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <IconCalendar className="size-3" />
                <span>Creado {format(new Date(selectedLead.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Temperature Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {(() => {
                    const temp = selectedLead.temperature as keyof typeof temperatureConfig
                    const config = temperatureConfig[temp] || temperatureConfig.warm
                    const TempIcon = config.icon
                    return (
                      <>
                        <TempIcon className={cn("size-4", config.color)} />
                        {config.label}
                      </>
                    )
                  })()}
                  <IconChevronDown className="size-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {(Object.entries(temperatureConfig) as [keyof typeof temperatureConfig, typeof temperatureConfig.hot][]).map(
                  ([key, config]) => {
                    const TempIcon = config.icon
                    return (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => handleTemperatureChange(key)}
                        className="gap-2 cursor-pointer"
                      >
                        <TempIcon className={cn("size-4", config.color)} />
                        {config.label}
                        {selectedLead.temperature === key && (
                          <IconCheck className="size-4 ml-auto text-primary" />
                        )}
                      </DropdownMenuItem>
                    )
                  }
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: selectedLead.status?.color }}
                  />
                  {selectedLead.status?.name || "Sin estado"}
                  <IconChevronDown className="size-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {statuses?.map((status) => (
                  <DropdownMenuItem
                    key={status.id}
                    onClick={() => handleStatusChange(status.id)}
                    className="gap-2 cursor-pointer"
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.name}
                    {status.id === selectedLead.status_id && (
                      <IconCheck className="size-4 ml-auto text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content - 2 Columns */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Sidebar */}
          <aside className="w-[320px] border-r flex flex-col shrink-0 min-h-0">
            <ScrollArea className="flex-1 min-h-0 overflow-x-hidden">
              <div className="p-4 space-y-6">
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" asChild title="Llamar">
                    <a href={`tel:${selectedLead.phone}`}>
                      <IconPhone className="size-4" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    title="WhatsApp"
                    onClick={() => setShowWhatsAppChat(true)}
                    className="text-green-600 hover:text-green-700 hover:border-green-600"
                  >
                    <IconBrandWhatsapp className="size-4" />
                  </Button>
                  <Button variant="outline" size="icon" asChild title="Email">
                    <a href={`mailto:${selectedLead.email}`}>
                      <IconMail className="size-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" title="Agendar cita">
                    <IconCalendarEvent className="size-4" />
                  </Button>
                </div>

                {/* Datos del Cliente */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <IconUser className="size-4 text-muted-foreground" />
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Datos del Cliente
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <IconMail className="size-4 text-muted-foreground mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <Input
                          className="h-7 text-sm px-1 border-transparent hover:border-input focus:border-input"
                          defaultValue={selectedLead.email || ""}
                          placeholder="correo@ejemplo.com"
                          type="email"
                          onBlur={(e) => {
                            const v = e.target.value || null
                            if (v !== selectedLead.email) {
                              updateLead.mutate({ id: selectedLead.id, updates: { email: v } })
                              toast.success("Email actualizado")
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <IconPhone className="size-4 text-muted-foreground mt-1 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Teléfono</p>
                        <Input
                          className="h-7 text-sm px-1 border-transparent hover:border-input focus:border-input"
                          defaultValue={selectedLead.phone || ""}
                          placeholder="+507 0000-0000"
                          onBlur={(e) => {
                            const v = e.target.value || null
                            if (v !== selectedLead.phone) {
                              updateLead.mutate({ id: selectedLead.id, updates: { phone: v } })
                              toast.success("Teléfono actualizado")
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <IconId className="size-4 text-muted-foreground mt-1 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Cédula</p>
                        <Input
                          placeholder="Ingresa la cédula"
                          defaultValue={selectedLead.cedula || ""}
                          className="h-8 text-sm"
                          onBlur={(e) => {
                            const value = e.target.value || null
                            if (value !== selectedLead.cedula) {
                              updateLead.mutate({
                                id: selectedLead.id,
                                updates: { cedula: value },
                              })
                              toast.success("Cédula actualizada")
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <IconMapPin className="size-4 text-muted-foreground mt-1 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Dirección</p>
                        <Input
                          className="h-7 text-sm px-1 border-transparent hover:border-input focus:border-input"
                          defaultValue={(selectedLead as unknown as Record<string,string>).address || ""}
                          placeholder="Dirección del cliente"
                          onBlur={(e) => {
                            if (e.target.value) {
                              updateLead.mutate({ id: selectedLead.id, updates: { notes: (selectedLead.notes || "") + " | Dir: " + e.target.value } })
                              toast.success("Dirección guardada")
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Datos Comerciales */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <IconCurrencyDollar className="size-4 text-muted-foreground" />
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Datos Comerciales
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Presupuesto</Label>
                      <Input
                        type="number"
                        placeholder="Ingreso mensual ($)"
                        defaultValue={selectedLead.budget_min || ""}
                        onBlur={(e) => {
                          const value = e.target.value ? Number(e.target.value) : null
                          updateLead.mutate({
                            id: selectedLead.id,
                            updates: { budget_min: value },
                          })
                          toast.success("Presupuesto actualizado")
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Proyecto de Interés</Label>
                      <Select
                        value={selectedLead.project_id || "__none__"}
                        onValueChange={(val) => {
                          updateLead.mutate({
                            id: selectedLead.id,
                            updates: { project_id: val === "__none__" ? null : val },
                          })
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar proyecto" />
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
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Vendedor Asignado</Label>
                      <Select
                        value={selectedLead.assigned_to || "__unassigned__"}
                        onValueChange={(val) => handleAssign(val === "__unassigned__" ? "" : val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__unassigned__">Sin Asignar</SelectItem>
                          {users?.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.first_name} {user.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Datos de Marketing */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <IconAd2 className="size-4 text-muted-foreground" />
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Datos de Marketing
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Fuente</Label>
                      <Input
                        placeholder="Ej: Facebook, Google, Referido"
                        defaultValue={selectedLead.source || ""}
                        onBlur={(e) => {
                          updateLead.mutate({
                            id: selectedLead.id,
                            updates: { source: e.target.value || null },
                          })
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Campaña</Label>
                      <Input
                        placeholder="Nombre de la campaña"
                        defaultValue={selectedLead.utm_campaign || ""}
                        onBlur={(e) => {
                          updateLead.mutate({
                            id: selectedLead.id,
                            updates: { utm_campaign: e.target.value || null },
                          })
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Nombre del Anuncio</Label>
                      <Input
                        placeholder="Ej: Promo Enero 2025"
                        defaultValue={selectedLead.utm_content || ""}
                        onBlur={(e) => {
                          updateLead.mutate({
                            id: selectedLead.id,
                            updates: { utm_content: e.target.value || null },
                          })
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Collapse button */}
            <div className="p-4 border-t">
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                Colapsar panel
              </Button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-h-0 overflow-x-hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeadDetailTab)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="shrink-0 pt-4 pb-2 px-6 border-b">
                <TabsList className="w-full justify-start rounded-none bg-transparent h-auto gap-1 overflow-x-auto">
                  <TabsTrigger value="activity" className="text-sm data-[state=active]:bg-muted px-4 py-2 rounded-md shrink-0">
                    Actividad
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-sm data-[state=active]:bg-muted px-4 py-2 rounded-md shrink-0">
                    Notas
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="text-sm data-[state=active]:bg-muted px-4 py-2 rounded-md shrink-0">
                    Tareas
                  </TabsTrigger>
                  <TabsTrigger value="files" className="text-sm data-[state=active]:bg-muted px-4 py-2 rounded-md shrink-0">
                    Archivos
                  </TabsTrigger>
                  <TabsTrigger value="appointments" className="text-sm data-[state=active]:bg-muted px-4 py-2 rounded-md shrink-0">
                    Citas
                  </TabsTrigger>
                  <TabsTrigger value="process" className="text-sm data-[state=active]:bg-muted px-4 py-2 rounded-md shrink-0">
                    Trámite
                  </TabsTrigger>
                  <TabsTrigger value="reservation" className="text-sm data-[state=active]:bg-muted px-4 py-2 rounded-md shrink-0">
                    Reserva
                  </TabsTrigger>
                  <TabsTrigger value="returns" className="text-sm data-[state=active]:bg-muted px-4 py-2 rounded-md shrink-0">
                    Devoluciones
                  </TabsTrigger>
                  <TabsTrigger value="assignments" className="text-sm data-[state=active]:bg-muted px-4 py-2 rounded-md shrink-0">
                    Asignaciones
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 min-h-0 overflow-x-hidden">
                {/* Activity Tab */}
                <TabsContent value="activity" className="m-0 p-4 space-y-6 overflow-hidden">
                  {/* AI Summary Card */}
                  <Card className="border-chart-1/20 bg-gradient-to-r from-chart-1/5 to-transparent overflow-hidden">
                    <CardContent className="p-4 space-y-4 max-w-full break-words">
                      {/* Header with score */}
                      <div className="flex items-start gap-4">
                        <div className="size-12 rounded-xl bg-chart-1/10 flex items-center justify-center shrink-0">
                          <IconSparkles className="size-6 text-chart-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">Resumen Inteligente</h3>
                            <Badge variant="secondary" className="text-xs">IA</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {generateAISummary()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-2">
                            <div className={cn("size-3 rounded-full", scoreBgColor)} />
                            <span className="text-lg font-semibold">{aiScore}</span>
                          </div>
                          <span className={cn("text-xs font-medium", scoreColor)}>{scoreLabel}</span>
                        </div>
                      </div>

                      {/* Contact Metrics */}
                      <div className="grid grid-cols-4 gap-3 pt-3 border-t">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <IconPhone className="size-4" />
                          </div>
                          <p className="text-xl font-semibold">{selectedLead.call_attempts || 0}</p>
                          <p className="text-xs text-muted-foreground">Llamadas</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <IconBrandWhatsapp className="size-4" />
                          </div>
                          <p className="text-xl font-semibold">{selectedLead.chat_attempts || 0}</p>
                          <p className="text-xs text-muted-foreground">Mensajes</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <IconHistory className="size-4" />
                          </div>
                          <p className="text-sm font-semibold">
                            {selectedLead.last_contact_at
                              ? formatDistanceToNow(new Date(selectedLead.last_contact_at), {
                                  addSuffix: false,
                                  locale: es,
                                })
                              : "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">Últ. contacto</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <IconCheck className="size-4" />
                          </div>
                          <p className="text-sm font-semibold">
                            {selectedLead.last_response_at
                              ? formatDistanceToNow(new Date(selectedLead.last_response_at), {
                                  addSuffix: false,
                                  locale: es,
                                })
                              : "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">Últ. respuesta</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity Timeline */}
                  <div>
                    <h4 className="text-sm font-medium mb-4">Actividad Reciente</h4>
                    <div className="space-y-4">
                      {/* Example activity items - these will be dynamic later */}
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="size-8 rounded-full bg-chart-2/10 flex items-center justify-center">
                            <IconBrandWhatsapp className="size-4 text-chart-2" />
                          </div>
                          <div className="w-px flex-1 bg-border mt-2" />
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Mensaje de WhatsApp</span>
                            <span className="text-xs text-muted-foreground">Hace 2 horas</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Cliente: "Hola, me interesa el departamento de 2 habitaciones. ¿Tienen disponibilidad para una visita esta semana?"
                          </p>
                          <Badge variant="outline" className="mt-2 text-xs">Respuesta del cliente</Badge>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="size-8 rounded-full bg-chart-1/10 flex items-center justify-center">
                            <IconPhone className="size-4 text-chart-1" />
                          </div>
                          <div className="w-px flex-1 bg-border mt-2" />
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Llamada realizada</span>
                            <span className="text-xs text-muted-foreground">Hace 1 día</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Duración: 3:45 min. Se explicaron las opciones de financiamiento y se acordó enviar información por correo.
                          </p>
                          <Badge variant="secondary" className="mt-2 text-xs">Llamada contestada</Badge>
                        </div>
                      </div>

                    </div>
                    {/* Actividades reales de la DB */}
                    {loadingActivities && <p className="text-sm text-muted-foreground px-1">Cargando actividades...</p>}
                    {!loadingActivities && activities.length === 0 && (
                      <p className="text-sm text-muted-foreground px-1">No hay actividades registradas aún.</p>
                    )}
                    {!loadingActivities && activities.map((act, idx) => {
                      const isWA = act.type === "whatsapp_received" || act.type === "whatsapp_sent"
                      const isSystem = act.type === "system_notification" || act.type === "status_changed"
                      const Icon = isWA ? IconBrandWhatsapp : isSystem ? IconHistory : IconUser
                      const iconBg = isWA ? "bg-green-100" : isSystem ? "bg-blue-100" : "bg-muted"
                      const iconColor = isWA ? "text-green-600" : isSystem ? "text-blue-600" : "text-muted-foreground"
                      const isLast = idx === activities.length - 1
                      const timeAgo = (() => {
                        const diff = Date.now() - new Date(act.created_at).getTime()
                        const h = Math.floor(diff/3600000)
                        const d = Math.floor(diff/86400000)
                        if (h < 1) return "Hace un momento"
                        if (h < 24) return `Hace ${h}h`
                        return `Hace ${d} día${d>1?"s":""}`
                      })()
                      return (
                        <div key={act.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`size-8 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
                              <Icon className={`size-4 ${iconColor}`} />
                            </div>
                            {!isLast && <div className="w-px flex-1 bg-border mt-2" />}
                          </div>
                          <div className={`flex-1 ${!isLast ? "pb-4" : ""}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{act.title}</span>
                              <span className="text-xs text-muted-foreground">{timeAgo}</span>
                            </div>
                            {act.description && (
                              <p className="text-sm text-muted-foreground line-clamp-3">{act.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="m-0 p-4 space-y-6 overflow-hidden">
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Escribe una nota sobre este lead..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <Button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="gap-2"
                    >
                      <IconNotes className="size-4" />
                      Agregar Nota
                    </Button>
                  </div>

                  {selectedLead.notes ? (
                    <Card>
                      <CardContent className="p-4">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {selectedLead.notes}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <IconNotes className="size-10 mb-3 opacity-40" />
                      <p className="text-sm font-medium">Sin notas</p>
                      <p className="text-xs mt-1">Agrega una nota para este lead</p>
                    </div>
                  )}
                </TabsContent>

                {/* Tasks Tab */}
                <TabsContent value="tasks" className="m-0 p-4 overflow-hidden">
                  <TasksList leadId={selectedLead.id} />
                </TabsContent>

                {/* Files Tab */}
                <TabsContent value="files" className="m-0 p-4 overflow-hidden">
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <IconFolder className="size-10 mb-3 opacity-40" />
                    <p className="text-sm font-medium">Sin archivos</p>
                    <p className="text-xs mt-1">Sube documentos relacionados</p>
                  </div>
                </TabsContent>

                {/* Appointments Tab */}
                <TabsContent value="appointments" className="m-0 p-4 overflow-hidden">
                  <LeadAppointmentsSection leadId={selectedLead.id} />
                </TabsContent>

                {/* Process Tab */}
                <TabsContent value="process" className="m-0 p-4 overflow-hidden">
                  <LeadCreditCheckSection
                    leadId={selectedLead.id}
                    cedula={selectedLead.cedula}
                  />
                </TabsContent>

                {/* Reservation Tab */}
                <TabsContent value="reservation" className="m-0 p-4 overflow-hidden">
                  <LeadReservationsSection leadId={selectedLead.id} />
                </TabsContent>

                {/* Returns Tab */}
                <TabsContent value="returns" className="m-0 p-4 overflow-hidden">
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <IconRefresh className="size-10 mb-3 opacity-40" />
                    <p className="text-sm font-medium">Sin devoluciones</p>
                    <p className="text-xs mt-1">No hay devoluciones registradas</p>
                  </div>
                </TabsContent>

                {/* Assignments Tab */}
                <TabsContent value="assignments" className="m-0 p-4 overflow-hidden">
                  <LeadAssignmentHistory leadId={selectedLead.id} />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </main>
        </div>
      </SheetContent>
    </Sheet>

    {selectedLead && (
      <WhatsAppChatModal
        open={showWhatsAppChat}
        onClose={() => setShowWhatsAppChat(false)}
        leadId={selectedLead.id}
        leadName={`${selectedLead.first_name} ${selectedLead.last_name || ""}`.trim()}
        phone={selectedLead.phone || ""}
      />
    )}
    </>
  )
}
