'use client'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './Sidebar'
import { Separator } from '@/components/ui/separator'

// =====================================================
// TYPES
// =====================================================

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole?: 'admin' | 'user' | null
}

// =====================================================
// COMPONENT
// =====================================================

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar userRole={userRole} />
      <SidebarInset>
        {/* Header with trigger */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            {/* Breadcrumbs or page title can go here */}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
