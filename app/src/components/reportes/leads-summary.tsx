"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useLeadStatuses, useLeads } from "@/hooks/use-leads"

export function LeadsSummary() {
  const { data: leads, isLoading: isLoadingLeads } = useLeads()
  const { data: statuses, isLoading: isLoadingStatuses } = useLeadStatuses()

  const isLoading = isLoadingLeads || isLoadingStatuses

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads por Estado</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Count leads by status
  const leadsByStatus = (leads || []).reduce(
    (acc, lead) => {
      const statusId = lead.status_id || "unknown"
      acc[statusId] = (acc[statusId] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const totalLeads = leads?.length || 0

  // Get status info and sort by position
  const statusData = (statuses || [])
    .filter((s) => s.is_active)
    .sort((a, b) => a.position - b.position)
    .map((status) => ({
      id: status.id,
      name: status.name,
      color: status.color,
      count: leadsByStatus[status.id] || 0,
      percentage: totalLeads > 0 ? ((leadsByStatus[status.id] || 0) / totalLeads) * 100 : 0,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads por Estado</CardTitle>
        <CardDescription>
          {totalLeads} lead{totalLeads !== 1 ? "s" : ""} en total
        </CardDescription>
      </CardHeader>
      <CardContent>
        {statusData.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No hay estados configurados
          </div>
        ) : (
          <div className="space-y-4">
            {statusData.map((status) => (
              <div key={status.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="font-medium">{status.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {status.count} ({status.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${status.percentage}%`,
                      backgroundColor: status.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
