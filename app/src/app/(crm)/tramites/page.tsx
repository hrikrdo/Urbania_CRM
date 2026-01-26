"use client"

import { useState } from "react"
import {
  IconLayoutKanban,
  IconList,
  IconPlus,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { CreditChecksList, TramitesKanban } from "@/components/tramites"

export default function TramitesPage() {
  const [view, setView] = useState<"list" | "kanban">("kanban")

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Trámites</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las verificaciones de crédito y precalificaciones
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Content */}
      {view === "kanban" ? (
        <TramitesKanban />
      ) : (
        <CreditChecksList />
      )}
    </div>
  )
}
