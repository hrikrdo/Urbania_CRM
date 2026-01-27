"use client"

import { useState } from "react"
import {
  IconSearch,
  IconHome,
  IconPhone,
  IconMail,
  IconCalendar,
  IconBuilding,
  IconEye,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

// TODO: Replace with real data from reservations with status = 'completed'
const mockClients = [
  {
    id: "1",
    name: "María González",
    email: "maria@email.com",
    phone: "+507 6123-4567",
    project: "Torre Central",
    unit: "12-A",
    deliveredAt: "2026-01-15",
    satisfaction: 5,
  },
  {
    id: "2",
    name: "Carlos Rodríguez",
    email: "carlos@email.com",
    phone: "+507 6234-5678",
    project: "Residencial Norte",
    unit: "8-B",
    deliveredAt: "2026-01-10",
    satisfaction: 4,
  },
]

export function DeliveredClientsList() {
  const [search, setSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<typeof mockClients[0] | null>(null)

  const filteredClients = mockClients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.project.toLowerCase().includes(search.toLowerCase()) ||
      client.unit.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Clientes Entregados</CardTitle>
            <div className="relative w-64">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente, proyecto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Fecha Entrega</TableHead>
                  <TableHead>Satisfacción</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {client.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{client.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <IconMail className="size-3" />
                          {client.email}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <IconPhone className="size-3" />
                          {client.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconBuilding className="size-4 text-muted-foreground" />
                        {client.project}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.unit}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <IconCalendar className="size-3" />
                        {new Date(client.deliveredAt).toLocaleDateString("es-PA")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < client.satisfaction
                                ? "text-chart-4"
                                : "text-muted-foreground/30"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedClient(client)}
                      >
                        <IconEye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <IconHome className="mx-auto size-12 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">
                {search ? "No se encontraron clientes" : "No hay entregas registradas"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Cliente</DialogTitle>
          </DialogHeader>

          {selectedClient && (
            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 pt-4">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16">
                    <AvatarFallback className="text-lg">
                      {selectedClient.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedClient.name}</h3>
                    <p className="text-muted-foreground">{selectedClient.email}</p>
                    <p className="text-muted-foreground">{selectedClient.phone}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Proyecto</p>
                    <p className="font-medium">{selectedClient.project}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unidad</p>
                    <p className="font-medium">{selectedClient.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Entrega</p>
                    <p className="font-medium">
                      {new Date(selectedClient.deliveredAt).toLocaleDateString("es-PA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Satisfacción</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < selectedClient.satisfaction
                              ? "text-chart-4"
                              : "text-muted-foreground/30"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="pt-4">
                <div className="py-8 text-center text-muted-foreground">
                  Historial de la venta disponible próximamente
                </div>
              </TabsContent>

              <TabsContent value="tickets" className="pt-4">
                <div className="py-8 text-center text-muted-foreground">
                  Sistema de tickets disponible próximamente
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
