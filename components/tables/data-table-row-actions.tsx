'use client'

import * as React from 'react'
import { MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// =====================================================
// TYPES
// =====================================================

export interface RowAction<TData> {
  /**
   * Etiqueta del action
   */
  label: string
  /**
   * Callback cuando se hace click
   */
  onClick: (row: TData) => void
  /**
   * Icono opcional (componente de Lucide React)
   */
  icon?: React.ComponentType<{ className?: string }>
  /**
   * Variante del action (para aplicar estilos diferentes)
   */
  variant?: 'default' | 'destructive'
  /**
   * Roles permitidos para ver esta acción (opcional)
   * Si no se especifica, se muestra para todos los roles
   */
  allowedRoles?: string[]
  /**
   * Función para determinar si el action está deshabilitado
   */
  disabled?: (row: TData) => boolean
  /**
   * Mostrar separador después de este action
   */
  showSeparatorAfter?: boolean
}

export interface DataTableRowActionsProps<TData> {
  /**
   * Fila de datos
   */
  row: TData
  /**
   * Lista de acciones disponibles
   */
  actions: RowAction<TData>[]
  /**
   * Rol del usuario actual (para filtrar acciones según permisos)
   */
  userRole?: string | null
  /**
   * Etiqueta del dropdown
   */
  label?: string
}

// =====================================================
// COMPONENT
// =====================================================

export function DataTableRowActions<TData>({
  row,
  actions,
  userRole,
  label = 'Acciones',
}: DataTableRowActionsProps<TData>) {
  // Filtrar acciones según el rol del usuario
  const allowedActions = React.useMemo(() => {
    return actions.filter((action) => {
      // Si no se especifican roles permitidos, se muestra para todos
      if (!action.allowedRoles || action.allowedRoles.length === 0) {
        return true
      }

      // Si no hay rol de usuario, no mostrar acciones restringidas
      if (!userRole) {
        return false
      }

      // Verificar si el rol del usuario está en la lista de roles permitidos
      return action.allowedRoles.includes(userRole)
    })
  }, [actions, userRole])

  // Si no hay acciones permitidas, no mostrar el dropdown
  if (allowedActions.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">{label}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allowedActions.map((action, index) => {
          const Icon = action.icon
          const isDisabled = action.disabled ? action.disabled(row) : false

          return (
            <React.Fragment key={index}>
              <DropdownMenuItem
                onClick={() => !isDisabled && action.onClick(row)}
                disabled={isDisabled}
                className={
                  action.variant === 'destructive'
                    ? 'text-destructive focus:text-destructive'
                    : ''
                }
              >
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {action.label}
              </DropdownMenuItem>
              {action.showSeparatorAfter && <DropdownMenuSeparator />}
            </React.Fragment>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
