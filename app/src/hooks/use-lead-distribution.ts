"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getUserProjects,
  getUsersByProject,
  assignUserToProject,
  updateUserProject,
  removeUserFromProject,
  autoAssignLead,
  claimLeadFromPool,
  recordLeadContact,
  expireUnattendedLeads,
  getLeadAssignmentHistory,
  getSalesRepWorkload,
  getProjectDistributionStats,
  getPoolLeads,
  canUserClaimLead,
  isLeadPreviouslyAssigned,
  type UserProjectWithRelations,
  type LeadAssignmentHistoryWithRelations,
  type SalesRepWorkload,
} from "@/lib/services/lead-distribution"
import type { Database } from "@/types/database"

type UserProjectInsert = Database["public"]["Tables"]["user_projects"]["Insert"]
type UserProjectUpdate = Database["public"]["Tables"]["user_projects"]["Update"]

// Query keys
export const distributionKeys = {
  all: ["lead-distribution"] as const,
  userProjects: (userId?: string) => [...distributionKeys.all, "user-projects", userId] as const,
  projectUsers: (projectId: string) =>
    [...distributionKeys.all, "project-users", projectId] as const,
  history: (leadId: string) => [...distributionKeys.all, "history", leadId] as const,
  workload: (projectId?: string) => [...distributionKeys.all, "workload", projectId] as const,
  stats: (projectId: string) => [...distributionKeys.all, "stats", projectId] as const,
  poolLeads: (projectId?: string, userId?: string) =>
    [...distributionKeys.all, "pool", projectId, userId] as const,
}

// ============================================
// USER PROJECTS HOOKS
// ============================================

export function useUserProjects(userId?: string) {
  return useQuery({
    queryKey: distributionKeys.userProjects(userId),
    queryFn: () => getUserProjects(userId),
  })
}

export function useUsersByProject(projectId: string) {
  return useQuery({
    queryKey: distributionKeys.projectUsers(projectId),
    queryFn: () => getUsersByProject(projectId),
    enabled: !!projectId,
  })
}

export function useAssignUserToProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UserProjectInsert) => assignUserToProject(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.all })
    },
  })
}

export function useUpdateUserProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UserProjectUpdate }) =>
      updateUserProject(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.all })
    },
  })
}

export function useRemoveUserFromProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, projectId }: { userId: string; projectId: string }) =>
      removeUserFromProject(userId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.all })
    },
  })
}

// ============================================
// LEAD ASSIGNMENT HOOKS
// ============================================

export function useAutoAssignLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (leadId: string) => autoAssignLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      queryClient.invalidateQueries({ queryKey: distributionKeys.all })
    },
  })
}

export function useClaimLeadFromPool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leadId, userId }: { leadId: string; userId: string }) =>
      claimLeadFromPool(leadId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      queryClient.invalidateQueries({ queryKey: distributionKeys.all })
    },
  })
}

export function useRecordLeadContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      leadId,
      userId,
      newStatusId,
    }: {
      leadId: string
      userId: string
      newStatusId?: string
    }) => recordLeadContact(leadId, userId, newStatusId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      queryClient.invalidateQueries({ queryKey: distributionKeys.all })
    },
  })
}

export function useExpireUnattendedLeads() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => expireUnattendedLeads(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      queryClient.invalidateQueries({ queryKey: distributionKeys.all })
    },
  })
}

// ============================================
// HISTORY HOOKS
// ============================================

export function useLeadAssignmentHistory(leadId: string) {
  return useQuery({
    queryKey: distributionKeys.history(leadId),
    queryFn: () => getLeadAssignmentHistory(leadId),
    enabled: !!leadId,
  })
}

export function useIsLeadPreviouslyAssigned(leadId: string) {
  return useQuery({
    queryKey: [...distributionKeys.history(leadId), "check"],
    queryFn: () => isLeadPreviouslyAssigned(leadId),
    enabled: !!leadId,
  })
}

// ============================================
// WORKLOAD & STATS HOOKS
// ============================================

export function useSalesRepWorkload(projectId?: string) {
  return useQuery({
    queryKey: distributionKeys.workload(projectId),
    queryFn: () => getSalesRepWorkload(projectId),
  })
}

export function useProjectDistributionStats(projectId: string) {
  return useQuery({
    queryKey: distributionKeys.stats(projectId),
    queryFn: () => getProjectDistributionStats(projectId),
    enabled: !!projectId,
  })
}

// ============================================
// POOL HOOKS
// ============================================

export function usePoolLeads(projectId?: string, userId?: string) {
  return useQuery({
    queryKey: distributionKeys.poolLeads(projectId, userId),
    queryFn: () => getPoolLeads(projectId, userId),
  })
}

export function useCanUserClaimLead(userId: string, leadId: string) {
  return useQuery({
    queryKey: [...distributionKeys.all, "can-claim", userId, leadId],
    queryFn: () => canUserClaimLead(userId, leadId),
    enabled: !!userId && !!leadId,
  })
}

// Re-export types
export type { UserProjectWithRelations, LeadAssignmentHistoryWithRelations, SalesRepWorkload }
