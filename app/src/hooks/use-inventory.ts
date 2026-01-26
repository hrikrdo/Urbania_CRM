"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectsMetrics,
  getUnitTypesByProject,
  createUnitType,
  updateUnitType,
  deleteUnitType,
  type ProjectWithStats,
} from "@/lib/services/projects"
import {
  getUnitsByProject,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit,
  reserveUnit,
  releaseUnit,
  markUnitAsSold,
  toggleUnitBlock,
  getAvailableUnits,
  getProjectFloors,
  bulkCreateUnits,
  type UnitWithRelations,
  type UnitStatus,
} from "@/lib/services/units"
import {
  getReservations,
  getReservation,
  getReservationsByLead,
  createReservation,
  updateReservation,
  cancelReservation,
  completeReservation,
  getPaymentsByReservation,
  createPayment,
  confirmPayment,
  rejectPayment,
  getReservationMetrics,
  getPaymentsSummary,
  type ReservationWithRelations,
  type ReservationStatus,
} from "@/lib/services/reservations"
import type { Database } from "@/types/database"

type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"]
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"]
type UnitInsert = Database["public"]["Tables"]["units"]["Insert"]
type UnitUpdate = Database["public"]["Tables"]["units"]["Update"]
type ReservationInsert = Database["public"]["Tables"]["reservations"]["Insert"]
type ReservationUpdate = Database["public"]["Tables"]["reservations"]["Update"]
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"]

// Query keys
export const inventoryKeys = {
  all: ["inventory"] as const,
  projects: () => [...inventoryKeys.all, "projects"] as const,
  project: (id: string) => [...inventoryKeys.projects(), id] as const,
  projectMetrics: () => [...inventoryKeys.projects(), "metrics"] as const,
  unitTypes: (projectId: string) =>
    [...inventoryKeys.all, "unit-types", projectId] as const,
  units: (projectId: string) => [...inventoryKeys.all, "units", projectId] as const,
  unit: (id: string) => [...inventoryKeys.all, "unit", id] as const,
  availableUnits: (projectId: string) =>
    [...inventoryKeys.units(projectId), "available"] as const,
  floors: (projectId: string) =>
    [...inventoryKeys.units(projectId), "floors"] as const,
  reservations: () => [...inventoryKeys.all, "reservations"] as const,
  reservation: (id: string) => [...inventoryKeys.reservations(), id] as const,
  reservationsByLead: (leadId: string) =>
    [...inventoryKeys.reservations(), "lead", leadId] as const,
  reservationMetrics: () => [...inventoryKeys.reservations(), "metrics"] as const,
  payments: (reservationId: string) =>
    [...inventoryKeys.all, "payments", reservationId] as const,
  paymentsSummary: (reservationId: string) =>
    [...inventoryKeys.payments(reservationId), "summary"] as const,
}

// ============================================
// Projects Hooks
// ============================================

export function useProjects() {
  return useQuery({
    queryKey: inventoryKeys.projects(),
    queryFn: getProjects,
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: inventoryKeys.project(id),
    queryFn: () => getProject(id),
    enabled: !!id,
  })
}

export function useProjectsMetrics() {
  return useQuery({
    queryKey: inventoryKeys.projectMetrics(),
    queryFn: getProjectsMetrics,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (project: ProjectInsert) => createProject(project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.projects() })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ProjectUpdate }) =>
      updateProject(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.projects() })
      queryClient.setQueryData(inventoryKeys.project(data.id), data)
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.projects() })
    },
  })
}

// ============================================
// Unit Types Hooks
// ============================================

export function useUnitTypes(projectId: string) {
  return useQuery({
    queryKey: inventoryKeys.unitTypes(projectId),
    queryFn: () => getUnitTypesByProject(projectId),
    enabled: !!projectId,
  })
}

export function useCreateUnitType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (unitType: Database["public"]["Tables"]["unit_types"]["Insert"]) =>
      createUnitType(unitType),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.unitTypes(data.project_id),
      })
    },
  })
}

export function useUpdateUnitType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Database["public"]["Tables"]["unit_types"]["Update"]
    }) => updateUnitType(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.unitTypes(data.project_id),
      })
    },
  })
}

export function useDeleteUnitType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      deleteUnitType(id),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.unitTypes(projectId),
      })
    },
  })
}

// ============================================
// Units Hooks
// ============================================

