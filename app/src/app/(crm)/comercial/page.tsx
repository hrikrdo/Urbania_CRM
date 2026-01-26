import { LeadsView } from "@/components/leads"

export const metadata = {
  title: "Comercial - Urbania CRM",
  description: "Gestión de leads comerciales",
}

export default function ComercialPage() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 mb-4">
        <h1 className="text-2xl font-bold">Comercial</h1>
        <p className="text-muted-foreground">
          Gestiona tu pipeline de ventas
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <LeadsView module="comercial" />
      </div>
    </div>
  )
}
