"use client"

import { useState } from "react"
import {
  IconLayoutKanban,
  IconList,
} from "@tabler/icons-react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { CreditChecksList, TramitesKanban } from "@/components/tramites"
import { ModuleHeader } from "@/components/module-header"

export default function TramitesPage() {
  const [view, setView] = useState<"list" | "kanban">("kanban")

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ModuleHeader
        title="Trámites"
        description="Gestiona las verificaciones de crédito y precalificaciones"
      >
        <Tabs value={view} onValueChange={(v) => setView(v as "list" | "kanban")}>
          <TabsList>
            <TabsTrigger value="kanban" className="gap-2">
              <IconLayoutKanban className="size-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <IconList className="size-4" />
              Lista
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </ModuleHeader>

      {/* Content */}
      {view === "kanban" ? (
        <TramitesKanban />
      ) : (
        <CreditChecksList />
      )}
    </div>
  )
}
