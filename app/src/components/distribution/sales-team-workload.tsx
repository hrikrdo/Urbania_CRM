"use client"

import {
  IconUsers,
  IconLoader2,
  IconTrendingUp,
  IconAlertCircle,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

import { useSalesRepWorkload } from "@/hooks/use-lead-distribution"

interface SalesTeamWorkloadProps {
  projectId?: string
}

export function SalesTeamWorkload({ projectId }: SalesTeamWorkloadProps) {
  const { data: workload, isLoading } = useSalesRepWorkload(projectId)

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

  // Calculate totals
  const totals = workload?.reduce(
    (acc, rep) => ({
      totalLeads: acc.totalLeads + rep.leads_assigned_today,
      totalCapacity: acc.totalCapacity + rep.max_leads_per_day,
      repsAtCapacity: acc.repsAtCapacity + (rep.leads_available <= 0 ? 1 : 0),
    }),
    { totalLeads: 0, totalCapacity: 0, repsAtCapacity: 0 }
  ) || { totalLeads: 0, totalCapacity: 0, repsAtCapacity: 0 }

  const overallProgress = totals.totalCapacity > 0
    ? (totals.totalLeads / totals.totalCapacity) * 100
    : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconUsers className="size-5" />
              Carga del Equipo
            </CardTitle>
            <CardDescription>
              Distribución de leads por vendedor hoy
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {totals.totalLeads}/{totals.totalCapacity}
            </div>
            <div className="text-xs text-muted-foreground">leads asignados</div>
          </div>
        </div>

        {/* Overall progress */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Capacidad utilizada</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Warnings */}
        {totals.repsAtCapacity > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-chart-4">
            <IconAlertCircle className="size-4" />
            <span>
              {totals.repsAtCapacity} vendedor{totals.repsAtCapacity > 1 ? "es" : ""} al límite
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {workload && workload.length > 0 ? (
          <div className="space-y-4">
            {workload.map((rep) => {
              const progress = (rep.leads_assigned_today / rep.max_leads_per_day) * 100
              const isAtCapacity = rep.leads_available <= 0
              const isNearCapacity = rep.leads_available <= 3 && rep.leads_available > 0

              const initials = rep.user_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)

              return (
                <div
                  key={`${rep.user_id}-${rep.project_id}`}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg border",
                    isAtCapacity && "border-destructive/50 bg-destructive/5"
                  )}
                >
                  <Avatar className="size-10">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {rep.user_name}
                      </span>
                      {!projectId && (
                        <Badge variant="outline" className="text-xs">
                          {rep.project_name}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Progress
                        value={progress}
                        className={cn(
                          "h-2 flex-1",
                          isAtCapacity && "[&>div]:bg-destructive",
                          isNearCapacity && "[&>div]:bg-chart-4"
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs font-medium min-w-[60px] text-right",
                          isAtCapacity && "text-destructive",
                          isNearCapacity && "text-chart-4"
                        )}
                      >
                        {rep.leads_assigned_today}/{rep.max_leads_per_day}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {isAtCapacity ? (
                      <Badge variant="destructive">Al límite</Badge>
                    ) : isNearCapacity ? (
                      <Badge className="bg-chart-4/10 text-chart-4 hover:bg-chart-4/20">
                        Quedan {rep.leads_available}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <IconTrendingUp className="size-3 mr-1" />
                        {rep.leads_available} disponibles
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <IconUsers className="size-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay vendedores asignados</p>
            <p className="text-xs mt-1">
              Asigna vendedores a proyectos para comenzar
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
