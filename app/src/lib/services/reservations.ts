import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type Reservation = Database["public"]["Tables"]["reservations"]["Row"]
type ReservationInsert = Database["public"]["Tables"]["reservations"]["Insert"]
type ReservationUpdate = Database["public"]["Tables"]["reservations"]["Update"]
type Payment = Database["public"]["Tables"]["payments"]["Row"]
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"]
type Lead = Database["public"]["Tables"]["leads"]["Row"]
type Unit = Database["public"]["Tables"]["units"]["Row"]
type Project = Database["public"]["Tables"]["projects"]["Row"]

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"

export type PaymentType =
  | "separation"
  | "initial"
  | "monthly"
  | "notary"
  | "other"

export type PaymentStatus = "pending" | "confirmed" | "rejected"

export type ReservationWithRelations = Reservation & {
  lead?: Pick<Lead, "id" | "first_name" | "last_name" | "email" | "phone"> | null
  unit?: Pick<Unit, "id" | "unit_number" | "floor" | "area_m2" | "price"> | null
  project?: Pick<Project, "id" | "name"> | null
  payments?: Payment[]
}

// Get all reservations with filters
export async function getReservations(filters?: {
  status?: ReservationStatus
  projectId?: string
  leadId?: string
}): Promise<ReservationWithRelations[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("reservations") as any)
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone),
      unit:units(id, unit_number, floor, area_m2, price),
      project:projects(id, name),
      payments(*)
    `)

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId)
  }

  if (filters?.leadId) {
    query = query.eq("lead_id", filters.leadId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return (data || []) as ReservationWithRelations[]
}

// Get single reservation
export async function getReservation(
  id: string
): Promise<ReservationWithRelations | null> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("reservations") as any)
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone),
      unit:units(id, unit_number, floor, area_m2, price),
      project:projects(id, name),
      payments(*)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data as ReservationWithRelations | null
}

// Get reservations by lead
export async function getReservationsByLead(
  leadId: string
): Promise<ReservationWithRelations[]> {
  return getReservations({ leadId })
}

// Create reservation
export async function createReservation(
  reservation: ReservationInsert
): Promise<Reservation> {
  const supabase = createClient()

  // First, check if unit is available
  if (reservation.unit_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: unit } = await (supabase
      .from("units") as any)
      .select("status")
      .eq("id", reservation.unit_id)
      .single()

    if (unit?.status !== "available") {
      throw new Error("La unidad no está disponible")
    }

    // Reserve the unit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("units") as any)
      .update({
        status: "reserved",
        reserved_by: reservation.lead_id,
        reserved_at: new Date().toISOString(),
      })
      .eq("id", reservation.unit_id)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("reservations") as any)
    .insert(reservation)
    .select()
    .single()

  if (error) throw error
  return data as Reservation
}

// Update reservation
export async function updateReservation(
  id: string,
  updates: ReservationUpdate
): Promise<Reservation> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("reservations") as any)
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Reservation
}

// Cancel reservation
export async function cancelReservation(
  id: string,
  reason: string
): Promise<Reservation> {
  const supabase = createClient()

  // Get reservation to release unit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservation } = await (supabase
    .from("reservations") as any)
    .select("unit_id")
    .eq("id", id)
    .single()

  // Release the unit
  if (reservation?.unit_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("units") as any)
      .update({
        status: "available",
        reserved_by: null,
        reserved_at: null,
      })
      .eq("id", reservation.unit_id)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("reservations") as any)
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Reservation
}

// Complete reservation (mark as sold)
export async function completeReservation(id: string): Promise<Reservation> {
  const supabase = createClient()

  // Get reservation to mark unit as sold
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservation } = await (supabase
    .from("reservations") as any)
    .select("unit_id")
    .eq("id", id)
    .single()

  // Mark unit as sold
  if (reservation?.unit_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("units") as any)
      .update({
        status: "sold",
        sold_at: new Date().toISOString(),
      })
      .eq("id", reservation.unit_id)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("reservations") as any)
    .update({
      status: "completed",
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Reservation
}

// ============================================
// Payments
// ============================================

// Get payments for a reservation
export async function getPaymentsByReservation(
  reservationId: string
): Promise<Payment[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("payments") as any)
    .select("*")
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data || []) as Payment[]
}

// Create payment
export async function createPayment(payment: PaymentInsert): Promise<Payment> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("payments") as any)
    .insert(payment)
    .select()
    .single()

  if (error) throw error

  // Auto-update reservation status based on payment type
  if (payment.reservation_id && payment.status === "confirmed") {
    await updateReservationPaymentStatus(payment.reservation_id, payment.type)
  }

  return data as Payment
}

// Confirm payment
export async function confirmPayment(
  id: string,
  confirmedBy: string
): Promise<Payment> {
  const supabase = createClient()

  // Get payment to update reservation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payment } = await (supabase
    .from("payments") as any)
    .select("reservation_id, type")
    .eq("id", id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("payments") as any)
    .update({
      status: "confirmed",
      confirmed_by: confirmedBy,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error

  // Update reservation payment status
  if (payment?.reservation_id) {
    await updateReservationPaymentStatus(payment.reservation_id, payment.type)
  }

  return data as Payment
}

// Reject payment
export async function rejectPayment(id: string): Promise<Payment> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("payments") as any)
    .update({
      status: "rejected",
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Payment
}

// Helper to update reservation payment status
async function updateReservationPaymentStatus(
  reservationId: string,
  paymentType: string
): Promise<void> {
  const supabase = createClient()

  const updates: ReservationUpdate = {}

  switch (paymentType) {
    case "separation":
      updates.separation_paid = true
      updates.separation_paid_at = new Date().toISOString()
      updates.status = "confirmed"
      break
    case "initial":
      updates.initial_payment_paid = true
      updates.initial_payment_paid_at = new Date().toISOString()
      break
  }

  if (Object.keys(updates).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("reservations") as any).update(updates).eq("id", reservationId)
  }
}

// Get reservation metrics
export async function getReservationMetrics(): Promise<{
  total: number
  pending: number
  confirmed: number
  completed: number
  cancelled: number
  totalValue: number
}> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("reservations") as any)
    .select("status, unit_price")

  if (error) throw error

  const reservations = (data || []) as { status: string; unit_price: number | null }[]

  return {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === "pending").length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    completed: reservations.filter((r) => r.status === "completed").length,
    cancelled: reservations.filter((r) => r.status === "cancelled").length,
    totalValue: reservations
      .filter((r) => r.status !== "cancelled")
      .reduce((sum, r) => sum + (r.unit_price || 0), 0),
  }
}

// Get payments summary for a reservation
export async function getPaymentsSummary(reservationId: string): Promise<{
  totalPaid: number
  pendingAmount: number
  payments: {
    type: string
    amount: number
    status: string
  }[]
}> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservation } = await (supabase
    .from("reservations") as any)
    .select("unit_price, separation_amount, initial_payment, notary_costs")
    .eq("id", reservationId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payments } = await (supabase
    .from("payments") as any)
    .select("type, amount, status")
    .eq("reservation_id", reservationId)

  const confirmedPayments = ((payments || []) as { type: string; amount: number; status: string }[]).filter(
    (p) => p.status === "confirmed"
  )
  const totalPaid = confirmedPayments.reduce((sum, p) => sum + p.amount, 0)

  const totalRequired =
    (reservation?.separation_amount || 0) +
    (reservation?.initial_payment || 0) +
    (reservation?.notary_costs || 0)

  return {
    totalPaid,
    pendingAmount: Math.max(0, totalRequired - totalPaid),
    payments: (payments || []) as { type: string; amount: number; status: string }[],
  }
}
