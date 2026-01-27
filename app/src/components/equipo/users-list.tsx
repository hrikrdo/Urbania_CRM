"use client"

import { useState } from "react"
import {
  IconMail,
  IconPhone,
  IconSearch,
  IconUserCheck,
  IconUserOff,
} from "@tabler/icons-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useUsers, type UserWithRelations } from "@/hooks/use-team"
import { getUserInitials, getUserFullName } from "@/lib/services/team"

interface UsersListProps {
  onSelectUser?: (user: UserWithRelations) => void
}

export function UsersList({ onSelectUser }: UsersListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { data: users, isLoading } = useUsers()

  const filteredUsers = (users || []).filter((user) => {
    if (!searchTerm) return true
    const fullName = getUserFullName(user.first_name, user.last_name).toLowerCase()
    const email = user.email?.toLowerCase() || ""
    const search = searchTerm.toLowerCase()
    return fullName.includes(search) || email.includes(search)
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>
              {filteredUsers.length} usuario{filteredUsers.length !== 1 ? "s" : ""} registrado{filteredUsers.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No hay usuarios que coincidan con la búsqueda
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectUser?.(user)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {getUserInitials(user.first_name, user.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {getUserFullName(user.first_name, user.last_name)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <IconMail className="size-4" />
                            {user.email}
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <IconPhone className="size-4" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.role?.name || "Sin rol"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge variant="default" className="gap-1">
                          <IconUserCheck className="size-3" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <IconUserOff className="size-3" />
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
