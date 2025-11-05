'use client'

import { useState, useEffect, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Pencil, Trash, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable, DataTableRowActions, RowAction } from '@/components/tables'

import { InsumoDialog } from './InsumoDialog'
import { InsumoDeleteDialog } from './InsumoDeleteDialog'

import type { InsumoWithRelations } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface InsumosTableProps {
  initialData: InsumoWithRelations[]
  tiposInsumo: Array<{ id_tipo_insumo: string; descripcion_tipo_insumo: string }>
  unidadesMedida: Array<{ id_unidad: string; nombre: string; abreviatura: string | null }>
  userRole: string | null
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getTipoBadgeColor(tipo: string): 'default' | 'secondary' | 'outline' {
  const lowerTipo = tipo.toLowerCase()

  if (lowerTipo.includes('semilla')) return 'default'
  if (lowerTipo.includes('sustrato')) return 'secondary'
  if (lowerTipo.includes('promotor') || lowerTipo.includes('promotores')) return 'outline'

  return 'outline'
}

// =====================================================
// COMPONENT
// =====================================================

export function InsumosTable({
  initialData,
  tiposInsumo,
  unidadesMedida,
  userRole,
}: InsumosTableProps) {
  // State para filtros
  const [tipoFilter, setTipoFilter] = useState<string>('all')

  // State para datos filtrados
  const [filteredData, setFilteredData] = useState<InsumoWithRelations[]>(initialData)

  // State para diálogos
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedInsumo, setSelectedInsumo] = useState<InsumoWithRelations | null>(null)

  // Verificar permisos
  const canCreateOrEdit = userRole === 'admin' || userRole === 'operador_lab'

  // Aplicar filtros
  useEffect(() => {
    let filtered = initialData

    if (tipoFilter !== 'all') {
      filtered = filtered.filter((insumo) => insumo.id_tipo_insumo === tipoFilter)
    }

    setFilteredData(filtered)
  }, [initialData, tipoFilter])

  // Definir columnas
  const columns = useMemo<ColumnDef<InsumoWithRelations>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        enableSorting: true,
      },
      {
        accessorKey: 'tipo_insumo.descripcion_tipo_insumo',
        header: 'Tipo',
        cell: ({ row }) => {
          const tipo = row.original.tipo_insumo?.descripcion_tipo_insumo || 'Sin tipo'
          return (
            <Badge variant={getTipoBadgeColor(tipo)} className="whitespace-nowrap">
              {tipo}
            </Badge>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: 'especie',
        header: 'Especie',
        cell: ({ row }) => row.original.especie || '-',
      },
      {
        accessorKey: 'nombre_cientifico',
        header: 'Nombre Científico',
        cell: ({ row }) => (
          <span className="italic text-muted-foreground">
            {row.original.nombre_cientifico || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'unidad.nombre',
        header: 'Unidad',
        cell: ({ row }) => {
          const unidad = row.original.unidad
          if (!unidad) return '-'

          return (
            <span className="text-sm">
              {unidad.nombre}
              {unidad.abreviatura && (
                <span className="ml-1 text-muted-foreground">({unidad.abreviatura})</span>
              )}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => {
          const insumo = row.original

          const actions: RowAction<InsumoWithRelations>[] = [
            {
              label: 'Editar',
              onClick: (insumo) => {
                setSelectedInsumo(insumo)
                setEditDialogOpen(true)
              },
              icon: Pencil,
              allowedRoles: ['admin', 'operador_lab'],
            },
            {
              label: 'Eliminar',
              onClick: (insumo) => {
                setSelectedInsumo(insumo)
                setDeleteDialogOpen(true)
              },
              icon: Trash,
              variant: 'destructive',
              allowedRoles: ['admin', 'operador_lab'],
            },
          ]

          return <DataTableRowActions row={insumo} actions={actions} userRole={userRole} />
        },
      },
    ],
    [userRole]
  )

  return (
    <>
      <div className="space-y-4">
        {/* Header con filtros y botón nuevo */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Filtro por tipo */}
          <div className="flex items-center gap-2">
            <label htmlFor="tipo-filter" className="text-sm font-medium">
              Filtrar por tipo:
            </label>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger id="tipo-filter" className="w-[200px]">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {tiposInsumo.map((tipo) => (
                  <SelectItem key={tipo.id_tipo_insumo} value={tipo.id_tipo_insumo}>
                    {tipo.descripcion_tipo_insumo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botón nuevo insumo */}
          {canCreateOrEdit && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Insumo
            </Button>
          )}
        </div>

        {/* Tabla */}
        <DataTable
          columns={columns}
          data={filteredData}
          searchable
          searchPlaceholder="Buscar insumos..."
          searchColumn="nombre"
          emptyMessage="No se encontraron insumos"
          pagination={{
            mode: 'client',
            pageSize: 10,
          }}
        />
      </div>

      {/* Dialog para crear insumo */}
      <InsumoDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        tiposInsumo={tiposInsumo}
        unidadesMedida={unidadesMedida}
      />

      {/* Dialog para editar insumo */}
      <InsumoDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        insumo={selectedInsumo}
        tiposInsumo={tiposInsumo}
        unidadesMedida={unidadesMedida}
      />

      {/* Dialog para eliminar insumo */}
      <InsumoDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        insumo={selectedInsumo}
      />
    </>
  )
}
