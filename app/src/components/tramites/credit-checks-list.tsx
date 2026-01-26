"use client"

import { useState } from "react"
import {
  IconSearch,
  IconFilter,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconClock,
  IconUser,
  IconBuildingBank,
  IconFileCheck,
  IconChevronRight,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Skeleton } from "@/components/ui/skeleton"

import {
  useCreditChecks,
  useCreditCheckMetrics,
  type CreditCheckWithRelations,
  type APCStatus,
  type CreditCheckResult,
} from "@/hooks/use-credit-checks"
import { CreditCheckDetail } from "./credit-check-detail"

// Using shadcn/ui chart colors for APC status indicators
const apcStatusConfig: Record<APCStatus, { label: string; color: string }> = {
  good: { label: "Bueno", color: "bg-chart-2" },
  fair: { label: "Regular", color: "bg-chart-4" },
  bad: { label: "Malo", color: "bg-destructive" },
  no_history: { label: "Sin Historial", color: "bg-muted-foreground" },
}

const resultConfig: Record<CreditCheckResult, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  approved: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
  needs_cosigner: { label: "Requiere Codeudor", variant: "outline" },
}

export function CreditChecksList() {
  const [search, setSearch] = useState("")
  const [resultFilter, setResultFilter] = useState<CreditCheckResult | "all">("all")
  const [apcFilter, setApcFilter] = useState<APCStatus | "all">("all")
  const [selectedCheck, setSelectedCheck] = useState<CreditCheckWithRelations | null>(null)

  const { data: metrics, isLoading: metricsLoading } = useCreditCheckMetrics()
  const { data: creditChecks, isLoading: checksLoading } = useCreditChecks(
    resultFilter !== "all" || apcFilter !== "all"
      ? {
          result: resultFilter !== "all" ? resultFilter : undefined,
          apcStatus: apcFilter !== "all" ? apcFilter : undefined,
        }
      : undefined
  )

  // Filter by search
  const filteredChecks = creditChecks?.filter((check) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    const leadName = `${check.lead?.first_name || ""} ${check.lead?.last_name || ""}`.toLowerCase()
    return (
      leadName.includes(searchLower) ||
      check.cedula.toLowerCase().includes(searchLower) ||
      check.lead?.email?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">En Trámite</p>
              <IconClock className="size-4 text-muted-foreground" />
            </div>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{metrics?.pending || 0}</p>
            )}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Aprobados</p>
              <IconCheck className="size-4 text-chart-2" />
            </div>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold text-chart-2">{metrics?.approved || 0}</p>
            )}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Rechazados</p>
              <IconX className="size-4 text-destructive" />
            </div>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold text-destructive">{metrics?.rejected || 0}</p>
            )}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Precalificados</p>
              <IconBuildingBank className="size-4 text-chart-3" />
            </div>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold text-chart-3">{metrics?.prequalifiedCount || 0}</p>
            )}
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, cédula o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <IconFilter className="size-4 text-muted-foreground" />
              <Select
                value={resultFilter}
                onValueChange={(value) => setResultFilter(value as CreditCheckResult | "all")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                  <SelectItem value="needs_cosigner">Requiere Codeudor</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={apcFilter}
                onValueChange={(value) => setApcFilter(value as APCStatus | "all")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado APC" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="good">Bueno</SelectItem>
                  <SelectItem value="fair">Regular</SelectItem>
                  <SelectItem value="bad">Malo</SelectItem>
                  <SelectItem value="no_history">Sin Historial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-base">Verificaciones de Crédito</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {checksLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredChecks && filteredChecks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>APC</TableHead>
                  <TableHead>Ingresos</TableHead>
                  <TableHead>Precalificación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChecks.map((check) => (
                  <TableRow
                    key={check.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedCheck(check)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                          <IconUser className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {check.lead?.first_name} {check.lead?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{check.lead?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{check.cedula}</TableCell>
                    <TableCell>
                      {check.apc_status ? (
                        <div className="flex items-center gap-2">
                          <div
                            className={`size-2 rounded-full ${
                              apcStatusConfig[check.apc_status as APCStatus]?.color || "bg-gray-400"
                            }`}
                          />
                          <span className="text-sm">
                            {apcStatusConfig[check.apc_status as APCStatus]?.label || check.apc_status}
                          </span>
                          {check.apc_score && (
                            <span className="text-xs text-muted-foreground">({check.apc_score})</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin verificar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {check.income_verified ? (
                        <div className="flex items-center gap-1">
                          <IconFileCheck className="size-4 text-chart-2" />
                          <span className="text-sm">
                            ${check.monthly_income?.toLocaleString()}/mes
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin verificar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {check.prequalified !== null ? (
                        check.prequalified ? (
                          <div className="flex items-center gap-1">
                            <IconBuildingBank className="size-4 text-chart-3" />
                            <span className="text-sm">
                              ${check.prequalified_amount?.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <IconAlertTriangle className="size-4 text-chart-4" />
                            <span className="text-sm text-muted-foreground">No califica</span>
                          </div>
                        )
                      ) : (
                        <span className="text-sm text-muted-foreground">Pendiente</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          resultConfig[check.result as CreditCheckResult]?.variant || "secondary"
                        }
                      >
                        {resultConfig[check.result as CreditCheckResult]?.label || "Pendiente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <IconChevronRight className="size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No hay verificaciones de crédito
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selectedCheck} onOpenChange={() => setSelectedCheck(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[1200px] p-0 flex flex-col gap-0">
          <VisuallyHidden>
            <SheetTitle>Verificación de Crédito</SheetTitle>
          </VisuallyHidden>
          {selectedCheck && (
            <CreditCheckDetail
              creditCheck={selectedCheck}
              onClose={() => setSelectedCheck(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
