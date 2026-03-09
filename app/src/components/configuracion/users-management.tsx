"use client"

import { useState } from "react"
import {
  IconSearch,
  IconPlus,
  IconMail,
  IconPhone,
  IconEdit,
  IconTrash,
  IconUserCircle,
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

// TODO: Replace with real data from profiles table
const mockUsers = [
  {
    id: "1",
    name: "Ana Martínez",
    email: "ana@urbania.com",
    phone: "+507 6111-1111",
    role: "admin",
    status: "active",
    createdAt: "2025-01-01",
  },
  {
    id: "2",
    name: "Carlos López",
    email: "carlos@urbania.com",
    phone: "+507 6222-2222",
    role: "asesor",
    status: "active",
    createdAt: "2025-01-15",
  },
  {
    id: "3",
    name: "María García",
    email: "maria@urbania.com",
    phone: "+507 6333-3333",
    role: "asesor",
    status: "active",
    createdAt: "2025-02-01",
  },
  {
    id: "4",
    name: "Pedro Rodríguez",
    email: "pedro@urbania.com",
    phone: "+507 6444-4444",
    role: "gerente",
    status: "inactive",
    createdAt: "2025-02-15",
  },
]

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  asesor: "Asesor",
  marketing: "Marketing",
}

const roleColors: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  gerente: "secondary",
  asesor: "outline",
  marketing: "outline",
}

export function UsersManagement() {
  const [search, setSearch] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "asesor",
  })

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddUser = () => {
    // TODO: Implement user creation with Supabase Auth
    console.log("Creating user:", newUser)
    setShowAddDialog(false)
    setNewUser({ name: "", email: "", phone: "", role: "asesor" })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Usuarios del Sistema</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuario..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setShowAddDialog(true)}>
                <IconPlus className="mr-2 size-4" />
                Nuevo Usuario
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <IconMail className="size-3" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <IconPhone className="size-3" />
                          {user.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleColors[user.role]}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.status === "active" ? "default" : "secondary"}
                      >
                        {user.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("es-PA")}
                    </TableCell>
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
          ) : (
            <div className="py-12 text-center">
              <IconUserCircle className="mx-auto size-12 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">
                {search ? "No se encontraron usuarios" : "No hay usuarios registrados"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Agrega un nuevo usuario al sistema. Se enviará una invitación por email.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Nombre del usuario"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="email@urbania.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="+507 6XXX-XXXX"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="asesor">Asesor</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddUser}>Crear Usuario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
