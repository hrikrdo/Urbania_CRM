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

const data = {
  user: {
    name: "Usuario",
    email: "usuario@urbania.com",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Comercial",
      url: "/comercial",
      icon: IconLayoutKanban,
    },
    {
      title: "Pool",
      url: "/pool",
      icon: IconPool,
    },
    {
      title: "Citas",
      url: "/agenda",
      icon: IconCalendarEvent,
    },
    {
      title: "Marketing",
      url: "/marketing",
      icon: IconSpeakerphone,
    },
    {
      title: "Trámites",
      url: "/tramites",
      icon: IconFileDescription,
    },
    {
      title: "Cierre",
      url: "/cierre",
      icon: IconTicket,
    },
    {
      title: "Cobranza",
      url: "/cobranza",
      icon: IconCreditCard,
    },
    {
      title: "Post-Venta",
      url: "/postventa",
      icon: IconHomeCheck,
    },
    {
      title: "Proyectos",
      url: "/proyectos",
      icon: IconBuildingSkyscraper,
    },
    {
      title: "Equipo",
      url: "/equipo",
      icon: IconUsers,
    },
    {
      title: "Reportes",
      url: "/reportes",
      icon: IconChartBar,
    },
  ],
  navSecondary: [
    {
      title: "Notificaciones",
      url: "/notificaciones",
      icon: IconBell,
    },
    {
      title: "Configuración",
      url: "/configuracion",
      icon: IconSettings,
    },
    {
      title: "Ayuda",
      url: "/ayuda",
      icon: IconHelp,
    },
    {
      title: "Buscar",
      url: "#",
      icon: IconSearch,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-2"
            >
              <a href="/dashboard">
                <IconBuildingSkyscraper className="!size-5" />
                <span className="text-base font-semibold">Urbania CRM</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
