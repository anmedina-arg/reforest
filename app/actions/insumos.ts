'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createInsumoSchema,
  updateInsumoSchema,
  insumoFiltersSchema,
  type CreateInsumoInput,
  type UpdateInsumoInput,
  type InsumoFilters,
} from '@/lib/validations/insumo'
import type { InsumoWithRelations, PaginatedResponse } from '@/types/entities'

// =====================================================
// TIPOS DE RESPUESTA
// =====================================================

type ActionResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

// =====================================================
// OBTENER LISTA DE INSUMOS CON FILTROS Y PAGINACIÓN
// =====================================================

/**
 * Obtiene la lista de insumos con filtros opcionales y paginación
 *
 * @param filters - Filtros opcionales (tipo, especie, search, page, pageSize)
 * @returns Lista paginada de insumos con sus relaciones
 */
export async function getInsumos(
  filters?: InsumoFilters
): Promise<ActionResponse<PaginatedResponse<InsumoWithRelations>>> {
  try {
    // Validar y normalizar filtros
    const validatedFilters = insumoFiltersSchema.parse(filters || {})
    const { tipo, especie, search } = validatedFilters
    const page = validatedFilters.page || 1
    const pageSize = validatedFilters.pageSize || 10

    const supabase = await createClient()

    // Construir query base
    let query = supabase
      .from('insumo')
      .select(
        `
        *,
        tipo_insumo:tipo_insumo!insumo_id_tipo_insumo_fkey(
          id_tipo_insumo,
          descripcion_tipo_insumo
        ),
        unidad:unidad_medida!insumo_unidad_medida_fkey(
          id_unidad,
          nombre,
          abreviatura
        )
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null)

    // Aplicar filtros
    if (tipo) {
      query = query.eq('id_tipo_insumo', tipo)
    }

    if (especie) {
      query = query.ilike('especie', `%${especie}%`)
    }

    if (search) {
      query = query.or(
        `nombre.ilike.%${search}%,nombre_cientifico.ilike.%${search}%,especie.ilike.%${search}%`
      )
    }

    // Calcular offset para paginación
    const offset = (page - 1) * pageSize

    // Aplicar paginación y ordenamiento
    query = query.order('nombre', { ascending: true }).range(offset, offset + pageSize - 1)

    // Ejecutar query
    const { data, error, count } = await query

    if (error) {
      console.error('Error obteniendo insumos:', error)
      return {
        success: false,
        error: 'No se pudieron obtener los insumos',
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
    console.error('Error en getInsumos:', error)

    // Si es un error de validación de Zod
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: 'Filtros inválidos',
      }
    }

    return {
      success: false,
      error: 'Error inesperado al obtener insumos',
    }
  }
}

// =====================================================
// OBTENER UN INSUMO POR ID
// =====================================================

/**
 * Obtiene un insumo específico por su ID con todas sus relaciones
 *
 * @param id - UUID del insumo
 * @returns Insumo con sus relaciones
 */
export async function getInsumo(id: string): Promise<ActionResponse<InsumoWithRelations>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de insumo requerido',
      }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('insumo')
      .select(
        `
        *,
        tipo_insumo:tipo_insumo!insumo_id_tipo_insumo_fkey(
          id_tipo_insumo,
          descripcion_tipo_insumo
        ),
        unidad:unidad_medida!insumo_unidad_medida_fkey(
          id_unidad,
          nombre,
          abreviatura
        )
      `
      )
      .eq('id_insumo', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error obteniendo insumo:', error)
      return {
        success: false,
        error: 'No se pudo obtener el insumo',
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Insumo no encontrado',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error en getInsumo:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener el insumo',
    }
  }
}

// =====================================================
// CREAR NUEVO INSUMO
// =====================================================

/**
 * Crea un nuevo insumo en el sistema
 *
 * @param input - Datos del nuevo insumo
 * @returns Insumo creado con sus relaciones
 */
export async function createInsumo(
  input: CreateInsumoInput
): Promise<ActionResponse<InsumoWithRelations>> {
  try {
    // Validar datos de entrada con Zod
    const validation = createInsumoSchema.safeParse(input)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const validatedData = validation.data

    const supabase = await createClient()

    // Crear el insumo
    const { data: newInsumo, error: createError } = await supabase
      .from('insumo')
      .insert({
        nombre: validatedData.nombre,
        nombre_cientifico: validatedData.nombre_cientifico || null,
        especie: validatedData.especie || null,
        id_tipo_insumo: validatedData.id_tipo_insumo,
        unidad_medida: validatedData.unidad_medida,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creando insumo:', createError)

      // Mensajes de error más amigables
      if (createError.code === '23503') {
        return {
          success: false,
          error: 'El tipo de insumo o unidad de medida no existe',
        }
      }

      if (createError.code === '23505') {
        return {
          success: false,
          error: 'Ya existe un insumo con ese nombre',
        }
      }

      return {
        success: false,
        error: `Error al crear insumo: ${createError.message}`,
      }
    }

    if (!newInsumo) {
      return {
        success: false,
        error: 'No se pudo crear el insumo',
      }
    }

    // Obtener el insumo completo con relaciones
    const insumoResult = await getInsumo(newInsumo.id_insumo)

    if (!insumoResult.success || !insumoResult.data) {
      return {
        success: false,
        error: 'Insumo creado pero no se pudieron cargar sus relaciones',
      }
    }

    // Revalidar la ruta de insumos
    revalidatePath('/insumos')

    return {
      success: true,
      data: insumoResult.data,
    }
  } catch (error) {
    console.error('Error en createInsumo:', error)
    return {
      success: false,
      error: 'Error inesperado al crear insumo',
    }
  }
}

// =====================================================
// ACTUALIZAR INSUMO EXISTENTE
// =====================================================

/**
 * Actualiza un insumo existente
 *
 * @param id - UUID del insumo a actualizar
 * @param input - Datos a actualizar (campos opcionales)
 * @returns Insumo actualizado con sus relaciones
 */
export async function updateInsumo(
  id: string,
  input: UpdateInsumoInput
): Promise<ActionResponse<InsumoWithRelations>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de insumo requerido',
      }
    }

    // Validar datos de entrada con Zod
    const validation = updateInsumoSchema.safeParse(input)

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

    // Verificar que el insumo existe y no está eliminado
    const { data: existingInsumo, error: checkError } = await supabase
      .from('insumo')
      .select('id_insumo')
      .eq('id_insumo', id)
      .is('deleted_at', null)
      .single()

    if (checkError || !existingInsumo) {
      return {
        success: false,
        error: 'Insumo no encontrado',
      }
    }

    // Actualizar el insumo
    const { error: updateError } = await supabase
      .from('insumo')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id_insumo', id)

    if (updateError) {
      console.error('Error actualizando insumo:', updateError)

      // Mensajes de error más amigables
      if (updateError.code === '23503') {
        return {
          success: false,
          error: 'El tipo de insumo o unidad de medida no existe',
        }
      }

      if (updateError.code === '23505') {
        return {
          success: false,
          error: 'Ya existe un insumo con ese nombre',
        }
      }

      return {
        success: false,
        error: `Error al actualizar insumo: ${updateError.message}`,
      }
    }

    // Obtener el insumo actualizado con relaciones
    const insumoResult = await getInsumo(id)

    if (!insumoResult.success || !insumoResult.data) {
      return {
        success: false,
        error: 'Insumo actualizado pero no se pudieron cargar sus relaciones',
      }
    }

    // Revalidar la ruta de insumos
    revalidatePath('/insumos')

    return {
      success: true,
      data: insumoResult.data,
    }
  } catch (error) {
    console.error('Error en updateInsumo:', error)
    return {
      success: false,
      error: 'Error inesperado al actualizar insumo',
    }
  }
}

// =====================================================
// ELIMINAR INSUMO (SOFT DELETE)
// =====================================================

/**
 * Elimina un insumo de forma lógica (soft delete)
 * Establece el campo deleted_at en lugar de eliminar el registro
 *
 * @param id - UUID del insumo a eliminar
 * @returns Confirmación de eliminación
 */
export async function deleteInsumo(id: string): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de insumo requerido',
      }
    }

    const supabase = await createClient()

    // Verificar que el insumo existe y no está ya eliminado
    const { data: existingInsumo, error: checkError } = await supabase
      .from('insumo')
      .select('id_insumo')
      .eq('id_insumo', id)
      .is('deleted_at', null)
      .single()

    if (checkError || !existingInsumo) {
      return {
        success: false,
        error: 'Insumo no encontrado',
      }
    }

    // Soft delete: actualizar deleted_at
    const { error: deleteError } = await supabase
      .from('insumo')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id_insumo', id)

    if (deleteError) {
      console.error('Error eliminando insumo:', deleteError)
      return {
        success: false,
        error: `Error al eliminar insumo: ${deleteError.message}`,
      }
    }

    // Revalidar la ruta de insumos
    revalidatePath('/insumos')

    return {
      success: true,
      data: { id },
    }
  } catch (error) {
    console.error('Error en deleteInsumo:', error)
    return {
      success: false,
      error: 'Error inesperado al eliminar insumo',
    }
  }
}

// =====================================================
// OBTENER CATÁLOGOS (TIPOS Y UNIDADES)
// =====================================================

/**
 * Obtiene la lista de tipos de insumo
 *
 * @returns Lista de tipos de insumo
 */
export async function getTiposInsumo() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tipo_insumo')
      .select('*')
      .is('deleted_at', null)
      .order('descripcion_tipo_insumo', { ascending: true })

    if (error) {
      console.error('Error obteniendo tipos de insumo:', error)
      return {
        success: false,
        error: 'No se pudieron obtener los tipos de insumo',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error en getTiposInsumo:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener tipos de insumo',
    }
  }
}

/**
 * Obtiene la lista de unidades de medida
 *
 * @returns Lista de unidades de medida
 */
export async function getUnidadesMedida(): Promise<ActionResponse<{ id_unidad: string; nombre: string; abreviatura: string | null }[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('unidad_medida')
      .select('id_unidad, nombre, abreviatura')
      .is('deleted_at', null)
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error obteniendo unidades de medida:', error)
      return {
        success: false,
        error: 'No se pudieron obtener las unidades de medida',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error en getUnidadesMedida:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener unidades de medida',
    }
  }
}

/**
 * Obtiene la lista de especies forestales
 *
 * @returns Lista de especies
 */
export async function getEspecies(): Promise<ActionResponse<{ id_especie: string; descripcion_especie: string }[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('especie')
      .select('id_especie, descripcion_especie')
      .is('deleted_at', null)
      .order('descripcion_especie', { ascending: true })

    if (error) {
      console.error('Error obteniendo especies:', error)
      return {
        success: false,
        error: 'No se pudieron obtener las especies',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error en getEspecies:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener especies',
    }
  }
}
