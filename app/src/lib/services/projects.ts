import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type Project = Database["public"]["Tables"]["projects"]["Row"]
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"]
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"]
type UnitType = Database["public"]["Tables"]["unit_types"]["Row"]

export type ProjectWithStats = Project & {
  unit_types?: UnitType[]
  units_count?: number
  available_count?: number
  reserved_count?: number
  sold_count?: number
}

// Get all projects with stats
export async function getProjects(): Promise<ProjectWithStats[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("projects") as any)
    .select(`
      *,
      unit_types(*),
      units(id, status)
    `)
    .order("created_at", { ascending: false })

  if (error) throw error

  // Calculate stats for each project
  return (data || []).map((project: Project & { unit_types?: UnitType[]; units?: { id: string; status: string }[] }) => {
    const units = project.units || []
    return {
      ...project,
      unit_types: project.unit_types,
      units_count: units.length,
      available_count: units.filter((u) => u.status === "available").length,
      reserved_count: units.filter((u) => u.status === "reserved").length,
      sold_count: units.filter((u) => u.status === "sold").length,
      units: undefined,
    } as ProjectWithStats
  })
}

// Get single project with details
export async function getProject(id: string): Promise<ProjectWithStats | null> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("projects") as any)
    .select(`
      *,
      unit_types(*),
      units(id, status)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  if (!data) return null

  const project = data as Project & { unit_types?: UnitType[]; units?: { id: string; status: string }[] }
  const units = project.units || []
  return {
    ...project,
    unit_types: project.unit_types,
    units_count: units.length,
    available_count: units.filter((u) => u.status === "available").length,
    reserved_count: units.filter((u) => u.status === "reserved").length,
    sold_count: units.filter((u) => u.status === "sold").length,
    units: undefined,
  } as ProjectWithStats
}

// Create project
export async function createProject(project: ProjectInsert): Promise<Project> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("projects") as any)
    .insert(project)
    .select()
    .single()

  if (error) throw error
  return data as Project
}

// Update project
export async function updateProject(
  id: string,
  updates: ProjectUpdate
): Promise<Project> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("projects") as any)
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Project
}

// Delete project
export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("projects") as any).delete().eq("id", id)

  if (error) throw error
}

// Get project metrics summary
export async function getProjectsMetrics(): Promise<{
  totalProjects: number
  activeProjects: number
  totalUnits: number
  availableUnits: number
  reservedUnits: number
  soldUnits: number
}> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: projects, error: projectsError } = await (supabase
    .from("projects") as any)
    .select("id, status")

  if (projectsError) throw projectsError

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: units, error: unitsError } = await (supabase
    .from("units") as any)
    .select("id, status")

  if (unitsError) throw unitsError

  return {
    totalProjects: projects?.length || 0,
    activeProjects: projects?.filter((p: { status: string }) => p.status === "active").length || 0,
    totalUnits: units?.length || 0,
    availableUnits: units?.filter((u: { status: string }) => u.status === "available").length || 0,
    reservedUnits: units?.filter((u: { status: string }) => u.status === "reserved").length || 0,
    soldUnits: units?.filter((u: { status: string }) => u.status === "sold").length || 0,
  }
}

// Unit Types
export async function getUnitTypesByProject(projectId: string): Promise<UnitType[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("unit_types") as any)
    .select("*")
    .eq("project_id", projectId)
    .order("bedrooms", { ascending: true })

  if (error) throw error
  return (data || []) as UnitType[]
}

export async function createUnitType(
  unitType: Database["public"]["Tables"]["unit_types"]["Insert"]
): Promise<UnitType> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("unit_types") as any)
    .insert(unitType)
    .select()
    .single()

  if (error) throw error
  return data as UnitType
}

export async function updateUnitType(
  id: string,
  updates: Database["public"]["Tables"]["unit_types"]["Update"]
): Promise<UnitType> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("unit_types") as any)
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as UnitType
}

export async function deleteUnitType(id: string): Promise<void> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("unit_types") as any).delete().eq("id", id)

  if (error) throw error
}
