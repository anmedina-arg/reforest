'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'

import { AgregarInsumoDialog } from './AgregarInsumoDialog'
import { RemoverInsumoDialog } from './RemoverInsumoDialog'

import type { InsumoEnReceta, InsumoWithRelations } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface RecetaInsumosListProps {
  recetaId: string
  insumos: InsumoEnReceta[]
  insumosDisponibles: InsumoWithRelations[]
  unidadesDisponibles: Array<{
    id_unidad: string
    nombre: string
    abreviatura: string | null
  }>
  userRole: string | null
}

// =====================================================
// COMPONENT
// =====================================================

export function RecetaInsumosList({
  recetaId,
  insumos,
  insumosDisponibles,
  unidadesDisponibles,
  userRole,
}: RecetaInsumosListProps) {
  // State para diálogos
  const [agregarDialogOpen, setAgregarDialogOpen] = useState(false)
  const [removerDialogOpen, setRemoverDialogOpen] = useState(false)
  const [selectedInsumo, setSelectedInsumo] = useState<InsumoEnReceta | null>(null)

  // Verificar permisos
  const canEdit = userRole === 'admin' || userRole === 'operador_lab'

  // Calcular totales agrupados por unidad
  const totalesPorUnidad = useMemo(() => {
    const totales: Record<
      string,
      {
        unidad: string
        abreviatura: string | null
        total: number
      }
    > = {}

    insumos.forEach((insumo) => {
      const unidadKey = insumo.unidad.id_unidad

      if (!totales[unidadKey]) {
        totales[unidadKey] = {
          unidad: insumo.unidad.nombre,
          abreviatura: insumo.unidad.abreviatura,
          total: 0,
        }
      }

      totales[unidadKey].total += insumo.cantidad
    })

    return Object.values(totales)
  }, [insumos])

  const handleRemoveClick = (insumo: InsumoEnReceta) => {
    setSelectedInsumo(insumo)
    setRemoverDialogOpen(true)
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header con botón agregar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Ingredientes</h2>
            <p className="text-sm text-muted-foreground">
              {insumos.length} {insumos.length === 1 ? 'insumo' : 'insumos'} en esta receta
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => setAgregarDialogOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Insumo
            </Button>
          )}
        </div>

        {/* Tabla de insumos */}
        {insumos.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              No hay insumos en esta receta todavía.
            </p>
            {canEdit && (
              <Button
                onClick={() => setAgregarDialogOpen(true)}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar primer insumo
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Unidad</TableHead>
                  {canEdit && <TableHead className="w-[80px]">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {insumos.map((insumo) => (
                  <TableRow key={insumo.id_insumo}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{insumo.nombre}</span>
                        {insumo.nombre_cientifico && (
                          <span className="text-xs text-muted-foreground italic">
                            {insumo.nombre_cientifico}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {insumo.cantidad.toLocaleString('es-CL', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {insumo.unidad.abreviatura || insumo.unidad.nombre}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveClick(insumo)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remover insumo</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>

              {/* Totales agrupados por unidad */}
              {totalesPorUnidad.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={canEdit ? 4 : 3}>
                      <div className="flex flex-col gap-2 py-2">
                        <Separator className="mb-2" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">Totales por unidad:</span>
                          <div className="flex flex-wrap gap-3 justify-end">
                            {totalesPorUnidad.map((total, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-sm"
                              >
                                <span className="font-mono font-semibold">
                                  {total.total.toLocaleString('es-CL', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                                <Badge variant="secondary">
                                  {total.abreviatura || total.unidad}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        )}
      </div>

      {/* Dialog para agregar insumo */}
      <AgregarInsumoDialog
        open={agregarDialogOpen}
        onOpenChange={setAgregarDialogOpen}
        recetaId={recetaId}
        insumos={insumosDisponibles}
        unidades={unidadesDisponibles}
      />

      {/* Dialog para remover insumo */}
      <RemoverInsumoDialog
        open={removerDialogOpen}
        onOpenChange={setRemoverDialogOpen}
        recetaId={recetaId}
        insumo={selectedInsumo}
      />
    </>
  )
}
