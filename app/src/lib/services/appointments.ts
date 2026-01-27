import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type Appointment = Database["public"]["Tables"]["appointments"]["Row"]
type AppointmentInsert = Database["public"]["Tables"]["appointments"]["Insert"]
type AppointmentUpdate = Database["public"]["Tables"]["appointments"]["Update"]
type Lead = Database["public"]["Tables"]["leads"]["Row"]
type User = Database["public"]["Tables"]["users"]["Row"]
type Project = Database["public"]["Tables"]["projects"]["Row"]

export type AppointmentType =
  | "visit"
  | "call"
  | "video_call"
  | "meeting"
  | "follow_up"
  | "other"

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"

export type AppointmentOutcome =
  | "interested"
  | "not_interested"
  | "needs_follow_up"
  | "closed"
  | "rescheduled"

export type AppointmentWithRelations = Appointment & {
  lead?: Pick<Lead, "id" | "first_name" | "last_name" | "email" | "phone"> | null
  assigned_user?: Pick<User, "id" | "first_name" | "last_name" | "email"> | null
  created_user?: Pick<User, "id" | "first_name" | "last_name"> | null
  project?: Pick<Project, "id" | "name"> | null
}

// Get all appointments with filters
export async function getAppointments(filters?: {
  status?: AppointmentStatus
  type?: AppointmentType
  assignedTo?: string
  projectId?: string
  leadId?: string
  dateFrom?: string
  dateTo?: string
}): Promise<AppointmentWithRelations[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("appointments") as any).select(`
      *,
      lead:leads(id, first_name, last_name, email, phone),
      assigned_user:users!appointments_assigned_to_fkey(id, first_name, last_name, email),
      created_user:users!appointments_created_by_fkey(id, first_name, last_name),
      project:projects(id, name)
    `)

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.type) {
    query = query.eq("type", filters.type)
  }

  if (filters?.assignedTo) {
    query = query.eq("assigned_to", filters.assignedTo)
  }

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId)
  }

  if (filters?.leadId) {
    query = query.eq("lead_id", filters.leadId)
  }

  if (filters?.dateFrom) {
    query = query.gte("scheduled_at", filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte("scheduled_at", filters.dateTo)
  }

  const { data, error } = await query.order("scheduled_at", { ascending: true })

  if (error) throw error
  return (data || []) as AppointmentWithRelations[]
}

// Get single appointment
export async function getAppointment(
  id: string
): Promise<AppointmentWithRelations | null> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("appointments") as any)
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone),
      assigned_user:users!appointments_assigned_to_fkey(id, first_name, last_name, email),
      created_user:users!appointments_created_by_fkey(id, first_name, last_name),
      project:projects(id, name)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data as AppointmentWithRelations | null
}

// Get appointments by lead
export async function getAppointmentsByLead(
  leadId: string
): Promise<AppointmentWithRelations[]> {
  return getAppointments({ leadId })
}

// Get appointments by date range (for calendar view)
export async function getAppointmentsByDateRange(
  dateFrom: string,
  dateTo: string,
  assignedTo?: string
): Promise<AppointmentWithRelations[]> {
  return getAppointments({ dateFrom, dateTo, assignedTo })
}

// Get today's appointments
export async function getTodayAppointments(
  assignedTo?: string
): Promise<AppointmentWithRelations[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return getAppointments({
    dateFrom: today.toISOString(),
    dateTo: tomorrow.toISOString(),
    assignedTo,
  })
}

