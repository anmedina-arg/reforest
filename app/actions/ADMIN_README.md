# Admin Server Actions

Server actions para funciones administrativas que requieren privilegios elevados.

## 🔐 Seguridad

**IMPORTANTE**: Todas las funciones en este archivo están protegidas con `requireRole('admin')` y solo pueden ser ejecutadas por usuarios con rol de administrador.

## Archivo: `admin.ts`

### Función: `createUser()`

Crea nuevos usuarios en el sistema con roles específicos.

#### Firma

```typescript
async function createUser(
  email: string,
  nombre: string,
  role: string
): Promise<CreateUserResult>
```

#### Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `email` | string | Email del nuevo usuario (debe ser válido) |
| `nombre` | string | Nombre completo (mínimo 3 caracteres) |
| `role` | string | Rol del usuario (ver roles disponibles) |

#### Roles Disponibles

| Rol | Valor | Descripción |
|-----|-------|-------------|
| Administrador | `admin` | Acceso completo al sistema |
| Operador de Lab | `operador_lab` | Gestión de ensayos y producción |
| Operador de Campo | `operador_campo` | Gestión de proyectos forestales |
| Visualizador | `viewer` | Solo lectura |

#### Password por Defecto

🔒 **Password fija para todos los usuarios**: `Reforest2025!`

**⚠️ IMPORTANTE PARA ADMINS:**
- Todos los usuarios nuevos reciben la misma contraseña temporal
- El admin debe comunicar la contraseña verbalmente o por canal seguro
- **NUNCA** enviar la contraseña por email sin encriptar
- Se recomienda implementar cambio de contraseña obligatorio en el primer login

#### Validaciones

El schema de validación (Zod) verifica:

```typescript
{
  email: string (formato válido)
  nombre: string (3-100 caracteres)
  role: enum ['admin', 'operador_lab', 'operador_campo', 'viewer']
}
```

#### Retorno

```typescript
type CreateUserResult = {
  success: boolean
  error?: string
  user?: User
}
```

**Casos:**

1. **Éxito** (`success: true`):
   ```typescript
   {
     success: true,
     user: { ...userData }
   }
   ```

2. **Error de validación**:
   ```typescript
   {
     success: false,
     error: "El nombre debe tener al menos 3 caracteres"
   }
   ```

3. **Error de permisos**:
   ```typescript
   {
     success: false,
     error: "Permiso denegado. Se requiere rol: admin"
   }
   ```

4. **Usuario duplicado**:
   ```typescript
   {
     success: false,
     error: "El email ya está registrado"
   }
   ```

#### Ejemplo de Uso

```typescript
'use client'

import { createUser } from '@/app/actions/admin'
import { toast } from 'sonner'

async function handleCreateUser() {
  const result = await createUser(
    'nuevo.usuario@reforest.com',
    'Juan Pérez',
    'operador_lab'
  )

  if (result.success) {
    toast.success('Usuario creado exitosamente')
    console.log('Usuario:', result.user)
    // Informar al usuario sobre la contraseña temporal
    alert('Contraseña temporal: Reforest2025!')
  } else {
    toast.error(result.error)
  }
}
```

## Funciones Helper

### `getRoleDescription(role: UserRole): string`

Obtiene la descripción amigable de un rol.

```typescript
getRoleDescription('admin') // "Administrador - Acceso completo al sistema"
getRoleDescription('operador_lab') // "Operador de Laboratorio - Gestión de ensayos y producción"
```

### `getAvailableRoles(): Array<RoleInfo>`

Obtiene todos los roles disponibles con sus descripciones.

```typescript
const roles = getAvailableRoles()
// [
//   {
//     value: 'admin',
//     label: 'Admin',
//     description: 'Administrador - Acceso completo al sistema'
//   },
//   ...
// ]
```

Útil para poblar select/dropdown en formularios.

## Configuración Requerida

### Variables de Entorno

Agregar en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key  # ⚠️ CRÍTICO
```

**⚠️ ADVERTENCIAS SOBRE SERVICE_ROLE_KEY:**

1. **NO** exponerla al cliente/navegador
2. **NO** subirla a control de versiones (usar `.env.local`, nunca `.env.local.example`)
3. Solo usarla en server actions protegidas
4. Tiene permisos de administrador completos sobre Supabase
5. Bypass de RLS (Row Level Security)

### Obtener Service Role Key

1. Ir a [Supabase Dashboard](https://app.supabase.com)
2. Seleccionar tu proyecto
3. Settings > API
4. Copiar `service_role` key (sección "Project API keys")
5. Pegar en `.env.local` (NUNCA en `.env.local.example`)

## Arquitectura

### Flujo de Creación de Usuario

```
Admin → Componente Cliente
           ↓
   createUser() Server Action
           ↓
   requireRole('admin') ← Verifica permisos
           ↓
   Validación con Zod
           ↓
   createAdminClient() ← Service Role Key
           ↓
   supabase.auth.admin.createUser()
           ↓
   { success, user/error }
           ↓
   Componente Cliente ← Maneja resultado
```

### Archivos Relacionados

```
app/
└── actions/
    ├── admin.ts              # ✨ Server actions de admin
    └── ADMIN_README.md       # Esta documentación

lib/
├── auth.ts                   # requireRole() helper
└── supabase/
    ├── server.ts            # Cliente normal
    └── admin.ts             # ✨ Cliente admin (service_role)
```

## Seguridad Implementada

✅ **Verificación de rol**: `requireRole('admin')` antes de ejecutar
✅ **Validación de datos**: Schema Zod
✅ **Service Role Key**: Solo en servidor, nunca expuesta
✅ **Server Actions**: Ejecución exclusiva en servidor
✅ **Errores amigables**: Mensajes traducidos para el usuario
✅ **Auto-confirmación**: Email confirmado automáticamente
✅ **Metadata**: Rol y nombre almacenados en `user_metadata`

## Próximas Mejoras

- [ ] Implementar cambio de contraseña obligatorio en primer login
- [ ] Agregar server action para actualizar roles
- [ ] Agregar server action para desactivar usuarios (soft delete)
- [ ] Implementar auditoría de creación de usuarios
- [ ] Agregar envío de email de bienvenida
- [ ] Implementar límite de intentos de creación

## Testing

### Caso 1: Creación exitosa
```typescript
const result = await createUser('test@example.com', 'Test User', 'viewer')
// Esperado: { success: true, user: {...} }
```

### Caso 2: Email duplicado
```typescript
await createUser('existing@example.com', 'Test', 'viewer')
// Esperado: { success: false, error: "El email ya está registrado" }
```

### Caso 3: Sin permisos
```typescript
// Usuario sin rol 'admin'
await createUser('test@example.com', 'Test', 'viewer')
// Esperado: { success: false, error: "Permiso denegado. Se requiere rol: admin" }
```

### Caso 4: Validación fallida
```typescript
await createUser('invalid-email', 'AB', 'invalid-role')
// Esperado: { success: false, error: "Debe ser un email válido" }
```

## Soporte

Para dudas o problemas:
1. Verificar que `SUPABASE_SERVICE_ROLE_KEY` esté configurada
2. Verificar que el usuario tenga rol `admin`
3. Revisar logs del servidor para errores detallados
4. Consultar documentación de Supabase Admin API

---

**Versión**: 1.0.0
**Última actualización**: 28 de Octubre, 2025
**Autor**: Equipo Reforest
