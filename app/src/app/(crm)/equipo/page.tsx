"use client"

import { useState } from "react"
import { IconUsers, IconUsersGroup, IconArrowsShuffle } from "@tabler/icons-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TeamMetrics, UsersList, TeamsList } from "@/components/equipo"
import { SalesTeamWorkload, UserProjectAssignments } from "@/components/distribution"
import { ModuleHeader } from "@/components/module-header"

export default function EquipoPage() {
  const [activeTab, setActiveTab] = useState<"users" | "teams" | "distribution">("users")

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <ModuleHeader
        title="Equipo"
        description="Gestiona usuarios y equipos de trabajo"
      />

      {/* Metrics */}
      <TeamMetrics />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "users" | "teams" | "distribution")}>
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <IconUsers className="size-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2">
            <IconUsersGroup className="size-4" />
            Equipos
          </TabsTrigger>
          <TabsTrigger value="distribution" className="gap-2">
            <IconArrowsShuffle className="size-4" />
            Distribución
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UsersList />
        </TabsContent>
        <TabsContent value="teams" className="mt-4">
          <TeamsList />
        </TabsContent>
        <TabsContent value="distribution" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <SalesTeamWorkload />
            <UserProjectAssignments />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
