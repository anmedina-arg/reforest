'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Play, CheckCircle, XCircle, Eye } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

import { CompletarProduccionDialog } from '@/components/proyectos/CompletarProduccionDialog'
import { iniciarProduccion, cancelarProduccion } from '@/app/actions/produccion'
import type { ProduccionWithRelations } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface ProduccionTableProps {
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
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es })
  } catch {
    return '-'
  }
}

// =====================================================
// COMPONENT
// =====================================================

export function ProduccionTable({ producciones }: ProduccionTableProps) {
  const router = useRouter()
  const [produccionToCancel, setProduccionToCancel] = useState<ProduccionToCancel | null>(null)
  const [produccionToComplete, setProduccionToComplete] = useState<ProduccionToComplete | null>(
    null
  )
  const [isActionLoading, setIsActionLoading] = useState(false)

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
              <TableHead>Proyecto</TableHead>
              <TableHead>Receta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {producciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No hay producciones para mostrar
                </TableCell>
              </TableRow>
            ) : (
              producciones.map((produccion) => {
                const estadoNombre = produccion.estado_produccion?.nombre?.toLowerCase() || ''
                const isPlanificada = estadoNombre.includes('planificada')
                const isEnCurso = estadoNombre.includes('curso')
                const isCompletada = estadoNombre.includes('completada')
                const isCancelada = estadoNombre.includes('cancelada')

                return (
                  <TableRow key={produccion.id_produccion}>
                    {/* Proyecto */}
                    <TableCell>
                      <div className="flex flex-col">
                        <Link
                          href={`/proyectos/${produccion.id_proyecto}`}
                          className="font-medium hover:underline"
                        >
                          {produccion.proyecto?.nombre_del_proyecto || 'Sin nombre'}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {produccion.proyecto?.codigo_proyecto || '-'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Receta */}
                    <TableCell>
                      <span className="text-sm">
                        {produccion.receta?.nombre || 'Sin receta'}
                      </span>
                    </TableCell>

                    {/* Estado */}
                    <TableCell>
                      <Badge variant={getEstadoBadgeVariant(produccion.estado_produccion?.nombre)}>
                        {produccion.estado_produccion?.nombre || 'Sin estado'}
                      </Badge>
                    </TableCell>

                    {/* Fecha inicio */}
                    <TableCell>
                      <span className="text-sm">{formatFecha(produccion.fecha_inicio)}</span>
                    </TableCell>

                    {/* Cantidad */}
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end text-sm">
                        {isCompletada && produccion.cantidad_real !== null ? (
                          <>
                            <span className="font-medium text-muted-foreground">
                              {new Intl.NumberFormat('es-AR').format(
                                produccion.cantidad_planificada || 0
                              )}{' '}
                              plan.
                            </span>
                            <span className="text-green-600 font-semibold">
                              {new Intl.NumberFormat('es-AR').format(produccion.cantidad_real)}{' '}
                              real
                            </span>
                          </>
                        ) : (
                          <span className="font-medium">
                            {new Intl.NumberFormat('es-AR').format(
                              produccion.cantidad_planificada || 0
                            )}{' '}
                            plan.
                          </span>
                        )}
                      </div>
                    </TableCell>

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
                            variant="outline"
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

                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/proyectos/${produccion.id_proyecto}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
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
              Esta acción no se puede deshacer. Si la producción no ha sido completada, no se
              descontará stock.
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
