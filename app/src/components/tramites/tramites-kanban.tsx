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
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import {
  IconLoader2,
  IconSearch,
  IconFileDescription,
  IconCurrencyDollar,
  IconBuildingBank,
  IconFileCheck,
  IconCheck,
  IconX,
  IconFilter,
  IconBuilding,
} from "@tabler/icons-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  useCreditChecks,
  useUpdateCreditCheck,
  getTramiteStage,
  type CreditCheckWithRelations,
  type TramiteStage,
} from "@/hooks/use-credit-checks"
import { useProjects } from "@/hooks/use-inventory"
import { CreditCheckDetail } from "./credit-check-detail"
import { cn } from "@/lib/utils"

// Define the stages of the tramite process
// Using shadcn/ui chart colors for consistent theming
const tramiteStages: {
  id: TramiteStage
  name: string
  icon: typeof IconSearch
  color: string
  description: string
}[] = [
  {
    id: "apc_pending",
    name: "Verificación APC",
    icon: IconSearch,
    color: "bg-chart-3",
    description: "Pendiente verificar en APC",
  },
  {
    id: "income_pending",
    name: "Verificar Ingresos",
    icon: IconCurrencyDollar,
    color: "bg-chart-1",
    description: "APC verificado, pendiente ingresos",
  },
  {
    id: "bank_pending",
    name: "Precalificación",
    icon: IconBuildingBank,
    color: "bg-chart-4",
    description: "Pendiente precalificación bancaria",
  },
  {
    id: "formal_pending",
    name: "Aprobación Formal",
    icon: IconFileCheck,
    color: "bg-chart-5",
    description: "Pendiente aprobación formal",
  },
  {
    id: "approved",
    name: "Aprobados",
    icon: IconCheck,
    color: "bg-chart-2",
    description: "Trámites aprobados",
  },
  {
    id: "rejected",
    name: "Rechazados",
    icon: IconX,
    color: "bg-destructive",
    description: "Trámites rechazados",
  },
]

interface TramiteCardProps {
  check: CreditCheckWithRelations
  onClick: () => void
  isDragging?: boolean
}

function TramiteCard({ check, onClick, isDragging }: TramiteCardProps) {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return null
    return `$${amount.toLocaleString()}`
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isDragging && "opacity-50 shadow-lg scale-105"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted shrink-0">
            <IconFileDescription className="size-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {check.lead?.first_name} {check.lead?.last_name}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {check.cedula}
            </p>
          </div>
        </div>

        {/* Project Badge */}
        {check.lead?.project?.name && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs gap-1">
              <IconBuilding className="size-3" />
              {check.lead.project.name}
            </Badge>
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-1">
          {check.apc_status && (
            <Badge variant="outline" className="text-xs">
              APC: {check.apc_status === "good" ? "Bueno" :
                    check.apc_status === "fair" ? "Regular" :
                    check.apc_status === "bad" ? "Malo" : "Sin historial"}
            </Badge>
          )}
          {check.income_verified && check.monthly_income && (
            <Badge variant="outline" className="text-xs">
              {formatCurrency(check.monthly_income)}/mes
            </Badge>
          )}
          {check.prequalified && check.prequalified_amount && (
            <Badge variant="secondary" className="text-xs">
              Precal: {formatCurrency(check.prequalified_amount)}
            </Badge>
          )}
        </div>

        {check.bank_name && (
          <p className="mt-2 text-xs text-muted-foreground truncate">
            Banco: {check.bank_name}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface TramiteColumnProps {
  stage: typeof tramiteStages[number]
  checks: CreditCheckWithRelations[]
  onCardClick: (check: CreditCheckWithRelations) => void
}

function TramiteColumn({ stage, checks, onCardClick }: TramiteColumnProps) {
  const StageIcon = stage.icon

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] h-full max-h-full bg-muted/50 rounded-lg">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <div className={cn("size-3 rounded-full", stage.color)} />
          <h3 className="font-medium text-sm">{stage.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {checks.length}
          </Badge>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-2 space-y-2 min-h-[100px]">
          {checks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <StageIcon className="size-8 opacity-40 mb-2" />
              <p className="text-xs text-center px-2">{stage.description}</p>
            </div>
          ) : (
            checks.map((check) => (
              <TramiteCard
                key={check.id}
                check={check}
                onClick={() => onCardClick(check)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface TramitesKanbanProps {
  projectFilter?: string
  onProjectFilterChange?: (projectId: string | undefined) => void
}

export function TramitesKanban({ projectFilter, onProjectFilterChange }: TramitesKanbanProps) {
  const [localProjectFilter, setLocalProjectFilter] = useState<string | undefined>(projectFilter)
  const activeProjectFilter = projectFilter ?? localProjectFilter

  const { data: creditChecks, isLoading, error } = useCreditChecks(
    activeProjectFilter ? { projectId: activeProjectFilter } : undefined
  )
  const { data: projects } = useProjects()
  const updateCreditCheck = useUpdateCreditCheck()
  const [selectedCheck, setSelectedCheck] = useState<CreditCheckWithRelations | null>(null)
  const [activeCheck, setActiveCheck] = useState<CreditCheckWithRelations | null>(null)

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

  const handleProjectFilterChange = (value: string) => {
    const newValue = value === "all" ? undefined : value
    setLocalProjectFilter(newValue)
    onProjectFilterChange?.(newValue)
  }

  // Group checks by stage
  const checksByStage = tramiteStages.reduce((acc, stage) => {
    acc[stage.id] = creditChecks?.filter((check) => getTramiteStage(check) === stage.id) || []
    return acc
  }, {} as Record<string, CreditCheckWithRelations[]>)

  const handleDragStart = (event: DragStartEvent) => {
    const check = creditChecks?.find((c) => c.id === event.active.id)
    if (check) {
      setActiveCheck(check)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCheck(null)

    const { active, over } = event
    if (!over) return

    const checkId = active.id as string
    const targetStageId = over.id as string

    // Find the check
    const check = creditChecks?.find((c) => c.id === checkId)
    if (!check) return

    const currentStage = getTramiteStage(check)
    if (currentStage === targetStageId) return

    // Handle stage transitions
    // Note: In a real app, you'd want to show a confirmation dialog
    // and potentially update multiple fields
    if (targetStageId === "approved") {
      updateCreditCheck.mutate({
        id: checkId,
        updates: { result: "approved" },
      })
    } else if (targetStageId === "rejected") {
      updateCreditCheck.mutate({
        id: checkId,
        updates: { result: "rejected" },
      })
    }
    // For other stages, opening the detail panel is more appropriate
    // since they require filling in specific data
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

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <IconFilter className="size-4 text-muted-foreground" />
        <Select
          value={activeProjectFilter || "all"}
          onValueChange={handleProjectFilterChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos los proyectos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proyectos</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 h-full">
          {tramiteStages.map((stage) => (
            <TramiteColumn
              key={stage.id}
              stage={stage}
              checks={checksByStage[stage.id] || []}
              onCardClick={setSelectedCheck}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCheck && (
            <TramiteCard
              check={activeCheck}
              onClick={() => {}}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Detail Sheet */}
      <Sheet open={!!selectedCheck} onOpenChange={() => setSelectedCheck(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[1200px] p-0 flex flex-col gap-0">
          <VisuallyHidden>
            <SheetTitle>Verificación de Crédito</SheetTitle>
          </VisuallyHidden>
          {selectedCheck && (
            <CreditCheckDetail
              creditCheck={selectedCheck}
              onClose={() => setSelectedCheck(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
