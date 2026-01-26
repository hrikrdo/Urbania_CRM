"use client"

import { useState } from "react"
import {
  IconUser,
  IconPhone,
  IconMail,
  IconId,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconBuildingBank,
  IconClock,
  IconTrash,
  IconFileCheck,
  IconCurrencyDollar,
  IconSearch,
  IconBuilding,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  useDeleteCreditCheck,
  useSetCreditCheckResult,
  useUpdateCreditCheck,
  getTramiteStage,
  type CreditCheckWithRelations,
  type APCStatus,
  type CreditCheckResult,
  type TramiteStage,
} from "@/hooks/use-credit-checks"
import { APCVerificationForm } from "./apc-verification-form"
import { PrequalificationForm } from "./prequalification-form"
import { cn } from "@/lib/utils"

// Using shadcn/ui theme colors for APC status indicators
const apcStatusConfig: Record<APCStatus, { label: string; color: string; bgColor: string }> = {
  good: { label: "Bueno", color: "text-chart-2", bgColor: "bg-chart-2/10" },
  fair: { label: "Regular", color: "text-chart-4", bgColor: "bg-chart-4/10" },
  bad: { label: "Malo", color: "text-destructive", bgColor: "bg-destructive/10" },
  no_history: { label: "Sin Historial", color: "text-muted-foreground", bgColor: "bg-muted" },
}

const resultConfig: Record<CreditCheckResult, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  approved: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
  needs_cosigner: { label: "Requiere Codeudor", variant: "outline" },
}

// Tramite stage configuration
const tramiteStageConfig: Record<TramiteStage, { label: string; color: string; icon: typeof IconSearch }> = {
  apc_pending: { label: "Verificación APC", color: "bg-chart-3", icon: IconSearch },
  income_pending: { label: "Verificar Ingresos", color: "bg-chart-1", icon: IconCurrencyDollar },
  bank_pending: { label: "Precalificación", color: "bg-chart-4", icon: IconBuildingBank },
  formal_pending: { label: "Aprobación Formal", color: "bg-chart-5", icon: IconFileCheck },
  approved: { label: "Aprobado", color: "bg-chart-2", icon: IconCheck },
  rejected: { label: "Rechazado", color: "bg-destructive", icon: IconX },
}

interface CreditCheckDetailProps {
  creditCheck: CreditCheckWithRelations
  onClose: () => void
}

