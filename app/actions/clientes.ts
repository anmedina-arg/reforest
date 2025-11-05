'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createClienteSchema,
  updateClienteSchema,
  clienteFiltersSchema,
  type CreateClienteInput,
  type UpdateClienteInput,
  type ClienteFilters,
} from '@/lib/validations/proyecto'
import type { Cliente, PaginatedResponse } from '@/types/entities'

// =====================================================
// TIPOS DE RESPUESTA
// =====================================================

type ActionResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

// =====================================================
// OBTENER LISTA DE CLIENTES CON FILTROS Y PAGINACIÓN
// =====================================================

/**
 * Obtiene la lista de clientes con filtros opcionales y paginación
 *
 * @param filters - Filtros opcionales (search, page, pageSize)
 * @returns Lista paginada de clientes
 */
export async function getClientes(
  filters?: ClienteFilters
): Promise<ActionResponse<PaginatedResponse<Cliente>>> {
  try {
    // Validar y normalizar filtros
    const validatedFilters = clienteFiltersSchema.parse(filters || {})
    const { search } = validatedFilters
    const page = validatedFilters.page || 1
    const pageSize = validatedFilters.pageSize || 10

    const supabase = await createClient()

    // Construir query base
    let query = supabase
      .from('cliente')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Aplicar filtros
    if (search) {
      query = query.or(`nombre_cliente.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Calcular offset para paginación
    const offset = (page - 1) * pageSize

    // Aplicar paginación y ordenamiento
    query = query.order('nombre_cliente', { ascending: true }).range(offset, offset + pageSize - 1)

    // Ejecutar query
    const { data, error, count } = await query

    if (error) {
      console.error('Error obteniendo clientes:', error)
      return {
        success: false,
        error: 'No se pudieron obtener los clientes',
      }
    }

    const totalPages = count ? Math.ceil(count / pageSize) : 0

    return {
      success: true,
      data: {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error en getClientes:', error)

    // Si es un error de validación de Zod
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: 'Filtros inválidos',
      }
    }

    return {
      success: false,
      error: 'Error inesperado al obtener clientes',
    }
  }
}

// =====================================================
// OBTENER UN CLIENTE POR ID
// =====================================================

/**
 * Obtiene un cliente específico por su ID
 *
 * @param id - UUID del cliente
 * @returns Cliente
 */
export async function getCliente(id: string): Promise<ActionResponse<Cliente>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de cliente requerido',
      }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('cliente')
      .select('*')
      .eq('id_cliente', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error obteniendo cliente:', error)
      return {
        success: false,
        error: 'No se pudo obtener el cliente',
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Cliente no encontrado',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error en getCliente:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener el cliente',
    }
  }
}

// =====================================================
// CREAR NUEVO CLIENTE
// =====================================================

/**
 * Crea un nuevo cliente en el sistema
 *
 * @param input - Datos del nuevo cliente
 * @returns Cliente creado
 */
export async function createCliente(
  input: CreateClienteInput
): Promise<ActionResponse<Cliente>> {
  try {
    // Validar datos de entrada con Zod
    const validation = createClienteSchema.safeParse(input)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const validatedData = validation.data

    const supabase = await createClient()

    // Crear el cliente
    const { data: newCliente, error: createError } = await supabase
      .from('cliente')
      .insert({
        nombre_cliente: validatedData.nombre_cliente,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        picture: validatedData.picture || null,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creando cliente:', createError)

      // Mensajes de error más amigables
      if (createError.code === '23505') {
        return {
          success: false,
          error: 'Ya existe un cliente con ese email',
        }
      }

      return {
        success: false,
        error: `Error al crear cliente: ${createError.message}`,
      }
    }

    if (!newCliente) {
      return {
        success: false,
        error: 'No se pudo crear el cliente',
      }
    }

    // Revalidar la ruta de clientes
    revalidatePath('/clientes')

    return {
      success: true,
      data: newCliente,
    }
  } catch (error) {
    console.error('Error en createCliente:', error)
    return {
      success: false,
      error: 'Error inesperado al crear cliente',
    }
  }
}

// =====================================================
// ACTUALIZAR CLIENTE EXISTENTE
// =====================================================

/**
 * Actualiza un cliente existente
 *
 * @param id - UUID del cliente a actualizar
 * @param input - Datos a actualizar (campos opcionales)
 * @returns Cliente actualizado
 */
export async function updateCliente(
  id: string,
  input: UpdateClienteInput
): Promise<ActionResponse<Cliente>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de cliente requerido',
      }
    }

    // Validar datos de entrada con Zod
    const validation = updateClienteSchema.safeParse(input)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const validatedData = validation.data

    // Verificar que hay al menos un campo para actualizar
    if (Object.keys(validatedData).length === 0) {
      return {
        success: false,
        error: 'No hay campos para actualizar',
      }
    }

    const supabase = await createClient()

    // Verificar que el cliente existe y no está eliminado
    const { data: existingCliente, error: checkError } = await supabase
      .from('cliente')
      .select('id_cliente')
      .eq('id_cliente', id)
      .is('deleted_at', null)
      .single()

    if (checkError || !existingCliente) {
      return {
        success: false,
        error: 'Cliente no encontrado',
      }
    }

    // Actualizar el cliente
    const { data, error: updateError } = await supabase
      .from('cliente')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id_cliente', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error actualizando cliente:', updateError)

      // Mensajes de error más amigables
      if (updateError.code === '23505') {
        return {
          success: false,
          error: 'Ya existe un cliente con ese email',
        }
      }

      return {
        success: false,
        error: `Error al actualizar cliente: ${updateError.message}`,
      }
    }

    // Revalidar la ruta de clientes
    revalidatePath('/clientes')

    return {
      success: true,
      data: data,
    }
  } catch (error) {
    console.error('Error en updateCliente:', error)
    return {
      success: false,
      error: 'Error inesperado al actualizar cliente',
    }
  }
}

// =====================================================
// ELIMINAR CLIENTE (SOFT DELETE)
// =====================================================

/**
 * Elimina un cliente de forma lógica (soft delete)
 * Establece el campo deleted_at en lugar de eliminar el registro
 *
 * @param id - UUID del cliente a eliminar
 * @returns Confirmación de eliminación
 */
export async function deleteCliente(id: string): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de cliente requerido',
      }
    }

    const supabase = await createClient()

    // Verificar que el cliente existe y no está ya eliminado
    const { data: existingCliente, error: checkError } = await supabase
      .from('cliente')
      .select('id_cliente')
      .eq('id_cliente', id)
      .is('deleted_at', null)
      .single()

    if (checkError || !existingCliente) {
      return {
        success: false,
        error: 'Cliente no encontrado',
      }
    }

    // Soft delete: actualizar deleted_at
    const { error: deleteError } = await supabase
      .from('cliente')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id_cliente', id)

    if (deleteError) {
      console.error('Error eliminando cliente:', deleteError)
      return {
        success: false,
        error: `Error al eliminar cliente: ${deleteError.message}`,
      }
    }

    // Revalidar la ruta de clientes
    revalidatePath('/clientes')

    return {
      success: true,
      data: { id },
    }
  } catch (error) {
    console.error('Error en deleteCliente:', error)
    return {
      success: false,
      error: 'Error inesperado al eliminar cliente',
    }
  }
}
