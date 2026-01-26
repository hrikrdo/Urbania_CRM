import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type Unit = Database["public"]["Tables"]["units"]["Row"]
type UnitInsert = Database["public"]["Tables"]["units"]["Insert"]
type UnitUpdate = Database["public"]["Tables"]["units"]["Update"]
type Project = Database["public"]["Tables"]["projects"]["Row"]
type UnitType = Database["public"]["Tables"]["unit_types"]["Row"]
type Lead = Database["public"]["Tables"]["leads"]["Row"]

export type UnitStatus = "available" | "reserved" | "sold" | "blocked"

export type UnitWithRelations = Unit & {
  project?: Project
  unit_type?: UnitType | null
  reserved_lead?: Pick<Lead, "id" | "first_name" | "last_name" | "email" | "phone"> | null
}

// Get units by project
export async function getUnitsByProject(
  projectId: string,
  filters?: {
    status?: UnitStatus
    floor?: number
    unitTypeId?: string
  }
): Promise<UnitWithRelations[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("units") as any)
    .select(`
      *,
      project:projects(*),
      unit_type:unit_types(*),
      reserved_lead:leads!reserved_by(id, first_name, last_name, email, phone)
    `)
    .eq("project_id", projectId)

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.floor) {
    query = query.eq("floor", filters.floor)
  }

  if (filters?.unitTypeId) {
    query = query.eq("unit_type_id", filters.unitTypeId)
  }

  const { data, error } = await query.order("floor").order("unit_number")

  if (error) throw error
  return (data || []) as UnitWithRelations[]
}

// Get single unit
export async function getUnit(id: string): Promise<UnitWithRelations | null> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("units") as any)
    .select(`
      *,
      project:projects(*),
      unit_type:unit_types(*),
      reserved_lead:leads!reserved_by(id, first_name, last_name, email, phone)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data as UnitWithRelations | null
}

// Create unit
export async function createUnit(unit: UnitInsert): Promise<Unit> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("units") as any)
    .insert(unit)
    .select()
    .single()

  if (error) throw error

  // Update project available_units count
  await updateProjectUnitCounts(unit.project_id)

  return data as Unit
}

// Update unit
export async function updateUnit(id: string, updates: UnitUpdate): Promise<Unit> {
  const supabase = createClient()

  // Get current unit to check project_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentUnit } = await (supabase
    .from("units") as any)
    .select("project_id")
    .eq("id", id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("units") as any)
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error

  // Update project counts if status changed
  if (currentUnit?.project_id) {
    await updateProjectUnitCounts(currentUnit.project_id)
  }

  return data as Unit
}

// Delete unit
export async function deleteUnit(id: string): Promise<void> {
  const supabase = createClient()

  // Get project_id before deleting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: unit } = await (supabase
    .from("units") as any)
    .select("project_id")
    .eq("id", id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("units") as any).delete().eq("id", id)

  if (error) throw error

  // Update project counts
  if (unit?.project_id) {
    await updateProjectUnitCounts(unit.project_id)
  }
}

// Reserve unit for a lead
export async function reserveUnit(
  unitId: string,
  leadId: string
): Promise<Unit> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("units") as any)
    .update({
      status: "reserved",
      reserved_by: leadId,
      reserved_at: new Date().toISOString(),
    })
    .eq("id", unitId)
    .eq("status", "available") // Only reserve if currently available
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error("Unidad no disponible para reservar")

  // Get project_id and update counts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: unit } = await (supabase
    .from("units") as any)
    .select("project_id")
    .eq("id", unitId)
    .single()

  if (unit?.project_id) {
    await updateProjectUnitCounts(unit.project_id)
  }

  return data as Unit
}

// Release reservation
export async function releaseUnit(unitId: string): Promise<Unit> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("units") as any)
    .update({
      status: "available",
      reserved_by: null,
      reserved_at: null,
    })
    .eq("id", unitId)
    .select()
    .single()

  if (error) throw error

  // Get project_id and update counts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: unit } = await (supabase
    .from("units") as any)
    .select("project_id")
    .eq("id", unitId)
    .single()

  if (unit?.project_id) {
    await updateProjectUnitCounts(unit.project_id)
  }

  return data as Unit
}

// Mark unit as sold
export async function markUnitAsSold(unitId: string): Promise<Unit> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("units") as any)
    .update({
      status: "sold",
      sold_at: new Date().toISOString(),
    })
    .eq("id", unitId)
    .select()
    .single()

  if (error) throw error

  // Get project_id and update counts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: unit } = await (supabase
    .from("units") as any)
    .select("project_id")
    .eq("id", unitId)
    .single()

  if (unit?.project_id) {
    await updateProjectUnitCounts(unit.project_id)
  }

  return data as Unit
}

// Block/unblock unit
export async function toggleUnitBlock(
  unitId: string,
  blocked: boolean
): Promise<Unit> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("units") as any)
    .update({
      status: blocked ? "blocked" : "available",
    })
    .eq("id", unitId)
    .select()
    .single()

  if (error) throw error

  // Get project_id and update counts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: unit } = await (supabase
    .from("units") as any)
    .select("project_id")
    .eq("id", unitId)
    .single()

  if (unit?.project_id) {
    await updateProjectUnitCounts(unit.project_id)
  }

  return data as Unit
}

// Get available units for a project (for reservation selector)
export async function getAvailableUnits(projectId: string): Promise<Unit[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("units") as any)
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "available")
    .order("floor")
    .order("unit_number")

  if (error) throw error
  return (data || []) as Unit[]
}

// Get floors for a project (for filtering)
export async function getProjectFloors(projectId: string): Promise<number[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("units") as any)
    .select("floor")
    .eq("project_id", projectId)
    .not("floor", "is", null)

  if (error) throw error

  const floors = [...new Set((data || []).map((u: { floor: number }) => u.floor).filter(Boolean) as number[])]
  return floors.sort((a, b) => a - b)
}

// Helper to update project unit counts
async function updateProjectUnitCounts(projectId: string): Promise<void> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: units } = await (supabase
    .from("units") as any)
    .select("status")
    .eq("project_id", projectId)

  if (units) {
    const totalUnits = units.length
    const availableUnits = units.filter((u: { status: string }) => u.status === "available").length

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase
      .from("projects") as any)
      .update({
        total_units: totalUnits,
        available_units: availableUnits,
      })
      .eq("id", projectId)
  }
}

// Bulk create units (for initial setup)
export async function bulkCreateUnits(
  projectId: string,
  units: Omit<UnitInsert, "project_id">[]
): Promise<Unit[]> {
  const supabase = createClient()

  const unitsWithProject = units.map((unit) => ({
    ...unit,
    project_id: projectId,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("units") as any)
    .insert(unitsWithProject)
    .select()

  if (error) throw error

  // Update project counts
  await updateProjectUnitCounts(projectId)

  return (data || []) as Unit[]
}
