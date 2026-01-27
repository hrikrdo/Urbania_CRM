"use client"

import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { ProjectsConfig } from "@/components/configuracion/projects-config"

export default function ProyectosConfigPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/configuracion">
            <IconArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Configuración de Proyectos</h1>
          <p className="text-muted-foreground">
            Configurar proyectos, tipos de unidades y precios
          </p>
        </div>
      </div>

      <ProjectsConfig />
    </div>
  )
}
