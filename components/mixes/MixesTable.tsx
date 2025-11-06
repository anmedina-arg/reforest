'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/tables/data-table'

import { MixDialog } from './MixDialog'
import type { MixISeeds } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

type MixWithCount = MixISeeds & { recetas_count: number }

interface MixesTableProps {
  initialData: MixWithCount[]
}

// =====================================================
// COMPONENT
// =====================================================

export function MixesTable({ initialData }: MixesTableProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)

  // =====================================================
  // COLUMNS DEFINITION
  // =====================================================

  const columns: ColumnDef<MixWithCount>[] = [
    {
      accessorKey: 'nombre',
      header: 'Nombre del Mix',
      cell: ({ row }) => {
        return (
          <span className="font-medium text-foreground cursor-pointer hover:underline">
            {row.original.nombre}
          </span>
        )
      },
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: ({ row }) => {
        const descripcion = row.original.descripcion
        return (
          <span className="text-sm text-muted-foreground cursor-pointer max-w-md truncate block">
            {descripcion || '-'}
          </span>
        )
      },
    },
    {
      accessorKey: 'recetas_count',
      header: 'Recetas',
      cell: ({ row }) => {
        const count = row.original.recetas_count
        return (
          <Badge variant="secondary" className="cursor-pointer">
            {count} {count === 1 ? 'receta' : 'recetas'}
          </Badge>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mixes de iSeeds</h2>
          <p className="text-muted-foreground">
            Gestiona las mezclas de recetas para tus proyectos
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Mix
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={initialData}
        searchColumn="nombre"
        searchable
        searchPlaceholder="Buscar por nombre..."
        onRowClick={(row) => router.push(`/mixes/${row.id_mix}`)}
      />

      {/* Create Dialog */}
      <MixDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
