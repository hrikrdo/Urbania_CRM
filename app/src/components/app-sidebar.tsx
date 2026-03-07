"use client"

import * as React from "react"
import {
  IconBuildingSkyscraper,
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconLayoutKanban,
  IconPool,
  IconSearch,
  IconSettings,
  IconUsers,
  IconCalendarEvent,
  IconFileDescription,
  IconCreditCard,
  IconBell,
  IconSpeakerphone,
  IconTicket,
  IconHomeCheck,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useCurrentUser } from "@/hooks/use-current-user"

const navMain = [
  { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
  { title: "Comercial", url: "/comercial", icon: IconLayoutKanban },
  { title: "Pool", url: "/pool", icon: IconPool },
  { title: "Citas", url: "/agenda", icon: IconCalendarEvent },
  { title: "Marketing", url: "/marketing", icon: IconSpeakerphone },
  { title: "Trámites", url: "/tramites", icon: IconFileDescription },
  { title: "Cierre", url: "/cierre", icon: IconTicket },
  { title: "Cobranza", url: "/cobranza", icon: IconCreditCard },
  { title: "Post-Venta", url: "/postventa", icon: IconHomeCheck },
  { title: "Proyectos", url: "/proyectos", icon: IconBuildingSkyscraper },
  { title: "Equipo", url: "/equipo", icon: IconUsers },
  { title: "Reportes", url: "/reportes", icon: IconChartBar },
]

const navSecondary = [
  { title: "Configuración", url: "/configuracion", icon: IconSettings },
  { title: "Notificaciones", url: "/configuracion/notificaciones", icon: IconBell },
  { title: "Ayuda", url: "#", icon: IconHelp },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: currentUser } = useCurrentUser()

  const user = {
    name: currentUser
      ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.email || "Usuario"
      : "Usuario",
    email: currentUser?.email || "—",
    avatar: (currentUser as any)?.avatar_url || "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/dashboard">
                <IconBuildingSkyscraper className="size-5 text-primary" />
                <span className="font-bold text-base">Urbania CRM</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
