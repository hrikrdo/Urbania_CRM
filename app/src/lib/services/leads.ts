import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type Lead = Database["public"]["Tables"]["leads"]["Row"]
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"]
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"]
type LeadStatus = Database["public"]["Tables"]["lead_statuses"]["Row"]
type User = Database["public"]["Tables"]["users"]["Row"]
type Project = Database["public"]["Tables"]["projects"]["Row"]

// Timer configuration
export const ATTENTION_TIMEOUT_MINUTES = 60

// Calculate attention deadline (60 minutes from now)
export function calculateAttentionDeadline(minutes: number = ATTENTION_TIMEOUT_MINUTES): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

export type LeadWithRelations = Lead & {
  status?: LeadStatus | null
  assigned_user?: User | null
  project?: Project | null
}

export type KanbanColumn = {
  id: string
  name: string
  slug: string
  color: string
  position: number
  leads: LeadWithRelations[]
}

// Fetch all lead statuses for kanban columns
export async function getLeadStatuses(_module?: string): Promise<LeadStatus[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("lead_statuses") as any)
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true })

  if (error) throw error
  return (data || []) as LeadStatus[]
}

// Fetch leads with relations (fetching separately to avoid PostgREST relationship issues)
export async function getLeads(filters?: {
  status_id?: string
  assigned_to?: string
  project_id?: string
  search?: string
  is_pool?: boolean
  module?: string
  temperature?: string
  source?: string
  timer_status?: 'active' | 'expiring' | 'expired'
}): Promise<LeadWithRelations[]> {
  const supabase = createClient()

  // Fetch leads without joins
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase
    .from("leads") as any)
    .select("*")
    .order("updated_at", { ascending: false })

  if (filters?.status_id) {
    query = query.eq("status_id", filters.status_id)
  }

  if (filters?.assigned_to) {
    query = query.eq("assigned_to", filters.assigned_to)
  }

  if (filters?.project_id) {
    query = query.eq("project_id", filters.project_id)
  }

  if (filters?.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
  }

  if (filters?.is_pool) {
    query = query.is("assigned_to", null)
  }

  if (filters?.temperature) {
    query = query.eq("temperature", filters.temperature)
  }

  if (filters?.source) {
    query = query.eq("source", filters.source)
  }

  // Timer status filters
  if (filters?.timer_status) {
    const now = new Date()
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000)

    switch (filters.timer_status) {
      case 'active':
        // Has deadline in future (more than 15 min)
        query = query
          .eq("attention_expired", false)
          .not("attention_deadline", "is", null)
          .gt("attention_deadline", fifteenMinutesLater.toISOString())
        break
      case 'expiring':
        // Deadline within 15 minutes
        query = query
          .eq("attention_expired", false)
          .not("attention_deadline", "is", null)
          .lte("attention_deadline", fifteenMinutesLater.toISOString())
          .gte("attention_deadline", now.toISOString())
        break
      case 'expired':
        // Already expired
        query = query.or(`attention_expired.eq.true,attention_deadline.lt.${now.toISOString()}`)
        break
    }
  }

  const { data: leads, error: leadsError } = await query

  if (leadsError) throw leadsError
  if (!leads || leads.length === 0) return []

  // Fetch related data in parallel
  const statusIds = [...new Set(leads.map((l: Lead) => l.status_id).filter(Boolean))]
  const userIds = [...new Set(leads.map((l: Lead) => l.assigned_to).filter(Boolean))]
  const projectIds = [...new Set(leads.map((l: Lead) => l.project_id).filter(Boolean))]

  const [statusesResult, usersResult, projectsResult] = await Promise.all([
    statusIds.length > 0
      ? (supabase.from("lead_statuses") as any).select("*").in("id", statusIds)
      : { data: [], error: null },
    userIds.length > 0
      ? (supabase.from("users") as any).select("*").in("id", userIds)
      : { data: [], error: null },
    projectIds.length > 0
      ? (supabase.from("projects") as any).select("*").in("id", projectIds)
      : { data: [], error: null },
  ])

  // Create lookup maps
  const statusMap = new Map((statusesResult.data || []).map((s: LeadStatus) => [s.id, s]))
  const userMap = new Map((usersResult.data || []).map((u: User) => [u.id, u]))
  const projectMap = new Map((projectsResult.data || []).map((p: Project) => [p.id, p]))

  // Combine data
  return leads.map((lead: Lead) => ({
    ...lead,
    status: lead.status_id ? statusMap.get(lead.status_id) || null : null,
    assigned_user: lead.assigned_to ? userMap.get(lead.assigned_to) || null : null,
    project: lead.project_id ? projectMap.get(lead.project_id) || null : null,
  })) as LeadWithRelations[]
}

