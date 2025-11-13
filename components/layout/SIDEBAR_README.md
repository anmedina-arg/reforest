# Sidebar Component

Sidebar responsive usando componentes de shadcn/ui.

## Estructura de Archivos

```
components/layout/
├── Sidebar.tsx          # Componente del sidebar con navegación
├── DashboardLayout.tsx  # Wrapper con SidebarProvider
└── SIDEBAR_README.md    # Esta documentación
```

## Componentes Instalados

- ✅ `sidebar` - Componente principal de shadcn
- ✅ `sheet` - Para sidebar móvil
- ✅ `tooltip` - Para tooltips en items deshabilitados
- ✅ `skeleton` - Para estados de carga
- ✅ `separator` - Para divisores

## Características

- ✅ **Colapsable** - Se puede expandir/contraer con animaciones
- ✅ **Responsive** - Se convierte en Sheet (drawer) en móvil
- ✅ **Active State** - Resalta el link activo automáticamente usando `usePathname()`
- ✅ **Tooltips** - Muestra tooltips cuando está colapsado
- ✅ **Disabled Items** - Links deshabilitados con tooltip "Próximamente"
- ✅ **Role-based** - Sección de Admin solo visible para admins
- ✅ **Keyboard Shortcuts** - Atajo `Ctrl + B` para toggle

## Navegación Incluida

### Navegación Principal
- Dashboard (`/dashboard`)
- Proyectos (`/proyectos`)
- Producción (`/produccion`) - *Deshabilitado*
- Insumos (`/insumos`)
- Recetas (`/recetas`)
- Mixes (`/mixes`)
- Stock (`/stock`)

### Herramientas
- Laboratorio (`/laboratorio`) - *Deshabilitado*

### Administración (solo admin)
- Usuarios (`/admin/usuarios`)

## Uso

El sidebar ya está integrado en el layout de autenticación (`app/(auth)/layout.tsx`):

```tsx
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default async function AuthLayout({ children }) {
  const userRole = 'user' // o 'admin'

  return (
    <DashboardLayout userRole={userRole}>
      {children}
    </DashboardLayout>
  )
}
```

## Personalización de Roles

### Obtener rol desde la base de datos

Modifica `app/(auth)/layout.tsx` para obtener el rol real del usuario:

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function AuthLayout({ children }) {
  const supabase = await createClient()

  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener rol desde tu tabla de usuarios
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user?.id)
    .single()

  const userRole = userData?.rol || 'user'

  return (
    <DashboardLayout userRole={userRole}>
      {children}
    </DashboardLayout>
  )
}
```

## Agregar Nuevos Links

Edita `components/layout/Sidebar.tsx`:

```tsx
const mainNavItems: NavItem[] = [
  // ...items existentes
  {
    title: 'Nuevo Item',
    href: '/nuevo-item',
    icon: IconName, // Importar de lucide-react
    disabled: false, // opcional
  },
]
```

## Deshabilitar Items

Para deshabilitar temporalmente un link:

```tsx
{
  title: 'Producción',
  href: '/produccion',
  icon: FlaskConical,
  disabled: true, // Muestra tooltip "Próximamente"
}
```

## Customizar Footer

El footer actualmente muestra un botón de logout. Para conectarlo:

```tsx
// En Sidebar.tsx, actualiza el botón:
import { signOut } from '@/lib/auth'

<Button
  variant="ghost"
  className="w-full justify-start"
  size="sm"
  onClick={async () => {
    await signOut()
    router.push('/login')
  }}
>
  <LogOut className="mr-2 h-4 w-4" />
  Cerrar Sesión
</Button>
```

## Estilos

El sidebar usa variables CSS de shadcn. Para personalizar colores, edita `app/globals.css`:

```css
:root {
  --sidebar-background: 0 0% 98%;
  --sidebar-foreground: 240 5.3% 26.1%;
  --sidebar-primary: 240 5.9% 10%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 240 4.8% 95.9%;
  --sidebar-accent-foreground: 240 5.9% 10%;
  --sidebar-border: 220 13% 91%;
  --sidebar-ring: 217.2 91.2% 59.8%;
}
```

## Responsive Behavior

- **Desktop (≥768px)**: Sidebar fijo con toggle para colapsar
- **Mobile (<768px)**: Sheet (drawer) que se abre desde la izquierda
- **Trigger**: Botón hamburguesa en el header

## Iconos

Todos los iconos son de `lucide-react`. Para cambiar:

1. Importar el nuevo icono:
   ```tsx
   import { NewIcon } from 'lucide-react'
   ```

2. Actualizar en el array de navegación:
   ```tsx
   {
     title: 'Mi Item',
     icon: NewIcon,
     // ...
   }
   ```

## Keyboard Shortcuts

- `Ctrl + B` (Windows/Linux) o `Cmd + B` (Mac) - Toggle sidebar

## Estado Persistente

El estado (expandido/colapsado) se guarda automáticamente en cookies:
- Cookie: `sidebar_state`
- Duración: 7 días

## Troubleshooting

### El sidebar no aparece
- Verifica que `SidebarProvider` esté presente en el layout
- Revisa que los estilos de shadcn estén importados en `globals.css`

### Los links no se marcan como activos
- Verifica que `usePathname()` esté devolviendo el path correcto
- Revisa la función `isActive()` en el componente

### Items admin no se muestran
- Verifica que `userRole === 'admin'` esté retornando true
- Revisa la lógica condicional en el componente

## Recursos

- [Documentación oficial de shadcn Sidebar](https://ui.shadcn.com/docs/components/sidebar)
- [Lucide Icons](https://lucide.dev/)
