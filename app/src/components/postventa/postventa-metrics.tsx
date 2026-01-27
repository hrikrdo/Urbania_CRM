"use client"

import { IconHome, IconUsers, IconStar, IconTicket } from "@tabler/icons-react"
import { Card, CardHeader } from "@/components/ui/card"

export function PostventaMetrics() {
  // TODO: Fetch real metrics from API
  const metrics = {
    totalDelivered: 0,
    thisMonth: 0,
    satisfaction: 0,
    openTickets: 0,
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center gap-2">
            <IconHome className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Entregas Totales</span>
          </div>
          <p className="text-2xl font-semibold">{metrics.totalDelivered}</p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center gap-2">
            <IconUsers className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Este Mes</span>
          </div>
          <p className="text-2xl font-semibold text-chart-2">{metrics.thisMonth}</p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center gap-2">
            <IconStar className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Satisfacción</span>
          </div>
          <p className="text-2xl font-semibold text-chart-4">
            {metrics.satisfaction > 0 ? `${metrics.satisfaction}%` : "N/A"}
          </p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center gap-2">
            <IconTicket className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Tickets Abiertos</span>
          </div>
          <p className="text-2xl font-semibold text-chart-1">{metrics.openTickets}</p>
        </CardHeader>
      </Card>
    </div>
  )
}
