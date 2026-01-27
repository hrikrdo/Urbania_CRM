"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getPayments,
  getPayment,
  createPayment,
  confirmPayment,
  rejectPayment,
  getPaymentMetrics,
  type PaymentStatus,
  type PaymentType,
  type PaymentWithRelations,
} from "@/lib/services/payments"
import type { Database } from "@/types/database"

type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"]

export type { PaymentWithRelations }

// Query keys
export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, "detail"] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  metrics: (filters?: Record<string, unknown>) =>
    [...paymentKeys.all, "metrics", filters] as const,
}

// Get all payments
export function usePayments(filters?: {
  status?: PaymentStatus
  type?: PaymentType
  reservationId?: string
  leadId?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: paymentKeys.list(filters || {}),
    queryFn: () => getPayments(filters),
  })
}

// Get single payment
export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: paymentKeys.detail(id || ""),
    queryFn: () => (id ? getPayment(id) : null),
    enabled: !!id,
  })
}

// Get payment metrics
export function usePaymentMetrics(filters?: {
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: paymentKeys.metrics(filters),
    queryFn: () => getPaymentMetrics(filters),
  })
}

// Create payment
export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payment: PaymentInsert) => createPayment(payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
  })
}

// Confirm payment
export function useConfirmPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, confirmedBy }: { id: string; confirmedBy: string }) =>
      confirmPayment(id, confirmedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
  })
}

// Reject payment
export function useRejectPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rejectPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
  })
}
