"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getCreditChecks,
  getCreditCheck,
  getCreditCheckByLead,
  createCreditCheck,
  updateCreditCheck,
  verifyAPC,
  verifyIncome,
  updatePrequalification,
  updateFormalApproval,
  setCreditCheckResult,
  deleteCreditCheck,
  getCreditCheckMetrics,
  getTramiteStage,
  type CreditCheckWithRelations,
  type APCStatus,
  type EmploymentType,
  type CreditCheckResult,
  type TramiteStage,
} from "@/lib/services/credit-checks"
import type { Database } from "@/types/database"

type CreditCheckInsert = Database["public"]["Tables"]["credit_checks"]["Insert"]
type CreditCheckUpdate = Database["public"]["Tables"]["credit_checks"]["Update"]

// Query keys
export const creditCheckKeys = {
  all: ["credit-checks"] as const,
  lists: () => [...creditCheckKeys.all, "list"] as const,
  list: (filters?: { result?: CreditCheckResult; apcStatus?: APCStatus; prequalified?: boolean; projectId?: string; stage?: TramiteStage }) =>
    [...creditCheckKeys.lists(), filters] as const,
  details: () => [...creditCheckKeys.all, "detail"] as const,
  detail: (id: string) => [...creditCheckKeys.details(), id] as const,
  byLead: (leadId: string) => [...creditCheckKeys.all, "lead", leadId] as const,
  metrics: () => [...creditCheckKeys.all, "metrics"] as const,
}

// ============================================
// Query Hooks
// ============================================

export function useCreditChecks(filters?: {
  result?: CreditCheckResult
  apcStatus?: APCStatus
  prequalified?: boolean
  projectId?: string
  stage?: TramiteStage
}) {
  return useQuery({
    queryKey: creditCheckKeys.list(filters),
    queryFn: () => getCreditChecks(filters),
  })
}

export function useCreditCheck(id: string) {
  return useQuery({
    queryKey: creditCheckKeys.detail(id),
    queryFn: () => getCreditCheck(id),
    enabled: !!id,
  })
}

export function useCreditCheckByLead(leadId: string) {
  return useQuery({
    queryKey: creditCheckKeys.byLead(leadId),
    queryFn: () => getCreditCheckByLead(leadId),
    enabled: !!leadId,
  })
}

export function useCreditCheckMetrics() {
  return useQuery({
    queryKey: creditCheckKeys.metrics(),
    queryFn: getCreditCheckMetrics,
  })
}

// ============================================
// Mutation Hooks
// ============================================

export function useCreateCreditCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (creditCheck: CreditCheckInsert) => createCreditCheck(creditCheck),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.lists() })
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.byLead(data.lead_id) })
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.metrics() })
    },
  })
}

export function useUpdateCreditCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CreditCheckUpdate }) =>
      updateCreditCheck(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.lists() })
      queryClient.setQueryData(creditCheckKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.byLead(data.lead_id) })
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.metrics() })
    },
  })
}

export function useVerifyAPC() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      apcData,
    }: {
      id: string
      apcData: {
        apc_status: APCStatus
        apc_score?: number
        apc_notes?: string
        verified_by?: string
      }
    }) => verifyAPC(id, apcData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.lists() })
      queryClient.setQueryData(creditCheckKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.byLead(data.lead_id) })
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.metrics() })
    },
  })
}

export function useVerifyIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      incomeData,
    }: {
      id: string
      incomeData: {
        monthly_income: number
        employment_type: EmploymentType
        employer_name?: string
      }
    }) => verifyIncome(id, incomeData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.lists() })
      queryClient.setQueryData(creditCheckKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.byLead(data.lead_id) })
    },
  })
}

export function useUpdatePrequalification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      prequalData,
    }: {
      id: string
      prequalData: {
        bank_name: string
        prequalified: boolean
        prequalified_amount?: number
        prequalified_rate?: number
        prequalified_term_months?: number
        prequalification_notes?: string
      }
    }) => updatePrequalification(id, prequalData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.lists() })
      queryClient.setQueryData(creditCheckKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.byLead(data.lead_id) })
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.metrics() })
    },
  })
}

export function useUpdateFormalApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      approvalData,
    }: {
      id: string
      approvalData: {
        formal_approval: boolean
        formal_approval_amount?: number
        formal_approval_notes?: string
      }
    }) => updateFormalApproval(id, approvalData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.lists() })
      queryClient.setQueryData(creditCheckKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.byLead(data.lead_id) })
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.metrics() })
    },
  })
}

export function useSetCreditCheckResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      result,
      rejectionReason,
    }: {
      id: string
      result: CreditCheckResult
      rejectionReason?: string
    }) => setCreditCheckResult(id, result, rejectionReason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.lists() })
      queryClient.setQueryData(creditCheckKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.byLead(data.lead_id) })
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.metrics() })
    },
  })
}

export function useDeleteCreditCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, leadId }: { id: string; leadId: string }) => deleteCreditCheck(id),
    onSuccess: (_data, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.lists() })
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.byLead(leadId) })
      queryClient.invalidateQueries({ queryKey: creditCheckKeys.metrics() })
    },
  })
}

// Re-export types and helpers
export { getTramiteStage }
export type { CreditCheckWithRelations, APCStatus, EmploymentType, CreditCheckResult, TramiteStage }
