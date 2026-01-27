import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type UserProject = Database["public"]["Tables"]["user_projects"]["Row"]
type UserProjectInsert = Database["public"]["Tables"]["user_projects"]["Insert"]
type UserProjectUpdate = Database["public"]["Tables"]["user_projects"]["Update"]
type LeadAssignmentHistory = Database["public"]["Tables"]["lead_assignment_history"]["Row"]
type User = Database["public"]["Tables"]["users"]["Row"]
type Project = Database["public"]["Tables"]["projects"]["Row"]
type Lead = Database["public"]["Tables"]["leads"]["Row"]

export type UserProjectWithRelations = UserProject & {
  user?: Pick<User, "id" | "first_name" | "last_name" | "email" | "is_active">
  project?: Pick<Project, "id" | "name" | "status">
}

export type LeadAssignmentHistoryWithRelations = LeadAssignmentHistory & {
  user?: Pick<User, "id" | "first_name" | "last_name"> | null
  lead?: Pick<Lead, "id" | "first_name" | "last_name"> | null
}

export type SalesRepWorkload = {
  user_id: string
  user_name: string
  project_id: string
  project_name: string
  leads_assigned_today: number
  max_leads_per_day: number
  leads_available: number
  last_assigned_at: string | null
  active_leads_count: number
}

// ============================================
// USER PROJECTS (Sales Rep - Project assignments)
// ============================================

export async function getUserProjects(userId?: string): Promise<UserProjectWithRelations[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("user_projects") as any)
    .select(`
      *,
      user:users(id, first_name, last_name, email, is_active),
      project:projects(id, name, status)
    `)
    .eq("is_active", true)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return (data || []) as UserProjectWithRelations[]
}

export async function getUsersByProject(projectId: string): Promise<UserProjectWithRelations[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("user_projects") as any)
    .select(`
      *,
      user:users(id, first_name, last_name, email, is_active),
      project:projects(id, name, status)
    `)
    .eq("project_id", projectId)
    .eq("is_active", true)
    .order("leads_assigned_today", { ascending: true })

  if (error) throw error
  return (data || []) as UserProjectWithRelations[]
}

export async function assignUserToProject(data: UserProjectInsert): Promise<UserProject> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (supabase.from("user_projects") as any)
    .upsert(data, { onConflict: "user_id,project_id" })
    .select()
    .single()

  if (error) throw error
  return result
}

export async function updateUserProject(
  id: string,
  updates: UserProjectUpdate
): Promise<UserProject> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("user_projects") as any)
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeUserFromProject(userId: string, projectId: string): Promise<void> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("user_projects") as any)
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("project_id", projectId)

  if (error) throw error
}

// ============================================
// LEAD ASSIGNMENT FUNCTIONS
// ============================================

export async function autoAssignLead(leadId: string): Promise<string | null> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("auto_assign_lead", {
    p_lead_id: leadId,
  })

  if (error) throw error
  return data
}

export async function claimLeadFromPool(leadId: string, userId: string): Promise<boolean> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("claim_lead_from_pool", {
    p_lead_id: leadId,
    p_user_id: userId,
  })

  if (error) throw error
  return data
}

export async function recordLeadContact(
  leadId: string,
  userId: string,
  newStatusId?: string
): Promise<boolean> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("record_lead_contact", {
    p_lead_id: leadId,
    p_user_id: userId,
    p_new_status_id: newStatusId || null,
  })

  if (error) throw error
  return data
}

export async function expireUnattendedLeads(): Promise<number> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("expire_unattended_leads")

  if (error) throw error
  return data || 0
}

// ============================================
// LEAD ASSIGNMENT HISTORY
// ============================================

export async function getLeadAssignmentHistory(
  leadId: string
): Promise<LeadAssignmentHistoryWithRelations[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("lead_assignment_history") as any)
    .select(`
      *,
      user:users(id, first_name, last_name)
    `)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data || []) as LeadAssignmentHistoryWithRelations[]
}

