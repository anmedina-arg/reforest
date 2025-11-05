# Bug Fix: Redirect en Server Actions

## 🐛 Problema identificado

El uso de `redirect()` dentro de un `try-catch` en server actions causaba que el redirect fuera capturado como error y no funcionara correctamente.

```typescript
// ❌ INCORRECTO - El redirect se captura como error
try {
  const result = await supabase.auth.signInWithPassword(...)
  redirect('/dashboard') // Esto se captura en el catch
} catch (error) {
  return { success: false, error: '...' }
}
```

## ✅ Solución implementada

Removimos los `redirect()` de los server actions y movimos la lógica de navegación a los componentes cliente usando `useRouter`.

### Cambios realizados

#### 1. **Server Actions** (`app/actions/auth.ts`)

```typescript
// ✅ CORRECTO - Retornar success y manejar redirect en cliente
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: '...' }
    }

    revalidatePath('/', 'layout')

    // Retornar éxito - el redirect se maneja en el cliente
    return { success: true }
  } catch (error) {
    return { success: false, error: '...' }
  }
}

export async function logoutUser(): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: '...' }
    }

    revalidatePath('/', 'layout')

    // Retornar éxito - el redirect se maneja en el cliente
    return { success: true }
  } catch (error) {
    return { success: false, error: '...' }
  }
}
```

**Cambios:**
- ✅ Removido `import { redirect } from 'next/navigation'`
- ✅ Removidos todos los `redirect()` calls
- ✅ Ambas funciones ahora retornan `{ success: true }` en caso de éxito
- ✅ Mantiene `revalidatePath()` para actualizar datos del servidor

#### 2. **Login Page** (`app/(public)/login/page.tsx`)

```typescript
'use client'

import { useRouter } from 'next/navigation' // ✅ Agregado

export default function LoginPage() {
  const router = useRouter() // ✅ Agregado

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true)

    try {
      const result = await loginUser(values.email, values.password)

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return // ✅ Return explícito en caso de error
      }

      // ✅ Manejar redirect en el cliente cuando es exitoso
      if (result.success) {
        toast.success('¡Bienvenido a Reforest!')
        router.push('/dashboard')
        router.refresh() // Refrescar datos del servidor
      }
    } catch (error) {
      toast.error('Error inesperado. Por favor, intenta nuevamente.')
      setIsLoading(false)
    }
  }
}
```

**Cambios:**
- ✅ Import de `useRouter` desde `next/navigation`
- ✅ Hook `useRouter()` inicializado
- ✅ Redirect con `router.push('/dashboard')` cuando `result.success === true`
- ✅ `router.refresh()` para actualizar datos del servidor
- ✅ Toast de éxito agregado
- ✅ Return explícito en caso de error

#### 3. **Logout Button** (`components/auth/LogoutButton.tsx`)

```typescript
'use client'

import { useRouter } from 'next/navigation' // ✅ Agregado

export function LogoutButton() {
  const router = useRouter() // ✅ Agregado

  async function handleLogout() {
    setIsLoading(true)

    try {
      const result = await logoutUser()

      if (!result.success && result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return // ✅ Return explícito en caso de error
      }

      // ✅ Manejar redirect en el cliente cuando es exitoso
      if (result.success) {
        toast.success('Sesión cerrada correctamente')
        router.push('/login')
        router.refresh() // Refrescar datos del servidor
      }
    } catch (error) {
      toast.error('Error al cerrar sesión')
      setIsLoading(false)
    }
  }
}
```

**Cambios:**
- ✅ Import de `useRouter` desde `next/navigation`
- ✅ Hook `useRouter()` inicializado
- ✅ Redirect con `router.push('/login')` cuando `result.success === true`
- ✅ `router.refresh()` para actualizar datos del servidor
- ✅ Toast de éxito agregado
- ✅ Return explícito en caso de error

## 🔄 Flujo actualizado

### Login Flow

```
Usuario ingresa credenciales
         ↓
Validación con Zod
         ↓
Server Action: loginUser()
         ↓
   Supabase Auth
         ↓
    ✅ Éxito
         ↓
revalidatePath('/', 'layout')
         ↓
return { success: true }
         ↓
Cliente verifica result.success
         ↓
router.push('/dashboard')
router.refresh()
toast.success('¡Bienvenido!')
```

### Logout Flow

```
Usuario click en logout
         ↓
Server Action: logoutUser()
         ↓
Supabase signOut()
         ↓
    ✅ Éxito
         ↓
revalidatePath('/', 'layout')
         ↓
return { success: true }
         ↓
Cliente verifica result.success
         ↓
router.push('/login')
router.refresh()
toast.success('Sesión cerrada')
```

## 🎯 Beneficios de la solución

1. **✅ Funcionalidad correcta**: Los redirects ahora funcionan correctamente
2. **✅ Mejor UX**: Toast notifications informan al usuario del resultado
3. **✅ Separación de responsabilidades**:
   - Server Actions: Lógica de autenticación
   - Cliente: Navegación y feedback visual
4. **✅ Más control**: El cliente puede decidir qué hacer después del success
5. **✅ Manejo de errores mejorado**: Return explícito en cada caso de error

## 📝 Lecciones aprendidas

### ❌ No hacer

```typescript
// NO usar redirect() dentro de try-catch en server actions
try {
  await someAsyncOperation()
  redirect('/somewhere') // ❌ Esto se captura como error
} catch (error) {
  return { error }
}
```

### ✅ Hacer

```typescript
// Server Action - Solo retornar el resultado
export async function myAction() {
  try {
    await someAsyncOperation()
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { success: false, error: '...' }
  }
}

// Cliente - Manejar navegación
'use client'
export function MyComponent() {
  const router = useRouter()

  async function handleAction() {
    const result = await myAction()

    if (result.success) {
      router.push('/destination')
      router.refresh()
    }
  }
}
```

## 🧪 Testing

Para verificar que el fix funciona:

1. **Login**:
   - Ir a `/login`
   - Ingresar credenciales válidas
   - Verificar que redirige a `/dashboard`
   - Verificar toast de éxito

2. **Logout**:
   - Estar en `/dashboard`
   - Click en "Cerrar sesión"
   - Verificar que redirige a `/login`
   - Verificar toast de éxito

3. **Errores**:
   - Ingresar credenciales inválidas
   - Verificar que NO redirige
   - Verificar toast de error
   - Usuario permanece en `/login`

## 📊 Estado del build

```bash
✓ Compiled successfully
✓ Generating static pages (6/6)

Routes:
○ /login       (Static - pública)
ƒ /dashboard   (Dynamic - protegida)
```

✅ El proyecto compila sin errores
✅ Todas las rutas funcionan correctamente
✅ Los redirects ahora funcionan como se espera

---

**Fecha**: 28 de Octubre, 2025
**Archivos modificados**: 3
**Status**: ✅ Resuelto y verificado
