'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { completarProduccion } from '@/app/actions/produccion'
import { completarProduccionSchema, type CompletarProduccionInput } from '@/lib/validations/produccion'

// =====================================================
// TYPES
// =====================================================

interface CompletarProduccionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produccionId: string
  recetaNombre: string
}

// =====================================================
// COMPONENT
// =====================================================

export function CompletarProduccionDialog({
  open,
  onOpenChange,
  produccionId,
  recetaNombre,
}: CompletarProduccionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<CompletarProduccionInput>({
    resolver: zodResolver(completarProduccionSchema),
    defaultValues: {
      id_produccion: produccionId,
      cantidad_real: 0,
      fecha_fin: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    },
  })

  async function onSubmit(values: CompletarProduccionInput) {
    setIsLoading(true)

    try {
      const result = await completarProduccion(values)

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      if (result.success) {
        toast.success('Producción completada exitosamente')

        // Cerrar el dialog
        onOpenChange(false)

        // Limpiar el formulario
        form.reset()

        // Refrescar la página
        router.refresh()
      }
    } catch (error) {
      toast.error('Error inesperado al completar la producción')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Completar Producción</DialogTitle>
          <DialogDescription>
            Completa la producción de la receta <span className="font-semibold">{recetaNombre}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Cantidad Real */}
            <FormField
              control={form.control}
              name="cantidad_real"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad Real Producida *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="0"
                      disabled={isLoading}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Cantidad real de iSeeds producidos. Puede ser menor a lo planificado.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha de Fin */}
            <FormField
              control={form.control}
              name="fecha_fin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Finalización</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      disabled={isLoading}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Si no se especifica, se usará la fecha actual
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completando...
                  </>
                ) : (
                  'Completar Producción'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
