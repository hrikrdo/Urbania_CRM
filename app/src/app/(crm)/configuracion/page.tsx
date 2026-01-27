"use client"

import { useRouter } from "next/navigation"
import {
  IconUsers,
  IconBuildingSkyscraper,
  IconListDetails,
  IconPalette,
  IconBell,
  IconShieldLock,
  IconChevronRight,
} from "@tabler/icons-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const configSections = [
  {
    title: "Usuarios",
    description: "Gestionar usuarios, roles y permisos del sistema",
    icon: IconUsers,
    href: "/configuracion/usuarios",
  },
  {
    title: "Proyectos",
    description: "Configurar proyectos, tipos de unidades y precios",
    icon: IconBuildingSkyscraper,
    href: "/configuracion/proyectos",
  },
  {
    title: "Etapas de Venta",
    description: "Definir las etapas del pipeline de ventas",
    icon: IconListDetails,
    href: "/configuracion/etapas",
  },
  {
    title: "Apariencia",
    description: "Personalizar colores, logo y tema del sistema",
    icon: IconPalette,
    href: "/configuracion/apariencia",
  },
  {
    title: "Notificaciones",
    description: "Configurar alertas y notificaciones por email",
    icon: IconBell,
    href: "/configuracion/notificaciones",
  },
  {
    title: "Seguridad",
    description: "Configurar autenticación y políticas de acceso",
    icon: IconShieldLock,
    href: "/configuracion/seguridad",
    disabled: true,
  },
]

export default function ConfiguracionPage() {
  const router = useRouter()

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-muted-foreground">
          Administra la configuración general del sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {configSections.map((section) => (
          <Card
            key={section.title}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              section.disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => !section.disabled && router.push(section.href)}
          >
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <section.icon className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{section.title}</CardTitle>
              </div>
              <IconChevronRight className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>{section.description}</CardDescription>
              {section.disabled && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Próximamente disponible
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
