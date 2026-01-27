"use client"

import {
  IconBuildingSkyscraper,
  IconCash,
  IconTicket,
  IconTrendingUp,
} from "@tabler/icons-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useReservationMetrics } from "@/hooks/use-inventory"
import { usePaymentMetrics } from "@/hooks/use-payments"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function SalesSummary() {
  const { data: reservationMetrics, isLoading: isLoadingReservations } =
    useReservationMetrics()
  const { data: paymentMetrics, isLoading: isLoadingPayments } =
    usePaymentMetrics()

  const isLoading = isLoadingReservations || isLoadingPayments

  const cards = [
    {
      title: "Reservaciones Totales",
      value: reservationMetrics?.total || 0,
      description: `${reservationMetrics?.confirmed || 0} confirmadas`,
      icon: IconTicket,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Ventas Completadas",
      value: reservationMetrics?.completed || 0,
      description: "Unidades entregadas",
      icon: IconBuildingSkyscraper,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Valor Total",
      value: formatCurrency(reservationMetrics?.totalValue || 0),
      description: "En reservaciones activas",
      icon: IconTrendingUp,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      isAmount: true,
    },
    {
      title: "Cobrado",
      value: formatCurrency(paymentMetrics?.totalConfirmed || 0),
      description: `${paymentMetrics?.confirmedCount || 0} pagos confirmados`,
      icon: IconCash,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      isAmount: true,
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
            <div className={`font-bold ${card.isAmount ? "text-xl" : "text-2xl"}`}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
