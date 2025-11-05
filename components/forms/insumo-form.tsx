'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
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

interface InsumoFormProps {
  /**
   * Datos iniciales para modo edición
   * Si no se proporciona, el formulario está en modo creación
   */
  initialData?: InsumoWithRelations | null

  /**
   * Catálogo de tipos de insumo
   */
  tiposInsumo: Array<{ id_tipo_insumo: string; descripcion_tipo_insumo: string }>

  /**
   * Catálogo de especies forestales
   */
  especies: Array<{ id_especie: string; descripcion_especie: string }>

  /**
   * Catálogo de unidades de medida
   */
  unidadesMedida: Array<{ id_unidad: string; nombre: string; abreviatura: string | null }>

  /**
   * Callback cuando se guarda exitosamente
   */
  onSuccess?: (data: InsumoWithRelations) => void

  /**
   * Callback cuando se cancela
   */
  onCancel?: () => void

  /**
   * Mostrar botón de cancelar
   */
  showCancelButton?: boolean
}

// =====================================================
// COMPONENT
// =====================================================

export function InsumoForm({
  initialData,
  tiposInsumo,
  especies,
  unidadesMedida,
  onSuccess,
  onCancel,
  showCancelButton = true,
}: InsumoFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!initialData

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

  // Cargar datos iniciales cuando cambia initialData
  useEffect(() => {
    if (initialData) {
      form.reset({
        nombre: initialData.nombre,
        nombre_cientifico: initialData.nombre_cientifico || '',
        especie: initialData.especie || '',
        id_tipo_insumo: initialData.id_tipo_insumo || '',
        unidad_medida: initialData.unidad_medida || '',
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
  }, [initialData, form])

  async function onSubmit(values: CreateInsumoInput) {
    setIsLoading(true)

    try {
      let result

      if (isEditing) {
        // Actualizar insumo existente
        result = await updateInsumo(initialData.id_insumo, values)
      } else {
        // Crear nuevo insumo
        result = await createInsumo(values)
      }

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      if (result.success && result.data) {
        toast.success(
          isEditing ? 'Insumo actualizado exitosamente' : 'Insumo creado exitosamente'
        )

        // Limpiar el formulario en modo creación
        if (!isEditing) {
          form.reset()
        }

        // Llamar callback de éxito
        if (onSuccess) {
          onSuccess(result.data)
        }
      }
    } catch (error) {
      toast.error('Error inesperado al guardar insumo')
      console.error('Error en onSubmit:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleCancel() {
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Nombre */}
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Semilla de Pino"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Nombre del insumo (mínimo 3 caracteres)
              </FormDescription>
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
              <FormLabel>
                Tipo de Insumo <span className="text-destructive">*</span>
              </FormLabel>
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
                  {tiposInsumo.length === 0 ? (
                    <SelectItem value="no-options" disabled>
                      No hay tipos disponibles
                    </SelectItem>
                  ) : (
                    tiposInsumo.map((tipo) => (
                      <SelectItem key={tipo.id_tipo_insumo} value={tipo.id_tipo_insumo}>
                        {tipo.descripcion_tipo_insumo}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Categoría del insumo (semilla, sustrato, promotor, cápsula)
              </FormDescription>
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
              <FormLabel>
                Unidad de Medida <span className="text-destructive">*</span>
              </FormLabel>
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
                  {unidadesMedida.length === 0 ? (
                    <SelectItem value="no-options" disabled>
                      No hay unidades disponibles
                    </SelectItem>
                  ) : (
                    unidadesMedida.map((unidad) => (
                      <SelectItem key={unidad.id_unidad} value={unidad.id_unidad}>
                        {unidad.nombre}
                        {unidad.abreviatura && ` (${unidad.abreviatura})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Unidad de medida para el inventario
              </FormDescription>
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || undefined}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una especie (opcional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Sin especie</SelectItem>
                  {especies.map((especie) => (
                    <SelectItem
                      key={especie.id_especie}
                      value={especie.descripcion_especie}
                    >
                      {especie.descripcion_especie}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Especie forestal relacionada (si aplica)
              </FormDescription>
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
              <FormDescription>
                Nombre científico del insumo (opcional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botones */}
        <div className="flex items-center justify-end gap-3">
          {showCancelButton && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Actualizando...' : 'Creando...'}
              </>
            ) : isEditing ? (
              'Actualizar Insumo'
            ) : (
              'Crear Insumo'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
