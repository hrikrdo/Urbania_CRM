"use client"

import {
  IconUsers,
  IconUserCheck,
  IconUsersGroup,
} from "@tabler/icons-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserMetrics } from "@/hooks/use-team"

export function TeamMetrics() {
  const { data: metrics, isLoading } = useUserMetrics()

  const cards = [
    {
      title: "Total Usuarios",
      value: metrics?.totalUsers || 0,
      icon: IconUsers,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Usuarios Activos",
      value: metrics?.activeUsers || 0,
      icon: IconUserCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Equipos",
      value: metrics?.totalTeams || 0,
      icon: IconUsersGroup,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`size-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
