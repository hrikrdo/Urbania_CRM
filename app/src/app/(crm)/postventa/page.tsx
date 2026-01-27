"use client"

import { PostventaMetrics } from "@/components/postventa/postventa-metrics"
import { DeliveredClientsList } from "@/components/postventa/delivered-clients-list"
import { ModuleHeader } from "@/components/module-header"

export default function PostventaPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <ModuleHeader
        title="Post-Venta"
        description="Gestiona clientes entregados y seguimiento post-venta"
      />

      {/* Metrics */}
      <PostventaMetrics />

      {/* Delivered Clients List */}
      <DeliveredClientsList />
    </div>
  )
}
