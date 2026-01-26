import { create } from "zustand"
import type { LeadWithRelations } from "@/lib/services/leads"

type ViewMode = "kanban" | "list"
type TimerStatus = "active" | "expiring" | "expired" | null
type Temperature = "hot" | "warm" | "cold" | null

interface LeadFilters {
  search: string
  status_id: string | null
  assigned_to: string | null
  project_id: string | null
  temperature: Temperature
  source: string | null
  timer_status: TimerStatus
}

interface LeadsStore {
  // Selected lead for detail panel
  selectedLead: LeadWithRelations | null
  setSelectedLead: (lead: LeadWithRelations | null) => void

  // Detail panel state
  isDetailOpen: boolean
  openDetail: (lead: LeadWithRelations) => void
  closeDetail: () => void

  // View mode
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  // Filters
  filters: LeadFilters
  setFilter: <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) => void
  clearFilters: () => void

  // Create lead modal
  isCreateModalOpen: boolean
  openCreateModal: () => void
  closeCreateModal: () => void
}

const initialFilters: LeadFilters = {
  search: "",
  status_id: null,
  assigned_to: null,
  project_id: null,
  temperature: null,
  source: null,
  timer_status: null,
}

export const useLeadsStore = create<LeadsStore>((set) => ({
  // Selected lead
  selectedLead: null,
  setSelectedLead: (lead) => set({ selectedLead: lead }),

  // Detail panel
  isDetailOpen: false,
  openDetail: (lead) => set({ selectedLead: lead, isDetailOpen: true }),
  closeDetail: () => set({ isDetailOpen: false }),

  // View mode
  viewMode: "kanban",
  setViewMode: (mode) => set({ viewMode: mode }),

  // Filters
  filters: initialFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  clearFilters: () => set({ filters: initialFilters }),

  // Create modal
  isCreateModalOpen: false,
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
}))
