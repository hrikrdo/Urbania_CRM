import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type User = Database["public"]["Tables"]["users"]["Row"]
type Team = Database["public"]["Tables"]["teams"]["Row"]
type Role = Database["public"]["Tables"]["roles"]["Row"]

export type UserWithRelations = User & {
  role?: Pick<Role, "id" | "name"> | null
  teams?: Pick<Team, "id" | "name">[]
}

export type TeamWithMembers = Team & {
  manager?: Pick<User, "id" | "first_name" | "last_name" | "email" | "avatar_url"> | null
  members?: Pick<User, "id" | "first_name" | "last_name" | "email" | "avatar_url" | "is_active">[]
}

// Get all users
export async function getUsers(): Promise<UserWithRelations[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("users") as any)
    .select(`
      *,
      role:roles(id, name)
    `)
    .order("first_name", { ascending: true })

  if (error) throw error
  return (data || []) as UserWithRelations[]
}

// Get active users only
export async function getActiveUsers(): Promise<UserWithRelations[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("users") as any)
    .select(`
      *,
      role:roles(id, name)
    `)
    .eq("is_active", true)
    .order("first_name", { ascending: true })

  if (error) throw error
  return (data || []) as UserWithRelations[]
}

// Get single user
export async function getUser(id: string): Promise<UserWithRelations | null> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("users") as any)
    .select(`
      *,
      role:roles(id, name)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data as UserWithRelations | null
}

// Get all teams
export async function getTeams(): Promise<TeamWithMembers[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("teams") as any)
    .select(`
      *,
      manager:users!teams_manager_id_fkey(id, first_name, last_name, email, avatar_url)
    `)
    .order("name", { ascending: true })

  if (error) throw error

  // Get members for each team
  const teams = (data || []) as TeamWithMembers[]

  for (const team of teams) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members } = await (supabase.from("team_members") as any)
      .select(`
        user:users(id, first_name, last_name, email, avatar_url, is_active)
      `)
      .eq("team_id", team.id)

    team.members = (members || [])
      .map((m: { user: UserWithRelations }) => m.user)
      .filter(Boolean)
  }

  return teams
}

// Get single team
export async function getTeam(id: string): Promise<TeamWithMembers | null> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: team, error } = await (supabase.from("teams") as any)
    .select(`
      *,
      manager:users!teams_manager_id_fkey(id, first_name, last_name, email, avatar_url)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  if (!team) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = await (supabase.from("team_members") as any)
    .select(`
      user:users(id, first_name, last_name, email, avatar_url, is_active)
    `)
    .eq("team_id", id)

  return {
    ...team,
    members: (members || [])
      .map((m: { user: UserWithRelations }) => m.user)
      .filter(Boolean),
  } as TeamWithMembers
}

// Get user metrics
export async function getUserMetrics(): Promise<{
  totalUsers: number
  activeUsers: number
  totalTeams: number
}> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalUsers } = await (supabase.from("users") as any)
    .select("*", { count: "exact", head: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: activeUsers } = await (supabase.from("users") as any)
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalTeams } = await (supabase.from("teams") as any)
    .select("*", { count: "exact", head: true })

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    totalTeams: totalTeams || 0,
  }
}

// Helper to get user initials
export function getUserInitials(
  firstName: string | null,
  lastName: string | null
): string {
  const first = firstName?.charAt(0)?.toUpperCase() || ""
  const last = lastName?.charAt(0)?.toUpperCase() || ""
  return first + last || "U"
}

// Helper to get user full name
export function getUserFullName(
  firstName: string | null,
  lastName: string | null
): string {
  return [firstName, lastName].filter(Boolean).join(" ") || "Usuario"
}