export function useUnitsByProject(
  projectId: string,
  filters?: {
    status?: UnitStatus
    floor?: number
    unitTypeId?: string
  }
) {
  return useQuery({
    queryKey: [...inventoryKeys.units(projectId), filters],
    queryFn: () => getUnitsByProject(projectId, filters),
    enabled: !!projectId,
  })
}

export function useUnit(id: string) {
  return useQuery({
    queryKey: inventoryKeys.unit(id),
    queryFn: () => getUnit(id),
    enabled: !!id,
  })
}

export function useAvailableUnits(projectId: string) {
  return useQuery({
    queryKey: inventoryKeys.availableUnits(projectId),
    queryFn: () => getAvailableUnits(projectId),
    enabled: !!projectId,
  })
}

export function useProjectFloors(projectId: string) {
  return useQuery({
    queryKey: inventoryKeys.floors(projectId),
    queryFn: () => getProjectFloors(projectId),
    enabled: !!projectId,
  })
}

export function useCreateUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (unit: UnitInsert) => createUnit(unit),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.units(data.project_id),
      })
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.project(data.project_id),
      })
    },
  })
}

export function useUpdateUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UnitUpdate }) =>
      updateUnit(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.units(data.project_id),
      })
      queryClient.setQueryData(inventoryKeys.unit(data.id), data)
    },
  })
}

export function useDeleteUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      deleteUnit(id),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.units(projectId) })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.project(projectId) })
    },
  })
}

export function useReserveUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ unitId, leadId }: { unitId: string; leadId: string }) =>
      reserveUnit(unitId, leadId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useReleaseUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (unitId: string) => releaseUnit(unitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useMarkUnitAsSold() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (unitId: string) => markUnitAsSold(unitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useToggleUnitBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ unitId, blocked }: { unitId: string; blocked: boolean }) =>
      toggleUnitBlock(unitId, blocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useBulkCreateUnits() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      units,
    }: {
      projectId: string
      units: Omit<UnitInsert, "project_id">[]
    }) => bulkCreateUnits(projectId, units),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.units(projectId) })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.project(projectId) })
    },
  })
}

// ============================================
// Reservations Hooks
// ============================================

export function useReservations(filters?: {
  status?: ReservationStatus
  projectId?: string
  leadId?: string
}) {
  return useQuery({
    queryKey: [...inventoryKeys.reservations(), filters],
    queryFn: () => getReservations(filters),
  })
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: inventoryKeys.reservation(id),
    queryFn: () => getReservation(id),
    enabled: !!id,
  })
}

export function useReservationsByLead(leadId: string) {
  return useQuery({
    queryKey: inventoryKeys.reservationsByLead(leadId),
    queryFn: () => getReservationsByLead(leadId),
    enabled: !!leadId,
  })
}

export function useReservationMetrics() {
  return useQuery({
    queryKey: inventoryKeys.reservationMetrics(),
    queryFn: getReservationMetrics,
  })
}

export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reservation: ReservationInsert) => createReservation(reservation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useUpdateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ReservationUpdate }) =>
      updateReservation(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.reservations() })
      queryClient.setQueryData(inventoryKeys.reservation(data.id), data)
    },
  })
}

export function useCancelReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelReservation(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useCompleteReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => completeReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

// ============================================
// Payments Hooks
// ============================================

export function usePaymentsByReservation(reservationId: string) {
  return useQuery({
    queryKey: inventoryKeys.payments(reservationId),
    queryFn: () => getPaymentsByReservation(reservationId),
    enabled: !!reservationId,
  })
}

export function usePaymentsSummary(reservationId: string) {
  return useQuery({
    queryKey: inventoryKeys.paymentsSummary(reservationId),
    queryFn: () => getPaymentsSummary(reservationId),
    enabled: !!reservationId,
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payment: PaymentInsert) => createPayment(payment),
    onSuccess: (data) => {
      if (data.reservation_id) {
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.payments(data.reservation_id),
        })
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.reservation(data.reservation_id),
        })
      }
    },
  })
}

export function useConfirmPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, confirmedBy }: { id: string; confirmedBy: string }) =>
      confirmPayment(id, confirmedBy),
    onSuccess: (data) => {
      if (data.reservation_id) {
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.payments(data.reservation_id),
        })
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.reservation(data.reservation_id),
        })
      }
    },
  })
}

export function useRejectPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rejectPayment(id),
    onSuccess: (data) => {
      if (data.reservation_id) {
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.payments(data.reservation_id),
        })
      }
    },
  })
}

// Re-export types
export type { ProjectWithStats, UnitWithRelations, UnitStatus, ReservationWithRelations, ReservationStatus }
