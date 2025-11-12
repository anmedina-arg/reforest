'use client'

import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Play, CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

import { CompletarProduccionDialog } from './CompletarProduccionDialog'
import { iniciarProduccion, cancelarProduccion } from '@/app/actions/produccion'
import type { ProduccionWithRelations } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface ProduccionesTableProps {
  producciones: ProduccionWithRelations[]
}

interface ProduccionToCancel {
  id: string
  nombre: string
}

interface ProduccionToComplete {
  id: string
  nombre: string
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getEstadoBadgeVariant(
  estadoNombre?: string
): 'default' | 'secondary' | 'success' | 'destructive' | 'outline' {
  if (!estadoNombre) return 'secondary'

  const nombre = estadoNombre.toLowerCase()

  if (nombre.includes('curso')) {
    return 'default' // azul
  }
  if (nombre.includes('completada')) {
    return 'success' // verde
  }
  if (nombre.includes('planificada')) {
    return 'outline' // gris con borde
  }
  if (nombre.includes('cancelada')) {
    return 'destructive' // rojo
  }

  return 'secondary'
}

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

export function ProduccionesTable({ producciones }: ProduccionesTableProps) {
  const router = useRouter()
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [produccionToCancel, setProduccionToCancel] = useState<ProduccionToCancel | null>(null)
  const [produccionToComplete, setProduccionToComplete] = useState<ProduccionToComplete | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  async function handleIniciar(produccionId: string) {
    setIsActionLoading(true)

    try {
      const result = await iniciarProduccion({ id_produccion: produccionId })

      if (!result.success && result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success('Producción iniciada exitosamente')
        router.refresh()
      }
    } catch (error) {
      toast.error('Error inesperado al iniciar la producción')
    } finally {
      setIsActionLoading(false)
    }
  }

  async function handleCancelar() {
    if (!produccionToCancel) return

    setIsActionLoading(true)

    try {
      const result = await cancelarProduccion({ id_produccion: produccionToCancel.id })

      if (!result.success && result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success('Producción cancelada exitosamente')
        router.refresh()
      }
    } catch (error) {
      toast.error('Error inesperado al cancelar la producción')
    } finally {
      setIsActionLoading(false)
      setProduccionToCancel(null)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Receta</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead>Fecha Fin</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {producciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">No hay producciones registradas</p>
                </TableCell>
              </TableRow>
            ) : (
              producciones.map((produccion) => {
                const isExpanded = expandedRows.has(produccion.id_produccion)
                const estadoNombre = produccion.estado_produccion?.nombre?.toLowerCase() || ''
                const isPlanificada = estadoNombre.includes('planificada')
                const isEnCurso = estadoNombre.includes('curso')
                const isCompletada = estadoNombre.includes('completada')
                const isCancelada = estadoNombre.includes('cancelada')

                return (
                  <Fragment key={produccion.id_produccion}>
                    <TableRow>
                      {/* Expand button */}
                      <TableCell>
                        {produccion.insumos && produccion.insumos.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(produccion.id_produccion)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>

                      {/* Receta */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {produccion.receta?.nombre || 'Sin receta'}
                          </span>
                          {produccion.receta?.descripcion && (
                            <span className="text-sm text-muted-foreground">
                              {produccion.receta.descripcion}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Cantidad: Planificado vs Real */}
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          {isCompletada && produccion.cantidad_real !== null ? (
                            <>
                              <span className="font-medium">
                                {new Intl.NumberFormat('es-AR').format(produccion.cantidad_planificada || 0)} plan.
                              </span>
                              <span className="text-green-600 font-semibold">
                                {new Intl.NumberFormat('es-AR').format(produccion.cantidad_real)} real
                              </span>
                            </>
                          ) : (
                            <span className="font-medium">
                              {new Intl.NumberFormat('es-AR').format(produccion.cantidad_planificada || 0)} plan.
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        <Badge variant={getEstadoBadgeVariant(produccion.estado_produccion?.nombre)}>
                          {produccion.estado_produccion?.nombre || 'Sin estado'}
                        </Badge>
                      </TableCell>

                      {/* Fecha Inicio */}
                      <TableCell>{formatFecha(produccion.fecha_inicio)}</TableCell>

                      {/* Fecha Fin */}
                      <TableCell>{formatFecha(produccion.fecha_fin)}</TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isPlanificada && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleIniciar(produccion.id_produccion)}
                              disabled={isActionLoading}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Iniciar
                            </Button>
                          )}

                          {isEnCurso && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() =>
                                setProduccionToComplete({
                                  id: produccion.id_produccion,
                                  nombre: produccion.receta?.nombre || 'Sin nombre',
                                })
                              }
                              disabled={isActionLoading}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Completar
                            </Button>
                          )}

                          {!isCompletada && !isCancelada && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                setProduccionToCancel({
                                  id: produccion.id_produccion,
                                  nombre: produccion.receta?.nombre || 'Sin nombre',
                                })
                              }
                              disabled={isActionLoading}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded row - Insumos */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/50">
                          <Card>
                            <CardContent className="pt-4">
                              <h4 className="text-sm font-semibold mb-3">Insumos Consumidos</h4>
                              {produccion.insumos && produccion.insumos.length > 0 ? (
                                <div className="space-y-2">
                                  {produccion.insumos.map((insumo) => (
                                    <div
                                      key={insumo.id_produccion_insumo}
                                      className="flex items-center justify-between text-sm p-2 border rounded"
                                    >
                                      <div>
                                        <span className="font-medium">
                                          {insumo.insumo?.nombre || 'Sin nombre'}
                                        </span>
                                        {insumo.insumo?.nombre_cientifico && (
                                          <span className="text-muted-foreground ml-2 italic">
                                            ({insumo.insumo.nombre_cientifico})
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <Badge variant="secondary">
                                          {insumo.cantidad_real?.toLocaleString() || 0}{' '}
                                          {insumo.unidad?.abreviatura || insumo.unidad?.nombre || ''}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No hay insumos registrados
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para completar producción */}
      {produccionToComplete && (
        <CompletarProduccionDialog
          open={!!produccionToComplete}
          onOpenChange={(open) => !open && setProduccionToComplete(null)}
          produccionId={produccionToComplete.id}
          recetaNombre={produccionToComplete.nombre}
        />
      )}

      {/* Alert Dialog para cancelar producción */}
      <AlertDialog
        open={!!produccionToCancel}
        onOpenChange={() => setProduccionToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar producción?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cancelar la producción de{' '}
              <span className="font-semibold">{produccionToCancel?.nombre}</span>?
              <br />
              <br />
              Esta acción no se puede deshacer. Si la producción no ha sido completada, no se descontará stock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelar}
              disabled={isActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActionLoading ? 'Cancelando...' : 'Confirmar Cancelación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
