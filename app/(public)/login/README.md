# Login de Reforest

Página de autenticación para la plataforma Reforest.

## Características

- ✅ Formulario con validación usando Zod
- ✅ Integración con Supabase Auth
- ✅ Loading states durante el proceso de login
- ✅ Mensajes de error amigables con toasts (Sonner)
- ✅ Diseño responsive y profesional con shadcn/ui
- ✅ Redirect automático a dashboard tras login exitoso

## Stack técnico

- **Next.js 15** - App Router
- **Supabase Auth** - Autenticación
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de schemas
- **shadcn/ui** - Componentes UI (Card, Form, Input, Button)
- **Sonner** - Notificaciones toast

## Estructura de archivos

```
app/
├── (public)/
│   └── login/
│       ├── page.tsx         # Página de login (client component)
│       └── README.md        # Este archivo
├── (auth)/
│   ├── dashboard/
│   │   └── page.tsx        # Dashboard (requiere auth)
│   └── layout.tsx
├── actions/
│   └── auth.ts             # Server actions (loginUser, logoutUser)
└── layout.tsx              # Root layout con Toaster

lib/
└── supabase/
    ├── client.ts           # Cliente de Supabase para navegador
    └── server.ts           # Cliente de Supabase para servidor
```

## Uso

### Login de usuario

La página `/login` permite a los usuarios autenticarse:

```typescript
// Validación del formulario
const loginSchema = z.object({
  email: z.string().email('Debe ser un email válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
```

### Server Action

El login se maneja mediante un server action:

```typescript
// app/actions/auth.ts
export async function loginUser(email: string, password: string): Promise<AuthResult>
```

**Respuesta:**
```typescript
{
  success: boolean
  error?: string  // Solo presente si success es false
}
```

### Mensajes de error

Los errores de Supabase se traducen a mensajes amigables:

| Error de Supabase | Mensaje al usuario |
|-------------------|-------------------|
| Invalid login credentials | Email o contraseña incorrectos |
| Email not confirmed | Por favor, confirma tu email primero |
| User not found | Usuario no encontrado |
| Invalid email | Email inválido |

## Variables de entorno requeridas

Asegúrate de tener configurado `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Flujo de autenticación

1. Usuario ingresa credenciales
2. Validación del formulario con Zod
3. Server action `loginUser()` se ejecuta
4. Supabase Auth valida las credenciales
5. Si es exitoso:
   - Se establece la sesión en cookies
   - Se revalida el path
   - Redirect a `/dashboard`
6. Si falla:
   - Toast con mensaje de error
   - Usuario permanece en `/login`

## Próximos pasos

- [ ] Agregar middleware para proteger rutas `/dashboard`
- [ ] Implementar recuperación de contraseña
- [ ] Agregar roles y permisos (admin, operador_lab, operador_campo, viewer)
- [ ] Implementar logout en el dashboard
- [ ] Agregar remember me
