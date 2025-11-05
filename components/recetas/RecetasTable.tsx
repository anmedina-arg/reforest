'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/tables'

import { RecetaDialog } from './RecetaDialog'

import type { RecetaWithRelations } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface RecetasTableProps {
  initialData: RecetaWithRelations[]
  responsables: Array<{
    id_responsable_labo: string
    nombre_responsable: string
  }>
  userRole: string | null
}

// =====================================================
// COMPONENT
// =====================================================

export function RecetasTable({ initialData, responsables, userRole }: RecetasTableProps) {
  const router = useRouter()

  // State para diálogos
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Verificar permisos
  const canCreateOrEdit = userRole === 'admin' || userRole === 'operador_lab'

  // Handler para click en fila
  const handleRowClick = useCallback(
    (receta: RecetaWithRelations) => {
      router.push(`/recetas/${receta.id_receta}`)
    },
    [router]
  )

  // Definir columnas
  const columns = useMemo<ColumnDef<RecetaWithRelations>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        enableSorting: true,
        cell: ({ row }) => (
          <div
            className="font-medium text-primary hover:underline cursor-pointer"
            onClick={() => handleRowClick(row.original)}
          >
            {row.original.nombre}
          </div>
        ),
      },
      {
        accessorKey: 'autor',
        header: 'Autor',
        enableSorting: false,
        cell: ({ row }) => {
          const autor = row.original.autor
          if (!autor)
            return (
              <span className="text-muted-foreground cursor-pointer" onClick={() => handleRowClick(row.original)}>
                Sin autor
              </span>
            )

          return (
            <span className="text-sm cursor-pointer" onClick={() => handleRowClick(row.original)}>
              {autor.nombre_responsable}
            </span>
          )
        },
      },
      {
        accessorKey: 'insumos_count',
        header: 'Insumos',
        enableSorting: true,
        cell: ({ row }) => {
          const count = row.original.insumos_count || 0
          return (
            <Badge
              variant="secondary"
              className="font-mono cursor-pointer"
              onClick={() => handleRowClick(row.original)}
            >
              {count} {count === 1 ? 'insumo' : 'insumos'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Fecha de Creación',
        enableSorting: true,
        cell: ({ row }) => {
          try {
            const fecha = new Date(row.original.created_at)
            return (
              <span
                className="text-sm text-muted-foreground cursor-pointer"
                onClick={() => handleRowClick(row.original)}
              >
                {format(fecha, 'dd/MM/yyyy', { locale: es })}
              </span>
            )
          } catch {
            return (
              <span
                className="text-sm text-muted-foreground cursor-pointer"
                onClick={() => handleRowClick(row.original)}
              >
                -
              </span>
            )
          }
        },
      },
    ],
    [handleRowClick]
  )

  return (
    <>
      <div className="space-y-4">
        {/* Header con botón nuevo */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          {/* Botón nueva receta */}
          {canCreateOrEdit && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Receta
            </Button>
          )}
        </div>

        {/* Tabla */}
        <DataTable
          columns={columns}
          data={initialData}
          searchable
          searchPlaceholder="Buscar recetas por nombre..."
          searchColumn="nombre"
          emptyMessage="No se encontraron recetas"
          pagination={{
            mode: 'client',
            pageSize: 10,
          }}
        />
      </div>

      {/* Dialog para crear receta */}
      <RecetaDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        responsables={responsables}
      />
    </>
  )
}