// Get leads grouped by status for kanban
export async function getLeadsForKanban(module: string = "comercial"): Promise<KanbanColumn[]> {
  const [statuses, leads] = await Promise.all([
    getLeadStatuses(module),
    getLeads({ module })
  ])

  return statuses.map(status => ({
    ...status,
    leads: leads.filter(lead => lead.status_id === status.id)
  }))
}

// Get single lead by ID
export async function getLead(id: string): Promise<LeadWithRelations | null> {
  const supabase = createClient()

  // Fetch lead without joins
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lead, error } = await (supabase
    .from("leads") as any)
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  if (!lead) return null

  // Fetch related data in parallel
  const [statusResult, userResult, projectResult] = await Promise.all([
    lead.status_id
      ? (supabase.from("lead_statuses") as any).select("*").eq("id", lead.status_id).single()
      : { data: null, error: null },
    lead.assigned_to
      ? (supabase.from("users") as any).select("*").eq("id", lead.assigned_to).single()
      : { data: null, error: null },
    lead.project_id
      ? (supabase.from("projects") as any).select("*").eq("id", lead.project_id).single()
      : { data: null, error: null },
  ])

  return {
    ...lead,
    status: statusResult.data || null,
    assigned_user: userResult.data || null,
    project: projectResult.data || null,
  } as LeadWithRelations
}

// Create a new lead with automatic attention deadline
export async function createLead(lead: LeadInsert): Promise<Lead> {
  const supabase = createClient()

  // Set attention deadline if not provided (60 minutes from now)
  const leadWithDeadline = {
    ...lead,
    attention_deadline: lead.attention_deadline || calculateAttentionDeadline(),
    attention_expired: false,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("leads") as any)
    .insert(leadWithDeadline)
    .select()
    .single()

  if (error) throw error
  return data as Lead
}

// Update a lead
export async function updateLead(id: string, updates: LeadUpdate): Promise<Lead> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("leads") as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Lead
}

// Update lead status (for kanban drag & drop)
export async function updateLeadStatus(leadId: string, statusId: string): Promise<Lead> {
  const supabase = createClient()

  // First, log the status change in history
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lead } = await (supabase
    .from("leads") as any)
    .select("status_id")
    .eq("id", leadId)
    .single()

  if (lead && lead.status_id !== statusId) {
    // Log status change - ignore errors if table doesn't exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("lead_stage_history") as any).insert({
      lead_id: leadId,
      from_stage: lead.status_id,
      to_stage: statusId
    }).catch(() => {})
  }

  // Update the lead
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("leads") as any)
    .update({
      status_id: statusId,
      updated_at: new Date().toISOString()
    })
    .eq("id", leadId)
    .select()
    .single()

  if (error) throw error
  return data as Lead
}

// Assign lead to user (clears attention deadline when assigned)
export async function assignLead(leadId: string, userId: string | null): Promise<Lead> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentLead } = await (supabase
    .from("leads") as any)
    .select("assigned_to")
    .eq("id", leadId)
    .single()

  // When assigning to a user, clear the attention deadline (lead is being attended)
  // When unassigning, set a new deadline
  const deadlineUpdate = userId
    ? { attention_deadline: null, attention_expired: false }
    : { attention_deadline: calculateAttentionDeadline(), attention_expired: false }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("leads") as any)
    .update({
      assigned_to: userId,
      assigned_at: userId ? new Date().toISOString() : null,
      previous_assigned_to: currentLead?.assigned_to || null,
      pool_claimed_by: userId,
      pool_claimed_at: userId ? new Date().toISOString() : null,
      ...deadlineUpdate,
      updated_at: new Date().toISOString()
    })
    .eq("id", leadId)
    .select()
    .single()

  if (error) throw error
  return data as Lead
}

