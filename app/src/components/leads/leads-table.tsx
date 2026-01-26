"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  IconArrowsSort,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconFlame,
  IconLayoutColumns,
  IconLoader2,
  IconMail,
  IconPhone,
  IconSnowflake,
  IconTemperature,
  IconTrash,
  IconUser,
  IconUserPlus,
} from "@tabler/icons-react"
import { formatDistanceToNow, format } from "date-fns"
import { es } from "date-fns/locale"

import {
  useLeads,
  useDeleteLead,
  useAssignLead,
  useUpdateLead,
  useUpdateLeadStatus,
  useLeadStatuses,
  useUsers,
  useProjects,
} from "@/hooks/use-leads"
import { toast } from "sonner"
import { IconCheck } from "@tabler/icons-react"
import { useLeadsStore } from "@/stores/leads-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { LeadWithRelations } from "@/lib/services/leads"

const temperatureIcons = {
  hot: IconFlame,
  warm: IconTemperature,
  cold: IconSnowflake,
}

const temperatureColors = {
  hot: "text-chart-1",
  warm: "text-chart-5",
  cold: "text-chart-2",
}

// Editable Status Cell
function EditableStatusCell({ lead }: { lead: LeadWithRelations }) {
  const { data: statuses } = useLeadStatuses()
  const updateStatus = useUpdateLeadStatus()

  const handleStatusChange = async (statusId: string) => {
    try {
      await updateStatus.mutateAsync({ leadId: lead.id, statusId })
      toast.success("Estado actualizado")
    } catch {
      toast.error("Error al actualizar estado")
    }
  }

  const status = lead.status
  if (!status) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button className="focus:outline-none">
          <Badge
            variant="outline"
            className="cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              borderColor: status.color,
              color: status.color,
            }}
          >
            {status.name}
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {statuses?.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => handleStatusChange(s.id)}
            className="gap-2 cursor-pointer"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.name}
            {s.id === lead.status_id && (
              <IconCheck className="size-4 ml-auto text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Editable Assigned To Cell
function EditableAssignedToCell({ lead }: { lead: LeadWithRelations }) {
  const { data: users } = useUsers()
  const assignLead = useAssignLead()

  const handleAssign = async (userId: string | null) => {
    try {
      await assignLead.mutateAsync({ leadId: lead.id, userId })
      toast.success(userId ? "Lead asignado" : "Lead desasignado")
    } catch {
      toast.error("Error al asignar lead")
    }
  }

  const user = lead.assigned_user

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button className="focus:outline-none">
          {user ? (
            <div className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
              <IconUser className="size-3 text-muted-foreground" />
              <span className="text-sm">
                {user.first_name} {user.last_name}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm cursor-pointer hover:text-foreground transition-colors">
              Sin asignar
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          onClick={() => handleAssign(null)}
          className="gap-2 cursor-pointer"
        >
          <IconUser className="size-4 text-muted-foreground" />
          Sin asignar
          {!lead.assigned_to && (
            <IconCheck className="size-4 ml-auto text-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {users?.map((u) => (
          <DropdownMenuItem
            key={u.id}
            onClick={() => handleAssign(u.id)}
            className="gap-2 cursor-pointer"
          >
            <IconUser className="size-4 text-muted-foreground" />
            {u.first_name} {u.last_name}
            {u.id === lead.assigned_to && (
              <IconCheck className="size-4 ml-auto text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Editable Project Cell
function EditableProjectCell({ lead }: { lead: LeadWithRelations }) {
  const { data: projects } = useProjects()
  const updateLead = useUpdateLead()

  const handleProjectChange = async (projectId: string | null) => {
    try {
      await updateLead.mutateAsync({
        id: lead.id,
        updates: { project_id: projectId },
      })
      toast.success("Proyecto actualizado")
    } catch {
      toast.error("Error al actualizar proyecto")
    }
  }

  const project = lead.project

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button className="focus:outline-none">
          {project ? (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              {project.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm cursor-pointer hover:text-foreground transition-colors">
              Sin proyecto
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          onClick={() => handleProjectChange(null)}
          className="gap-2 cursor-pointer"
        >
          Sin proyecto
          {!lead.project_id && (
            <IconCheck className="size-4 ml-auto text-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {projects?.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => handleProjectChange(p.id)}
            className="gap-2 cursor-pointer"
          >
            {p.name}
            {p.id === lead.project_id && (
              <IconCheck className="size-4 ml-auto text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const columns: ColumnDef<LeadWithRelations>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todo"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "first_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Nombre
        <IconArrowsSort className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const lead = row.original
      const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ")
      const initials = [lead.first_name?.[0], lead.last_name?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase()
      const TempIcon = temperatureIcons[lead.temperature as keyof typeof temperatureIcons] || IconTemperature

      return (
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{fullName}</span>
            {lead.source && (
              <span className="text-xs text-muted-foreground">{lead.source}</span>
            )}
          </div>
          <TempIcon
            className={`size-4 ${
              temperatureColors[lead.temperature as keyof typeof temperatureColors] || ""
            }`}
          />
        </div>
      )
    },
  },
  {
    accessorKey: "phone",
    header: "Contacto",
    cell: ({ row }) => {
      const lead = row.original
      return (
        <div className="space-y-1">
          {lead.phone && (
            <div className="flex items-center gap-1 text-sm">
              <IconPhone className="size-3 text-muted-foreground" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1 text-sm">
              <IconMail className="size-3 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{lead.email}</span>
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "status_id",
    header: "Estado",
    cell: ({ row }) => <EditableStatusCell lead={row.original} />,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "assigned_to",
    header: "Asignado a",
    cell: ({ row }) => <EditableAssignedToCell lead={row.original} />,
  },
  {
    accessorKey: "project_id",
    header: "Proyecto",
    cell: ({ row }) => <EditableProjectCell lead={row.original} />,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Creado
        <IconArrowsSort className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.created_at)
      return (
        <div className="text-sm">
          <div>{format(date, "dd/MM/yyyy", { locale: es })}</div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true, locale: es })}
          </div>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <LeadActions lead={row.original} />,
  },
]

function LeadActions({ lead }: { lead: LeadWithRelations }) {
  const { openDetail } = useLeadsStore()
  const deleteLead = useDeleteLead()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <IconDotsVertical className="size-4" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => openDetail(lead)}>
          Ver detalle
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconUserPlus className="size-4 mr-2" />
          Asignar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => deleteLead.mutate(lead.id)}
        >
          <IconTrash className="size-4 mr-2" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface LeadsTableProps {
  filters?: {
    search?: string
    status_id?: string
    assigned_to?: string
    project_id?: string
    temperature?: string
    source?: string
    timer_status?: 'active' | 'expiring' | 'expired'
  }
}

export function LeadsTable({ filters }: LeadsTableProps) {
  const { data: leads, isLoading } = useLeads(filters)
  const { openDetail } = useLeadsStore()

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data: leads || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar leads..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="size-4 mr-2" />
                Columnas
                <IconChevronDown className="size-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                  onClick={(e) => {
                    // Don't open detail if clicking on checkbox or dropdown
                    if ((e.target as HTMLElement).closest("button, input")) return
                    openDetail(row.original)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No se encontraron leads.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between shrink-0">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows-per-page" className="text-sm">
              Filas por página
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-20" id="rows-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
