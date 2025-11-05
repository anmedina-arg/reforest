'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'

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

import { removerInsumo } from '@/app/actions/recetas'
import type { InsumoEnReceta } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface RemoverInsumoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recetaId: string
  insumo: InsumoEnReceta | null
}

// =====================================================
// COMPONENT
// =====================================================

export function RemoverInsumoDialog({
  open,
  onOpenChange,
  recetaId,
  insumo,
}: RemoverInsumoDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleRemove() {
    if (!insumo) return

    setIsLoading(true)

    try {
      const result = await removerInsumo({
        id_receta: recetaId,
        id_insumo: insumo.id_insumo,
      })

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      if (result.success) {
        toast.success('Insumo removido de la receta exitosamente')

        // Cerrar el dialog
        onOpenChange(false)

        // Refrescar la página
        router.refresh()
      }
    } catch (error) {
      toast.error('Error inesperado al remover insumo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Remover Insumo</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-3">
            ¿Estás seguro de que deseas remover el insumo{' '}
            <span className="font-semibold">{insumo?.nombre}</span> de esta receta?
            <br />
            <br />
            La cantidad actual es: <span className="font-semibold">
              {insumo?.cantidad} {insumo?.unidad.abreviatura || insumo?.unidad.nombre}
            </span>
            <br />
            <br />
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleRemove()
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removiendo...
              </>
            ) : (
              'Remover'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
