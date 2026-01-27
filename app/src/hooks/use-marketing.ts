"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getMarketingMetrics,
  getTopCampaigns,
  getLeadsBySource,
  pauseCampaign,
  resumeCampaign,
  archiveCampaign,
  syncCampaignMetrics,
  type CampaignWithRelations,
  type CampaignPlatform,
  type CampaignStatus,
} from "@/lib/services/marketing"
import type { Database } from "@/types/database"

type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"]
type CampaignUpdate = Database["public"]["Tables"]["campaigns"]["Update"]

// Query keys
export const marketingKeys = {
  all: ["marketing"] as const,
  campaigns: () => [...marketingKeys.all, "campaigns"] as const,
  campaign: (id: string) => [...marketingKeys.campaigns(), id] as const,
  campaignsList: (filters: Record<string, unknown>) =>
    [...marketingKeys.campaigns(), "list", filters] as const,
  metrics: (filters?: Record<string, unknown>) =>
    [...marketingKeys.all, "metrics", filters] as const,
  topCampaigns: (limit: number, metric: string) =>
    [...marketingKeys.all, "top", limit, metric] as const,
  leadsBySource: () => [...marketingKeys.all, "leads-by-source"] as const,
}

// ============================================
// Query Hooks
// ============================================

// Fetch campaigns with filters
export function useCampaigns(filters?: {
  platform?: CampaignPlatform
  status?: CampaignStatus
  projectId?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: marketingKeys.campaignsList(filters || {}),
    queryFn: () => getCampaigns(filters),
  })
}

// Fetch single campaign
export function useCampaign(id: string) {
  return useQuery({
    queryKey: marketingKeys.campaign(id),
    queryFn: () => getCampaign(id),
    enabled: !!id,
  })
}

// Fetch marketing metrics
export function useMarketingMetrics(filters?: {
  projectId?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: marketingKeys.metrics(filters),
    queryFn: () => getMarketingMetrics(filters),
  })
}

// Fetch top campaigns
export function useTopCampaigns(
  limit: number = 5,
  metric: "leads" | "conversions" | "cpl" = "leads"
) {
  return useQuery({
    queryKey: marketingKeys.topCampaigns(limit, metric),
    queryFn: () => getTopCampaigns(limit, metric),
  })
}

// Fetch leads by source
export function useLeadsBySource() {
  return useQuery({
    queryKey: marketingKeys.leadsBySource(),
    queryFn: getLeadsBySource,
  })
}

// ============================================
// Mutation Hooks
// ============================================

// Create campaign
export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (campaign: CampaignInsert) => createCampaign(campaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: marketingKeys.metrics() })
    },
  })
}

// Update campaign
export function useUpdateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CampaignUpdate }) =>
      updateCampaign(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() })
      queryClient.setQueryData(marketingKeys.campaign(data.id), data)
    },
  })
}

// Delete campaign
export function useDeleteCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: marketingKeys.metrics() })
    },
  })
}

// Pause campaign
export function usePauseCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => pauseCampaign(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() })
      queryClient.setQueryData(marketingKeys.campaign(data.id), data)
    },
  })
}

// Resume campaign
export function useResumeCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => resumeCampaign(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() })
      queryClient.setQueryData(marketingKeys.campaign(data.id), data)
    },
  })
}

// Archive campaign
export function useArchiveCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => archiveCampaign(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() })
      queryClient.setQueryData(marketingKeys.campaign(data.id), data)
    },
  })
}

// Sync campaign metrics
export function useSyncCampaignMetrics() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => syncCampaignMetrics(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: marketingKeys.metrics() })
      queryClient.setQueryData(marketingKeys.campaign(data.id), data)
    },
  })
}

// Re-export types
export type { CampaignWithRelations, CampaignPlatform, CampaignStatus }
