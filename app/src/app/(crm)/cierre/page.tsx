"use client"

import { useState } from "react"

import {
  ReservationsList,
  CreateReservationDialog,
  CreatePaymentDialog,
} from "@/components/reservations"
import type { ReservationWithRelations } from "@/hooks/use-inventory"
import { useLeadsStore } from "@/stores/leads-store"
import { useCurrentUser } from "@/hooks/use-current-user"
import { ModuleHeader } from "@/components/module-header"

export default function CierrePage() {
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationWithRelations | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  // Use unified lead detail panel
  const { openDetailById } = useLeadsStore()

  // Get current user from auth context
  const { data: currentUser } = useCurrentUser()
  const currentUserId = currentUser?.id

  const handleSelectReservation = (reservation: ReservationWithRelations) => {
    setSelectedReservation(reservation)
    // Open unified lead detail panel with "reservation" tab
    if (reservation.lead_id) {
      openDetailById(reservation.lead_id, "reservation")
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0">
        <ModuleHeader
          title="Cierre"
          description="Gestiona reservaciones, pagos y entregas"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <ReservationsList
          onSelectReservation={handleSelectReservation}
          onCreateReservation={() => setShowCreateDialog(true)}
          selectedReservationId={selectedReservation?.id}
        />
      </div>

      {/* Create Reservation Dialog */}
      <CreateReservationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false)
        }}
      />

      {/* Create Payment Dialog */}
      {selectedReservation && (
        <CreatePaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          reservationId={selectedReservation.id}
          leadId={selectedReservation.lead_id || undefined}
          onSuccess={() => setShowPaymentDialog(false)}
        />
      )}
    </div>
  )
}
