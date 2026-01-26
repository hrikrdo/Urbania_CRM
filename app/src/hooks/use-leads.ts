"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getLeads,
  getLeadStatuses,
  getLeadsForKanban,
  getLead,
  createLead,
  updateLead,
  updateLeadStatus,
  assignLead,
  sendToPool,
  getPoolLeads,
  claimFromPool,
  deleteLead,
  getUsers,
  getProjects,
  getLeadMetrics,
  getLeadsByDate,
  markLeadExpired,
  extendLeadDeadline,
  clearLeadDeadline,
  getExpiringLeads,
  type LeadWithRelations,
  type KanbanColumn,
  type DashboardFilters,
  type DashboardMetrics
} from "@/lib/services/leads"
import type { Database } from "@/types/database"

type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"]
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"]

// Query keys
export const leadKeys = {
  all: ["leads"] as const,
  lists: () => [...leadKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...leadKeys.lists(), filters] as const,
  kanban: (module: string) => [...leadKeys.all, "kanban", module] as const,
  pool: () => [...leadKeys.all, "pool"] as const,
  details: () => [...leadKeys.all, "detail"] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
  statuses: (module?: string) => ["lead_statuses", module] as const,
  users: () => ["users"] as const,
  projects: () => ["projects"] as const,
  metrics: () => [...leadKeys.all, "metrics"] as const,
  expiring: () => [...leadKeys.all, "expiring"] as const,
}

// Fetch leads with optional filters
export function useLeads(filters?: {
  status_id?: string
  assigned_to?: string
  project_id?: string
  search?: string
}) {
  return useQuery({
    queryKey: leadKeys.list(filters || {}),
    queryFn: () => getLeads(filters),
  })
}

// Fetch lead statuses
export function useLeadStatuses(module?: string) {
  return useQuery({
    queryKey: leadKeys.statuses(module),
    queryFn: () => getLeadStatuses(module),
  })
}

// Fetch leads for kanban board
export function useKanbanLeads(module: string = "comercial") {
  return useQuery({
    queryKey: leadKeys.kanban(module),
    queryFn: () => getLeadsForKanban(module),
  })
}

// Fetch pool leads
export function usePoolLeads() {
  return useQuery({
    queryKey: leadKeys.pool(),
    queryFn: () => getPoolLeads(),
  })
}

// Fetch single lead
export function useLead(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => getLead(id),
    enabled: !!id,
  })
}

// Fetch users for assignment
export function useUsers() {
  return useQuery({
    queryKey: leadKeys.users(),
    queryFn: () => getUsers(),
  })
}

// Fetch projects for filters
export function useProjects() {
  return useQuery({
    queryKey: leadKeys.projects(),
    queryFn: () => getProjects(),
  })
}

// Create lead mutation
export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (lead: LeadInsert) => createLead(lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
    },
  })
}

// Update lead mutation
export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: LeadUpdate }) =>
      updateLead(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
      queryClient.setQueryData(leadKeys.detail(data.id), data)
    },
  })
}

// Update lead status mutation (for kanban)
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leadId, statusId }: { leadId: string; statusId: string }) =>
      updateLeadStatus(leadId, statusId),
    onMutate: async ({ leadId, statusId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: leadKeys.all })

      // Snapshot the previous kanban state
      const previousKanban = queryClient.getQueryData<KanbanColumn[]>(
        leadKeys.kanban("comercial")
      )

      // Optimistically update the kanban
      if (previousKanban) {
        const updatedKanban = previousKanban.map((column) => {
          // Remove lead from current column
          const filteredLeads = column.leads.filter((l) => l.id !== leadId)

          // Add lead to new column if this is the target
          if (column.id === statusId) {
            const leadToMove = previousKanban
              .flatMap((c) => c.leads)
              .find((l) => l.id === leadId)
            if (leadToMove) {
              return {
                ...column,
                leads: [{ ...leadToMove, status_id: statusId }, ...filteredLeads],
              }
            }
          }

          return { ...column, leads: filteredLeads }
        })

        queryClient.setQueryData(leadKeys.kanban("comercial"), updatedKanban)
      }

      return { previousKanban }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousKanban) {
        queryClient.setQueryData(leadKeys.kanban("comercial"), context.previousKanban)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
    },
  })
}

// Assign lead mutation
export function useAssignLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leadId, userId }: { leadId: string; userId: string | null }) =>
      assignLead(leadId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
    },
  })
}

// Send to pool mutation
export function useSendToPool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (leadId: string) => sendToPool(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
    },
  })
}

// Claim from pool mutation
export function useClaimFromPool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leadId, userId }: { leadId: string; userId: string }) =>
      claimFromPool(leadId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
    },
  })
}

// Delete lead mutation
export function useDeleteLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
    },
  })
}

// Fetch lead metrics for dashboard with filters
export function useLeadMetrics(filters?: DashboardFilters) {
  return useQuery({
    queryKey: [...leadKeys.metrics(), filters],
    queryFn: () => getLeadMetrics(filters),
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

// Fetch leads by date for chart
export function useLeadsByDate(filters?: DashboardFilters) {
  return useQuery({
    queryKey: [...leadKeys.all, "by-date", filters],
    queryFn: () => getLeadsByDate(filters),
    refetchInterval: 60000, // Refresh every minute
  })
}

// Re-export types
export type { DashboardFilters, DashboardMetrics }

// Fetch expiring leads (for notifications)
export function useExpiringLeads(minutesThreshold: number = 5) {
  return useQuery({
    queryKey: leadKeys.expiring(),
    queryFn: () => getExpiringLeads(minutesThreshold),
    refetchInterval: 60000, // Refresh every minute
  })
}

// Mark lead as expired
export function useMarkLeadExpired() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (leadId: string) => markLeadExpired(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
    },
  })
}

// Extend lead deadline
export function useExtendLeadDeadline() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leadId, additionalMinutes }: { leadId: string; additionalMinutes?: number }) =>
      extendLeadDeadline(leadId, additionalMinutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
    },
  })
}

// Clear lead deadline (when attending)
export function useClearLeadDeadline() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (leadId: string) => clearLeadDeadline(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
    },
  })
}
