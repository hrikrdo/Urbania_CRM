import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type Payment = Database["public"]["Tables"]["payments"]["Row"]
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"]
type Lead = Database["public"]["Tables"]["leads"]["Row"]
type Reservation = Database["public"]["Tables"]["reservations"]["Row"]
type Unit = Database["public"]["Tables"]["units"]["Row"]
type Project = Database["public"]["Tables"]["projects"]["Row"]

export type PaymentType =
  | "separation"
  | "initial"
  | "monthly"
  | "notary"
  | "disbursement"
  | "other"

export type PaymentStatus = "pending" | "confirmed" | "rejected"

export type PaymentMethod = "transfer" | "check" | "cash" | "financing"

export type PaymentWithRelations = Payment & {
  lead?: Pick<Lead, "id" | "first_name" | "last_name" | "email" | "phone"> | null
  reservation?: (Pick<Reservation, "id" | "unit_price" | "status"> & {
    unit?: Pick<Unit, "id" | "unit_number"> | null
    project?: Pick<Project, "id" | "name"> | null
  }) | null
  confirmed_by_user?: { first_name: string | null; last_name: string | null } | null
}

// Get all payments with filters
export async function getPayments(filters?: {
  status?: PaymentStatus
  type?: PaymentType
  reservationId?: string
  leadId?: string
  dateFrom?: string
  dateTo?: string
}): Promise<PaymentWithRelations[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("payments") as any)
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone),
      reservation:reservations(
        id, unit_price, status,
        unit:units(id, unit_number),
        project:projects(id, name)
      ),
      confirmed_by_user:profiles!payments_confirmed_by_fkey(first_name, last_name)
    `)

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.type) {
    query = query.eq("type", filters.type)
  }

  if (filters?.reservationId) {
    query = query.eq("reservation_id", filters.reservationId)
  }

  if (filters?.leadId) {
    query = query.eq("lead_id", filters.leadId)
  }

  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return (data || []) as PaymentWithRelations[]
}

// Get payment by ID
export async function getPayment(id: string): Promise<PaymentWithRelations | null> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("payments") as any)
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone),
      reservation:reservations(
        id, unit_price, status,
        unit:units(id, unit_number),
        project:projects(id, name)
      ),
      confirmed_by_user:profiles!payments_confirmed_by_fkey(first_name, last_name)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data as PaymentWithRelations | null
}

// Create payment
export async function createPayment(payment: PaymentInsert): Promise<Payment> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("payments") as any)
    .insert(payment)
    .select()
    .single()

  if (error) throw error
  return data as Payment
}

// Confirm payment
export async function confirmPayment(
  id: string,
  confirmedBy: string
): Promise<Payment> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("payments") as any)
    .update({
      status: "confirmed",
      confirmed_by: confirmedBy,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Payment
}

// Reject payment
export async function rejectPayment(id: string): Promise<Payment> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("payments") as any)
    .update({ status: "rejected" })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Payment
}

// Get payment metrics
export async function getPaymentMetrics(filters?: {
  dateFrom?: string
  dateTo?: string
}): Promise<{
  totalPending: number
  totalConfirmed: number
  totalRejected: number
  pendingCount: number
  confirmedCount: number
  pendingByType: Record<string, number>
}> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("payments") as any).select("status, type, amount")

  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo)
  }

  const { data, error } = await query

  if (error) throw error

  const payments = (data || []) as { status: string; type: string; amount: number }[]

  const pending = payments.filter((p) => p.status === "pending")
  const confirmed = payments.filter((p) => p.status === "confirmed")
  const rejected = payments.filter((p) => p.status === "rejected")

  const pendingByType = pending.reduce(
    (acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + p.amount
      return acc
    },
    {} as Record<string, number>
  )

  return {
    totalPending: pending.reduce((sum, p) => sum + p.amount, 0),
    totalConfirmed: confirmed.reduce((sum, p) => sum + p.amount, 0),
    totalRejected: rejected.reduce((sum, p) => sum + p.amount, 0),
    pendingCount: pending.length,
    confirmedCount: confirmed.length,
    pendingByType,
  }
}

// Helper to format payment type
export function formatPaymentType(type: string): string {
  const types: Record<string, string> = {
    separation: "Separación",
    initial: "Enganche",
    monthly: "Mensualidad",
    notary: "Escrituración",
    disbursement: "Desembolso",
    other: "Otro",
  }
  return types[type] || type
}

// Helper to format payment method
export function formatPaymentMethod(method: string | null): string {
  if (!method) return "No especificado"
  const methods: Record<string, string> = {
    transfer: "Transferencia",
    check: "Cheque",
    cash: "Efectivo",
    financing: "Financiamiento",
  }
  return methods[method] || method
}

// Helper to format payment status
export function formatPaymentStatus(status: string): string {
  const statuses: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    rejected: "Rechazado",
  }
  return statuses[status] || status
}
