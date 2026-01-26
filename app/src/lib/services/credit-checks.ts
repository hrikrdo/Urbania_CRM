import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type CreditCheck = Database["public"]["Tables"]["credit_checks"]["Row"]
type CreditCheckInsert = Database["public"]["Tables"]["credit_checks"]["Insert"]
type CreditCheckUpdate = Database["public"]["Tables"]["credit_checks"]["Update"]
type Lead = Database["public"]["Tables"]["leads"]["Row"]
type User = Database["public"]["Tables"]["users"]["Row"]
type Project = Database["public"]["Tables"]["projects"]["Row"]

export type APCStatus = "good" | "fair" | "bad" | "no_history"
export type EmploymentType = "employed" | "self_employed" | "retired" | "other"
export type CreditCheckResult = "approved" | "rejected" | "pending" | "needs_cosigner"

// Tramite stages for the Kanban
export type TramiteStage = "apc_pending" | "income_pending" | "bank_pending" | "formal_pending" | "approved" | "rejected"

export type CreditCheckWithRelations = CreditCheck & {
  lead?: Pick<Lead, "id" | "first_name" | "last_name" | "email" | "phone" | "cedula" | "project_id"> & {
    project?: Pick<Project, "id" | "name"> | null
  } | null
  verified_by_user?: Pick<User, "id" | "first_name" | "last_name"> | null
}

// Get all credit checks with filters
export async function getCreditChecks(filters?: {
  result?: CreditCheckResult
  apcStatus?: APCStatus
  prequalified?: boolean
  projectId?: string
  stage?: TramiteStage
}): Promise<CreditCheckWithRelations[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("credit_checks") as any)
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone, cedula, project_id, project:projects(id, name)),
      verified_by_user:users!verified_by(id, first_name, last_name)
    `)

  if (filters?.result) {
    query = query.eq("result", filters.result)
  }

  if (filters?.apcStatus) {
    query = query.eq("apc_status", filters.apcStatus)
  }

  if (filters?.prequalified !== undefined) {
    query = query.eq("prequalified", filters.prequalified)
  }

  if (filters?.projectId) {
    query = query.eq("lead.project_id", filters.projectId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error

  let results = (data || []) as CreditCheckWithRelations[]

  // Filter by project_id (need to do this client-side since Supabase doesn't support nested filters well)
  if (filters?.projectId) {
    results = results.filter(check => check.lead?.project_id === filters.projectId)
  }

  // Filter by stage (computed field, must be done client-side)
  if (filters?.stage) {
    results = results.filter(check => getTramiteStage(check) === filters.stage)
  }

  return results
}

// Helper function to determine which stage a credit check belongs to
export function getTramiteStage(check: CreditCheckWithRelations): TramiteStage {
  // Final states first
  if (check.result === "approved") return "approved"
  if (check.result === "rejected") return "rejected"

  // Process stages
  if (!check.apc_status) return "apc_pending"
  if (!check.income_verified) return "income_pending"
  if (check.prequalified === null) return "bank_pending"
  if (check.formal_approval === null) return "formal_pending"

  // Default to formal pending if prequalified but not formally approved
  return "formal_pending"
}

// Get credit check by ID
export async function getCreditCheck(id: string): Promise<CreditCheckWithRelations | null> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("credit_checks") as any)
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone, cedula, project_id, project:projects(id, name)),
      verified_by_user:users!verified_by(id, first_name, last_name)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data as CreditCheckWithRelations | null
}

// Get credit check by lead ID
export async function getCreditCheckByLead(leadId: string): Promise<CreditCheckWithRelations | null> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("credit_checks") as any)
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone, cedula, project_id, project:projects(id, name)),
      verified_by_user:users!verified_by(id, first_name, last_name)
    `)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== "PGRST116") throw error // PGRST116 = no rows
  return data as CreditCheckWithRelations | null
}

// Create credit check
export async function createCreditCheck(creditCheck: CreditCheckInsert): Promise<CreditCheck> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("credit_checks") as any)
    .insert(creditCheck)
    .select()
    .single()

  if (error) throw error
  return data as CreditCheck
}

// Update credit check
export async function updateCreditCheck(
  id: string,
  updates: CreditCheckUpdate
): Promise<CreditCheck> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("credit_checks") as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as CreditCheck
}

