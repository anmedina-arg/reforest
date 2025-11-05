# Form Components

Componentes de formularios reutilizables con React Hook Form y Zod.

## InsumoForm

Formulario completo para crear y editar insumos forestales.

### Features

- ✅ React Hook Form + Zod validation
- ✅ Modo create/edit según `initialData`
- ✅ Validación real-time con mensajes claros
- ✅ Loading states durante submit
- ✅ Toast notifications de éxito/error
- ✅ Callbacks: `onSuccess`, `onCancel`
- ✅ Integración con server actions `createInsumo`/`updateInsumo`

### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre` | Input text | ✅ | Nombre del insumo (min 3 chars) |
| `id_tipo_insumo` | Select | ✅ | Tipo: semilla, sustrato, promotor, cápsula |
| `unidad_medida` | Select | ✅ | Unidad de medida para inventario |
| `especie` | Select | ❌ | Especie forestal relacionada |
| `nombre_cientifico` | Input text | ❌ | Nombre científico del insumo |

### Props

```typescript
interface InsumoFormProps {
  initialData?: InsumoWithRelations | null
  tiposInsumo: Array<{ id_tipo_insumo: string; descripcion_tipo_insumo: string }>
  especies: Array<{ id_especie: string; descripcion_especie: string }>
  unidadesMedida: Array<{ id_unidad: string; nombre: string; abreviatura: string | null }>
  onSuccess?: (data: InsumoWithRelations) => void
  onCancel?: () => void
  showCancelButton?: boolean
}
```

### Ejemplo de Uso - Modo Crear

```tsx
'use client'

import { InsumoForm } from '@/components/forms/insumo-form'
import { useRouter } from 'next/navigation'

export function CreateInsumoPage({ tiposInsumo, especies, unidadesMedida }) {
  const router = useRouter()

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Nuevo Insumo</h1>

      <InsumoForm
        tiposInsumo={tiposInsumo}
        especies={especies}
        unidadesMedida={unidadesMedida}
        onSuccess={(data) => {
          // Insumo creado exitosamente
          router.push(`/insumos/${data.id_insumo}`)
        }}
        onCancel={() => {
          // Usuario canceló
          router.push('/insumos')
        }}
      />
    </div>
  )
}
```

### Ejemplo de Uso - Modo Editar

```tsx
'use client'

import { InsumoForm } from '@/components/forms/insumo-form'
import { useRouter } from 'next/navigation'

export function EditInsumoPage({ insumo, tiposInsumo, especies, unidadesMedida }) {
  const router = useRouter()

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Editar Insumo</h1>

      <InsumoForm
        initialData={insumo}
        tiposInsumo={tiposInsumo}
        especies={especies}
        unidadesMedida={unidadesMedida}
        onSuccess={(data) => {
          // Insumo actualizado exitosamente
          router.push(`/insumos/${data.id_insumo}`)
        }}
        onCancel={() => {
          // Usuario canceló
          router.push(`/insumos/${insumo.id_insumo}`)
        }}
      />
    </div>
  )
}
```

### Ejemplo de Uso - Dentro de un Dialog

```tsx
'use client'

import { useState } from 'react'
import { InsumoForm } from '@/components/forms/insumo-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function InsumoDialogExample({ tiposInsumo, especies, unidadesMedida }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nuevo Insumo</DialogTitle>
          <DialogDescription>
            Completa el formulario para crear un nuevo insumo
          </DialogDescription>
        </DialogHeader>

        <InsumoForm
          tiposInsumo={tiposInsumo}
          especies={especies}
          unidadesMedida={unidadesMedida}
          onSuccess={() => {
            setOpen(false) // Cerrar dialog al guardar
          }}
          onCancel={() => {
            setOpen(false) // Cerrar dialog al cancelar
          }}
          showCancelButton={false} // Ocultar botón cancelar si el dialog tiene su propio botón cerrar
        />
      </DialogContent>
    </Dialog>
  )
}
```

### Cargar Catálogos en Server Component

```tsx
import { getTiposInsumo, getEspecies, getUnidadesMedida } from '@/app/actions/insumos'
import { CreateInsumoPage } from './CreateInsumoPage'

export default async function NewInsumoPage() {
  // Cargar catálogos en paralelo
  const [tiposResult, especiesResult, unidadesResult] = await Promise.all([
    getTiposInsumo(),
    getEspecies(),
    getUnidadesMedida(),
  ])

  // Manejar errores
  if (!tiposResult.success || !especiesResult.success || !unidadesResult.success) {
    return <div>Error cargando catálogos</div>
  }

  return (
    <CreateInsumoPage
      tiposInsumo={tiposResult.data}
      especies={especiesResult.data}
      unidadesMedida={unidadesResult.data}
    />
  )
}
```

### Validación

El formulario usa Zod para validación en tiempo real:

- **Nombre**: Mínimo 3 caracteres, máximo 255
- **Tipo de Insumo**: UUID válido, requerido
- **Unidad de Medida**: UUID válido, requerido
- **Especie**: Opcional, string de hasta 255 caracteres
- **Nombre Científico**: Opcional, string de hasta 255 caracteres

Los mensajes de error se muestran debajo de cada campo automáticamente.

### Estados de Loading

Durante el submit:
- Todos los campos se deshabilitan
- Botón de guardar muestra spinner y texto "Creando..." o "Actualizando..."
- Botón de cancelar se deshabilita

### Toast Notifications

El formulario muestra automáticamente:
- ✅ Toast de éxito al crear/actualizar
- ❌ Toast de error si falla la operación
- Los errores de validación del servidor se muestran como toasts

### Callbacks

#### `onSuccess(data: InsumoWithRelations)`
Se llama cuando el insumo se guarda exitosamente. Recibe el insumo creado/actualizado con todas sus relaciones.

#### `onCancel()`
Se llama cuando el usuario hace click en "Cancelar".

### Styling

El formulario usa componentes de shadcn/ui con Tailwind CSS:
- Espaciado consistente entre campos (`space-y-6`)
- Labels con indicador `*` para campos requeridos
- Descriptions en texto muted debajo de cada campo
- Botones alineados a la derecha

### Server Actions

El formulario se integra con:
- `createInsumo(data)` - Crea un nuevo insumo
- `updateInsumo(id, data)` - Actualiza un insumo existente

Ambas funciones:
- Validan con Zod en el servidor
- Retornan `{ success: boolean, data?: InsumoWithRelations, error?: string }`
- Revalidan la ruta `/insumos` automáticamente
