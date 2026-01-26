"use client"

import { create } from "zustand"
import type { DashboardFilters } from "@/lib/services/leads"

interface DashboardState {
  filters: DashboardFilters
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void
  setFilters: (filters: Partial<DashboardFilters>) => void
  clearFilters: () => void
}

// Get current month date range by default
const now = new Date()
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

const defaultFilters: DashboardFilters = {
  project_id: undefined,
  assigned_to: undefined,
  date_from: firstDayOfMonth.toISOString(),
  date_to: lastDayOfMonth.toISOString(),
}

export const useDashboardStore = create<DashboardState>((set) => ({
  filters: defaultFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  clearFilters: () => set({ filters: defaultFilters }),
}))