export async function getUserAssignmentHistory(
  userId: string,
  limit = 50
): Promise<LeadAssignmentHistoryWithRelations[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("lead_assignment_history") as any)
    .select(`
      *,
      lead:leads(id, first_name, last_name)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []) as LeadAssignmentHistoryWithRelations[]
}

// ============================================
// WORKLOAD & METRICS
// ============================================

export async function getSalesRepWorkload(projectId?: string): Promise<SalesRepWorkload[]> {
  const supabase = createClient()

  // Since views might not be set up, we'll query directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("user_projects") as any)
    .select(`
      *,
      user:users(id, first_name, last_name, is_active),
      project:projects(id, name)
    `)
    .eq("is_active", true)

  if (projectId) {
    query = query.eq("project_id", projectId)
  }

  const { data, error } = await query.order("leads_assigned_today", { ascending: true })

  if (error) throw error

  // Transform to SalesRepWorkload format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((up: any) => ({
    user_id: up.user_id,
    user_name: up.user
      ? `${up.user.first_name || ""} ${up.user.last_name || ""}`.trim()
      : "Unknown",
    project_id: up.project_id,
    project_name: up.project?.name || "Unknown",
    leads_assigned_today: up.leads_assigned_today,
    max_leads_per_day: up.max_leads_per_day,
    leads_available: up.max_leads_per_day - up.leads_assigned_today,
    last_assigned_at: up.last_assigned_at,
    active_leads_count: 0, // Would need a separate query
  }))
}

export async function getProjectDistributionStats(projectId: string): Promise<{
  totalReps: number
  totalCapacity: number
  usedCapacity: number
  availableCapacity: number
}> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("user_projects") as any)
    .select("leads_assigned_today, max_leads_per_day")
    .eq("project_id", projectId)
    .eq("is_active", true)

  if (error) throw error

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stats = (data || []).reduce(
    (acc: { totalReps: number; totalCapacity: number; usedCapacity: number }, up: any) => ({
      totalReps: acc.totalReps + 1,
      totalCapacity: acc.totalCapacity + up.max_leads_per_day,
      usedCapacity: acc.usedCapacity + up.leads_assigned_today,
    }),
    { totalReps: 0, totalCapacity: 0, usedCapacity: 0 }
  )

  return {
    ...stats,
    availableCapacity: stats.totalCapacity - stats.usedCapacity,
  }
}

// ============================================
// POOL LEADS
// ============================================

export async function getPoolLeads(projectId?: string, userId?: string) {
  const supabase = createClient()

  let query = supabase
    .from("leads")
    .select(`
      *,
      project:projects(id, name),
      status:lead_statuses(id, name, slug, color)
    `)
    .is("assigned_to", null)
    .eq("attention_expired", true)

  if (projectId) {
    query = query.eq("project_id", projectId)
  }

  // If userId provided, filter by projects the user has access to
  if (userId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProjects } = await (supabase.from("user_projects") as any)
      .select("project_id")
      .eq("user_id", userId)
      .eq("is_active", true)

    if (userProjects && userProjects.length > 0) {
      const projectIds = userProjects.map((up: { project_id: string }) => up.project_id)
      query = query.in("project_id", projectIds)
    }
  }

  const { data, error } = await query.order("pool_entered_at", { ascending: false })

  if (error) throw error
  return data || []
}

// ============================================
// CHECK FUNCTIONS
// ============================================

export async function canUserClaimLead(userId: string, leadId: string): Promise<boolean> {
  const supabase = createClient()

  // Get lead's project
  const { data: lead } = await supabase
    .from("leads")
    .select("project_id")
    .eq("id", leadId)
    .single() as { data: { project_id: string | null } | null }

  if (!lead?.project_id) return true // No project = anyone can claim

  // Check if user has access to this project
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userProject } = await (supabase.from("user_projects") as any)
    .select("id")
    .eq("user_id", userId)
    .eq("project_id", lead.project_id)
    .eq("is_active", true)
    .single()

  return !!userProject
}

export async function isLeadPreviouslyAssigned(leadId: string): Promise<{
  wasAssigned: boolean
  history: LeadAssignmentHistoryWithRelations[]
}> {
  const history = await getLeadAssignmentHistory(leadId)
  return {
    wasAssigned: history.length > 0,
    history,
  }
}