// Get upcoming appointments
export async function getUpcomingAppointments(
  assignedTo?: string,
  limit: number = 10
): Promise<AppointmentWithRelations[]> {
  const supabase = createClient()
  const now = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("appointments") as any)
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone),
      assigned_user:users!appointments_assigned_to_fkey(id, first_name, last_name, email),
      project:projects(id, name)
    `)
    .gte("scheduled_at", now)
    .in("status", ["scheduled", "confirmed"])
    .order("scheduled_at", { ascending: true })
    .limit(limit)

  if (assignedTo) {
    query = query.eq("assigned_to", assignedTo)
  }

  const { data, error } = await query

  if (error) throw error
  return (data || []) as AppointmentWithRelations[]
}

// Create appointment
export async function createAppointment(
  appointment: AppointmentInsert
): Promise<Appointment> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("appointments") as any)
    .insert(appointment)
    .select()
    .single()

  if (error) throw error
  return data as Appointment
}

// Update appointment
export async function updateAppointment(
  id: string,
  updates: AppointmentUpdate
): Promise<Appointment> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("appointments") as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Appointment
}

// Cancel appointment
export async function cancelAppointment(id: string): Promise<Appointment> {
  return updateAppointment(id, { status: "cancelled" })
}

// Confirm appointment (client confirmed)
export async function confirmAppointment(id: string): Promise<Appointment> {
  return updateAppointment(id, {
    status: "confirmed",
    client_confirmed: true,
    client_confirmed_at: new Date().toISOString(),
  })
}

// Mark as completed
export async function completeAppointment(
  id: string,
  outcome: AppointmentOutcome,
  notes?: string
): Promise<Appointment> {
  return updateAppointment(id, {
    status: "completed",
    attended: true,
    outcome,
    follow_up_notes: notes,
  })
}

// Mark as no-show
export async function markNoShow(id: string): Promise<Appointment> {
  return updateAppointment(id, {
    status: "no_show",
    attended: false,
  })
}

// Reschedule appointment
export async function rescheduleAppointment(
  id: string,
  newDate: string,
  duration?: number
): Promise<Appointment> {
  return updateAppointment(id, {
    scheduled_at: newDate,
    duration_minutes: duration,
    status: "scheduled",
    client_confirmed: null,
    client_confirmed_at: null,
  })
}

// Mark reminder sent
export async function markReminderSent(id: string): Promise<Appointment> {
  return updateAppointment(id, { reminder_sent: true })
}

// Mark confirmation sent
export async function markConfirmationSent(id: string): Promise<Appointment> {
  return updateAppointment(id, { confirmation_sent: true })
}

// Get appointment metrics
export async function getAppointmentMetrics(filters?: {
  assignedTo?: string
  dateFrom?: string
  dateTo?: string
}): Promise<{
  total: number
  scheduled: number
  confirmed: number
  completed: number
  cancelled: number
  noShow: number
  attendanceRate: number
  byType: Record<string, number>
}> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("appointments") as any).select("status, type, attended")

  if (filters?.assignedTo) {
    query = query.eq("assigned_to", filters.assignedTo)
  }

  if (filters?.dateFrom) {
    query = query.gte("scheduled_at", filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte("scheduled_at", filters.dateTo)
  }

  const { data, error } = await query

  if (error) throw error

  const appointments = (data || []) as {
    status: string
    type: string
    attended: boolean | null
  }[]

  const completedOrNoShow = appointments.filter(
    (a) => a.status === "completed" || a.status === "no_show"
  )
  const attended = appointments.filter((a) => a.attended === true)

  const byType: Record<string, number> = {}
  appointments.forEach((a) => {
    byType[a.type] = (byType[a.type] || 0) + 1
  })

  return {
    total: appointments.length,
    scheduled: appointments.filter((a) => a.status === "scheduled").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
    noShow: appointments.filter((a) => a.status === "no_show").length,
    attendanceRate:
      completedOrNoShow.length > 0
        ? Math.round((attended.length / completedOrNoShow.length) * 100)
        : 0,
    byType,
  }
}

// Get appointments needing reminders (24h before)
export async function getAppointmentsNeedingReminders(): Promise<
  AppointmentWithRelations[]
> {
  const supabase = createClient()
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setHours(tomorrow.getHours() + 24)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("appointments") as any)
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone),
      assigned_user:users!appointments_assigned_to_fkey(id, first_name, last_name, email),
      project:projects(id, name)
    `)
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", tomorrow.toISOString())
    .eq("reminder_sent", false)
    .in("status", ["scheduled", "confirmed"])

  if (error) throw error
  return (data || []) as AppointmentWithRelations[]
}
