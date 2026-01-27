"use client"

import { useState } from "react"
import {
  IconBrandFacebook,
  IconBrandGoogle,
  IconBrandInstagram,
  IconBrandTiktok,
  IconCurrencyDollar,
  IconUsers,
  IconTarget,
  IconTrendingUp,
  IconEye,
  IconClick,
  IconPercentage,
  IconLoader2,
  IconPlus,
  IconRefresh,
  IconPlayerPause,
  IconPlayerPlay,
  IconArchive,
  IconDotsVertical,
  IconChartBar,
  IconFilter,
} from "@tabler/icons-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import {
  useCampaigns,
  useMarketingMetrics,
  useTopCampaigns,
  useLeadsBySource,
  usePauseCampaign,
  useResumeCampaign,
  useArchiveCampaign,
  useSyncCampaignMetrics,
  type CampaignPlatform,
  type CampaignStatus,
} from "@/hooks/use-marketing"
import { useProjects } from "@/hooks/use-leads"
import { ModuleHeader } from "@/components/module-header"
import { CreateCampaignDialog } from "@/components/marketing"

const platformConfig: Record<
  CampaignPlatform,
  { label: string; icon: typeof IconBrandFacebook; color: string; bgColor: string }
> = {
  facebook: {
    label: "Facebook",
    icon: IconBrandFacebook,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  google: {
    label: "Google",
    icon: IconBrandGoogle,
    color: "text-red-500",
    bgColor: "bg-red-100",
  },
  instagram: {
    label: "Instagram",
    icon: IconBrandInstagram,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
  tiktok: {
    label: "TikTok",
    icon: IconBrandTiktok,
    color: "text-foreground",
    bgColor: "bg-muted",
  },
}

const statusConfig: Record<
  CampaignStatus,
  { label: string; color: string; bgColor: string }
> = {
  active: { label: "Activa", color: "text-chart-2", bgColor: "bg-chart-2/10" },
  paused: { label: "Pausada", color: "text-chart-4", bgColor: "bg-chart-4/10" },
  completed: { label: "Completada", color: "text-primary", bgColor: "bg-primary/10" },
  archived: { label: "Archivada", color: "text-muted-foreground", bgColor: "bg-muted" },
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-PA", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export default function MarketingPage() {
  const [platformFilter, setPlatformFilter] = useState<CampaignPlatform | "all">("all")
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const { data: projects } = useProjects()
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns({
    platform: platformFilter !== "all" ? platformFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    projectId: projectFilter !== "all" ? projectFilter : undefined,
  })
  const { data: metrics, isLoading: metricsLoading } = useMarketingMetrics({
    projectId: projectFilter !== "all" ? projectFilter : undefined,
  })
  const { data: topCampaigns } = useTopCampaigns(5, "leads")
  const { data: leadsBySource } = useLeadsBySource()

  const pauseMutation = usePauseCampaign()
  const resumeMutation = useResumeCampaign()
  const archiveMutation = useArchiveCampaign()
  const syncMutation = useSyncCampaignMetrics()

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <ModuleHeader
        title="Marketing"
        description="Analiza el rendimiento de tus campañas publicitarias"
      >
        <Button onClick={() => setShowCreateDialog(true)}>
          <IconPlus className="size-4 mr-2" />
          Nueva Campaña
        </Button>
      </ModuleHeader>

      <CreateCampaignDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inversión Total
            </CardTitle>
            <IconCurrencyDollar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics?.totalSpent || 0)}
                </div>
                <p className="text-xs text-muted-foreground">en campañas activas</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads Generados
            </CardTitle>
            <IconUsers className="size-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics?.totalLeads || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  CPL: {formatCurrency(metrics?.avgCPL || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversiones
            </CardTitle>
            <IconTarget className="size-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics?.totalConversions || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  CPA: {formatCurrency(metrics?.avgCPA || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CTR
            </CardTitle>
            <IconPercentage className="size-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(metrics?.ctr || 0).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(metrics?.totalClicks || 0)} clics /{" "}
                  {formatNumber(metrics?.totalImpressions || 0)} impresiones
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaigns Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <IconChartBar className="size-5" />
                  Campañas
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={platformFilter}
                    onValueChange={(v) => setPlatformFilter(v as CampaignPlatform | "all")}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as CampaignStatus | "all")}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activas</SelectItem>
                      <SelectItem value="paused">Pausadas</SelectItem>
                      <SelectItem value="completed">Completadas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : campaigns && campaigns.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaña</TableHead>
                      <TableHead>Gasto</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead>CPL</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => {
                      const platform = campaign.platform as CampaignPlatform
                      const status = campaign.status as CampaignStatus
                      const platformConf = platformConfig[platform] || platformConfig.facebook
                      const statusConf = statusConfig[status] || statusConfig.active
                      const PlatformIcon = platformConf.icon
                      const cpl =
                        campaign.leads_count && campaign.leads_count > 0
                          ? (campaign.budget_spent || 0) / campaign.leads_count
                          : 0

                      return (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "p-2 rounded-lg",
                                  platformConf.bgColor
                                )}
                              >
                                <PlatformIcon
                                  className={cn("size-4", platformConf.color)}
                                />
                              </div>
                              <div>
                                <p className="font-medium">{campaign.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {campaign.project?.name || "Sin proyecto"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {formatCurrency(campaign.budget_spent || 0)}
                              </p>
                              {campaign.budget_total && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Progress
                                    value={
                                      ((campaign.budget_spent || 0) /
                                        campaign.budget_total) *
                                      100
                                    }
                                    className="h-1 w-16"
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {Math.round(
                                      ((campaign.budget_spent || 0) /
                                        campaign.budget_total) *
                                        100
                                    )}
                                    %
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{campaign.leads_count || 0}</p>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{formatCurrency(cpl)}</p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                statusConf.bgColor,
                                statusConf.color
                              )}
                            >
                              {statusConf.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <IconDotsVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => syncMutation.mutate(campaign.id)}
                                >
                                  <IconRefresh className="size-4 mr-2" />
                                  Sincronizar
                                </DropdownMenuItem>
                                {status === "active" ? (
                                  <DropdownMenuItem
                                    onClick={() => pauseMutation.mutate(campaign.id)}
                                  >
                                    <IconPlayerPause className="size-4 mr-2" />
                                    Pausar
                                  </DropdownMenuItem>
                                ) : status === "paused" ? (
                                  <DropdownMenuItem
                                    onClick={() => resumeMutation.mutate(campaign.id)}
                                  >
                                    <IconPlayerPlay className="size-4 mr-2" />
                                    Reanudar
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem
                                  onClick={() => archiveMutation.mutate(campaign.id)}
                                >
                                  <IconArchive className="size-4 mr-2" />
                                  Archivar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <IconChartBar className="size-10 mb-2 opacity-40" />
                  <p className="text-sm font-medium">Sin campañas</p>
                  <p className="text-xs mt-1">Crea tu primera campaña para comenzar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Performance by Platform */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rendimiento por Plataforma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {metricsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : metrics?.byPlatform && metrics.byPlatform.length > 0 ? (
                metrics.byPlatform.map((item) => {
                  const platform = item.platform as CampaignPlatform
                  const conf = platformConfig[platform] || platformConfig.facebook
                  const PlatformIcon = conf.icon

                  return (
                    <div
                      key={item.platform}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", conf.bgColor)}>
                          <PlatformIcon className={cn("size-4", conf.color)} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{conf.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.leads} leads
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {formatCurrency(item.spent)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          CPL: {formatCurrency(item.cpl)}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin datos de plataformas
                </p>
              )}
            </CardContent>
          </Card>

          {/* Leads by Source */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fuente de Leads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leadsBySource && leadsBySource.length > 0 ? (
                leadsBySource.slice(0, 5).map((item) => (
                  <div key={item.source} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{item.source}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin datos de fuentes
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mejores Campañas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCampaigns && topCampaigns.length > 0 ? (
                topCampaigns.map((campaign, index) => {
                  const platform = campaign.platform as CampaignPlatform
                  const conf = platformConfig[platform] || platformConfig.facebook
                  const PlatformIcon = conf.icon

                  return (
                    <div
                      key={campaign.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-semibold text-muted-foreground w-4">
                        {index + 1}
                      </span>
                      <div className={cn("p-1.5 rounded", conf.bgColor)}>
                        <PlatformIcon className={cn("size-3", conf.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.leads_count || 0} leads
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin campañas activas
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
