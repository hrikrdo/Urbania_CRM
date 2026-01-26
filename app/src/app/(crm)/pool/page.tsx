import { PoolView } from "@/components/leads"
import { LeadDetailPanel } from "@/components/leads"

export const metadata = {
  title: "Pool - Urbania CRM",
  description: "Leads sin asignar",
}

export default function PoolPage() {
  return (
    <div className="flex flex-col">
      <PoolView />
      <LeadDetailPanel />
    </div>
  )
}
