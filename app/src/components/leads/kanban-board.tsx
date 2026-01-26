"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { IconLoader2 } from "@tabler/icons-react"

import { useKanbanLeads, useUpdateLeadStatus } from "@/hooks/use-leads"
import { useLeadsStore } from "@/stores/leads-store"
import { KanbanColumn } from "./kanban-column"
import { LeadCard } from "./lead-card"
import type { LeadWithRelations } from "@/lib/services/leads"

interface KanbanBoardProps {
  module?: string
}

export function KanbanBoard({ module = "comercial" }: KanbanBoardProps) {
  const { data: columns, isLoading, error } = useKanbanLeads(module)
  const updateStatus = useUpdateLeadStatus()
  const { openCreateModal } = useLeadsStore()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeLead, setActiveLead] = useState<LeadWithRelations | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    // Find the lead being dragged
    const lead = columns
      ?.flatMap((col) => col.leads)
      .find((l) => l.id === active.id)

    if (lead) {
      setActiveLead(lead)
    }
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Optional: handle drag over for visual feedback
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)
    setActiveLead(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the source and destination columns
    const activeColumn = columns?.find((col) =>
      col.leads.some((l) => l.id === activeId)
    )

    // Check if we dropped over a column directly or over a lead
    let overColumn = columns?.find((col) => col.id === overId)

    if (!overColumn) {
      // We dropped over a lead, find its column
      overColumn = columns?.find((col) =>
        col.leads.some((l) => l.id === overId)
      )
    }

    if (!activeColumn || !overColumn) return

    // If the columns are different, update the status
    if (activeColumn.id !== overColumn.id) {
      updateStatus.mutate({
        leadId: activeId,
        statusId: overColumn.id,
      })
    }
  }

  const handleAddLead = (_statusId: string) => {
    openCreateModal()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive gap-2">
        <p className="font-medium">Error al cargar datos</p>
        <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
      </div>
    )
  }

  if (!columns || columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No hay columnas configuradas</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 h-full">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onAddLead={handleAddLead}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}
