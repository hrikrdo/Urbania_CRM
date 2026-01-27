"use client"

import { PaymentMetrics, PaymentsList } from "@/components/cobranza"
import { useCurrentUser } from "@/hooks/use-current-user"
import { ModuleHeader } from "@/components/module-header"

export default function CobranzaPage() {
  // Get current user from auth context
  const { data: currentUser } = useCurrentUser()
  const currentUserId = currentUser?.id

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <ModuleHeader
        title="Cobranza"
        description="Gestiona y da seguimiento a los pagos"
      />

      {/* Metrics */}
      <PaymentMetrics />

      {/* Payments List */}
      <PaymentsList currentUserId={currentUserId} />
    </div>
  )
}
