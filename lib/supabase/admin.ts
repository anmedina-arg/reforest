import { createClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase con privilegios de administrador
 *
 * IMPORTANTE: Este cliente usa el service_role_key que tiene
 * permisos completos sobre la base de datos, incluyendo:
 * - Crear usuarios
 * - Actualizar metadata de usuarios
 * - Bypass de RLS (Row Level Security)
 *
 * Solo debe usarse en server actions protegidas con requireRole('admin')
 * NUNCA exponer este cliente al cliente/navegador
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL no está configurada')
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no está configurada. ' +
      'Esta variable debe estar en .env.local (NUNCA en .env.local.example con el valor real)'
    )
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Obtiene la lista de todos los usuarios del sistema
 *
 * IMPORTANTE: Solo debe llamarse desde server components o server actions
 * protegidas con requireRole('admin')
 *
 * @returns Array de usuarios con su metadata
 */
export async function listUsers() {
  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin.auth.admin.listUsers()

  if (error) {
    console.error('Error listando usuarios:', error)
    throw new Error('No se pudieron obtener los usuarios')
  }

  return data.users
}
