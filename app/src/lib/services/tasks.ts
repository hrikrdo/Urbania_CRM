import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type Task = Database["public"]["Tables"]["tasks"]["Row"]
type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"]
type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"]
type User = Database["public"]["Tables"]["users"]["Row"]

export type TaskWithRelations = Task & {
  assigned_user?: User | null
  created_user?: User | null
}

export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled"

// Get tasks for a lead
export async function getTasksByLead(leadId: string): Promise<TaskWithRelations[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tasks, error } = await (supabase
    .from("tasks") as any)
    .select("*")
    .eq("lead_id", leadId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (error) throw error
  if (!tasks || tasks.length === 0) return []

  // Fetch related users
  const userIds = [...new Set([
    ...tasks.map((t: Task) => t.assigned_to).filter(Boolean),
    ...tasks.map((t: Task) => t.created_by).filter(Boolean)
  ])]

  if (userIds.length === 0) {
    return tasks.map((task: Task) => ({
      ...task,
      assigned_user: null,
      created_user: null,
    }))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: users } = await (supabase
    .from("users") as any)
    .select("*")
    .in("id", userIds)

  const usersMap = new Map((users || []).map((u: User) => [u.id, u]))

  return tasks.map((task: Task) => ({
    ...task,
    assigned_user: task.assigned_to ? usersMap.get(task.assigned_to) || null : null,
    created_user: task.created_by ? usersMap.get(task.created_by) || null : null,
  }))
}

// Get tasks assigned to a user
export async function getTasksByUser(userId: string, includeCompleted = false): Promise<TaskWithRelations[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase
    .from("tasks") as any)
    .select("*")
    .eq("assigned_to", userId)

  if (!includeCompleted) {
    query = query.in("status", ["pending", "in_progress"])
  }

  query = query
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: false })

  const { data: tasks, error } = await query

  if (error) throw error
  return (tasks || []) as TaskWithRelations[]
}

// Get overdue tasks
export async function getOverdueTasks(userId?: string): Promise<TaskWithRelations[]> {
  const supabase = createClient()
  const now = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase
    .from("tasks") as any)
    .select("*")
    .lt("due_date", now)
    .in("status", ["pending", "in_progress"])

  if (userId) {
    query = query.eq("assigned_to", userId)
  }

  const { data: tasks, error } = await query.order("due_date", { ascending: true })

  if (error) throw error
  return (tasks || []) as TaskWithRelations[]
}

// Get upcoming tasks (due within next 7 days)
export async function getUpcomingTasks(userId?: string): Promise<TaskWithRelations[]> {
  const supabase = createClient()
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase
    .from("tasks") as any)
    .select("*")
    .gte("due_date", now.toISOString())
    .lte("due_date", nextWeek.toISOString())
    .in("status", ["pending", "in_progress"])

  if (userId) {
    query = query.eq("assigned_to", userId)
  }

  const { data: tasks, error } = await query.order("due_date", { ascending: true })

  if (error) throw error
  return (tasks || []) as TaskWithRelations[]
}

// Create a new task
export async function createTask(task: TaskInsert): Promise<Task> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("tasks") as any)
    .insert(task)
    .select()
    .single()

  if (error) throw error
  return data as Task
}

// Update a task
export async function updateTask(id: string, updates: TaskUpdate): Promise<Task> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("tasks") as any)
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Task
}

// Complete a task
export async function completeTask(id: string): Promise<Task> {
  return updateTask(id, {
    status: "completed",
    completed_at: new Date().toISOString(),
  })
}

// Cancel a task
export async function cancelTask(id: string): Promise<Task> {
  return updateTask(id, {
    status: "cancelled",
  })
}

// Delete a task
export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from("tasks") as any)
    .delete()
    .eq("id", id)

  if (error) throw error
}

// Get task counts for dashboard
export async function getTaskCounts(userId?: string): Promise<{
  pending: number
  overdue: number
  completedToday: number
}> {
  const supabase = createClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseQuery = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabase.from("tasks") as any).select("*", { count: "exact", head: true })
    if (userId) q = q.eq("assigned_to", userId)
    return q
  }

  const [pendingResult, overdueResult, completedResult] = await Promise.all([
    baseQuery().in("status", ["pending", "in_progress"]),
    baseQuery()
      .in("status", ["pending", "in_progress"])
      .lt("due_date", now.toISOString()),
    baseQuery()
      .eq("status", "completed")
      .gte("completed_at", todayStart),
  ])

  return {
    pending: pendingResult.count || 0,
    overdue: overdueResult.count || 0,
    completedToday: completedResult.count || 0,
  }
}
