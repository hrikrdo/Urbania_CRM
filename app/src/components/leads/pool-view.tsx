"use client"

import * as React from "react"
import {
  IconLoader2,
  IconPhone,
  IconMail,
  IconHandGrab,
  IconUserPlus,
  IconClock,
} from "@tabler/icons-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePoolLeads, useClaimFromPool, useProjects, useUsers } from "@/hooks/use-leads"
import { useLeadsStore } from "@/stores/leads-store"
import { useCurrentUser } from "@/hooks/use-current-user"
import type { LeadWithRelations } from "@/lib/services/leads"

// Constants for attention time
const ATTENTION_TOTAL_MINUTES = 60

// Helper function to format elapsed time for expired leads
function formatElapsedTime(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) {
    // More than 1 day: show "Xd Xh"
    return `+${days}d ${hours}h`
  } else if (hours > 0) {
    // More than 1 hour: show "+HH:MM:SS"
    return `+${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  } else {
    // Less than 1 hour: show "+MM:SS"
    return `+${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
}

// Helper function to calculate time progress
function getTimeProgress(lead: LeadWithRelations): {
  percentage: number
  minutesRemaining: number
  secondsRemaining: number
  totalSecondsRemaining: number
  status: "fresh" | "warning" | "critical"
  displayTime: string
  isExpired: boolean
} {
  const now = new Date()

  // Use attention_deadline if available, otherwise calculate from pool_entered_at or created_at
  let deadline: Date
  if (lead.attention_deadline) {
    deadline = new Date(lead.attention_deadline)
  } else {
    const startTime = lead.pool_entered_at
      ? new Date(lead.pool_entered_at)
      : new Date(lead.created_at)
    deadline = new Date(startTime.getTime() + ATTENTION_TOTAL_MINUTES * 60 * 1000)
  }

  const totalMs = ATTENTION_TOTAL_MINUTES * 60 * 1000
  const remainingMs = deadline.getTime() - now.getTime()
  const isExpired = remainingMs < 0

  // Calculate time values
  let totalSecondsRemaining: number
  let minutesRemaining: number
  let secondsRemaining: number
  let displayTime: string

  if (isExpired) {
    // Time has expired - calculate elapsed time since expiration
    const elapsedMs = Math.abs(remainingMs)
    const elapsedSeconds = Math.floor(elapsedMs / 1000)
    totalSecondsRemaining = 0
    minutesRemaining = 0
    secondsRemaining = 0
    displayTime = formatElapsedTime(elapsedSeconds)
  } else {
    // Time remaining
    totalSecondsRemaining = Math.floor(remainingMs / 1000)
    minutesRemaining = Math.floor(totalSecondsRemaining / 60)
    secondsRemaining = totalSecondsRemaining % 60
    displayTime = `${minutesRemaining.toString().padStart(2, "0")}:${secondsRemaining.toString().padStart(2, "0")}`
  }

  // Calculate percentage (100% = full time remaining, 0% = no time)
  // When expired, show 100% so the red bar is fully visible
  const percentage = isExpired ? 100 : Math.max(0, Math.min(100, (remainingMs / totalMs) * 100))

  // Determine status based on time remaining
  let status: "fresh" | "warning" | "critical"
  if (isExpired) {
    status = "critical" // Red - expired
  } else if (minutesRemaining > 30) {
    status = "fresh" // Green - more than 30 min remaining
  } else {
    status = "warning" // Yellow - 0-30 min remaining
  }

  return { percentage, minutesRemaining, secondsRemaining, totalSecondsRemaining, status, displayTime, isExpired }
}

// Get progress bar color based on status
function getProgressColor(status: "fresh" | "warning" | "critical"): string {
  switch (status) {
    case "fresh":
      return "bg-green-500"
    case "warning":
      return "bg-yellow-500"
    case "critical":
      return "bg-red-500"
  }
}

interface PoolCardProps {
  lead: LeadWithRelations
  onClaim: (leadId: string) => void
  isClaiming: boolean
}

function PoolCard({ lead, onClaim, isClaiming }: PoolCardProps) {
  const { openDetail } = useLeadsStore()
  const [timeProgress, setTimeProgress] = React.useState(() => getTimeProgress(lead))

  // Update progress every second for real-time countdown
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeProgress(getTimeProgress(lead))
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [lead])

  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ")
  const initials = [lead.first_name?.[0], lead.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase()

  // Format entry date
  const entryDate = lead.pool_entered_at
    ? new Date(lead.pool_entered_at)
    : new Date(lead.created_at)
  const formattedDate = format(entryDate, "d MMM yyyy", { locale: es })

  return (
    <Card className="transition-shadow hover:shadow-md flex flex-col">
      {/* Header with project name and date */}
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground truncate flex-1 mr-2">
            {lead.project?.name || "Sin proyecto"}
          </span>
          <Badge variant="secondary" className="text-xs shrink-0">
            {formattedDate}
          </Badge>
        </div>
      </CardHeader>

      {/* Contact info */}
      <CardContent className="p-4 pt-0 flex-1">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="size-10 shrink-0">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span className="font-medium block truncate" title={fullName}>{fullName}</span>
            {lead.source && (
              <span className="text-xs text-muted-foreground block truncate">
                {lead.source}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          {lead.phone && (
            <div className="flex items-center gap-2">
              <IconPhone className="size-4 shrink-0" />
              <span className="truncate">{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2">
              <IconMail className="size-4 shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Progress bar for attention time */}
      <div className="px-4 pb-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <IconClock className="size-3" />
              Tiempo de atención
            </span>
            <span
              className={`font-medium font-mono ${
                timeProgress.status === "fresh"
                  ? "text-green-600"
                  : timeProgress.status === "warning"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {timeProgress.displayTime}
            </span>
          </div>
          <Progress
            value={timeProgress.percentage}
            className="h-2 bg-muted"
            indicatorClassName={getProgressColor(timeProgress.status)}
          />
        </div>
      </div>

      {/* Action buttons */}
      <CardFooter className="p-4 pt-0 gap-2">
        <Button
          className="flex-1"
          onClick={() => onClaim(lead.id)}
          disabled={isClaiming}
        >
          {isClaiming ? (
            <IconLoader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <IconHandGrab className="size-4 mr-2" />
          )}
          Tomar Lead
        </Button>
        <Button variant="outline" onClick={() => openDetail(lead)}>
          Ver
        </Button>
      </CardFooter>
    </Card>
  )
}

export function PoolView() {
  const { data: leads, isLoading } = usePoolLeads()
  const { data: projects } = useProjects()
  const { data: users } = useUsers()
  const { data: currentUser } = useCurrentUser()
  const claimLead = useClaimFromPool()

  // Filter state
  const [projectFilter, setProjectFilter] = React.useState<string>("__all__")
  const [vendorFilter, setVendorFilter] = React.useState<string>("__all__")

  // Get current user ID from auth context
  const currentUserId = currentUser?.id

  // Filter leads based on selected filters
  // Note: Pool leads are unassigned, so vendor filter is for UI purposes
  // When a vendor is selected, it can be used for claiming leads
  const filteredLeads = React.useMemo(() => {
    if (!leads) return []
    return leads.filter((lead) => {
      const matchesProject =
        projectFilter === "__all__" || lead.project_id === projectFilter
      // Vendor filter doesn't filter pool leads (they're all unassigned)
      // It's used to select which vendor will claim leads
      return matchesProject
    })
  }, [leads, projectFilter])

  const handleClaim = async (leadId: string) => {
    // Use selected vendor or fallback to current user
    const assignToUserId = vendorFilter !== "__all__" ? vendorFilter : currentUserId

    if (!assignToUserId) {
      toast.error("Selecciona un vendedor o inicia sesión para tomar el lead")
      return
    }

    try {
      await claimLead.mutateAsync({ leadId, userId: assignToUserId })
      const vendorName = vendorFilter !== "__all__"
        ? users?.find(u => u.id === vendorFilter)?.first_name
        : currentUser?.first_name || "ti"
      toast.success(`Lead asignado a ${vendorName} correctamente`)
    } catch {
      toast.error("Error al tomar el lead")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <IconUserPlus className="size-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Pool vacío</p>
        <p className="text-sm">No hay leads sin asignar</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters and counter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Project filter */}
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos los proyectos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los proyectos</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Vendor filter */}
          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos los vendedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los vendedores</SelectItem>
              {users?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lead count */}
        <p className="text-sm text-muted-foreground">
          {filteredLeads.length === leads.length ? (
            <>{leads.length} lead{leads.length !== 1 ? "s" : ""} sin asignar</>
          ) : (
            <>
              {filteredLeads.length} de {leads.length} lead
              {leads.length !== 1 ? "s" : ""}
            </>
          )}
        </p>
      </div>

      {/* Lead cards grid */}
      {filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <p className="text-sm">No hay leads con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredLeads.map((lead) => (
            <PoolCard
              key={lead.id}
              lead={lead}
              onClaim={handleClaim}
              isClaiming={claimLead.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
