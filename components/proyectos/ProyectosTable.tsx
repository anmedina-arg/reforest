'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/tables/data-table'

import { ProyectoDialog } from './ProyectoDialog'
import type { ProyectoWithRelations, Cliente, EstadoProyecto, EcoRegion } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface ProyectosTableProps {
  initialData: ProyectoWithRelations[]
  clientes: Cliente[]
  estados: EstadoProyecto[]
  ecoRegiones: EcoRegion[]
  userRole?: string
}

// =====================================================
// BADGE COLORS BY ESTADO
// =====================================================

function getEstadoBadgeVariant(estadoNombre?: string): 'default' | 'secondary' | 'success' | 'destructive' {
  if (!estadoNombre) return 'default'

  const nombre = estadoNombre.toLowerCase()

  if (nombre.includes('activo') || nombre.includes('en curso')) {
    return 'success' // verde
  }
  if (nombre.includes('completado') || nombre.includes('finalizado')) {
    return 'default' // azul
  }
  if (nombre.includes('pausado') || nombre.includes('pendiente')) {
    return 'secondary' // gris
  }
  if (nombre.includes('cancelado')) {
    return 'destructive' // rojo
  }

  return 'default'
}

// =====================================================
// COMPONENT
// =====================================================

export function ProyectosTable({
  initialData,
  clientes,
  estados,
  ecoRegiones,
  userRole,
}: ProyectosTableProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCliente, setSelectedCliente] = useState<string>('all')
  const [selectedEstado, setSelectedEstado] = useState<string>('all')

  // =====================================================
  // COLUMNS DEFINITION
  // =====================================================

  const columns: ColumnDef<ProyectoWithRelations>[] = [
    {
      accessorKey: 'codigo_proyecto',
      header: 'Código',
      cell: ({ row }) => {
        const codigo = row.original.codigo_proyecto
        return (
          <span className="font-mono text-sm cursor-pointer hover:underline">
            {codigo || '-'}
          </span>
        )
      },
    },
    {
      accessorKey: 'nombre_del_proyecto',
      header: 'Nombre del Proyecto',
      cell: ({ row }) => {
        return (
          <div className="flex flex-col cursor-pointer">
            <span className="font-medium text-foreground hover:underline">
              {row.original.nombre_del_proyecto}
            </span>
            {row.original.nombre_fantasia && (
              <span className="text-xs text-muted-foreground">
                {row.original.nombre_fantasia}
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'cliente',
      header: 'Cliente',
      cell: ({ row }) => {
        const cliente = row.original.cliente
        return (
          <span className="text-sm cursor-pointer">
            {cliente?.nombre_cliente || '-'}
          </span>
        )
      },
    },
    {
      accessorKey: 'estado_proyecto',
      header: 'Estado',
      cell: ({ row }) => {
        const estado = row.original.estado_proyecto
        const variant = getEstadoBadgeVariant(estado?.nombre)

        return (
          <Badge variant={variant} className="cursor-pointer">
            {estado?.nombre || 'Sin estado'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'fechas',
      header: 'Fechas',
      cell: ({ row }) => {
        const { fecha_inicio, fecha_fin } = row.original

        const formatFecha = (fecha: string | null) => {
          if (!fecha) return '-'
          try {
            return format(new Date(fecha), 'dd/MM/yyyy', { locale: es })
          } catch {
            return '-'
          }
        }

        return (
          <div className="text-sm cursor-pointer">
            <div className="text-muted-foreground">
              Inicio: <span className="text-foreground">{formatFecha(fecha_inicio)}</span>
            </div>
            <div className="text-muted-foreground">
              Fin: <span className="text-foreground">{formatFecha(fecha_fin)}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'hectareas',
      header: 'Hectáreas',
      cell: ({ row }) => {
        const hectareas = row.original.hectareas
        return (
          <span className="text-sm cursor-pointer">
            {hectareas !== null && hectareas !== undefined ? hectareas.toLocaleString() : '-'}
          </span>
        )
      },
    },
  ]

  // =====================================================
  // FILTERING LOGIC
  // =====================================================

  const filteredData = initialData.filter((proyecto) => {
    // Search filter (nombre or código)
    const matchesSearch =
      searchTerm === '' ||
      proyecto.nombre_del_proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proyecto.codigo_proyecto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false

    // Cliente filter
    const matchesCliente =
      selectedCliente === 'all' || proyecto.id_cliente === selectedCliente

    // Estado filter
    const matchesEstado =
      selectedEstado === 'all' || proyecto.id_estado_proyecto === selectedEstado

    return matchesSearch && matchesCliente && matchesEstado
  })

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Proyectos</h2>
          <p className="text-muted-foreground">
            Gestiona los proyectos forestales
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Search by nombre/código */}
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Cliente filter */}
        <Select value={selectedCliente} onValueChange={setSelectedCliente}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todos los clientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clientes.map((cliente) => (
              <SelectItem key={cliente.id_cliente} value={cliente.id_cliente}>
                {cliente.nombre_cliente}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Estado filter */}
        <Select value={selectedEstado} onValueChange={setSelectedEstado}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {estados.map((estado) => (
              <SelectItem key={estado.id_estado_proyecto} value={estado.id_estado_proyecto}>
                {estado.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        searchKey="nombre_del_proyecto"
        onRowClick={(row) => router.push(`/proyectos/${row.id_proyecto}`)}
      />

      {/* Create Dialog */}
      <ProyectoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clientes={clientes}
        estados={estados}
        ecoRegiones={ecoRegiones}
      />
    </div>
  )
}
