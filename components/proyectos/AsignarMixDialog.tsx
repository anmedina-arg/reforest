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

import { updateProyecto } from '@/app/actions/proyectos'
import type { MixISeeds } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface AsignarMixDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proyectoId: string
  mixActual?: {
    id_mix: string
    nombre: string
  } | null
  mixes: Array<MixISeeds & { recetas_count: number }>
}

// Validation schema
const asignarMixFormSchema = z.object({
  id_mix: z.string().uuid('Debe seleccionar un mix'),
})

type AsignarMixFormInput = z.infer<typeof asignarMixFormSchema>

// =====================================================
// COMPONENT
// =====================================================

export function AsignarMixDialog({
  open,
  onOpenChange,
  proyectoId,
  mixActual,
  mixes,
}: AsignarMixDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<AsignarMixFormInput>({
    resolver: zodResolver(asignarMixFormSchema),
    defaultValues: {
      id_mix: mixActual?.id_mix || '',
    },
  })

  async function onSubmit(values: AsignarMixFormInput) {
    setIsLoading(true)

    try {
      const result = await updateProyecto(proyectoId, {
        id_mix: values.id_mix,
      })

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      if (result.success) {
        toast.success('Mix asignado exitosamente')

        // Cerrar el dialog
        onOpenChange(false)

        // Refrescar la página
        router.refresh()
      }
    } catch (error) {
      toast.error('Error inesperado al asignar mix')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Asignar Mix al Proyecto</DialogTitle>
          <DialogDescription>
            Selecciona el mix de semillas que se utilizará en este proyecto
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Select de Mix */}
            <FormField
              control={form.control}
              name="id_mix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mix de iSeeds *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un mix" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mixes.length === 0 ? (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          No hay mixes disponibles
                        </div>
                      ) : (
                        mixes.map((mix) => (
                          <SelectItem key={mix.id_mix} value={mix.id_mix}>
                            <div className="flex flex-col">
                              <span className="font-medium">{mix.nombre}</span>
                              {mix.descripcion && (
                                <span className="text-xs text-muted-foreground">
                                  {mix.descripcion}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {mix.recetas_count} {mix.recetas_count === 1 ? 'receta' : 'recetas'}
                              </span>
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
              <Button type="submit" disabled={isLoading || mixes.length === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Asignando...
                  </>
                ) : (
                  'Asignar Mix'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
