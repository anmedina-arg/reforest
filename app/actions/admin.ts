'use server'

import { z } from 'zod'
import { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth'

// Schema de validación para creación de usuarios
const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Debe ser un email válido'),
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  role: z.enum(['admin', 'operador_lab', 'operador_campo', 'viewer'], {
    message: 'Rol inválido. Debe ser: admin, operador_lab, operador_campo o viewer'
  }),
})

export type CreateUserResult = {
  success: boolean
  error?: string
  user?: User
}

/**
 * Crea un nuevo usuario en Supabase
 *
 * IMPORTANTE: Este server action solo puede ser ejecutado por usuarios con rol 'admin'
 *
 * Password por defecto: 'Reforest2025!'
 *
 * NOTA PARA ADMINS:
 * - Todos los usuarios nuevos recibirán la misma contraseña temporal
 * - El admin debe comunicar la contraseña verbalmente o por canal seguro
 * - Se recomienda implementar cambio de contraseña obligatorio en el primer login
 * - La contraseña se puede cambiar desde el perfil de usuario
 *
 * @param email - Email del nuevo usuario
 * @param nombre - Nombre completo del usuario
 * @param role - Rol del usuario (admin, operador_lab, operador_campo, viewer)
 * @returns CreateUserResult con success, error y user
 */
export async function createUser(
  email: string,
  nombre: string,
  role: string
): Promise<CreateUserResult> {
  try {
    // 1. Verificar que el usuario actual sea admin
    await requireRole('admin')

    // 2. Validar los datos de entrada con Zod
    const validation = createUserSchema.safeParse({ email, nombre, role })

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    // 3. Crear cliente admin de Supabase
    const supabaseAdmin = createAdminClient()

    // 4. Password fijo para todos los usuarios nuevos
    const defaultPassword = 'Reforest2025!'

    // 5. Crear el usuario con Supabase Admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: nombre,
        role: role,
      },
    })

    if (error) {
      console.error('Error creando usuario:', error)

      // Mensajes de error más amigables
      const errorMessages: Record<string, string> = {
        'User already registered': 'El email ya está registrado',
        'Invalid email': 'Email inválido',
        'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
      }

      return {
        success: false,
        error: errorMessages[error.message] || `Error al crear usuario: ${error.message}`,
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'No se pudo crear el usuario',
      }
    }

    // 6. Retornar éxito con los datos del usuario
    return {
      success: true,
      user: data.user,
    }
  } catch (error) {
    console.error('Error en createUser:', error)

    // Si es un error de requireRole, retornar mensaje específico
    if (error instanceof Error) {
      if (error.message.includes('Permiso denegado') || error.message.includes('No autenticado')) {
        return {
          success: false,
          error: error.message,
        }
      }
    }

    return {
      success: false,
      error: 'Error inesperado al crear usuario',
    }
  }
}

