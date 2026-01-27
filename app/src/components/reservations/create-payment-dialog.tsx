"use client"

import { useState } from "react"
import { IconCurrencyDollar, IconReceipt } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useCreatePayment } from "@/hooks/use-inventory"
import type { Database } from "@/types/database"

type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"]

const paymentTypes = [
  { value: "separation", label: "Separación" },
  { value: "initial", label: "Abono Inicial" },
  { value: "monthly", label: "Mensualidad" },
  { value: "notary", label: "Notaría" },
  { value: "other", label: "Otro" },
]

const paymentMethods = [
  { value: "transfer", label: "Transferencia" },
  { value: "check", label: "Cheque" },
  { value: "cash", label: "Efectivo" },
  { value: "financing", label: "Financiamiento" },
]

interface CreatePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reservationId: string
  leadId?: string
  onSuccess?: () => void
}

export function CreatePaymentDialog({
  open,
  onOpenChange,
  reservationId,
  leadId,
  onSuccess,
}: CreatePaymentDialogProps) {
  const [type, setType] = useState("separation")
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("transfer")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [notes, setNotes] = useState("")

  const createPayment = useCreatePayment()

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Ingresa un monto válido")
      return
    }

    const payment: PaymentInsert = {
      reservation_id: reservationId,
      lead_id: leadId || null,
      type,
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      reference_number: referenceNumber || null,
      notes: notes || null,
      status: "pending",
    }

    try {
      await createPayment.mutateAsync(payment)
      toast.success("Pago registrado exitosamente")
      onOpenChange(false)
      onSuccess?.()
      resetForm()
    } catch {
      toast.error("Error al registrar el pago")
    }
  }

  const resetForm = () => {
    setType("separation")
    setAmount("")
    setPaymentMethod("transfer")
    setReferenceNumber("")
    setNotes("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconReceipt className="size-5" />
            Registrar Pago
          </DialogTitle>
          <DialogDescription>
            Registra un nuevo pago para esta reservación. El pago quedará pendiente de
            confirmación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Pago</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentTypes.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value}>
                    {pt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <div className="relative">
              <IconCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="method">Método de Pago</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm.value} value={pm.value}>
                    {pm.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="reference">Número de Referencia</Label>
            <Input
              id="reference"
              placeholder="Ej: TRF-12345"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createPayment.isPending}>
            {createPayment.isPending ? "Registrando..." : "Registrar Pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
