# Data Table Components

Componentes reutilizables para tablas con Tanstack Table v8 y shadcn/ui.

## Componentes

- **DataTable**: Componente principal de tabla con TypeScript generics
- **DataTablePagination**: Componente de paginación (client-side y server-side)
- **DataTableRowActions**: Componente de acciones por fila con permisos basados en roles

## Características

- ✅ TypeScript generics `<TData, TValue>`
- ✅ Sorting en columnas
- ✅ Filtro de búsqueda global
- ✅ Paginación client-side y server-side
- ✅ Loading state
- ✅ Empty state
- ✅ Actions dropdown por fila con control de permisos por rol
- ✅ Totalmente tipado con TypeScript

## Ejemplo de Uso Básico

```tsx
'use client'

import { ColumnDef } from '@tanstack/react-table'
import { DataTable, DataTableRowActions, RowAction } from '@/components/tables'
import { getUserRole } from '@/lib/auth'

// 1. Definir el tipo de datos
interface Product {
  id: string
  name: string
  price: number
  status: 'active' | 'inactive'
}

// 2. Definir las columnas
const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
    enableSorting: true,
  },
  {
    accessorKey: 'price',
    header: 'Precio',
    cell: ({ row }) => {
      const price = row.getValue('price') as number
      return `$${price.toFixed(2)}`
    },
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const product = row.original
      const userRole = getUserRole() // Obtener rol del usuario

      const actions: RowAction<Product>[] = [
        {
          label: 'Editar',
          onClick: (product) => console.log('Editar', product),
          allowedRoles: ['admin', 'operador_lab'],
          icon: Pencil,
        },
        {
          label: 'Eliminar',
          onClick: (product) => console.log('Eliminar', product),
          variant: 'destructive',
          allowedRoles: ['admin'],
          icon: Trash,
          showSeparatorAfter: true,
        },
      ]

      return (
        <DataTableRowActions
          row={product}
          actions={actions}
          userRole={userRole}
        />
      )
    },
  },
]

// 3. Usar el componente
export function ProductsTable({ products }: { products: Product[] }) {
  return (
    <DataTable
      columns={columns}
      data={products}
      searchable
      searchPlaceholder="Buscar productos..."
      searchColumn="name"
      pagination={{
        mode: 'client',
        pageSize: 10,
      }}
    />
  )
}
```

## Ejemplo con Paginación Server-Side

```tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/tables'
import { getInsumos } from '@/app/actions/insumos'

export function InsumosTable() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const result = await getInsumos({
        page,
        pageSize,
      })

      if (result.success && result.data) {
        setData(result.data.data)
        setTotal(result.data.total)
      }
      setLoading(false)
    }

    fetchData()
  }, [page, pageSize])

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      searchable
      pagination={{
        mode: 'server',
        page,
        pageSize,
        total,
        onPageChange: setPage,
        onPageSizeChange: setPageSize,
      }}
    />
  )
}
```

## Props de DataTable

| Prop | Tipo | Descripción |
|------|------|-------------|
| `columns` | `ColumnDef<TData, TValue>[]` | Definición de columnas de Tanstack Table |
| `data` | `TData[]` | Datos a mostrar |
| `loading` | `boolean?` | Estado de carga |
| `pagination` | `DataTablePaginationConfig?` | Configuración de paginación |
| `searchable` | `boolean?` | Habilitar búsqueda global |
| `searchPlaceholder` | `string?` | Placeholder del input de búsqueda |
| `searchColumn` | `string?` | Columna donde aplicar el filtro (default: 'nombre') |
| `emptyMessage` | `string?` | Mensaje cuando no hay datos |
| `className` | `string?` | Clase CSS adicional |

## Configuración de Paginación

```typescript
interface DataTablePaginationConfig {
  mode: 'client' | 'server'
  page?: number
  pageSize?: number
  total?: number // Solo para server-side
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}
```

## Acciones por Fila con Roles

```typescript
interface RowAction<TData> {
  label: string
  onClick: (row: TData) => void
  icon?: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'destructive'
  allowedRoles?: string[] // Roles permitidos para ver esta acción
  disabled?: (row: TData) => boolean
  showSeparatorAfter?: boolean
}
```

### Ejemplo de Acciones con Roles

```tsx
const actions: RowAction<Insumo>[] = [
  {
    label: 'Ver detalles',
    onClick: (insumo) => router.push(\`/insumos/\${insumo.id_insumo}\`),
    icon: Eye,
    // Todos los roles pueden ver
  },
  {
    label: 'Editar',
    onClick: (insumo) => setEditingInsumo(insumo),
    icon: Pencil,
    allowedRoles: ['admin', 'operador_lab'], // Solo admin y operador_lab
  },
  {
    label: 'Eliminar',
    onClick: (insumo) => handleDelete(insumo.id_insumo),
    icon: Trash,
    variant: 'destructive',
    allowedRoles: ['admin'], // Solo admin
    disabled: (insumo) => insumo.status === 'in_use', // Deshabilitado si está en uso
  },
]

<DataTableRowActions
  row={insumo}
  actions={actions}
  userRole={userRole}
/>
```

## Habilitar Sorting en Columnas

```tsx
const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
    enableSorting: true, // Habilitar sorting
  },
]
```

## Personalizar Cell Rendering

```tsx
{
  accessorKey: 'price',
  header: 'Precio',
  cell: ({ row }) => {
    const price = row.getValue('price') as number
    return (
      <div className="font-medium">
        ${price.toFixed(2)}
      </div>
    )
  },
}
```

## Integración con getUserRole()

```tsx
import { getUserRole } from '@/lib/auth'

export async function MyTablePage() {
  const userRole = await getUserRole()

  return (
    <DataTable
      columns={columns}
      data={data}
      // ... otras props
    />
  )
}
```

En el caso de componentes cliente, puedes usar un hook:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { getUserRole } from '@/lib/auth'

export function MyTable() {
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    getUserRole().then(setUserRole)
  }, [])

  // Usar userRole en DataTableRowActions
}
```
