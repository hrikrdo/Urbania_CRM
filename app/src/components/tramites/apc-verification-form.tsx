"use client"

import { useState, useEffect } from "react"
import { IconLoader2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  useVerifyAPC,
  useVerifyIncome,
  type CreditCheckWithRelations,
  type APCStatus,
  type EmploymentType,
} from "@/hooks/use-credit-checks"

interface APCVerificationFormProps {
  creditCheck: CreditCheckWithRelations
}

export function APCVerificationForm({ creditCheck }: APCVerificationFormProps) {
  // APC State
  const [apcStatus, setApcStatus] = useState<APCStatus | "">(
    (creditCheck.apc_status as APCStatus) || ""
  )
  const [apcScore, setApcScore] = useState(creditCheck.apc_score?.toString() || "")
  const [apcNotes, setApcNotes] = useState(creditCheck.apc_notes || "")

  // Income State
  const [monthlyIncome, setMonthlyIncome] = useState(
    creditCheck.monthly_income?.toString() || ""
  )
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">(
    (creditCheck.employment_type as EmploymentType) || ""
  )
  const [employerName, setEmployerName] = useState(creditCheck.employer_name || "")

  const verifyAPCMutation = useVerifyAPC()
  const verifyIncomeMutation = useVerifyIncome()

  // Update form when creditCheck changes
  useEffect(() => {
    setApcStatus((creditCheck.apc_status as APCStatus) || "")
    setApcScore(creditCheck.apc_score?.toString() || "")
    setApcNotes(creditCheck.apc_notes || "")
    setMonthlyIncome(creditCheck.monthly_income?.toString() || "")
    setEmploymentType((creditCheck.employment_type as EmploymentType) || "")
    setEmployerName(creditCheck.employer_name || "")
  }, [creditCheck])

  const handleSaveAPC = async () => {
    if (!apcStatus) return

    try {
      await verifyAPCMutation.mutateAsync({
        id: creditCheck.id,
        apcData: {
          apc_status: apcStatus,
          apc_score: apcScore ? parseInt(apcScore) : undefined,
          apc_notes: apcNotes || undefined,
        },
      })
    } catch (error) {
      console.error("Error saving APC:", error)
    }
  }

  const handleSaveIncome = async () => {
    if (!monthlyIncome || !employmentType) return

    try {
      await verifyIncomeMutation.mutateAsync({
        id: creditCheck.id,
        incomeData: {
          monthly_income: parseFloat(monthlyIncome),
          employment_type: employmentType,
          employer_name: employerName || undefined,
        },
      })
    } catch (error) {
      console.error("Error saving income:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* APC Verification */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Verificación APC</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apc-status">Estado APC</Label>
              <Select
                value={apcStatus}
                onValueChange={(value) => setApcStatus(value as APCStatus)}
              >
                <SelectTrigger id="apc-status">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Bueno</SelectItem>
                  <SelectItem value="fair">Regular</SelectItem>
                  <SelectItem value="bad">Malo</SelectItem>
                  <SelectItem value="no_history">Sin Historial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apc-score">Score (opcional)</Label>
              <Input
                id="apc-score"
                type="number"
                min="0"
                max="999"
                placeholder="0-999"
                value={apcScore}
                onChange={(e) => setApcScore(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apc-notes">Notas</Label>
            <Textarea
              id="apc-notes"
              placeholder="Observaciones de la verificación APC..."
              value={apcNotes}
              onChange={(e) => setApcNotes(e.target.value)}
              rows={3}
            />
          </div>
          <Button
            onClick={handleSaveAPC}
            disabled={!apcStatus || verifyAPCMutation.isPending}
            className="w-full"
          >
            {verifyAPCMutation.isPending && (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            )}
            Guardar Verificación APC
          </Button>
        </CardContent>
      </Card>

      {/* Income Verification */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Verificación de Ingresos</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthly-income">Ingreso Mensual ($)</Label>
            <Input
              id="monthly-income"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employment-type">Tipo de Empleo</Label>
            <Select
              value={employmentType}
              onValueChange={(value) => setEmploymentType(value as EmploymentType)}
            >
              <SelectTrigger id="employment-type">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employed">Empleado</SelectItem>
                <SelectItem value="self_employed">Independiente</SelectItem>
                <SelectItem value="retired">Jubilado</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employer-name">Nombre del Empleador (opcional)</Label>
            <Input
              id="employer-name"
              placeholder="Nombre de la empresa"
              value={employerName}
              onChange={(e) => setEmployerName(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSaveIncome}
            disabled={!monthlyIncome || !employmentType || verifyIncomeMutation.isPending}
            className="w-full"
          >
            {verifyIncomeMutation.isPending && (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            )}
            Guardar Verificación de Ingresos
          </Button>
        </CardContent>
      </Card>

      {/* Auto-logic indicators - using shadcn/ui theme colors */}
      {apcStatus === "bad" && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              <strong>APC Malo:</strong> Este lead será marcado como rechazado automáticamente
              si no hay mejora en su historial crediticio.
            </p>
          </CardContent>
        </Card>
      )}

      {apcStatus === "good" && monthlyIncome && parseFloat(monthlyIncome) > 0 && (
        <Card className="border-chart-2/50 bg-chart-2/10">
          <CardContent className="p-4">
            <p className="text-sm text-chart-2">
              <strong>Perfil Favorable:</strong> APC bueno con ingresos verificados.
              Este lead puede avanzar a precalificación bancaria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
