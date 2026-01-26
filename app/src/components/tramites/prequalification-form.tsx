"use client"

import { useState, useEffect, useMemo } from "react"
import { IconLoader2, IconCalculator, IconAlertCircle, IconCheck } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

import {
  useUpdatePrequalification,
  useUpdateFormalApproval,
  type CreditCheckWithRelations,
} from "@/hooks/use-credit-checks"
import { calculateMonthlyPayment, checkIncomeQualification } from "@/lib/services/credit-checks"

interface PrequalificationFormProps {
  creditCheck: CreditCheckWithRelations
}

export function PrequalificationForm({ creditCheck }: PrequalificationFormProps) {
  // Prequalification State
  const [bankName, setBankName] = useState(creditCheck.bank_name || "")
  const [prequalified, setPrequalified] = useState(creditCheck.prequalified ?? true)
  const [amount, setAmount] = useState(creditCheck.prequalified_amount?.toString() || "")
  const [rate, setRate] = useState(creditCheck.prequalified_rate?.toString() || "")
  const [termMonths, setTermMonths] = useState(
    creditCheck.prequalified_term_months?.toString() || "360"
  )
  const [prequalNotes, setPrequalNotes] = useState(creditCheck.prequalification_notes || "")

  // Formal Approval State
  const [formalApproval, setFormalApproval] = useState(creditCheck.formal_approval ?? false)
  const [formalAmount, setFormalAmount] = useState(
    creditCheck.formal_approval_amount?.toString() || ""
  )
  const [formalNotes, setFormalNotes] = useState(creditCheck.formal_approval_notes || "")

  const prequalMutation = useUpdatePrequalification()
  const formalMutation = useUpdateFormalApproval()

  // Update form when creditCheck changes
  useEffect(() => {
    setBankName(creditCheck.bank_name || "")
    setPrequalified(creditCheck.prequalified ?? true)
    setAmount(creditCheck.prequalified_amount?.toString() || "")
    setRate(creditCheck.prequalified_rate?.toString() || "")
    setTermMonths(creditCheck.prequalified_term_months?.toString() || "360")
    setPrequalNotes(creditCheck.prequalification_notes || "")
    setFormalApproval(creditCheck.formal_approval ?? false)
    setFormalAmount(creditCheck.formal_approval_amount?.toString() || "")
    setFormalNotes(creditCheck.formal_approval_notes || "")
  }, [creditCheck])

  // Calculate monthly payment
  const estimatedPayment = useMemo(() => {
    if (!amount || !rate || !termMonths) return null
    return calculateMonthlyPayment(
      parseFloat(amount),
      parseFloat(rate),
      parseInt(termMonths)
    )
  }, [amount, rate, termMonths])

  // Check income qualification
  const incomeCheck = useMemo(() => {
    if (!estimatedPayment || !creditCheck.monthly_income) return null
    return checkIncomeQualification(creditCheck.monthly_income, estimatedPayment)
  }, [estimatedPayment, creditCheck.monthly_income])

  const handleSavePrequal = async () => {
    if (!bankName) return

    try {
      await prequalMutation.mutateAsync({
        id: creditCheck.id,
        prequalData: {
          bank_name: bankName,
          prequalified,
          prequalified_amount: amount ? parseFloat(amount) : undefined,
          prequalified_rate: rate ? parseFloat(rate) : undefined,
          prequalified_term_months: termMonths ? parseInt(termMonths) : undefined,
          prequalification_notes: prequalNotes || undefined,
        },
      })
    } catch (error) {
      console.error("Error saving prequalification:", error)
    }
  }

  const handleSaveFormal = async () => {
    try {
      await formalMutation.mutateAsync({
        id: creditCheck.id,
        approvalData: {
          formal_approval: formalApproval,
          formal_approval_amount: formalAmount ? parseFloat(formalAmount) : undefined,
          formal_approval_notes: formalNotes || undefined,
        },
      })
    } catch (error) {
      console.error("Error saving formal approval:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Prequalification */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Precalificación Bancaria</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bank-name">Banco</Label>
            <Input
              id="bank-name"
              placeholder="Nombre del banco"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="prequalified">Precalificado</Label>
            <Switch
              id="prequalified"
              checked={prequalified}
              onCheckedChange={setPrequalified}
            />
          </div>

          {prequalified && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto Aprobado ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Tasa Anual (%)</Label>
                  <Input
                    id="rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0.00"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="term">Plazo (meses)</Label>
                <Input
                  id="term"
                  type="number"
                  min="12"
                  max="480"
                  placeholder="360"
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value)}
                />
              </div>

              {/* Calculator */}
              {estimatedPayment && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <IconCalculator className="size-4 text-primary" />
                      <span className="text-sm font-medium">Cálculo de Letra</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Letra Mensual Estimada</span>
                      <span className="text-lg font-bold text-primary">
                        ${estimatedPayment.toLocaleString()}
                      </span>
                    </div>
                    {incomeCheck && (
                      <>
                        <Separator className="my-3" />
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Ingreso Mensual</span>
                            <span>${creditCheck.monthly_income?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Ratio Deuda/Ingreso</span>
                            <span>{(incomeCheck.debtRatio * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Máximo Permitido (35%)</span>
                            <span>${incomeCheck.maxPayment.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            {incomeCheck.qualifies ? (
                              <>
                                <IconCheck className="size-4 text-chart-2" />
                                <span className="text-chart-2 font-medium">Califica por ingresos</span>
                              </>
                            ) : (
                              <>
                                <IconAlertCircle className="size-4 text-destructive" />
                                <span className="text-destructive font-medium">No califica por ingresos</span>
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="prequal-notes">Notas</Label>
            <Textarea
              id="prequal-notes"
              placeholder="Observaciones de la precalificación..."
              value={prequalNotes}
              onChange={(e) => setPrequalNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleSavePrequal}
            disabled={!bankName || prequalMutation.isPending}
            className="w-full"
          >
            {prequalMutation.isPending && (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            )}
            Guardar Precalificación
          </Button>
        </CardContent>
      </Card>

      {/* Formal Approval */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Aprobación Formal</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="formal-approval">Aprobado Formalmente</Label>
            <Switch
              id="formal-approval"
              checked={formalApproval}
              onCheckedChange={setFormalApproval}
            />
          </div>

          {formalApproval && (
            <div className="space-y-2">
              <Label htmlFor="formal-amount">Monto Aprobado ($)</Label>
              <Input
                id="formal-amount"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                value={formalAmount}
                onChange={(e) => setFormalAmount(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="formal-notes">Notas</Label>
            <Textarea
              id="formal-notes"
              placeholder="Observaciones de la aprobación formal..."
              value={formalNotes}
              onChange={(e) => setFormalNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleSaveFormal}
            disabled={formalMutation.isPending}
            className="w-full"
          >
            {formalMutation.isPending && (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            )}
            Guardar Aprobación Formal
          </Button>
        </CardContent>
      </Card>

      {/* Status indicators - using shadcn/ui theme colors */}
      {formalApproval && (
        <Card className="border-chart-2/50 bg-chart-2/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <IconCheck className="size-5 text-chart-2" />
              <p className="text-sm text-chart-2">
                <strong>Aprobación Formal Completada:</strong> El lead puede avanzar a la etapa
                de escrituración y cierre.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