// Send lead to pool
export async function sendToPool(leadId: string): Promise<Lead> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentLead } = await (supabase
    .from("leads") as any)
    .select("assigned_to")
    .eq("id", leadId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("leads") as any)
    .update({
      assigned_to: null,
      previous_assigned_to: currentLead?.assigned_to || null,
      pool_entered_at: new Date().toISOString(),
      pool_claimed_by: null,
      pool_claimed_at: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", leadId)
    .select()
    .single()

  if (error) throw error
  return data as Lead
}

// Get pool leads (unassigned)
export async function getPoolLeads(): Promise<LeadWithRelations[]> {
  return getLeads({ is_pool: true })
}

// Claim lead from pool
export async function claimFromPool(leadId: string, userId: string): Promise<Lead> {
  return assignLead(leadId, userId)
}

// Delete lead
export async function deleteLead(id: string): Promise<void> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from("leads") as any)
    .delete()
    .eq("id", id)

  if (error) throw error
}

// Get users for assignment dropdown
export async function getUsers(): Promise<User[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("users") as any)
    .select("*")
    .eq("is_active", true)
    .order("first_name", { ascending: true })

  if (error) throw error
  return (data || []) as User[]
}

// Get projects for filter dropdown
export async function getProjects(): Promise<Project[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("projects") as any)
    .select("*")
    .eq("status", "active")
    .order("name", { ascending: true })

  if (error) throw error
  return (data || []) as Project[]
}

// Mark lead as expired (called when timer runs out)
export async function markLeadExpired(leadId: string): Promise<Lead> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("leads") as any)
    .update({
      attention_expired: true,
      pool_entered_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", leadId)
    .select()
    .single()

  if (error) throw error
  return data as Lead
}

// Extend lead attention deadline
export async function extendLeadDeadline(leadId: string, additionalMinutes: number = ATTENTION_TIMEOUT_MINUTES): Promise<Lead> {
  const supabase = createClient()

  const newDeadline = calculateAttentionDeadline(additionalMinutes)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("leads") as any)
    .update({
      attention_deadline: newDeadline,
      attention_expired: false,
      updated_at: new Date().toISOString()
    })
    .eq("id", leadId)
    .select()
    .single()

  if (error) throw error
  return data as Lead
}

// Clear lead deadline (when a seller claims/attends the lead)
export async function clearLeadDeadline(leadId: string): Promise<Lead> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("leads") as any)
    .update({
      attention_deadline: null,
      attention_expired: false,
      updated_at: new Date().toISOString()
    })
    .eq("id", leadId)
    .select()
    .single()

  if (error) throw error
  return data as Lead
}

// Get leads with expiring timers (for notifications)
export async function getExpiringLeads(minutesThreshold: number = 5): Promise<LeadWithRelations[]> {
  const supabase = createClient()

  const now = new Date()
  const thresholdTime = new Date(now.getTime() + minutesThreshold * 60 * 1000)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leads, error } = await (supabase
    .from("leads") as any)
    .select("*")
    .eq("attention_expired", false)
    .not("attention_deadline", "is", null)
    .lte("attention_deadline", thresholdTime.toISOString())
    .gte("attention_deadline", now.toISOString())
    .order("attention_deadline", { ascending: true })

  if (error) throw error
  return (leads || []) as LeadWithRelations[]
}

// Dashboard filters type
export type DashboardFilters = {
  project_id?: string
  assigned_to?: string
  date_from?: string
  date_to?: string
}

// Dashboard metrics type
export type DashboardMetrics = {
  total: number
  new: number
  inNegotiation: number
  appointments: number
  visits: number
  reservations: number
  conversionRate: number
  expiringSoon: number
  inPool: number
}

