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

import { createProyecto } from '@/app/actions/proyectos'
import { createProyectoSchema, type CreateProyectoInput } from '@/lib/validations/proyecto'

// =====================================================
// TYPES
// =====================================================

interface ProyectoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientes: Array<{
    id_cliente: string
    nombre_cliente: string
  }>
  estados: Array<{
    id_estado_proyecto: string
    nombre: string
  }>
  ecoRegiones: Array<{
    id_eco_region: string
    nombre: string
  }>
}

// =====================================================
// COMPONENT
// =====================================================

export function ProyectoDialog({
  open,
  onOpenChange,
  clientes,
  estados,
  ecoRegiones,
}: ProyectoDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<CreateProyectoInput>({
    resolver: zodResolver(createProyectoSchema),
    defaultValues: {
      nombre_del_proyecto: '',
      codigo_proyecto: '',
      nombre_fantasia: '',
      fecha_inicio: '',
      fecha_fin: '',
      id_cliente: '',
      id_eco_region: '',
      id_estado_proyecto: '',
      hectareas: undefined,
      cantidad_iseeds: undefined,
      poligonos_entregados: false,
    },
  })

  // Reset form cuando se cierra el dialog
  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  async function onSubmit(values: CreateProyectoInput) {
    setIsLoading(true)

    try {
      // Convertir strings vacíos a null y numbers
      const data = {
        ...values,
        codigo_proyecto: values.codigo_proyecto || null,
        nombre_fantasia: values.nombre_fantasia || null,
        fecha_inicio: values.fecha_inicio || null,
        fecha_fin: values.fecha_fin || null,
        id_cliente: values.id_cliente || null,
        id_eco_region: values.id_eco_region || null,
        id_estado_proyecto: values.id_estado_proyecto || null,
        hectareas: values.hectareas ? Number(values.hectareas) : null,
        cantidad_iseeds: values.cantidad_iseeds ? Number(values.cantidad_iseeds) : null,
      }

      const result = await createProyecto(data)

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      if (result.success) {
        toast.success('Proyecto creado exitosamente')

        // Cerrar el dialog
        onOpenChange(false)

        // Limpiar el formulario
        form.reset()

        // Refrescar la página
        router.refresh()
      }
    } catch (error) {
      toast.error('Error inesperado al crear proyecto')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Proyecto</DialogTitle>
          <DialogDescription>
            Completa el formulario para crear un nuevo proyecto forestal
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nombre del Proyecto */}
            <FormField
              control={form.control}
              name="nombre_del_proyecto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Proyecto *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Reforestación Cerrado 2024"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Código y Nombre Fantasía en fila */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo_proyecto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: PRY-2024-001"
                        disabled={isLoading}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nombre_fantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Fantasía</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Opcional"
                        disabled={isLoading}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Cliente */}
            <FormField
              control={form.control}
              name="id_cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un cliente (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id_cliente} value={cliente.id_cliente}>
                          {cliente.nombre_cliente}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estado y Eco-región en fila */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="id_estado_proyecto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {estados.map((estado) => (
                          <SelectItem
                            key={estado.id_estado_proyecto}
                            value={estado.id_estado_proyecto}
                          >
                            {estado.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="id_eco_region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Eco-región</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona región" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ecoRegiones.map((region) => (
                          <SelectItem key={region.id_eco_region} value={region.id_eco_region}>
                            {region.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fechas en fila */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fecha_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isLoading} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha_fin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Fin</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isLoading} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Hectáreas y Cantidad iSeeds en fila */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hectareas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hectáreas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        disabled={isLoading}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cantidad_iseeds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad iSeeds</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        disabled={isLoading}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                    Creando...
                  </>
                ) : (
                  'Crear Proyecto'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
