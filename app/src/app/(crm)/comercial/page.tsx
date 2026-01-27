import { LeadsView } from "@/components/leads"
import { ModuleHeader } from "@/components/module-header"

export const metadata = {
  title: "Comercial - Urbania CRM",
  description: "Gestión de leads comerciales",
}

export default function ComercialPage() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0">
        <ModuleHeader
          title="Comercial"
          description="Gestiona tu pipeline de ventas"
        />
      </div>
      <div className="flex-1 min-h-0">
        <LeadsView module="comercial" />
      </div>
    </div>
  )
}
