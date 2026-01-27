"use client"

import {
  IconHistory,
  IconUserPlus,
  IconClock,
  IconHandGrab,
  IconPhone,
  IconArrowBack,
  IconLoader2,
} from "@tabler/icons-react"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

import {
  useLeadAssignmentHistory,
  type LeadAssignmentHistoryWithRelations,
} from "@/hooks/use-lead-distribution"

const actionConfig: Record<
  string,
  {
    label: string
    icon: typeof IconUserPlus
    color: string
    bgColor: string
  }
> = {
  assigned: {
    label: "Asignado",
    icon: IconUserPlus,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  expired: {
    label: "Expirado",
    icon: IconClock,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  claimed: {
    label: "Tomado del pool",
    icon: IconHandGrab,
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
  },
  contacted: {
    label: "Contactado",
    icon: IconPhone,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  returned: {
    label: "Devuelto",
    icon: IconArrowBack,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
  to_pool: {
    label: "Enviado al pool",
    icon: IconArrowBack,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
}

interface LeadAssignmentHistoryProps {
  leadId: string
  maxHeight?: string
}

export function LeadAssignmentHistory({
  leadId,
  maxHeight = "400px",
}: LeadAssignmentHistoryProps) {
  const { data: history, isLoading } = useLeadAssignmentHistory(leadId)

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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconHistory className="size-5" />
          Historial de Asignaciones
          {history && history.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {history.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history && history.length > 0 ? (
          <ScrollArea style={{ maxHeight }}>
            <div className="space-y-4">
              {history.map((entry, index) => {
                const config = actionConfig[entry.action] || actionConfig.assigned
                const Icon = config.icon
                const userName = entry.user
                  ? `${entry.user.first_name || ""} ${entry.user.last_name || ""}`.trim()
                  : "Sistema"

                const timestamp =
                  entry.contacted_at ||
                  entry.expired_at ||
                  entry.assigned_at ||
                  entry.created_at

                return (
                  <div key={entry.id} className="flex gap-3">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      <div className={cn("p-2 rounded-full", config.bgColor)}>
                        <Icon className={cn("size-4", config.color)} />
                      </div>
                      {index < history.length - 1 && (
                        <div className="w-px h-full bg-border mt-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{config.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatDistanceToNow(new Date(timestamp), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mt-1">
                        {entry.action === "assigned" && (
                          <>Asignado automáticamente a <strong>{userName}</strong></>
                        )}
                        {entry.action === "expired" && (
                          <>
                            No fue atendido por <strong>{userName}</strong>.
                            Enviado al pool.
                          </>
                        )}
                        {entry.action === "claimed" && (
                          <>
                            <strong>{userName}</strong> tomó este lead del pool
                          </>
                        )}
                        {entry.action === "contacted" && (
                          <>
                            <strong>{userName}</strong> contactó al cliente
                            {entry.status_changed_to && (
                              <>. Estado: <Badge variant="secondary">{entry.status_changed_to}</Badge></>
                            )}
                          </>
                        )}
                        {entry.action === "to_pool" && (
                          <>Enviado al pool. {entry.notes}</>
                        )}
                        {entry.action === "returned" && (
                          <>Devuelto al pool por <strong>{userName}</strong></>
                        )}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(timestamp), "dd MMM yyyy, HH:mm", { locale: es })}
                      </p>

                      {entry.notes && entry.action !== "to_pool" && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <IconHistory className="size-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Sin historial de asignaciones</p>
            <p className="text-xs mt-1">
              Este lead no ha sido asignado a ningún vendedor
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
