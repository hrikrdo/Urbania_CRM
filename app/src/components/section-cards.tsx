"use client"

import {
  IconUsers,
  IconUserPlus,
  IconMessages,
  IconCalendarEvent,
  IconHome,
  IconTicket,
  IconPercentage,
} from "@tabler/icons-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLeadMetrics } from "@/hooks/use-leads"
import { useDashboardStore } from "@/stores/dashboard-store"

export function SectionCards() {
  const { filters } = useDashboardStore()
  const { data: metrics, isLoading, error } = useLeadMetrics(filters)

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        {[...Array(7)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="p-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-12 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Card className="border-destructive/50">
          <CardHeader className="p-4">
            <CardDescription className="text-destructive">
              Error al cargar métricas
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const cards = [
    {
      title: "Total Leads",
      value: metrics?.total || 0,
      icon: IconUsers,
      color: "text-primary",
    },
    {
      title: "Nuevos",
      value: metrics?.new || 0,
      icon: IconUserPlus,
      color: "text-chart-2",
    },
    {
      title: "Negociación",
      value: metrics?.inNegotiation || 0,
      icon: IconMessages,
      color: "text-chart-3",
    },
    {
      title: "Citas",
      value: metrics?.appointments || 0,
      icon: IconCalendarEvent,
      color: "text-chart-4",
    },
    {
      title: "Visitas",
      value: metrics?.visits || 0,
      icon: IconHome,
      color: "text-chart-5",
    },
    {
      title: "Reservas",
      value: metrics?.reservations || 0,
      icon: IconTicket,
      color: "text-chart-1",
    },
    {
      title: "Conversión",
      value: `${metrics?.conversionRate || 0}%`,
      icon: IconPercentage,
      color: "text-chart-2",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="p-4">
            <CardDescription className="flex items-center gap-2 text-xs">
              <card.icon className={`size-4 ${card.color}`} />
              {card.title}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
