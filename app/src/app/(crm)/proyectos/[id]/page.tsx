"use client"

import { use } from "react"
import Link from "next/link"
import {
  IconArrowLeft,
  IconMapPin,
  IconEdit,
  IconSettings,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UnitsGrid } from "@/components/inventory"

import { useProject } from "@/hooks/use-inventory"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "Activo", variant: "default" },
  coming_soon: { label: "Próximamente", variant: "secondary" },
  sold_out: { label: "Agotado", variant: "outline" },
  archived: { label: "Archivado", variant: "destructive" },
}

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = use(params)
  const { data: project, isLoading, error } = useProject(id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <Link href="/proyectos">
          <Button variant="ghost" size="sm" className="gap-2">
            <IconArrowLeft className="size-4" />
            Volver
          </Button>
        </Link>
        <Card className="border-destructive/50">
          <CardContent className="py-12 text-center text-destructive">
            Proyecto no encontrado
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = statusConfig[project.status] || statusConfig.active

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/proyectos">
            <Button variant="ghost" size="icon">
              <IconArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
              {project.type && (
                <Badge variant="outline" className="capitalize">
                  {project.type}
                </Badge>
              )}
            </div>
            {project.address && (
              <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                <IconMapPin className="size-4" />
                <span>
                  {project.address}
                  {project.city && `, ${project.city}`}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <IconSettings className="size-4" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="p-4">
            <p className="text-xs text-muted-foreground">Total Unidades</p>
            <p className="text-2xl font-semibold">{project.units_count || 0}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <p className="text-xs text-muted-foreground">Disponibles</p>
            <p className="text-2xl font-semibold text-chart-2">
              {project.available_count || 0}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <p className="text-xs text-muted-foreground">Reservadas</p>
            <p className="text-2xl font-semibold text-chart-4">
              {project.reserved_count || 0}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <p className="text-xs text-muted-foreground">Vendidas</p>
            <p className="text-2xl font-semibold text-chart-1">
              {project.sold_count || 0}
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* Price Range */}
      {(project.price_from || project.price_to) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rango de Precios</p>
                <p className="text-lg font-semibold">
                  ${project.price_from?.toLocaleString() || "N/A"}
                  {project.price_to && (
                    <span>
                      {" - "}${project.price_to.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground max-w-md text-right">
                  {project.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="units" className="space-y-4">
        <TabsList>
          <TabsTrigger value="units">Unidades</TabsTrigger>
          <TabsTrigger value="types">Tipos de Unidad</TabsTrigger>
          <TabsTrigger value="reservations">Reservas</TabsTrigger>
        </TabsList>

        <TabsContent value="units" className="space-y-4">
          <UnitsGrid projectId={project.id} projectName={project.name} />
        </TabsContent>

        <TabsContent value="types">
          <UnitTypesTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="reservations">
          <ReservationsTab projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Unit Types Tab Component
function UnitTypesTab({ projectId }: { projectId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tipos de Unidad</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Configura los tipos de unidad disponibles en este proyecto (ej: 1
          Recámara, 2 Recámaras, Penthouse).
        </p>
        <Button variant="outline" className="mt-4">
          Administrar Tipos
        </Button>
      </CardContent>
    </Card>
  )
}

// Reservations Tab Component
function ReservationsTab({ projectId }: { projectId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reservas del Proyecto</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Lista de reservas activas para este proyecto.
        </p>
        <Button variant="outline" className="mt-4">
          Ver Todas las Reservas
        </Button>
      </CardContent>
    </Card>
  )
}
