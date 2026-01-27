"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getAppointments,
  getAppointment,
  getAppointmentsByLead,
  getAppointmentsByDateRange,
  getTodayAppointments,
  getUpcomingAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  confirmAppointment,
  completeAppointment,
  markNoShow,
  rescheduleAppointment,
  getAppointmentMetrics,
  getAppointmentsNeedingReminders,
  type AppointmentWithRelations,
  type AppointmentStatus,
  type AppointmentType,
  type AppointmentOutcome,
} from "@/lib/services/appointments"
import type { Database } from "@/types/database"

type AppointmentInsert = Database["public"]["Tables"]["appointments"]["Insert"]
type AppointmentUpdate = Database["public"]["Tables"]["appointments"]["Update"]

// Query keys
export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...appointmentKeys.lists(), filters] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  byLead: (leadId: string) => [...appointmentKeys.all, "lead", leadId] as const,
  byDateRange: (from: string, to: string, assignedTo?: string) =>
    [...appointmentKeys.all, "range", from, to, assignedTo] as const,
  today: (assignedTo?: string) =>
    [...appointmentKeys.all, "today", assignedTo] as const,
  upcoming: (assignedTo?: string, limit?: number) =>
    [...appointmentKeys.all, "upcoming", assignedTo, limit] as const,
  metrics: (filters?: Record<string, unknown>) =>
    [...appointmentKeys.all, "metrics", filters] as const,
  needingReminders: () => [...appointmentKeys.all, "reminders"] as const,
}

// ============================================
// Query Hooks
// ============================================

// Fetch appointments with filters
export function useAppointments(filters?: {
  status?: AppointmentStatus
  type?: AppointmentType
  assignedTo?: string
  projectId?: string
  leadId?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: appointmentKeys.list(filters || {}),
    queryFn: () => getAppointments(filters),
  })
}

// Fetch single appointment
export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => getAppointment(id),
    enabled: !!id,
  })
}

// Fetch appointments by lead
export function useAppointmentsByLead(leadId: string) {
  return useQuery({
    queryKey: appointmentKeys.byLead(leadId),
    queryFn: () => getAppointmentsByLead(leadId),
    enabled: !!leadId,
  })
}

// Fetch appointments by date range (for calendar)
export function useAppointmentsByDateRange(
  dateFrom: string,
  dateTo: string,
  assignedTo?: string
) {
  return useQuery({
    queryKey: appointmentKeys.byDateRange(dateFrom, dateTo, assignedTo),
    queryFn: () => getAppointmentsByDateRange(dateFrom, dateTo, assignedTo),
    enabled: !!dateFrom && !!dateTo,
  })
}

// Fetch today's appointments
export function useTodayAppointments(assignedTo?: string) {
  return useQuery({
    queryKey: appointmentKeys.today(assignedTo),
    queryFn: () => getTodayAppointments(assignedTo),
    refetchInterval: 60000, // Refresh every minute
  })
}

// Fetch upcoming appointments
export function useUpcomingAppointments(assignedTo?: string, limit?: number) {
  return useQuery({
    queryKey: appointmentKeys.upcoming(assignedTo, limit),
    queryFn: () => getUpcomingAppointments(assignedTo, limit),
    refetchInterval: 60000, // Refresh every minute
  })
}

// Fetch appointment metrics
export function useAppointmentMetrics(filters?: {
  assignedTo?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: appointmentKeys.metrics(filters),
    queryFn: () => getAppointmentMetrics(filters),
  })
}

// Fetch appointments needing reminders
export function useAppointmentsNeedingReminders() {
  return useQuery({
    queryKey: appointmentKeys.needingReminders(),
    queryFn: getAppointmentsNeedingReminders,
    refetchInterval: 300000, // Refresh every 5 minutes
  })
}

// ============================================
// Mutation Hooks
// ============================================

// Create appointment
export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (appointment: AppointmentInsert) =>
      createAppointment(appointment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}

// Update appointment
export function useUpdateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: AppointmentUpdate }) =>
      updateAppointment(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
      queryClient.setQueryData(appointmentKeys.detail(data.id), data)
    },
  })
}

// Cancel appointment
export function useCancelAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}

// Confirm appointment
export function useConfirmAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => confirmAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}

// Complete appointment
export function useCompleteAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      outcome,
      notes,
    }: {
      id: string
      outcome: AppointmentOutcome
      notes?: string
    }) => completeAppointment(id, outcome, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}

// Mark as no-show
export function useMarkNoShow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => markNoShow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}

// Reschedule appointment
export function useRescheduleAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      newDate,
      duration,
    }: {
      id: string
      newDate: string
      duration?: number
    }) => rescheduleAppointment(id, newDate, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}

// Re-export types
export type {
  AppointmentWithRelations,
  AppointmentStatus,
  AppointmentType,
  AppointmentOutcome,
}
