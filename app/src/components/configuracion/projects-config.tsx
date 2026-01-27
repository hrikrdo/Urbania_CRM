"use client"

import { useState } from "react"
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconBuildingSkyscraper,
  IconHome,
  IconMapPin,
} from "@tabler/icons-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// TODO: Replace with real data from projects and unit_types tables
const mockProjects = [
  {
    id: "1",
    name: "Torre Central",
    location: "Ciudad de Panamá",
    status: "active",
    totalUnits: 120,
    availableUnits: 45,
    unitTypes: [
      { id: "1a", name: "Studio", bedrooms: 0, bathrooms: 1, area: 45, price: 85000 },
      { id: "1b", name: "1 Recámara", bedrooms: 1, bathrooms: 1, area: 65, price: 120000 },
      { id: "1c", name: "2 Recámaras", bedrooms: 2, bathrooms: 2, area: 90, price: 175000 },
    ],
  },
  {
    id: "2",
    name: "Residencial Norte",
    location: "San Miguelito",
    status: "active",
    totalUnits: 80,
    availableUnits: 32,
    unitTypes: [
      { id: "2a", name: "1 Recámara", bedrooms: 1, bathrooms: 1, area: 55, price: 95000 },
      { id: "2b", name: "2 Recámaras", bedrooms: 2, bathrooms: 1, area: 75, price: 145000 },
    ],
  },
  {
    id: "3",
    name: "Vista Mar",
    location: "Costa del Este",
    status: "presale",
    totalUnits: 60,
    availableUnits: 60,
    unitTypes: [
      { id: "3a", name: "2 Recámaras", bedrooms: 2, bathrooms: 2, area: 95, price: 220000 },
      { id: "3b", name: "3 Recámaras", bedrooms: 3, bathrooms: 2, area: 130, price: 320000 },
    ],
  },
]

const statusLabels: Record<string, string> = {
  active: "Activo",
  presale: "Preventa",
  completed: "Completado",
  paused: "Pausado",
}

const statusColors: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  presale: "secondary",
  completed: "outline",
  paused: "outline",
}

export function ProjectsConfig() {
  const [search, setSearch] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showUnitTypeDialog, setShowUnitTypeDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [newProject, setNewProject] = useState({
    name: "",
    location: "",
    description: "",
    status: "presale",
  })
  const [newUnitType, setNewUnitType] = useState({
    name: "",
    bedrooms: 1,
    bathrooms: 1,
    area: 50,
    price: 100000,
  })

  const filteredProjects = mockProjects.filter(
    (project) =>
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.location.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddProject = () => {
    // TODO: Implement project creation with Supabase
    console.log("Creating project:", newProject)
    setShowAddDialog(false)
    setNewProject({ name: "", location: "", description: "", status: "presale" })
  }

  const handleAddUnitType = () => {
    // TODO: Implement unit type creation with Supabase
    console.log("Creating unit type for project:", selectedProject, newUnitType)
    setShowUnitTypeDialog(false)
    setNewUnitType({ name: "", bedrooms: 1, bathrooms: 1, area: 50, price: 100000 })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PA", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Proyectos y Tipos de Unidad</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar proyecto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setShowAddDialog(true)}>
                <IconPlus className="mr-2 size-4" />
                Nuevo Proyecto
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProjects.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredProjects.map((project) => (
                <AccordionItem key={project.id} value={project.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4 text-left">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                        <IconBuildingSkyscraper className="size-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{project.name}</span>
                          <Badge variant={statusColors[project.status]}>
                            {statusLabels[project.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <IconMapPin className="size-3" />
                            {project.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <IconHome className="size-3" />
                            {project.availableUnits}/{project.totalUnits} disponibles
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-medium">Tipos de Unidad</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project.id)
                            setShowUnitTypeDialog(true)
                          }}
                        >
                          <IconPlus className="mr-2 size-4" />
                          Agregar Tipo
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Recámaras</TableHead>
                            <TableHead>Baños</TableHead>
                            <TableHead>Área (m²)</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {project.unitTypes.map((unitType) => (
                            <TableRow key={unitType.id}>
                              <TableCell className="font-medium">
                                {unitType.name}
                              </TableCell>
                              <TableCell>{unitType.bedrooms}</TableCell>
                              <TableCell>{unitType.bathrooms}</TableCell>
                              <TableCell>{unitType.area} m²</TableCell>
                              <TableCell>{formatCurrency(unitType.price)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon">
                                    <IconEdit className="size-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon">
                                    <IconTrash className="size-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="py-12 text-center">
              <IconBuildingSkyscraper className="mx-auto size-12 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">
                {search ? "No se encontraron proyectos" : "No hay proyectos registrados"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Project Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Proyecto</DialogTitle>
            <DialogDescription>
              Crea un nuevo proyecto inmobiliario en el sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Nombre del Proyecto</Label>
              <Input
                id="project-name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Ej: Torre Central"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={newProject.location}
                onChange={(e) =>
                  setNewProject({ ...newProject, location: e.target.value })
                }
                placeholder="Ej: Ciudad de Panamá"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                placeholder="Descripción del proyecto..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={newProject.status}
                onValueChange={(value) =>
                  setNewProject({ ...newProject, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presale">Preventa</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddProject}>Crear Proyecto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Unit Type Dialog */}
      <Dialog open={showUnitTypeDialog} onOpenChange={setShowUnitTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Tipo de Unidad</DialogTitle>
            <DialogDescription>
              Agrega un nuevo tipo de unidad al proyecto.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="unit-name">Nombre</Label>
              <Input
                id="unit-name"
                value={newUnitType.name}
                onChange={(e) =>
                  setNewUnitType({ ...newUnitType, name: e.target.value })
                }
                placeholder="Ej: 2 Recámaras"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bedrooms">Recámaras</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min={0}
                  value={newUnitType.bedrooms}
                  onChange={(e) =>
                    setNewUnitType({ ...newUnitType, bedrooms: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bathrooms">Baños</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min={1}
                  value={newUnitType.bathrooms}
                  onChange={(e) =>
                    setNewUnitType({
                      ...newUnitType,
                      bathrooms: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="area">Área (m²)</Label>
                <Input
                  id="area"
                  type="number"
                  min={1}
                  value={newUnitType.area}
                  onChange={(e) =>
                    setNewUnitType({ ...newUnitType, area: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Precio (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  value={newUnitType.price}
                  onChange={(e) =>
                    setNewUnitType({ ...newUnitType, price: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnitTypeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddUnitType}>Agregar Tipo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
