'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'

import { agregarInsumo } from '@/app/actions/recetas'
import { agregarInsumoSchema, type AgregarInsumoInput } from '@/lib/validations/receta'
import type { InsumoWithRelations } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface AgregarInsumoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recetaId: string
  insumos: InsumoWithRelations[]
  unidades: Array<{ id_unidad: string; nombre: string; abreviatura: string | null }>
}

// =====================================================
// COMPONENT
// =====================================================

export function AgregarInsumoDialog({
  open,
  onOpenChange,
  recetaId,
  insumos,
  unidades,
}: AgregarInsumoDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<AgregarInsumoInput>({
    resolver: zodResolver(agregarInsumoSchema),
    defaultValues: {
      id_receta: recetaId,
      id_insumo: '',
      cantidad: 0,
      id_unidad: '',
    },
  })

  // Reset form cuando se cierra el dialog
  useEffect(() => {
    if (!open) {
      form.reset({
        id_receta: recetaId,
        id_insumo: '',
        cantidad: 0,
        id_unidad: '',
      })
    }
  }, [open, form, recetaId])

  // Actualizar id_receta cuando cambia
  useEffect(() => {
    form.setValue('id_receta', recetaId)
  }, [recetaId, form])

  async function onSubmit(values: AgregarInsumoInput) {
    setIsLoading(true)

    try {
      const result = await agregarInsumo(values)

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      if (result.success) {
        toast.success('Insumo agregado exitosamente')

        // Cerrar el dialog
        onOpenChange(false)

        // Limpiar el formulario
        form.reset()

        // Refrescar la página
        router.refresh()
      }
    } catch (error) {
      toast.error('Error inesperado al agregar insumo')
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener el insumo seleccionado para mostrar su tipo
  const selectedInsumoId = form.watch('id_insumo')
  const selectedInsumo = insumos.find((i) => i.id_insumo === selectedInsumoId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Insumo a Receta</DialogTitle>
          <DialogDescription>
            Selecciona un insumo, la cantidad y la unidad de medida
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Seleccionar Insumo */}
            <FormField
              control={form.control}
              name="id_insumo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Insumo *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un insumo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {insumos.map((insumo) => (
                        <SelectItem key={insumo.id_insumo} value={insumo.id_insumo}>
                          <div className="flex items-center gap-2">
                            <span>{insumo.nombre}</span>
                            {insumo.tipo_insumo && (
                              <Badge variant="outline" className="text-xs">
                                {insumo.tipo_insumo.descripcion_tipo_insumo}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedInsumo?.nombre_cientifico && (
                    <p className="text-xs text-muted-foreground italic mt-1">
                      {selectedInsumo.nombre_cientifico}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cantidad */}
            <FormField
              control={form.control}
              name="cantidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Ej: 100"
                      disabled={isLoading}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unidad de Medida */}
            <FormField
              control={form.control}
              name="id_unidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad de Medida *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una unidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unidades.map((unidad) => (
                        <SelectItem key={unidad.id_unidad} value={unidad.id_unidad}>
                          {unidad.nombre}
                          {unidad.abreviatura && ` (${unidad.abreviatura})`}
                        </SelectItem>
                      ))}
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  'Agregar Insumo'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
