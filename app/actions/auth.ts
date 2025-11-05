'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type AuthResult = {
  success: boolean
  error?: string
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Mensajes de error más amigables para el usuario
      const errorMessages: Record<string, string> = {
        'Invalid login credentials': 'Email o contraseña incorrectos',
        'Email not confirmed': 'Por favor, confirma tu email primero',
        'User not found': 'Usuario no encontrado',
        'Invalid email': 'Email inválido',
      }

      return {
        success: false,
        error: errorMessages[error.message] || 'Error al iniciar sesión. Intenta nuevamente.',
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'No se pudo autenticar el usuario',
      }
    }

    // Revalidar el path para actualizar datos del servidor
    revalidatePath('/', 'layout')

    // Retornar éxito - el redirect se maneja en el cliente
    return {
      success: true,
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'Error inesperado. Por favor, intenta nuevamente.',
    }
  }
}

export async function logoutUser(): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: 'Error al cerrar sesión',
      }
    }

    // Revalidar el path para actualizar datos del servidor
    revalidatePath('/', 'layout')

    // Retornar éxito - el redirect se maneja en el cliente
    return {
      success: true,
    }
  } catch (error) {
    console.error('Logout error:', error)
    return {
      success: false,
      error: 'Error inesperado al cerrar sesión',
    }
  }
}
