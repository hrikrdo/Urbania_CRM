"use client"

import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { StagesConfig } from "@/components/configuracion/stages-config"

export default function EtapasConfigPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/configuracion">
            <IconArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Etapas de Venta</h1>
          <p className="text-muted-foreground">
            Definir las etapas del pipeline de ventas
          </p>
        </div>
      </div>

      <StagesConfig />
    </div>
  )
}
