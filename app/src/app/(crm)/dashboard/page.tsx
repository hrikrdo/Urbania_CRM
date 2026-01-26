"use client"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen general de tu actividad
          </p>
        </div>
        <DashboardFilters />
      </div>

      {/* Metrics Cards - Full Width */}
      <SectionCards />

      {/* Chart - Full Width */}
      <ChartAreaInteractive />
    </div>
  )
}
