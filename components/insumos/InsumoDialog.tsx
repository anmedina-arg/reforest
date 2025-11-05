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

import { createInsumo, updateInsumo } from '@/app/actions/insumos'
import {
  createInsumoSchema,
  type CreateInsumoInput,
} from '@/lib/validations/insumo'
import type { InsumoWithRelations } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface InsumoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  insumo?: InsumoWithRelations | null
  tiposInsumo: Array<{ id_tipo_insumo: string; descripcion_tipo_insumo: string }>
  unidadesMedida: Array<{ id_unidad: string; nombre: string; abreviatura: string | null }>
}

// =====================================================
// COMPONENT
// =====================================================

export function InsumoDialog({
  open,
  onOpenChange,
  insumo,
  tiposInsumo,
  unidadesMedida,
}: InsumoDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const isEditing = !!insumo

  const form = useForm<CreateInsumoInput>({
    resolver: zodResolver(createInsumoSchema),
    defaultValues: {
      nombre: '',
      nombre_cientifico: '',
      especie: '',
      id_tipo_insumo: '',
      unidad_medida: '',
    },
  })

  // Cargar datos del insumo cuando se abre en modo edición
  useEffect(() => {
    if (insumo) {
      form.reset({
        nombre: insumo.nombre,
        nombre_cientifico: insumo.nombre_cientifico || '',
        especie: insumo.especie || '',
        id_tipo_insumo: insumo.id_tipo_insumo || '',
        unidad_medida: insumo.unidad_medida || '',
      })
    } else {
      form.reset({
        nombre: '',
        nombre_cientifico: '',
        especie: '',
        id_tipo_insumo: '',
        unidad_medida: '',
      })
    }
  }, [insumo, form])

  async function onSubmit(values: CreateInsumoInput) {
    setIsLoading(true)

    try {
      let result

      if (isEditing) {
        // Actualizar insumo existente
        result = await updateInsumo(insumo.id_insumo, values)
      } else {
        // Crear nuevo insumo
        result = await createInsumo(values)
      }

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      if (result.success) {
        toast.success(
          isEditing ? 'Insumo actualizado exitosamente' : 'Insumo creado exitosamente'
        )

        // Cerrar el dialog
        onOpenChange(false)

        // Limpiar el formulario
        form.reset()

        // Refrescar la página
        router.refresh()
      }
    } catch (error) {
      toast.error('Error inesperado al guardar insumo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Insumo' : 'Nuevo Insumo'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos del insumo'
              : 'Completa el formulario para crear un nuevo insumo'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nombre */}
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Semilla de Pino"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Insumo */}
            <FormField
              control={form.control}
              name="id_tipo_insumo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Insumo *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposInsumo.map((tipo) => (
                        <SelectItem key={tipo.id_tipo_insumo} value={tipo.id_tipo_insumo}>
                          {tipo.descripcion_tipo_insumo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una unidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unidadesMedida.map((unidad) => (
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

            {/* Especie */}
            <FormField
              control={form.control}
              name="especie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especie</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Pinus radiata"
                      disabled={isLoading}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nombre Científico */}
            <FormField
              control={form.control}
              name="nombre_cientifico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Científico</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Pinus radiata D.Don"
                      disabled={isLoading}
                      {...field}
                      value={field.value || ''}
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : isEditing ? (
                  'Actualizar'
                ) : (
                  'Crear'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
