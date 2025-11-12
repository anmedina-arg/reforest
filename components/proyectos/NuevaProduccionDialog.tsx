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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

import { createProduccion } from '@/app/actions/produccion'
import { createProduccionSchema, type CreateProduccionInput } from '@/lib/validations/produccion'
import type { RecetaEnMix } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface NuevaProduccionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proyectoId: string
  recetas: RecetaEnMix[] // Recetas del mix asignado
}

// =====================================================
// COMPONENT
// =====================================================

export function NuevaProduccionDialog({
  open,
  onOpenChange,
  proyectoId,
  recetas,
}: NuevaProduccionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<CreateProduccionInput>({
    resolver: zodResolver(createProduccionSchema),
    defaultValues: {
      id_proyecto: proyectoId,
      id_receta: '',
      cantidad_planificada: 0,
      fecha_inicio: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    },
  })

  async function onSubmit(values: CreateProduccionInput) {
    setIsLoading(true)

    try {
      const result = await createProduccion(values)

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      if (result.success) {
        toast.success('Producción creada exitosamente')

        // Cerrar el dialog
        onOpenChange(false)

        // Limpiar el formulario
        form.reset({
          id_proyecto: proyectoId,
          id_receta: '',
          cantidad_planificada: 0,
          fecha_inicio: new Date().toISOString().split('T')[0],
        })

        // Refrescar la página
        router.refresh()
      }
    } catch (error) {
      toast.error('Error inesperado al crear la producción')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Producción</DialogTitle>
          <DialogDescription>
            Crea una nueva producción para el proyecto
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
                        <SelectValue placeholder="Selecciona una receta del mix" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {recetas.length === 0 ? (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          No hay recetas disponibles en el mix
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
                              <span className="text-xs text-muted-foreground">
                                {receta.cantidad_iseeds.toLocaleString()} iSeeds
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

            {/* Cantidad Planificada */}
            <FormField
              control={form.control}
              name="cantidad_planificada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad Planificada *</FormLabel>
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
                    Cantidad objetivo de iSeeds a producir en esta tanda
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha de Inicio */}
            <FormField
              control={form.control}
              name="fecha_inicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Inicio *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      disabled={isLoading}
                      {...field}
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
              <Button type="submit" disabled={isLoading || recetas.length === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Producción'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