export function CreditCheckDetail({ creditCheck, onClose }: CreditCheckDetailProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("apc")

  const deleteMutation = useDeleteCreditCheck()
  const setResultMutation = useSetCreditCheckResult()
  const updateCreditCheck = useUpdateCreditCheck()

  const currentStage = getTramiteStage(creditCheck)

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: creditCheck.id, leadId: creditCheck.lead_id })
      onClose()
    } catch (error) {
      console.error("Error deleting credit check:", error)
    }
  }

  const handleSetResult = async (result: CreditCheckResult) => {
    try {
      await setResultMutation.mutateAsync({ id: creditCheck.id, result })
    } catch (error) {
      console.error("Error setting result:", error)
    }
  }

  const handleStageChange = async (stage: TramiteStage) => {
    try {
      // Handle stage changes by updating the appropriate fields
      if (stage === "approved") {
        await setResultMutation.mutateAsync({ id: creditCheck.id, result: "approved" })
      } else if (stage === "rejected") {
        await setResultMutation.mutateAsync({ id: creditCheck.id, result: "rejected" })
      } else if (stage === "apc_pending") {
        // Reset to APC pending - clear APC verification
        await updateCreditCheck.mutateAsync({
          id: creditCheck.id,
          updates: {
            result: "pending",
            apc_status: null,
            apc_score: null,
            apc_verified_at: null,
          },
        })
      } else if (stage === "income_pending") {
        // Move to income verification - keep APC but clear income
        await updateCreditCheck.mutateAsync({
          id: creditCheck.id,
          updates: {
            result: "pending",
            income_verified: false,
            monthly_income: null,
            employment_type: null,
            employer_name: null,
          },
        })
      } else if (stage === "bank_pending") {
        // Move to bank prequalification - keep APC and income but clear bank
        await updateCreditCheck.mutateAsync({
          id: creditCheck.id,
          updates: {
            result: "pending",
            prequalified: null,
            bank_name: null,
            prequalified_amount: null,
            prequalified_rate: null,
            prequalified_term_months: null,
          },
        })
      } else if (stage === "formal_pending") {
        // Move to formal approval - keep everything but clear formal
        await updateCreditCheck.mutateAsync({
          id: creditCheck.id,
          updates: {
            result: "pending",
            formal_approval: null,
            formal_approval_amount: null,
            formal_approval_date: null,
          },
        })
      }
    } catch (error) {
      console.error("Error changing stage:", error)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("es-PA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—"
    return `$${amount.toLocaleString()}`
  }

  // Get initials for avatar
  const initials = `${creditCheck.lead?.first_name?.[0] || ""}${creditCheck.lead?.last_name?.[0] || ""}`.toUpperCase()

  const StageIcon = tramiteStageConfig[currentStage]?.icon || IconClock

  return (
    <>
      {/* Header */}
      <header className="shrink-0 px-6 py-4 border-b flex items-center justify-between pr-16">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
            {initials || <IconUser className="size-6 text-muted-foreground" />}
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {creditCheck.lead?.first_name} {creditCheck.lead?.last_name}
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-mono">{creditCheck.cedula}</span>
              <Badge
                variant={resultConfig[creditCheck.result as CreditCheckResult]?.variant || "secondary"}
              >
                {resultConfig[creditCheck.result as CreditCheckResult]?.label || "Pendiente"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {creditCheck.result !== "approved" && (
            <Button
              size="sm"
              onClick={() => handleSetResult("approved")}
              disabled={setResultMutation.isPending}
            >
              <IconCheck className="size-4 mr-1" />
              Aprobar
            </Button>
          )}
          {creditCheck.result !== "rejected" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleSetResult("rejected")}
              disabled={setResultMutation.isPending}
            >
              <IconX className="size-4 mr-1" />
              Rechazar
            </Button>
          )}
        </div>
      </header>

      {/* Content - 2 Columns */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar - Summary */}
        <aside className="w-[320px] border-r flex flex-col shrink-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Stage Selector */}
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium">Etapa del Trámite</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("size-3 rounded-full", tramiteStageConfig[currentStage]?.color)} />
                    <StageIcon className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{tramiteStageConfig[currentStage]?.label}</span>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="stage-select">Cambiar Etapa</Label>
                    <Select
                      value={currentStage}
                      onValueChange={(value) => handleStageChange(value as TramiteStage)}
                    >
                      <SelectTrigger id="stage-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apc_pending">
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-chart-3" />
                            Verificación APC
                          </div>
                        </SelectItem>
                        <SelectItem value="income_pending">
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-chart-1" />
                            Verificar Ingresos
                          </div>
                        </SelectItem>
                        <SelectItem value="bank_pending">
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-chart-4" />
                            Precalificación
                          </div>
                        </SelectItem>
                        <SelectItem value="formal_pending">
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-chart-5" />
                            Aprobación Formal
                          </div>
                        </SelectItem>
                        <SelectItem value="approved">
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-chart-2" />
                            Aprobado
                          </div>
                        </SelectItem>
                        <SelectItem value="rejected">
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-destructive" />
                            Rechazado
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium">Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  {creditCheck.lead?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <IconPhone className="size-4 text-muted-foreground" />
                      <span>{creditCheck.lead.phone}</span>
                    </div>
                  )}
                  {creditCheck.lead?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <IconMail className="size-4 text-muted-foreground" />
                      <span className="truncate">{creditCheck.lead.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <IconId className="size-4 text-muted-foreground" />
                    <span className="font-mono">{creditCheck.cedula}</span>
                  </div>
                  {creditCheck.lead?.project?.name && (
                    <div className="flex items-center gap-2 text-sm">
                      <IconBuilding className="size-4 text-muted-foreground" />
                      <span>{creditCheck.lead.project.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* APC Summary */}
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium">Estado APC</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {creditCheck.apc_status ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Estado</span>
                        <div
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            apcStatusConfig[creditCheck.apc_status as APCStatus]?.bgColor
                          } ${apcStatusConfig[creditCheck.apc_status as APCStatus]?.color}`}
                        >
                          {apcStatusConfig[creditCheck.apc_status as APCStatus]?.label}
                        </div>
                      </div>
                      {creditCheck.apc_score && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Score</span>
                          <span className="font-semibold">{creditCheck.apc_score}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Verificado</span>
                        <span className="text-sm">{formatDate(creditCheck.apc_verified_at)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IconAlertTriangle className="size-4" />
                      <span className="text-sm">Sin verificar</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Income Summary */}
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {creditCheck.income_verified ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Ingreso Mensual</span>
                        <span className="font-semibold">{formatCurrency(creditCheck.monthly_income)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tipo Empleo</span>
                        <span className="text-sm capitalize">
                          {creditCheck.employment_type === "employed" && "Empleado"}
                          {creditCheck.employment_type === "self_employed" && "Independiente"}
                          {creditCheck.employment_type === "retired" && "Jubilado"}
                          {creditCheck.employment_type === "other" && "Otro"}
                        </span>
                      </div>
                      {creditCheck.employer_name && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Empleador</span>
                          <span className="text-sm truncate max-w-[150px]">{creditCheck.employer_name}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IconAlertTriangle className="size-4" />
                      <span className="text-sm">Sin verificar</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Prequalification Summary */}
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium">Precalificación Bancaria</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {creditCheck.prequalified !== null ? (
                    creditCheck.prequalified ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-chart-2">
                          <IconCheck className="size-4" />
                          <span className="font-medium">Precalificado</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Banco</span>
                          <span className="text-sm">{creditCheck.bank_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Monto</span>
                          <span className="font-semibold">{formatCurrency(creditCheck.prequalified_amount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Tasa</span>
                          <span className="text-sm">{creditCheck.prequalified_rate}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Plazo</span>
                          <span className="text-sm">{creditCheck.prequalified_term_months} meses</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Letra Estimada</span>
                          <span className="font-semibold text-primary">
                            {formatCurrency(creditCheck.estimated_monthly_payment)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Vence</span>
                          <span className="text-sm">{formatDate(creditCheck.prequalification_expires)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-destructive">
                        <IconX className="size-4" />
                        <span className="font-medium">No Precalifica</span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IconClock className="size-4" />
                      <span className="text-sm">Pendiente</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delete Action */}
              <Button
                variant="outline"
                className="w-full gap-2 text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <IconTrash className="size-4" />
                Eliminar Verificación
              </Button>
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content - Forms */}
        <main className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b px-6 shrink-0">
              <TabsList className="h-12">
                <TabsTrigger value="apc" className="gap-2">
                  <IconCurrencyDollar className="size-4" />
                  APC e Ingresos
                </TabsTrigger>
                <TabsTrigger value="banco" className="gap-2">
                  <IconBuildingBank className="size-4" />
                  Precalificación Bancaria
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6">
                <TabsContent value="apc" className="mt-0 m-0 data-[state=inactive]:hidden">
                  <APCVerificationForm creditCheck={creditCheck} />
                </TabsContent>

                <TabsContent value="banco" className="mt-0 m-0 data-[state=inactive]:hidden">
                  <PrequalificationForm creditCheck={creditCheck} />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </main>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Verificación</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              verificación de crédito de {creditCheck.lead?.first_name}{" "}
              {creditCheck.lead?.last_name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
