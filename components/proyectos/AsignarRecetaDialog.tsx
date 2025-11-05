'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { asignarReceta } from '@/app/actions/proyectos'
import type { RecetaWithRelations } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface AsignarRecetaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proyectoId: string
  recetaActual?: {
    id_receta: string
    nombre: string
  } | null
  recetas: RecetaWithRelations[]
}

// Validation schema
const asignarRecetaFormSchema = z.object({
  id_mix: z.string().uuid('Debe seleccionar una receta'),
})

type AsignarRecetaFormInput = z.infer<typeof asignarRecetaFormSchema>

// =====================================================
// COMPONENT
// =====================================================

export function AsignarRecetaDialog({
  open,
  onOpenChange,
  proyectoId,
  recetaActual,
  recetas,
}: AsignarRecetaDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<AsignarRecetaFormInput>({
    resolver: zodResolver(asignarRecetaFormSchema),
    defaultValues: {
      id_mix: recetaActual?.id_receta || '',
    },
  })

  async function onSubmit(values: AsignarRecetaFormInput) {
    setIsLoading(true)

    try {
      const result = await asignarReceta({
        id_proyecto: proyectoId,
        id_mix: values.id_mix,
      })

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      if (result.success) {
        toast.success('Receta asignada exitosamente')

        // Cerrar el dialog
        onOpenChange(false)

        // Refrescar la página
        router.refresh()
      }
    } catch (error) {
      toast.error('Error inesperado al asignar receta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Asignar Receta al Proyecto</DialogTitle>
          <DialogDescription>
            Selecciona la receta (mix de semillas) que se utilizará en este proyecto
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Select de Receta */}
            <FormField
              control={form.control}
              name="id_mix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receta *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una receta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {recetas.length === 0 ? (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          No hay recetas disponibles
                        </div>
                      ) : (
                        recetas.map((receta) => (
                          <SelectItem key={receta.id_receta} value={receta.id_receta}>
                            <div className="flex flex-col">
                              <span className="font-medium">{receta.nombre}</span>
                              {receta.descripcion && (
                                <span className="text-xs text-muted-foreground">
                                  {receta.descripcion}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
              <Button type="submit" disabled={isLoading || recetas.length === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Asignando...
                  </>
                ) : (
                  'Asignar Receta'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
