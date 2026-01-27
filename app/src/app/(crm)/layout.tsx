import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { LeadDetailPanel } from "@/components/leads/lead-detail-panel"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="h-svh max-h-svh overflow-hidden">
        <SiteHeader />
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          <div className="@container/main flex flex-1 flex-col gap-2 min-h-0">
            <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 min-h-0 overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Unified Lead Detail Panel - Available globally */}
      <LeadDetailPanel />
    </SidebarProvider>
  )
}
