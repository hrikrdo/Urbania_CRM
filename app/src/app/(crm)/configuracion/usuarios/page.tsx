"use client"

import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { UsersManagement } from "@/components/configuracion/users-management"

export default function UsuariosConfigPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/configuracion">
            <IconArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestionar usuarios, roles y permisos del sistema
          </p>
        </div>
      </div>

      <UsersManagement />
    </div>
  )
}
