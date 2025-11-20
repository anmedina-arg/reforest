'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

import { getMovimientos } from '@/app/actions/stock'
import { formatCantidadConUnidad } from '@/lib/utils/units'
import type { MovimientoWithRelations, InsumoWithRelations, PaginatedResponse } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface MovimientosTableProps {
  initialData: PaginatedResponse<MovimientoWithRelations> | null
  insumos: InsumoWithRelations[]
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function formatFecha(fecha: string | null): string {
  if (!fecha) return '-'
  try {
    return format(new Date(fecha), "dd/MM/yyyy", { locale: es })
  } catch {
    return '-'
  }
}

// =====================================================
// COMPONENT
// =====================================================

export function MovimientosTable({ initialData, insumos }: MovimientosTableProps) {
  const [data, setData] = useState(initialData)
  const [insumoFilter, setInsumoFilter] = useState<string>('all')
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const movimientos = data?.data || []
  const totalPages = data?.totalPages || 1
  const total = data?.total || 0

  async function fetchMovimientos(page: number = 1) {
    startTransition(async () => {
      try {
        const filters: any = {
          page,
          pageSize: 50,
        }

        if (insumoFilter !== 'all') {
          filters.id_insumo = insumoFilter
        }

        if (fechaDesde) {
          filters.fecha_desde = fechaDesde
        }

        if (fechaHasta) {
          filters.fecha_hasta = fechaHasta
        }

        const result = await getMovimientos(filters)

        if (result.success && result.data) {
          setData(result.data)
          setCurrentPage(page)
        } else if (result.error) {
          toast.error(result.error)
        }
      } catch (error) {
        toast.error('Error al cargar movimientos')
      }
    })
  }

  function handleApplyFilters() {
    fetchMovimientos(1)
  }

  function handleClearFilters() {
    setInsumoFilter('all')
    setFechaDesde('')
    setFechaHasta('')
    // Fetch without filters
    startTransition(async () => {
      const result = await getMovimientos({ page: 1, pageSize: 50 })
      if (result.success && result.data) {
        setData(result.data)
        setCurrentPage(1)
      }
    })
  }

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) return
    fetchMovimientos(page)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
        {/* Insumo Filter */}
        <div className="space-y-2">
          <Label>Insumo</Label>
          <Select value={insumoFilter} onValueChange={setInsumoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los insumos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los insumos</SelectItem>
              {insumos.map((insumo) => (
                <SelectItem key={insumo.id_insumo} value={insumo.id_insumo}>
                  {insumo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fecha Desde */}
        <div className="space-y-2">
          <Label>Fecha Desde</Label>
          <Input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>

        {/* Fecha Hasta */}
        <div className="space-y-2">
          <Label>Fecha Hasta</Label>
          <Input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>

        {/* Filter Actions */}
        <div className="md:col-span-3 flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClearFilters} disabled={isPending}>
            Limpiar Filtros
          </Button>
          <Button onClick={handleApplyFilters} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aplicando...
              </>
            ) : (
              'Aplicar Filtros'
            )}
          </Button>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Mostrando {movimientos.length} de {new Intl.NumberFormat('es-AR').format(total)} movimientos
        </span>
        {totalPages > 1 && (
          <span>
            Página {currentPage} de {totalPages}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Insumo</TableHead>
              <TableHead>Tipo de Movimiento</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead>Observación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : movimientos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <p className="text-muted-foreground">
                    No se encontraron movimientos con los filtros aplicados
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              movimientos.map((movimiento) => {
                const cantidad = movimiento.cantidad || 0
                const esEntrada = cantidad > 0
                const esNeutro = cantidad === 0

                return (
                  <TableRow key={movimiento.id_movimiento}>
                    {/* Fecha */}
                    <TableCell className="font-medium">
                      {formatFecha(movimiento.fecha)}
                    </TableCell>

                    {/* Insumo */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {movimiento.insumo?.nombre || 'Sin especificar'}
                        </span>
                        {movimiento.insumo?.nombre_cientifico && (
                          <span className="text-xs text-muted-foreground italic">
                            {movimiento.insumo.nombre_cientifico}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Tipo de Movimiento */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!esNeutro && (
                          <>
                            {esEntrada ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                          </>
                        )}
                        <span className="text-sm">
                          {movimiento.tipo_movimiento?.descripcion_movimiento || '-'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Cantidad */}
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          esEntrada ? 'success' : esNeutro ? 'secondary' : 'destructive'
                        }
                        className="font-mono"
                      >
                        {esEntrada && '+'}
                        {formatCantidadConUnidad(Math.abs(cantidad), movimiento.unidad_medida || 'unidad')}
                      </Badge>
                    </TableCell>

                    {/* Observación */}
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {movimiento.observacion || '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isPending}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={isPending}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isPending}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
