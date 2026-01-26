"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationsDropdown } from "@/components/notifications"
import { createClient } from "@/lib/supabase/client"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/comercial": "Comercial",
  "/pool": "Pool de Leads",
  "/citas": "Citas",
  "/tramites": "Trámites",
  "/cobranza": "Cobranza",
  "/proyectos": "Proyectos",
  "/equipo": "Equipo",
  "/reportes": "Reportes",
  "/configuracion": "Configuración",
}

export function SiteHeader() {
  const pathname = usePathname()
  const title = pageTitles[pathname] || "Urbania CRM"
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null)
    })
  }, [])

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {userId && <NotificationsDropdown userId={userId} />}
        </div>
      </div>
    </header>
  )
}
