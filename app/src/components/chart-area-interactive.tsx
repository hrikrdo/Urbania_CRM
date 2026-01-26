"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useLeadsByDate } from "@/hooks/use-leads"
import { useDashboardStore } from "@/stores/dashboard-store"

const chartConfig = {
  leads: {
    label: "Leads",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const { filters } = useDashboardStore()
  const { data: chartData, isLoading, error } = useLeadsByDate(filters)

  // Calculate total leads for the period
  const totalLeads = React.useMemo(() => {
    if (!chartData) return 0
    return chartData.reduce((sum, item) => sum + item.leads, 0)
  }, [chartData])

  // Get date range text
  const dateRangeText = React.useMemo(() => {
    if (!filters.date_from || !filters.date_to) return "Mes actual"
    const from = new Date(filters.date_from)
    const to = new Date(filters.date_to)
    return `${format(from, "d MMM", { locale: es })} - ${format(to, "d MMM yyyy", { locale: es })}`
  }, [filters.date_from, filters.date_to])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardDescription className="text-destructive">
            Error al cargar datos del gráfico
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads por Día</CardTitle>
        <CardDescription>
          {totalLeads.toLocaleString()} leads totales · {dateRangeText}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData || []}>
            <defs>
              <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-leads)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-leads)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return format(date, "d MMM", { locale: es })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return format(new Date(value), "EEEE, d MMMM", { locale: es })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="leads"
              type="monotone"
              fill="url(#fillLeads)"
              stroke="var(--color-leads)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