// Get lead metrics for dashboard with filters
export async function getLeadMetrics(filters?: DashboardFilters): Promise<DashboardMetrics> {
  const supabase = createClient()

  // Get all lead statuses first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: statuses } = await (supabase
    .from("lead_statuses") as any)
    .select("id, slug")

  const statusMap = new Map((statuses || []).map((s: LeadStatus) => [s.slug, s.id]))

  // Status IDs we need
  const newStatusId = statusMap.get("lead_entrante")
  const conversationStatusId = statusMap.get("en_conversacion")
  const appointmentStatusId = statusMap.get("cita_agendada")
  const visitStatusId = statusMap.get("visita_realizada")
  const reservationStatusId = statusMap.get("reserva")

  // Helper function to create a filtered query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createFilteredQuery = (baseQuery: any) => {
    let query = baseQuery
    if (filters?.project_id) {
      query = query.eq("project_id", filters.project_id)
    }
    if (filters?.assigned_to) {
      query = query.eq("assigned_to", filters.assigned_to)
    }
    if (filters?.date_from) {
      query = query.gte("created_at", filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte("created_at", filters.date_to)
    }
    return query
  }

  // Run all queries in parallel
  const [
    totalResult,
    newResult,
    conversationResult,
    appointmentResult,
    visitResult,
    reservationResult,
    poolResult,
    expiringResult
  ] = await Promise.all([
    // Total leads
    createFilteredQuery(
      (supabase.from("leads") as any).select("*", { count: "exact", head: true })
    ),
    // New leads (Lead Entrante)
    newStatusId
      ? createFilteredQuery(
          (supabase.from("leads") as any).select("*", { count: "exact", head: true }).eq("status_id", newStatusId)
        )
      : { count: 0 },
    // In conversation/negotiation
    conversationStatusId
      ? createFilteredQuery(
          (supabase.from("leads") as any).select("*", { count: "exact", head: true }).eq("status_id", conversationStatusId)
        )
      : { count: 0 },
    // Appointments (Cita Agendada)
    appointmentStatusId
      ? createFilteredQuery(
          (supabase.from("leads") as any).select("*", { count: "exact", head: true }).eq("status_id", appointmentStatusId)
        )
      : { count: 0 },
    // Visits (Visita Realizada)
    visitStatusId
      ? createFilteredQuery(
          (supabase.from("leads") as any).select("*", { count: "exact", head: true }).eq("status_id", visitStatusId)
        )
      : { count: 0 },
    // Reservations (Reserva)
    reservationStatusId
      ? createFilteredQuery(
          (supabase.from("leads") as any).select("*", { count: "exact", head: true }).eq("status_id", reservationStatusId)
        )
      : { count: 0 },
    // In pool (unassigned)
    createFilteredQuery(
      (supabase.from("leads") as any).select("*", { count: "exact", head: true }).is("assigned_to", null)
    ),
    // Expiring soon (within 15 minutes)
    createFilteredQuery(
      (supabase.from("leads") as any)
        .select("*", { count: "exact", head: true })
        .eq("attention_expired", false)
        .not("attention_deadline", "is", null)
        .lte("attention_deadline", new Date(Date.now() + 15 * 60 * 1000).toISOString())
        .gte("attention_deadline", new Date().toISOString())
    ),
  ])

  const total = totalResult.count || 0
  const appointments = appointmentResult.count || 0

  // Conversion rate: (appointments / total) * 100
  const conversionRate = total > 0 ? Math.round((appointments / total) * 100) : 0

  return {
    total,
    new: newResult.count || 0,
    inNegotiation: conversationResult.count || 0,
    appointments,
    visits: visitResult.count || 0,
    reservations: reservationResult.count || 0,
    conversionRate,
    expiringSoon: expiringResult.count || 0,
    inPool: poolResult.count || 0,
  }
}

// Get leads grouped by date for chart
export async function getLeadsByDate(filters?: DashboardFilters): Promise<{ date: string; leads: number }[]> {
  const supabase = createClient()

  // Default to current month if no date filters
  const now = new Date()
  const dateFrom = filters?.date_from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const dateTo = filters?.date_to || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase
    .from("leads") as any)
    .select("created_at")
    .gte("created_at", dateFrom)
    .lte("created_at", dateTo)
    .order("created_at", { ascending: true })

  if (filters?.project_id) {
    query = query.eq("project_id", filters.project_id)
  }
  if (filters?.assigned_to) {
    query = query.eq("assigned_to", filters.assigned_to)
  }

  const { data: leads, error } = await query

  if (error) throw error
  if (!leads || leads.length === 0) return []

  // Group leads by date
  const groupedByDate = new Map<string, number>()

  for (const lead of leads) {
    const date = new Date(lead.created_at).toISOString().split('T')[0]
    groupedByDate.set(date, (groupedByDate.get(date) || 0) + 1)
  }

  // Fill in missing dates with 0
  const result: { date: string; leads: number }[] = []
  const startDate = new Date(dateFrom)
  const endDate = new Date(dateTo)

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    result.push({
      date: dateStr,
      leads: groupedByDate.get(dateStr) || 0
    })
  }

  return result
}
