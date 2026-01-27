import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"]
type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"]
type CampaignUpdate = Database["public"]["Tables"]["campaigns"]["Update"]
type Project = Database["public"]["Tables"]["projects"]["Row"]

export type CampaignPlatform = "facebook" | "google" | "instagram" | "tiktok"
export type CampaignStatus = "active" | "paused" | "completed" | "archived"

export type CampaignWithRelations = Campaign & {
  project?: Pick<Project, "id" | "name"> | null
}

// Get all campaigns with filters
export async function getCampaigns(filters?: {
  platform?: CampaignPlatform
  status?: CampaignStatus
  projectId?: string
  dateFrom?: string
  dateTo?: string
}): Promise<CampaignWithRelations[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("campaigns") as any).select(`
      *,
      project:projects(id, name)
    `)

  if (filters?.platform) {
    query = query.eq("platform", filters.platform)
  }

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId)
  }

  if (filters?.dateFrom) {
    query = query.gte("start_date", filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte("end_date", filters.dateTo)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return (data || []) as CampaignWithRelations[]
}

// Get single campaign
export async function getCampaign(id: string): Promise<CampaignWithRelations | null> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("campaigns") as any)
    .select(`
      *,
      project:projects(id, name)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data as CampaignWithRelations | null
}

// Create campaign
export async function createCampaign(campaign: CampaignInsert): Promise<Campaign> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("campaigns") as any)
    .insert(campaign)
    .select()
    .single()

  if (error) throw error
  return data as Campaign
}

// Update campaign
export async function updateCampaign(
  id: string,
  updates: CampaignUpdate
): Promise<Campaign> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("campaigns") as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Campaign
}

// Delete campaign
export async function deleteCampaign(id: string): Promise<void> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("campaigns") as any).delete().eq("id", id)

  if (error) throw error
}

// Get marketing metrics
export async function getMarketingMetrics(filters?: {
  projectId?: string
  dateFrom?: string
  dateTo?: string
}): Promise<{
  totalSpent: number
  totalLeads: number
  totalConversions: number
  avgCPL: number
  avgCPA: number
  totalImpressions: number
  totalClicks: number
  ctr: number
  byPlatform: {
    platform: string
    spent: number
    leads: number
    conversions: number
    cpl: number
  }[]
}> {
  const campaigns = await getCampaigns({
    projectId: filters?.projectId,
    dateFrom: filters?.dateFrom,
    dateTo: filters?.dateTo,
  })

  const activeCampaigns = campaigns.filter((c) => c.status !== "archived")

  const totalSpent = activeCampaigns.reduce((sum, c) => sum + (c.budget_spent || 0), 0)
  const totalLeads = activeCampaigns.reduce((sum, c) => sum + (c.leads_count || 0), 0)
  const totalConversions = activeCampaigns.reduce((sum, c) => sum + (c.conversions || 0), 0)
  const totalImpressions = activeCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0)
  const totalClicks = activeCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0)

  // Group by platform
  const platformMap = new Map<
    string,
    { spent: number; leads: number; conversions: number }
  >()

  activeCampaigns.forEach((c) => {
    const existing = platformMap.get(c.platform) || {
      spent: 0,
      leads: 0,
      conversions: 0,
    }
    platformMap.set(c.platform, {
      spent: existing.spent + (c.budget_spent || 0),
      leads: existing.leads + (c.leads_count || 0),
      conversions: existing.conversions + (c.conversions || 0),
    })
  })

  const byPlatform = Array.from(platformMap.entries()).map(([platform, data]) => ({
    platform,
    spent: data.spent,
    leads: data.leads,
    conversions: data.conversions,
    cpl: data.leads > 0 ? data.spent / data.leads : 0,
  }))

  return {
    totalSpent,
    totalLeads,
    totalConversions,
    avgCPL: totalLeads > 0 ? totalSpent / totalLeads : 0,
    avgCPA: totalConversions > 0 ? totalSpent / totalConversions : 0,
    totalImpressions,
    totalClicks,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    byPlatform,
  }
}

// Get top performing campaigns
export async function getTopCampaigns(
  limit: number = 5,
  metric: "leads" | "conversions" | "cpl" = "leads"
): Promise<CampaignWithRelations[]> {
  const campaigns = await getCampaigns({ status: "active" })

  // Sort by metric
  const sorted = [...campaigns].sort((a, b) => {
    switch (metric) {
      case "leads":
        return (b.leads_count || 0) - (a.leads_count || 0)
      case "conversions":
        return (b.conversions || 0) - (a.conversions || 0)
      case "cpl":
        const cplA =
          a.leads_count && a.leads_count > 0
            ? (a.budget_spent || 0) / a.leads_count
            : Infinity
        const cplB =
          b.leads_count && b.leads_count > 0
            ? (b.budget_spent || 0) / b.leads_count
            : Infinity
        return cplA - cplB // Lower is better
      default:
        return 0
    }
  })

  return sorted.slice(0, limit)
}

// Get leads by source attribution
export async function getLeadsBySource(): Promise<
  {
    source: string
    count: number
    percentage: number
  }[]
> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leads, error } = await (supabase.from("leads") as any)
    .select("source")
    .not("source", "is", null)

  if (error) throw error

  const sourceMap = new Map<string, number>()
  const leadsData = (leads || []) as { source: string }[]

  leadsData.forEach((lead) => {
    const source = lead.source || "unknown"
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
  })

  const total = leadsData.length

  return Array.from(sourceMap.entries())
    .map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

// Get campaign performance over time (for charts)
export async function getCampaignPerformanceHistory(
  campaignId: string,
  days: number = 30
): Promise<
  {
    date: string
    impressions: number
    clicks: number
    leads: number
    spent: number
  }[]
> {
  // Note: This would typically come from a campaign_daily_stats table
  // For now, we'll return a mock structure
  // TODO: Implement when daily stats table is created
  return []
}

// Pause campaign
export async function pauseCampaign(id: string): Promise<Campaign> {
  return updateCampaign(id, { status: "paused" })
}

// Resume campaign
export async function resumeCampaign(id: string): Promise<Campaign> {
  return updateCampaign(id, { status: "active" })
}

// Archive campaign
export async function archiveCampaign(id: string): Promise<Campaign> {
  return updateCampaign(id, { status: "archived" })
}

// Sync campaign metrics (placeholder for API integration)
export async function syncCampaignMetrics(id: string): Promise<Campaign> {
  // TODO: Implement Meta/Google Ads API integration
  // This would fetch real-time metrics from the ad platforms
  return updateCampaign(id, { last_sync_at: new Date().toISOString() })
}
