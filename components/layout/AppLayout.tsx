'use client'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './Sidebar'
import { Separator } from '@/components/ui/separator'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { FlaskConical, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// =====================================================
// TYPES
// =====================================================

interface AppLayoutProps {
  children: React.ReactNode
  userRole?: 'admin' | 'user' | null
  userName?: string
  userEmail?: string
}

// =====================================================
// COMPONENT
// =====================================================

export function AppLayout({ children, userRole, userName, userEmail }: AppLayoutProps) {
  // Obtener iniciales del nombre del usuario
  const getUserInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <SidebarProvider>
      <AppSidebar userRole={userRole} />
      <SidebarInset>
        {/* Header fijo arriba */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
          {/* Left side: Trigger + Logo */}
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />

            {/* Logo y título */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FlaskConical className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-none">Reforest</span>
                <span className="text-xs text-muted-foreground leading-none">Lab Manager</span>
              </div>
            </div>
          </div>

          {/* Right side: User info + Logout */}
          <div className="flex items-center gap-3">
            {/* User info para desktop */}
            <div className="hidden items-center gap-2 sm:flex">
              <div className="text-right">
                <p className="text-sm font-medium leading-none">{userName || 'Usuario'}</p>
                {userEmail && (
                  <p className="text-xs text-muted-foreground leading-none mt-0.5">{userEmail}</p>
                )}
              </div>
            </div>

            {/* User menu dropdown para mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getUserInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{userName || 'Usuario'}</p>
                    {userEmail && (
                      <p className="text-xs text-muted-foreground">{userEmail}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <div className="w-full">
                    <LogoutButton />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
