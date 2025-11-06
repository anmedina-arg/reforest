'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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

import { AgregarRecetaAMixDialog } from './AgregarRecetaAMixDialog'
import { removerRecetaDeMix } from '@/app/actions/mixes'
import type { RecetaEnMix, RecetaWithRelations } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface MixRecetasTableProps {
  mixId: string
  recetas: RecetaEnMix[]
  todasRecetas: RecetaWithRelations[]
}

// =====================================================
// COMPONENT
// =====================================================

export function MixRecetasTable({ mixId, recetas, todasRecetas }: MixRecetasTableProps) {
  const router = useRouter()
  const [agregarRecetaOpen, setAgregarRecetaOpen] = useState(false)
  const [recetaToDelete, setRecetaToDelete] = useState<RecetaEnMix | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const totalISeeds = recetas.reduce((sum, receta) => sum + receta.cantidad_iseeds, 0)

  async function handleDelete() {
    if (!recetaToDelete) return

    setIsDeleting(true)

    try {
      const result = await removerRecetaDeMix({
        id_mix: mixId,
        id_receta: recetaToDelete.id_receta,
      })

      if (!result.success && result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success('Receta removida del mix exitosamente')
        router.refresh()
      }
    } catch (error) {
      toast.error('Error inesperado al remover receta')
    } finally {
      setIsDeleting(false)
      setRecetaToDelete(null)
    }
  }

  // IDs de recetas ya en el mix
  const recetasYaEnMix = recetas.map((r) => r.id_receta)

  return (
    <>
      <div className="space-y-4">
        {/* Header con botón agregar */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Recetas del Mix</h3>
            <p className="text-sm text-muted-foreground">
              {recetas.length} {recetas.length === 1 ? 'receta' : 'recetas'} en este mix
            </p>
          </div>
          <Button onClick={() => setAgregarRecetaOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Receta
          </Button>
        </div>

        {/* Tabla de recetas */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receta</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad iSeeds</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recetas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <p className="text-muted-foreground">No hay recetas en este mix</p>
                    <Button
                      variant="link"
                      onClick={() => setAgregarRecetaOpen(true)}
                      className="mt-2"
                    >
                      Agregar primera receta
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                recetas.map((receta) => (
                  <TableRow key={receta.id_receta}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{receta.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {receta.descripcion || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        {receta.cantidad_iseeds.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRecetaToDelete(receta)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {recetas.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>
                    <span className="font-semibold">Total</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="default" className="text-base">
                      {totalISeeds.toLocaleString()} iSeeds
                    </Badge>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>

      {/* Dialog para agregar receta */}
      <AgregarRecetaAMixDialog
        open={agregarRecetaOpen}
        onOpenChange={setAgregarRecetaOpen}
        mixId={mixId}
        recetas={todasRecetas}
        recetasYaEnMix={recetasYaEnMix}
      />

      {/* Alert Dialog para confirmar eliminación */}
      <AlertDialog open={!!recetaToDelete} onOpenChange={() => setRecetaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Remover receta del mix?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas remover la receta{' '}
              <span className="font-semibold">{recetaToDelete?.nombre}</span> de este mix?
              <br />
              <br />
              Cantidad: {recetaToDelete?.cantidad_iseeds.toLocaleString()} iSeeds
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Removiendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
