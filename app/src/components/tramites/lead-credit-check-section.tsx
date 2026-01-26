"use client"

import { useState } from "react"
import {
  IconCheck,
  IconAlertTriangle,
  IconPlus,
  IconFileDescription,
  IconRefresh,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

import {
  useCreditCheckByLead,
  useCreateCreditCheck,
  type APCStatus,
  type CreditCheckResult,
} from "@/hooks/use-credit-checks"
import { APCVerificationForm } from "./apc-verification-form"
import { PrequalificationForm } from "./prequalification-form"

const apcStatusConfig: Record<APCStatus, { label: string; color: string; bgColor: string }> = {
  good: { label: "Bueno", color: "text-green-700", bgColor: "bg-green-100" },
  fair: { label: "Regular", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  bad: { label: "Malo", color: "text-red-700", bgColor: "bg-red-100" },
  no_history: { label: "Sin Historial", color: "text-gray-700", bgColor: "bg-gray-100" },
}

const resultConfig: Record<CreditCheckResult, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  approved: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
  needs_cosigner: { label: "Requiere Codeudor", variant: "outline" },
}

interface LeadCreditCheckSectionProps {
  leadId: string
  cedula?: string | null
}

export function LeadCreditCheckSection({ leadId, cedula }: LeadCreditCheckSectionProps) {
  const { data: creditCheck, isLoading, refetch } = useCreditCheckByLead(leadId)
  const createMutation = useCreateCreditCheck()
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [detailTab, setDetailTab] = useState<"apc" | "banco">("apc")

  const handleCreateCreditCheck = async () => {
    if (!cedula) {
      toast.error("El lead debe tener cédula registrada para iniciar un trámite")
      return
    }

    try {
      await createMutation.mutateAsync({
        lead_id: leadId,
        cedula: cedula,
        result: "pending",
      })
      toast.success("Trámite de crédito iniciado")
    } catch {
      toast.error("Error al crear trámite")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  // No credit check exists yet
  if (!creditCheck) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                <IconFileDescription className="size-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">Sin trámite de crédito</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Inicia un trámite para verificar el crédito del cliente
                </p>
              </div>
              <Button
                onClick={handleCreateCreditCheck}
                disabled={createMutation.isPending || !cedula}
                className="gap-2"
              >
                <IconPlus className="size-4" />
                Iniciar Trámite
              </Button>
              {!cedula && (
                <p className="text-xs text-destructive">
                  Se requiere registrar la cédula del lead primero
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—"
    return `$${amount.toLocaleString()}`
  }

  const formatDate = (date: string | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("es-PA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant={resultConfig[creditCheck.result as CreditCheckResult]?.variant || "secondary"}
          >
            {resultConfig[creditCheck.result as CreditCheckResult]?.label || "Pendiente"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Cédula: {creditCheck.cedula}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <IconRefresh className="size-4" />
        </Button>
      </div>

      {/* APC Summary */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            Verificación APC
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDetailTab("apc")
                setShowDetailSheet(true)
              }}
            >
              {creditCheck.apc_status ? "Editar" : "Verificar"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {creditCheck.apc_status ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${
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
              {creditCheck.income_verified && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ingreso Mensual</span>
                  <span className="font-semibold">{formatCurrency(creditCheck.monthly_income)}</span>
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

      {/* Bank Prequalification Summary */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            Precalificación Bancaria
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDetailTab("banco")
                setShowDetailSheet(true)
              }}
            >
              {creditCheck.prequalified !== null ? "Editar" : "Evaluar"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {creditCheck.prequalified !== null ? (
            creditCheck.prequalified ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <IconCheck className="size-4" />
                  <span className="font-medium text-sm">Precalificado</span>
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
              <div className="flex items-center gap-2 text-red-600">
                <IconAlertTriangle className="size-4" />
                <span className="font-medium text-sm">No Precalifica</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <IconAlertTriangle className="size-4" />
              <span className="text-sm">Pendiente de evaluación</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent side="right" className="w-full sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>
              {detailTab === "apc" ? "Verificación APC" : "Precalificación Bancaria"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {detailTab === "apc" ? (
              <APCVerificationForm creditCheck={creditCheck} />
            ) : (
              <PrequalificationForm creditCheck={creditCheck} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
