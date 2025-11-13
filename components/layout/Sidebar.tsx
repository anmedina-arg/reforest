'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  FolderKanban,
  FlaskConical,
  Package,
  BookOpen,
  Layers,
  Warehouse,
  Microscope,
  Users,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

// =====================================================
// TYPES
// =====================================================

interface SidebarProps {
  userRole?: 'admin' | 'user' | null
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
  adminOnly?: boolean
}

// =====================================================
// NAV ITEMS
// =====================================================

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Proyectos',
    href: '/proyectos',
    icon: FolderKanban,
  },
  {
    title: 'Producción',
    href: '/produccion',
    icon: FlaskConical,
    disabled: true,
  },
  {
    title: 'Insumos',
    href: '/insumos',
    icon: Package,
  },
  {
    title: 'Recetas',
    href: '/recetas',
    icon: BookOpen,
  },
  {
    title: 'Mixes',
    href: '/mixes',
    icon: Layers,
  },
  {
    title: 'Stock',
    href: '/stock',
    icon: Warehouse,
  },
]

const secondaryNavItems: NavItem[] = [
  {
    title: 'Laboratorio',
    href: '/laboratorio',
    icon: Microscope,
    disabled: true,
  },
]

const adminNavItems: NavItem[] = [
  {
    title: 'Usuarios',
    href: '/admin/usuarios',
    icon: Users,
    adminOnly: true,
  },
]

// =====================================================
// COMPONENT
// =====================================================

export function AppSidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader className="border-b p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Reforest</span>
            <span className="text-xs text-muted-foreground">Lab Manager</span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    disabled={item.disabled}
                    tooltip={item.disabled ? 'Próximamente' : undefined}
                  >
                    <Link href={item.disabled ? '#' : item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Herramientas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    disabled={item.disabled}
                    tooltip={item.disabled ? 'Próximamente' : undefined}
                  >
                    <Link href={item.disabled ? '#' : item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Navigation */}
        {userRole === 'admin' && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel>Administración</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive(item.href)}>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t p-4">
        {/* Logout button is now handled by AppLayout dropdown */}
      </SidebarFooter>
    </Sidebar>
  )
}
