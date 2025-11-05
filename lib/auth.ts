import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

/**
 * Obtiene el usuario autenticado actual
 * @returns Usuario de Supabase o null si no está autenticado
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Obtiene el rol del usuario desde el JWT
 * @returns Rol del usuario ('admin' | 'operador_lab' | 'operador_campo' | 'viewer') o null
 */
export async function getUserRole(): Promise<string | null> {
  const user = await getUser()

  if (!user) {
    return null
  }

  // El rol se almacena en user_metadata
  const role = user.user_metadata?.role || null

  return role
}

/**
 * Obtiene el nombre de usuario para mostrar
 * Prioridad: full_name > email username > email
 */
export async function getUserDisplayName(): Promise<string> {
  const user = await getUser()

  if (!user) {
    return 'Usuario'
  }

  // Verificar si hay un nombre completo en metadata
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name
  }

  // Usar la parte antes del @ del email
  if (user.email) {
    return user.email.split('@')[0]
  }

  return 'Usuario'
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export async function hasRole(requiredRole: string | string[]): Promise<boolean> {
  const role = await getUserRole()

  if (!role) {
    return false
  }

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(role)
  }

  return role === requiredRole
}

/**
 * Verifica si el usuario está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser()
  return user !== null
}

/**
 * Obtiene el rol formateado para mostrar al usuario
 */
export function formatRole(role: string | null): string {
  const roleMap: Record<string, string> = {
    admin: 'Administrador',
    operador_lab: 'Operador de Laboratorio',
    operador_campo: 'Operador de Campo',
    viewer: 'Visualizador',
  }

  return role ? roleMap[role] || 'Usuario' : 'Usuario'
}

/**
 * Require que el usuario tenga un rol específico
 * Lanza error si el usuario no tiene el rol requerido
 * @throws Error si el usuario no tiene el rol requerido
 */
export async function requireRole(requiredRole: string | string[]): Promise<void> {
  const user = await getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const userRole = await getUserRole()

  if (!userRole) {
    throw new Error('Usuario sin rol asignado')
  }

  const hasRequiredRole = Array.isArray(requiredRole)
    ? requiredRole.includes(userRole)
    : userRole === requiredRole

  if (!hasRequiredRole) {
    const roleNames = Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole
    throw new Error(`Permiso denegado. Se requiere rol: ${roleNames}`)
  }
}
