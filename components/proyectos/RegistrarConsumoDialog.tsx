'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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

import { registrarConsumo } from '@/app/actions/disponibilidad'
import { registrarConsumoSchema, type RegistrarConsumoInput } from '@/lib/validations/disponibilidad'
import type { DisponibilidadWithConsumo } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface RegistrarConsumoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proyectoId: string
  disponibilidades: DisponibilidadWithConsumo[]
}

// =====================================================
// COMPONENT
// =====================================================

export function RegistrarConsumoDialog({
  open,
  onOpenChange,
  proyectoId,
  disponibilidades,
}: RegistrarConsumoDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Filtrar disponibilidades con stock disponible
  const disponibilidadesConStock = disponibilidades.filter(
    (d) => d.cantidad_disponible > 0
  )

  const form = useForm<RegistrarConsumoInput>({
    resolver: zodResolver(registrarConsumoSchema),
    defaultValues: {
      id_proyecto: proyectoId,
      id_disponibilidad: '',
      cantidad: 0,
      fecha_consumo: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    },
  })

  const disponibilidadSeleccionada = form.watch('id_disponibilidad')
  const disponibilidadData = disponibilidades.find(
    (d) => d.id_disponibilidad === disponibilidadSeleccionada
  )

  async function onSubmit(values: RegistrarConsumoInput) {
    setIsLoading(true)

    try {
      const result = await registrarConsumo(values)

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      if (result.success) {
        toast.success('Consumo registrado exitosamente')

        // Cerrar el dialog
        onOpenChange(false)

        // Limpiar el formulario
        form.reset({
          id_proyecto: proyectoId,
          id_disponibilidad: '',
          cantidad: 0,
          fecha_consumo: new Date().toISOString().split('T')[0],
        })

        // Refrescar la página
        router.refresh()
      }
    } catch (error) {
      toast.error('Error inesperado al registrar el consumo')
    } finally {
      setIsLoading(false)
    }
  }

  function formatFecha(fecha: string | null): string {
    if (!fecha) return '-'
    try {
      return format(new Date(fecha), "dd/MM/yyyy", { locale: es })
    } catch {
      return '-'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Registrar Consumo</DialogTitle>
          <DialogDescription>
            Registra el consumo de iSeeds desde una disponibilidad existente
          </DialogDescription>
        </DialogHeader>

        {disponibilidadesConStock.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              No hay disponibilidades con stock para consumir
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Seleccionar Disponibilidad */}
              <FormField
                control={form.control}
                name="id_disponibilidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disponibilidad *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una disponibilidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {disponibilidadesConStock.map((disp) => (
                          <SelectItem
                            key={disp.id_disponibilidad}
                            value={disp.id_disponibilidad}
                          >
                            {formatFecha(disp.fecha_produccion)} - Disponible:{' '}
                            {disp.cantidad_disponible.toLocaleString()} iSeeds
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecciona la disponibilidad desde la cual consumir
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Mostrar info de disponibilidad seleccionada */}
              {disponibilidadData && (
                <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cantidad original:</span>
                    <span className="font-medium">
                      {disponibilidadData.cantidad.toLocaleString()} iSeeds
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cantidad consumida:</span>
                    <span className="font-medium">
                      {disponibilidadData.cantidad_consumida.toLocaleString()} iSeeds
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cantidad disponible:</span>
                    <span className="font-medium text-green-600">
                      {disponibilidadData.cantidad_disponible.toLocaleString()} iSeeds
                    </span>
                  </div>
                </div>
              )}

              {/* Cantidad a Consumir */}
              <FormField
                control={form.control}
                name="cantidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad a Consumir *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max={disponibilidadData?.cantidad_disponible || undefined}
                        placeholder="0"
                        disabled={isLoading || !disponibilidadSeleccionada}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Máximo disponible:{' '}
                      {disponibilidadData?.cantidad_disponible.toLocaleString() || 0} iSeeds
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha de Consumo */}
              <FormField
                control={form.control}
                name="fecha_consumo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Consumo</FormLabel>
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
                <Button type="submit" disabled={isLoading || !disponibilidadSeleccionada}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Registrar Consumo'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
