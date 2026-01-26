"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { IconPlus } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LeadCard } from "./lead-card"
import type { KanbanColumn as KanbanColumnType } from "@/lib/services/leads"

interface KanbanColumnProps {
  column: KanbanColumnType
  onAddLead?: (statusId: string) => void
}

export function KanbanColumn({ column, onAddLead }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  })

  const leadIds = column.leads.map((lead) => lead.id)

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] h-full max-h-full bg-muted/50 rounded-lg">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="size-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-medium text-sm">{column.name}</h3>
          <Badge variant="secondary">{column.leads.length}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onAddLead?.(column.id)}
        >
          <IconPlus />
        </Button>
      </div>

      {/* Column Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div
          ref={setNodeRef}
          className={`p-2 space-y-2 min-h-[100px] transition-colors ${
            isOver ? "bg-primary/5" : ""
          }`}
        >
          <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
            {column.leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </SortableContext>

          {column.leads.length === 0 && (
            <div className="flex items-center justify-center h-20 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
              Sin leads
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
