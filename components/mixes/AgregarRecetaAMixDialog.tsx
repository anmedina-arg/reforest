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
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

import { agregarRecetaAMix } from '@/app/actions/mixes'
import { agregarRecetaAMixSchema, type AgregarRecetaAMixInput } from '@/lib/validations/mix'
import type { RecetaWithRelations } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface AgregarRecetaAMixDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mixId: string
  recetas: RecetaWithRelations[]
  recetasYaEnMix: string[] // IDs de recetas ya agregadas
}

// =====================================================
// COMPONENT
// =====================================================

export function AgregarRecetaAMixDialog({
  open,
  onOpenChange,
  mixId,
  recetas,
  recetasYaEnMix,
}: AgregarRecetaAMixDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<AgregarRecetaAMixInput>({
    resolver: zodResolver(agregarRecetaAMixSchema),
    defaultValues: {
      id_mix: mixId,
      id_receta: '',
      cantidad_iseeds: 0,
    },
  })

  async function onSubmit(values: AgregarRecetaAMixInput) {
    setIsLoading(true)

    try {
      const result = await agregarRecetaAMix(values)

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      if (result.success) {
        toast.success('Receta agregada al mix exitosamente')

        // Cerrar el dialog
        onOpenChange(false)

        // Limpiar el formulario
        form.reset({
          id_mix: mixId,
          id_receta: '',
          cantidad_iseeds: 0,
        })

        // Refrescar la página
        router.refresh()
      }
    } catch (error) {
      toast.error('Error inesperado al agregar receta')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar recetas que no están en el mix
  const recetasDisponibles = recetas.filter(
    (receta) => !recetasYaEnMix.includes(receta.id_receta)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Receta al Mix</DialogTitle>
          <DialogDescription>
            Selecciona una receta y especifica la cantidad de iSeeds
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Select de Receta */}
            <FormField
              control={form.control}
              name="id_receta"
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
                      {recetasDisponibles.length === 0 ? (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          Todas las recetas ya están en el mix
                        </div>
                      ) : (
                        recetasDisponibles.map((receta) => (
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

            {/* Cantidad de iSeeds */}
            <FormField
              control={form.control}
              name="cantidad_iseeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad de iSeeds *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      disabled={isLoading}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : 0)
                      }
                    />
                  </FormControl>
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
              <Button type="submit" disabled={isLoading || recetasDisponibles.length === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  'Agregar Receta'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