// Verify APC (update APC-related fields)
export async function verifyAPC(
  id: string,
  apcData: {
    apc_status: APCStatus
    apc_score?: number
    apc_notes?: string
    verified_by?: string
  }
): Promise<CreditCheck> {
  return updateCreditCheck(id, {
    ...apcData,
    apc_verified_at: new Date().toISOString(),
  })
}

// Update income verification
export async function verifyIncome(
  id: string,
  incomeData: {
    monthly_income: number
    employment_type: EmploymentType
    employer_name?: string
  }
): Promise<CreditCheck> {
  return updateCreditCheck(id, {
    ...incomeData,
    income_verified: true,
  })
}

// Update bank prequalification
export async function updatePrequalification(
  id: string,
  prequalData: {
    bank_name: string
    prequalified: boolean
    prequalified_amount?: number
    prequalified_rate?: number
    prequalified_term_months?: number
    prequalification_notes?: string
  }
): Promise<CreditCheck> {
  // Calculate estimated monthly payment if we have the required data
  let estimated_monthly_payment: number | undefined
  if (prequalData.prequalified && prequalData.prequalified_amount && prequalData.prequalified_rate && prequalData.prequalified_term_months) {
    estimated_monthly_payment = calculateMonthlyPayment(
      prequalData.prequalified_amount,
      prequalData.prequalified_rate,
      prequalData.prequalified_term_months
    )
  }

  return updateCreditCheck(id, {
    ...prequalData,
    estimated_monthly_payment,
    prequalification_date: new Date().toISOString(),
    // Prequalification typically expires in 90 days
    prequalification_expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  })
}

// Update formal approval
export async function updateFormalApproval(
  id: string,
  approvalData: {
    formal_approval: boolean
    formal_approval_amount?: number
    formal_approval_notes?: string
  }
): Promise<CreditCheck> {
  return updateCreditCheck(id, {
    ...approvalData,
    formal_approval_date: new Date().toISOString(),
    result: approvalData.formal_approval ? "approved" : "rejected",
  })
}

// Set result (approve/reject)
export async function setCreditCheckResult(
  id: string,
  result: CreditCheckResult,
  rejectionReason?: string
): Promise<CreditCheck> {
  return updateCreditCheck(id, {
    result,
    rejection_reason: result === "rejected" ? rejectionReason : null,
  })
}

// Delete credit check
export async function deleteCreditCheck(id: string): Promise<void> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("credit_checks") as any).delete().eq("id", id)

  if (error) throw error
}

// Get credit check metrics
export async function getCreditCheckMetrics(): Promise<{
  total: number
  pending: number
  approved: number
  rejected: number
  needsCosigner: number
  avgScore: number
  prequalifiedCount: number
  formallyApprovedCount: number
}> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("credit_checks") as any)
    .select("result, apc_score, prequalified, formal_approval")

  if (error) throw error

  const checks = (data || []) as { result: string | null; apc_score: number | null; prequalified: boolean | null; formal_approval: boolean | null }[]
  const scores = checks.filter(c => c.apc_score !== null).map(c => c.apc_score as number)

  return {
    total: checks.length,
    pending: checks.filter(c => c.result === "pending" || c.result === null).length,
    approved: checks.filter(c => c.result === "approved").length,
    rejected: checks.filter(c => c.result === "rejected").length,
    needsCosigner: checks.filter(c => c.result === "needs_cosigner").length,
    avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    prequalifiedCount: checks.filter(c => c.prequalified === true).length,
    formallyApprovedCount: checks.filter(c => c.formal_approval === true).length,
  }
}

// Helper function to calculate monthly payment
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  const monthlyRate = annualRate / 100 / 12
  if (monthlyRate === 0) return principal / termMonths

  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1)

  return Math.round(payment * 100) / 100
}

// Helper function to determine if lead qualifies based on income
export function checkIncomeQualification(
  monthlyIncome: number,
  estimatedPayment: number,
  maxDebtRatio: number = 0.35 // 35% is typical for Panama
): { qualifies: boolean; debtRatio: number; maxPayment: number } {
  const maxPayment = monthlyIncome * maxDebtRatio
  const debtRatio = estimatedPayment / monthlyIncome

  return {
    qualifies: estimatedPayment <= maxPayment,
    debtRatio: Math.round(debtRatio * 100) / 100,
    maxPayment: Math.round(maxPayment * 100) / 100,
  }
}
