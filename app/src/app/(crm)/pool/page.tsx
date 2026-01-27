import { PoolView } from "@/components/leads"
import { LeadDetailPanel } from "@/components/leads"
import { ModuleHeader } from "@/components/module-header"

export const metadata = {
  title: "Pool - Urbania CRM",
  description: "Leads sin asignar",
}

export default function PoolPage() {
  return (
    <div className="flex flex-col">
      <ModuleHeader
        title="Pool"
        description="Leads sin asignar disponibles para tomar"
      />
      <PoolView />
      <LeadDetailPanel />
    </div>
  )
}
