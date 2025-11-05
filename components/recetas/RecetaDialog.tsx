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

import { createReceta } from '@/app/actions/recetas'
import {
  createRecetaSchema,
  type CreateRecetaInput,
} from '@/lib/validations/receta'

// =====================================================
// TYPES
// =====================================================

interface RecetaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  responsables: Array<{
    id_responsable_labo: string
    nombre_responsable: string
  }>
}

// =====================================================
// COMPONENT
// =====================================================

export function RecetaDialog({ open, onOpenChange, responsables }: RecetaDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<CreateRecetaInput>({
    resolver: zodResolver(createRecetaSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      autor: '',
    },
  })

  // Reset form cuando se cierra el dialog
  useEffect(() => {
    if (!open) {
      form.reset({
        nombre: '',
        descripcion: '',
        autor: '',
      })
    }
  }, [open, form])

  async function onSubmit(values: CreateRecetaInput) {
    setIsLoading(true)

    try {
      const result = await createReceta(values)

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      if (result.success) {
        toast.success('Receta creada exitosamente')

        // Cerrar el dialog
        onOpenChange(false)

        // Limpiar el formulario
        form.reset()

        // Refrescar la página
        router.refresh()
      }
    } catch (error) {
      toast.error('Error inesperado al crear receta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Receta</DialogTitle>
          <DialogDescription>
            Completa el formulario para crear una nueva receta de iSeeds
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
                      placeholder="Ej: Receta Base Pino Radiata"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Descripción opcional de la receta"
                      disabled={isLoading}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Autor */}
            <FormField
              control={form.control}
              name="autor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Autor</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un responsable (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {responsables.map((resp) => (
                        <SelectItem key={resp.id_responsable_labo} value={resp.id_responsable_labo}>
                          {resp.nombre_responsable}
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
                    Creando...
                  </>
                ) : (
                  'Crear Receta'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
