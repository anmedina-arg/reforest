# Dashboard Protegido de Reforest

Dashboard principal de la plataforma con autenticación y control de acceso.

## Características

- ✅ **Autenticación requerida** - Redirect automático a `/login` si no está autenticado
- ✅ **Header persistente** - Logo, nombre de usuario y botón de logout
- ✅ **Información del usuario** - Muestra nombre, email y rol
- ✅ **Accesos rápidos** - Links a secciones principales
- ✅ **Diseño responsivo** - Funciona en móvil, tablet y desktop
- ✅ **Server-side rendering** - Datos del usuario obtenidos en el servidor

## Estructura de archivos

```
app/
├── (auth)/
│   ├── layout.tsx                      # Layout con header y protección
│   └── dashboard/
│       ├── page.tsx                    # Dashboard principal
│       └── README.md                   # Este archivo
├── actions/
│   └── auth.ts                         # Server actions (login, logout)
└── (public)/
    └── login/
        └── page.tsx                    # Página de login

lib/
└── auth.ts                             # Helper functions para autenticación

components/
└── auth/
    └── LogoutButton.tsx                # Botón de cerrar sesión
```

## Funciones helper de autenticación

### `lib/auth.ts`

Funciones server-side para obtener información del usuario:

```typescript
// Obtener usuario autenticado
const user = await getUser()

// Obtener rol del usuario
const role = await getUserRole()
// Retorna: 'admin' | 'operador_lab' | 'operador_campo' | 'viewer' | null

// Obtener nombre para mostrar
const displayName = await getUserDisplayName()
// Retorna: full_name > email username > 'Usuario'

// Formatear rol para UI
const formattedRole = formatRole(role)
// Retorna: 'Administrador' | 'Operador de Laboratorio' | etc.

// Verificar rol específico
const isAdmin = await hasRole('admin')
const canEdit = await hasRole(['admin', 'operador_lab'])

// Verificar autenticación
const authenticated = await isAuthenticated()
```

## Layout de rutas autenticadas

### `app/(auth)/layout.tsx`

Características:
- ✅ Verifica autenticación antes de renderizar
- ✅ Redirect a `/login` si no está autenticado
- ✅ Header con logo, nombre de usuario y logout
- ✅ Diseño consistente para todas las rutas en `(auth)`

```typescript
// Protección automática
if (!authenticated) {
  redirect('/login')
}
```

## Dashboard

### `app/(auth)/dashboard/page.tsx`

Muestra:
- **Card de bienvenida**: Nombre del usuario, rol, email
- **Estadísticas**: Placeholder para proyectos activos
- **Accesos rápidos**: Links a secciones principales
  - Proyectos
  - Insumos
  - Recetas
  - Ensayos

## Botón de logout

### `components/auth/LogoutButton.tsx`

Client component para cerrar sesión:
- Loading state durante el proceso
- Toast de error si falla
- Redirect automático a `/login` tras éxito
- Icono SVG de logout

```typescript
// Server action llamada
const result = await logoutUser()
```

## Server actions

### `app/actions/auth.ts`

**loginUser(email, password)**
- Autentica con Supabase
- Mensajes de error amigables
- Revalidación de paths
- Redirect a `/dashboard`

**logoutUser()**
- Cierra sesión en Supabase
- Limpia cookies de sesión
- Revalidación de paths
- Redirect a `/login`

Ambas retornan:
```typescript
{
  success: boolean
  error?: string
}
```

## Roles y permisos

El rol del usuario se obtiene de `user_metadata.role`:

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **admin** | Administrador | Acceso completo |
| **operador_lab** | Operador de laboratorio | Gestión de ensayos y producción |
| **operador_campo** | Operador de campo | Gestión de proyectos |
| **viewer** | Visualizador | Solo lectura |

### Asignar rol a un usuario

```sql
-- En Supabase SQL Editor
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "operador_lab"}'::jsonb
WHERE email = 'usuario@example.com';
```

## Flujo de autenticación

```
1. Usuario visita /dashboard
2. Layout verifica autenticación
3. Si no autenticado → redirect /login
4. Si autenticado → obtener datos del usuario
5. Renderizar header con nombre
6. Renderizar contenido del dashboard
```

## Diseño

### Header
- **Fondo**: `bg-primary` (tema configurado en Tailwind)
- **Texto**: `text-primary-foreground`
- **Logo**: Icono SVG de estrella/planta
- **Altura**: `h-16`
- **Responsive**: Oculta texto "Hola, {nombre}" en móviles

### Dashboard
- **Container**: `container mx-auto`
- **Padding**: `p-6 md:p-8`
- **Grid**: Responsive con `md:grid-cols-2 lg:grid-cols-3`
- **Cards**: shadcn/ui Card components
- **Badges**: Para mostrar roles

## Próximos pasos

- [ ] Agregar gráficos de estadísticas reales
- [ ] Implementar navegación a secciones (proyectos, insumos, etc.)
- [ ] Agregar notificaciones en tiempo real
- [ ] Crear página de perfil de usuario
- [ ] Implementar filtros por rol en el dashboard
- [ ] Agregar favoritos/accesos frecuentes
- [ ] Dashboard personalizable por usuario

## Variables de entorno

Asegúrate de configurar:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key
```

## Uso

```bash
# Desarrollo
npm run dev

# Visitar
http://localhost:3000/dashboard

# Si no está autenticado, redirect a:
http://localhost:3000/login
```
