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
import { Textarea } from '@/components/ui/textarea'

import { registrarEntrada } from '@/app/actions/stock'
import { registrarEntradaSchema, type RegistrarEntradaInput } from '@/lib/validations/stock'
import type { InsumoWithRelations } from '@/types/entities'
import { getTipoUnidad, type TipoUnidad } from '@/lib/utils/units'

// =====================================================
// TYPES
// =====================================================

interface RegistrarEntradaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  insumos: InsumoWithRelations[]
}

// =====================================================
// CONSTANTS
// =====================================================

// Unidades disponibles por tipo
const UNIDADES_PESO = [
  { value: 'kilogramo', label: 'Kilogramo (kg)' },
  { value: 'kg', label: 'kg' },
  { value: 'gramo', label: 'Gramo (g)' },
  { value: 'g', label: 'g' },
]

const UNIDADES_VOLUMEN = [
  { value: 'litro', label: 'Litro (l)' },
  { value: 'l', label: 'l' },
  { value: 'mililitro', label: 'Mililitro (ml)' },
  { value: 'ml', label: 'ml' },
]

const UNIDADES_UNIDAD = [{ value: 'unidad', label: 'Unidad (u)' }, { value: 'u', label: 'u' }]

// =====================================================
// COMPONENT
// =====================================================

export function RegistrarEntradaDialog({
  open,
  onOpenChange,
  insumos,
}: RegistrarEntradaDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<RegistrarEntradaInput>({
    resolver: zodResolver(registrarEntradaSchema),
    defaultValues: {
      id_insumo: '',
      cantidad: 0,
      unidad_medida: '',
      fecha: new Date().toISOString().split('T')[0], // Fecha actual por defecto
      observacion: '',
    },
  })

  const insumoSeleccionado = form.watch('id_insumo')
  const insumoData = insumos.find((i) => i.id_insumo === insumoSeleccionado)

  // Determinar qué unidades mostrar según el tipo de unidad del insumo
  const getUnidadesDisponibles = () => {
    if (!insumoData || !insumoData.unidad) {
      return [...UNIDADES_PESO, ...UNIDADES_VOLUMEN, ...UNIDADES_UNIDAD]
    }

    const unidadNombre =
      insumoData.unidad.abreviatura || insumoData.unidad.nombre || 'unidad'

    try {
      const tipo = getTipoUnidad(unidadNombre)

      switch (tipo) {
        case 'peso':
          return UNIDADES_PESO
        case 'volumen':
          return UNIDADES_VOLUMEN
        case 'unidad':
          return UNIDADES_UNIDAD
        default:
          return [...UNIDADES_PESO, ...UNIDADES_VOLUMEN, ...UNIDADES_UNIDAD]
      }
    } catch (error) {
      // Si no se puede determinar el tipo, mostrar todas las unidades
      console.warn('No se pudo determinar el tipo de unidad:', error)
      return [...UNIDADES_PESO, ...UNIDADES_VOLUMEN, ...UNIDADES_UNIDAD]
    }
  }

  // Auto-populate unidad_medida when insumo is selected
  const handleInsumoChange = (insumoId: string) => {
    const insumo = insumos.find((i) => i.id_insumo === insumoId)
    if (insumo && insumo.unidad) {
      form.setValue('unidad_medida', insumo.unidad.abreviatura || insumo.unidad.nombre || '')
    }
    form.setValue('id_insumo', insumoId)
  }

  async function onSubmit(values: RegistrarEntradaInput) {
    setIsLoading(true)

    try {
      const result = await registrarEntrada(values)

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      if (result.success) {
        toast.success('Entrada registrada exitosamente')

        // Cerrar el dialog
        onOpenChange(false)

        // Limpiar el formulario
        form.reset({
          id_insumo: '',
          cantidad: 0,
          unidad_medida: '',
          fecha: new Date().toISOString().split('T')[0],
          observacion: '',
        })

        // Refrescar la página
        router.refresh()
      }
    } catch (error) {
      toast.error('Error inesperado al registrar la entrada')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Registrar Entrada de Stock</DialogTitle>
          <DialogDescription>
            Registra una nueva entrada de insumo al inventario
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
                    onValueChange={handleInsumoChange}
                    value={field.value}
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
                          {insumo.nombre}
                          {insumo.nombre_cientifico && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({insumo.nombre_cientifico})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Selecciona el insumo a ingresar</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mostrar info del insumo seleccionado */}
            {insumoData && (
              <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">
                    {insumoData.tipo_insumo?.descripcion_tipo_insumo || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unidad:</span>
                  <span className="font-medium">
                    {insumoData.unidad?.nombre || insumoData.unidad?.abreviatura || '-'}
                  </span>
                </div>
              </div>
            )}

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
                      min="1"
                      step="1"
                      placeholder="0"
                      disabled={isLoading || !insumoSeleccionado}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>Cantidad a ingresar (solo números positivos)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unidad de Medida */}
            <FormField
              control={form.control}
              name="unidad_medida"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad de Medida *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading || !insumoSeleccionado}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una unidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getUnidadesDisponibles().map((unidad) => (
                        <SelectItem key={unidad.value} value={unidad.value}>
                          {unidad.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecciona la unidad de medida (se sugiere la unidad del insumo)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha */}
            <FormField
              control={form.control}
              name="fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Entrada *</FormLabel>
                  <FormControl>
                    <Input type="date" disabled={isLoading} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormDescription>Fecha en que se recibió el insumo</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observación */}
            <FormField
              control={form.control}
              name="observacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observación</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales (opcional)"
                      rows={3}
                      disabled={isLoading}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>Información adicional sobre la entrada</FormDescription>
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
              <Button type="submit" disabled={isLoading || !insumoSeleccionado}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Registrar Entrada'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
