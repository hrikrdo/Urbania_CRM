"use client"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SalesSummary, LeadsSummary } from "@/components/reportes"
import { ModuleHeader } from "@/components/module-header"

export default function ReportesPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <ModuleHeader
        title="Reportes"
        description="Análisis y métricas de rendimiento"
      />

      {/* Sales Summary */}
      <SalesSummary />

      {/* Charts and Summaries */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads Chart */}
        <div className="lg:col-span-2">
          <ChartAreaInteractive />
        </div>

        {/* Leads by Status */}
        <LeadsSummary />
      </div>
    </div>
  )
}
