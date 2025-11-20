'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

import { getMovimientos } from '@/app/actions/stock'
import { formatCantidadConUnidad } from '@/lib/utils/units'
import type { MovimientoWithRelations } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface MovimientosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  insumoId: string
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

export function MovimientosDialog({ open, onOpenChange, insumoId }: MovimientosDialogProps) {
  const [movimientos, setMovimientos] = useState<MovimientoWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [insumoNombre, setInsumoNombre] = useState<string>('')

  useEffect(() => {
    if (open && insumoId) {
      fetchMovimientos()
    }
  }, [open, insumoId])

  async function fetchMovimientos() {
    setIsLoading(true)

    try {
      const result = await getMovimientos({
        page: 1,
        pageSize: 100, // Get more records for history
        id_insumo: insumoId,
      })

      if (result.success && result.data) {
        setMovimientos(result.data.data)

        // Get insumo name from first movement
        if (result.data.data.length > 0 && result.data.data[0].insumo) {
          setInsumoNombre(result.data.data[0].insumo.nombre)
        }
      }
    } catch (error) {
      console.error('Error fetching movimientos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Historial de Movimientos</DialogTitle>
          <DialogDescription>
            {insumoNombre ? `Movimientos de: ${insumoNombre}` : 'Cargando...'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : movimientos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay movimientos registrados para este insumo
            </p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-auto">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead>Observación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((movimiento) => {
                    const cantidad = movimiento.cantidad || 0
                    const esEntrada = cantidad > 0
                    const esNeutro = cantidad === 0

                    return (
                      <TableRow key={movimiento.id_movimiento}>
                        {/* Fecha */}
                        <TableCell>{formatFecha(movimiento.fecha)}</TableCell>

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
                            variant={esEntrada ? 'success' : esNeutro ? 'secondary' : 'destructive'}
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
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Summary */}
        {!isLoading && movimientos.length > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total de movimientos:</span>
              <Badge variant="default">{movimientos.length}</Badge>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
