"use client"

import {
  IconCash,
  IconCheck,
  IconClock,
  IconX,
} from "@tabler/icons-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePaymentMetrics } from "@/hooks/use-payments"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function PaymentMetrics() {
  const { data: metrics, isLoading } = usePaymentMetrics()

  const cards = [
    {
      title: "Pagos Pendientes",
      value: formatCurrency(metrics?.totalPending || 0),
      count: metrics?.pendingCount || 0,
      icon: IconClock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Pagos Confirmados",
      value: formatCurrency(metrics?.totalConfirmed || 0),
      count: metrics?.confirmedCount || 0,
      icon: IconCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Recaudado",
      value: formatCurrency(metrics?.totalConfirmed || 0),
      icon: IconCash,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Rechazados",
      value: formatCurrency(metrics?.totalRejected || 0),
      icon: IconX,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            {card.count !== undefined && (
              <p className="text-xs text-muted-foreground">
                {card.count} {card.count === 1 ? "pago" : "pagos"}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
