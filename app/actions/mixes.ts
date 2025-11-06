'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createMixSchema,
  updateMixSchema,
  mixFiltersSchema,
  agregarRecetaAMixSchema,
  removerRecetaDeMixSchema,
  actualizarCantidadRecetaSchema,
  type CreateMixInput,
  type UpdateMixInput,
  type MixFilters,
  type AgregarRecetaAMixInput,
  type RemoverRecetaDeMixInput,
  type ActualizarCantidadRecetaInput,
} from '@/lib/validations/mix'
import type { MixISeeds, MixWithRecetas, PaginatedResponse } from '@/types/entities'

// =====================================================
// TIPOS DE RESPUESTA
// =====================================================

type ActionResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

// =====================================================
// OBTENER LISTA DE MIXES CON PAGINACIÓN
// =====================================================

/**
 * Obtiene la lista de mixes con count de recetas
 *
 * @param filters - Filtros opcionales (search, page, pageSize)
 * @returns Lista paginada de mixes con count de recetas
 */
export async function getMixes(
  filters?: MixFilters
): Promise<ActionResponse<PaginatedResponse<MixISeeds & { recetas_count: number }>>> {
  try {
    // Validar y normalizar filtros
    const validatedFilters = mixFiltersSchema.parse(filters || {})
    const { search } = validatedFilters
    const page = validatedFilters.page || 1
    const pageSize = validatedFilters.pageSize || 10

    const supabase = await createClient()

    // Construir query base
    let query = supabase
      .from('mix_iseeds')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Aplicar filtros
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,descripcion.ilike.%${search}%`)
    }

    // Calcular offset para paginación
    const offset = (page - 1) * pageSize

    // Aplicar paginación y ordenamiento
    query = query.order('nombre', { ascending: true }).range(offset, offset + pageSize - 1)

    // Ejecutar query
    const { data, error, count } = await query

    if (error) {
      console.error('Error obteniendo mixes:', error)
      return {
        success: false,
        error: 'No se pudieron obtener los mixes',
      }
    }

    // Obtener count de recetas para cada mix
    const mixesWithCount = await Promise.all(
      (data || []).map(async (mix) => {
        const { count: recetasCount } = await supabase
          .from('mix_recetas')
          .select('*', { count: 'exact', head: true })
          .eq('id_mix', mix.id_mix)
          .is('deleted_at', null)

        return {
          ...mix,
          recetas_count: recetasCount || 0,
        }
      })
    )

    const totalPages = count ? Math.ceil(count / pageSize) : 0

    return {
      success: true,
      data: {
        data: mixesWithCount,
        total: count || 0,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error en getMixes:', error)

    // Si es un error de validación de Zod
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: 'Filtros inválidos',
      }
    }

    return {
      success: false,
      error: 'Error inesperado al obtener mixes',
    }
  }
}

// =====================================================
// OBTENER UN MIX POR ID CON RECETAS
// =====================================================

/**
 * Obtiene un mix específico con todas sus recetas y cantidades
 *
 * @param id - UUID del mix
 * @returns Mix con array completo de recetas + cantidades
 */
export async function getMix(id: string): Promise<ActionResponse<MixWithRecetas>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de mix requerido',
      }
    }

    const supabase = await createClient()

    // Obtener datos del mix
    const { data: mixData, error: mixError } = await supabase
      .from('mix_iseeds')
      .select('*')
      .eq('id_mix', id)
      .is('deleted_at', null)
      .single()

    if (mixError) {
      console.error('Error obteniendo mix:', mixError)
      return {
        success: false,
        error: 'No se pudo obtener el mix',
      }
    }

    if (!mixData) {
      return {
        success: false,
        error: 'Mix no encontrado',
      }
    }

    // Obtener recetas del mix
    const { data: mixRecetasData, error: recetasError } = await supabase
      .from('mix_recetas')
      .select(
        `
        cantidad_iseeds,
        receta!mix_recetas_id_receta_fkey(
          id_receta,
          nombre,
          descripcion
        )
      `
      )
      .eq('id_mix', id)
      .is('deleted_at', null)

    if (recetasError) {
      console.error('Error obteniendo recetas del mix:', recetasError)
    }

    // Construir el mix completo
    const mixWithRecetas: MixWithRecetas = {
      ...mixData,
      recetas:
        mixRecetasData?.map((mr: any) => ({
          id_receta: mr.receta.id_receta,
          nombre: mr.receta.nombre,
          descripcion: mr.receta.descripcion,
          cantidad_iseeds: mr.cantidad_iseeds,
        })) || [],
    }

    return {
      success: true,
      data: mixWithRecetas,
    }
  } catch (error) {
    console.error('Error en getMix:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener el mix',
    }
  }
}

// =====================================================
// CREAR NUEVO MIX
// =====================================================

/**
 * Crea un nuevo mix de iSeeds
 *
 * @param input - Datos del nuevo mix (nombre, descripcion, recetas opcionales)
 * @returns Mix creado con id
 */
export async function createMix(input: CreateMixInput): Promise<ActionResponse<MixISeeds>> {
  try {
    // Validar datos de entrada con Zod
    const validation = createMixSchema.safeParse(input)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const validatedData = validation.data

    const supabase = await createClient()

    // Crear el mix
    const { data: newMix, error: createError } = await supabase
      .from('mix_iseeds')
      .insert({
        nombre: validatedData.nombre,
        descripcion: validatedData.descripcion || null,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creando mix:', createError)

      // Mensajes de error más amigables
      if (createError.code === '23505') {
        return {
          success: false,
          error: 'Ya existe un mix con ese nombre',
        }
      }

      return {
        success: false,
        error: `Error al crear mix: ${createError.message}`,
      }
    }

    if (!newMix) {
      return {
        success: false,
        error: 'No se pudo crear el mix',
      }
    }

    // Si se proporcionaron recetas, agregarlas
    if (validatedData.recetas && validatedData.recetas.length > 0) {
      const recetasToInsert = validatedData.recetas.map((receta) => ({
        id_mix: newMix.id_mix,
        id_receta: receta.id_receta,
        cantidad_iseeds: receta.cantidad_iseeds,
      }))

      const { error: recetasError } = await supabase
        .from('mix_recetas')
        .insert(recetasToInsert)

      if (recetasError) {
        console.error('Error agregando recetas al mix:', recetasError)
        // El mix se creó pero no se pudieron agregar las recetas
        // No retornamos error para no perder el mix creado
      }
    }

    // Revalidar la ruta de mixes
    revalidatePath('/mixes')

    return {
      success: true,
      data: newMix,
    }
  } catch (error) {
    console.error('Error en createMix:', error)
    return {
      success: false,
      error: 'Error inesperado al crear mix',
    }
  }
}

// =====================================================
// ACTUALIZAR MIX EXISTENTE
// =====================================================

/**
 * Actualiza un mix existente
 *
 * @param id - UUID del mix a actualizar
 * @param input - Datos a actualizar (nombre, descripcion)
 * @returns Mix actualizado
 */
export async function updateMix(
  id: string,
  input: UpdateMixInput
): Promise<ActionResponse<MixISeeds>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de mix requerido',
      }
    }

    // Validar datos de entrada con Zod
    const validation = updateMixSchema.safeParse(input)

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

    // Verificar que el mix existe y no está eliminado
    const { data: existingMix, error: checkError } = await supabase
      .from('mix_iseeds')
      .select('id_mix')
      .eq('id_mix', id)
      .is('deleted_at', null)
      .single()

    if (checkError || !existingMix) {
      return {
        success: false,
        error: 'Mix no encontrado',
      }
    }

    // Actualizar el mix
    const { data, error: updateError } = await supabase
      .from('mix_iseeds')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id_mix', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error actualizando mix:', updateError)

      // Mensajes de error más amigables
      if (updateError.code === '23505') {
        return {
          success: false,
          error: 'Ya existe un mix con ese nombre',
        }
      }

      return {
        success: false,
        error: `Error al actualizar mix: ${updateError.message}`,
      }
    }

    // Revalidar la ruta de mixes
    revalidatePath('/mixes')
    revalidatePath(`/mixes/${id}`)

    return {
      success: true,
      data: data,
    }
  } catch (error) {
    console.error('Error en updateMix:', error)
    return {
      success: false,
      error: 'Error inesperado al actualizar mix',
    }
  }
}

// =====================================================
// ELIMINAR MIX (SOFT DELETE)
// =====================================================

/**
 * Elimina un mix de forma lógica (soft delete)
 * Establece el campo deleted_at en lugar de eliminar el registro
 *
 * @param id - UUID del mix a eliminar
 * @returns Confirmación de eliminación
 */
export async function deleteMix(id: string): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de mix requerido',
      }
    }

    const supabase = await createClient()

    // Verificar que el mix existe y no está ya eliminado
    const { data: existingMix, error: checkError } = await supabase
      .from('mix_iseeds')
      .select('id_mix')
      .eq('id_mix', id)
      .is('deleted_at', null)
      .single()

    if (checkError || !existingMix) {
      return {
        success: false,
        error: 'Mix no encontrado',
      }
    }

    // Verificar si hay proyectos usando este mix
    const { data: proyectosUsandoMix } = await supabase
      .from('proyecto')
      .select('id_proyecto')
      .eq('id_mix', id)
      .is('deleted_at', null)
      .limit(1)

    if (proyectosUsandoMix && proyectosUsandoMix.length > 0) {
      return {
        success: false,
        error: 'No se puede eliminar: hay proyectos usando este mix',
      }
    }

    // Soft delete: actualizar deleted_at
    const { error: deleteError } = await supabase
      .from('mix_iseeds')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id_mix', id)

    if (deleteError) {
      console.error('Error eliminando mix:', deleteError)
      return {
        success: false,
        error: `Error al eliminar mix: ${deleteError.message}`,
      }
    }

    // También marcar como eliminadas las relaciones con recetas
    await supabase
      .from('mix_recetas')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id_mix', id)

    // Revalidar la ruta de mixes
    revalidatePath('/mixes')

    return {
      success: true,
      data: { id },
    }
  } catch (error) {
    console.error('Error en deleteMix:', error)
    return {
      success: false,
      error: 'Error inesperado al eliminar mix',
    }
  }
}

// =====================================================
// AGREGAR RECETA A MIX
// =====================================================

/**
 * Agrega una receta a un mix con cantidad específica
 *
 * @param input - ID del mix, ID de la receta y cantidad
 * @returns Mix actualizado
 */
export async function agregarRecetaAMix(
  input: AgregarRecetaAMixInput
): Promise<ActionResponse<MixWithRecetas>> {
  try {
    // Validar datos de entrada con Zod
    const validation = agregarRecetaAMixSchema.safeParse(input)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const validatedData = validation.data

    const supabase = await createClient()

    // Verificar que el mix existe
    const { data: existingMix, error: mixError } = await supabase
      .from('mix_iseeds')
      .select('id_mix')
      .eq('id_mix', validatedData.id_mix)
      .is('deleted_at', null)
      .single()

    if (mixError || !existingMix) {
      return {
        success: false,
        error: 'Mix no encontrado',
      }
    }

    // Verificar que la receta existe
    const { data: existingReceta, error: recetaError } = await supabase
      .from('receta')
      .select('id_receta')
      .eq('id_receta', validatedData.id_receta)
      .is('deleted_at', null)
      .single()

    if (recetaError || !existingReceta) {
      return {
        success: false,
        error: 'Receta no encontrada',
      }
    }

    // Verificar si la receta ya está en el mix
    const { data: existingRelacion, error: relacionError } = await supabase
      .from('mix_recetas')
      .select('id_mix')
      .eq('id_mix', validatedData.id_mix)
      .eq('id_receta', validatedData.id_receta)
      .is('deleted_at', null)
      .maybeSingle()

    if (existingRelacion) {
      return {
        success: false,
        error: 'Esta receta ya está en el mix',
      }
    }

    // Agregar la receta al mix
    const { error: insertError } = await supabase.from('mix_recetas').insert({
      id_mix: validatedData.id_mix,
      id_receta: validatedData.id_receta,
      cantidad_iseeds: validatedData.cantidad_iseeds,
    })

    if (insertError) {
      console.error('Error agregando receta al mix:', insertError)
      return {
        success: false,
        error: `Error al agregar receta: ${insertError.message}`,
      }
    }

    // Obtener el mix actualizado con todas las recetas
    const mixResult = await getMix(validatedData.id_mix)

    if (!mixResult.success || !mixResult.data) {
      return {
        success: false,
        error: 'Receta agregada pero no se pudo cargar el mix',
      }
    }

    // Revalidar rutas
    revalidatePath('/mixes')
    revalidatePath(`/mixes/${validatedData.id_mix}`)

    return {
      success: true,
      data: mixResult.data,
    }
  } catch (error) {
    console.error('Error en agregarRecetaAMix:', error)
    return {
      success: false,
      error: 'Error inesperado al agregar receta al mix',
    }
  }
}

// =====================================================
// REMOVER RECETA DE MIX
// =====================================================

/**
 * Remueve una receta de un mix
 *
 * @param input - ID del mix e ID de la receta
 * @returns Mix actualizado
 */
export async function removerRecetaDeMix(
  input: RemoverRecetaDeMixInput
): Promise<ActionResponse<MixWithRecetas>> {
  try {
    // Validar datos de entrada con Zod
    const validation = removerRecetaDeMixSchema.safeParse(input)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const validatedData = validation.data

    const supabase = await createClient()

    // Verificar que la relación existe
    const { data: existingRelacion, error: relacionError } = await supabase
      .from('mix_recetas')
      .select('id_mix')
      .eq('id_mix', validatedData.id_mix)
      .eq('id_receta', validatedData.id_receta)
      .is('deleted_at', null)
      .maybeSingle()

    if (relacionError || !existingRelacion) {
      return {
        success: false,
        error: 'Esta receta no está en el mix',
      }
    }

    // Soft delete de la relación
    const { error: deleteError } = await supabase
      .from('mix_recetas')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id_mix', validatedData.id_mix)
      .eq('id_receta', validatedData.id_receta)

    if (deleteError) {
      console.error('Error removiendo receta del mix:', deleteError)
      return {
        success: false,
        error: `Error al remover receta: ${deleteError.message}`,
      }
    }

    // Obtener el mix actualizado
    const mixResult = await getMix(validatedData.id_mix)

    if (!mixResult.success || !mixResult.data) {
      return {
        success: false,
        error: 'Receta removida pero no se pudo cargar el mix',
      }
    }

    // Revalidar rutas
    revalidatePath('/mixes')
    revalidatePath(`/mixes/${validatedData.id_mix}`)

    return {
      success: true,
      data: mixResult.data,
    }
  } catch (error) {
    console.error('Error en removerRecetaDeMix:', error)
    return {
      success: false,
      error: 'Error inesperado al remover receta del mix',
    }
  }
}

// =====================================================
// ACTUALIZAR CANTIDAD DE RECETA EN MIX
// =====================================================

/**
 * Actualiza la cantidad de iSeeds de una receta en un mix
 *
 * @param input - ID del mix, ID de la receta y nueva cantidad
 * @returns Mix actualizado
 */
export async function actualizarCantidadReceta(
  input: ActualizarCantidadRecetaInput
): Promise<ActionResponse<MixWithRecetas>> {
  try {
    // Validar datos de entrada con Zod
    const validation = actualizarCantidadRecetaSchema.safeParse(input)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const validatedData = validation.data

    const supabase = await createClient()

    // Verificar que la relación existe
    const { data: existingRelacion, error: relacionError } = await supabase
      .from('mix_recetas')
      .select('id_mix')
      .eq('id_mix', validatedData.id_mix)
      .eq('id_receta', validatedData.id_receta)
      .is('deleted_at', null)
      .maybeSingle()

    if (relacionError || !existingRelacion) {
      return {
        success: false,
        error: 'Esta receta no está en el mix',
      }
    }

    // Actualizar la cantidad
    const { error: updateError } = await supabase
      .from('mix_recetas')
      .update({
        cantidad_iseeds: validatedData.cantidad_iseeds,
        updated_at: new Date().toISOString(),
      })
      .eq('id_mix', validatedData.id_mix)
      .eq('id_receta', validatedData.id_receta)

    if (updateError) {
      console.error('Error actualizando cantidad de receta:', updateError)
      return {
        success: false,
        error: `Error al actualizar cantidad: ${updateError.message}`,
      }
    }

    // Obtener el mix actualizado
    const mixResult = await getMix(validatedData.id_mix)

    if (!mixResult.success || !mixResult.data) {
      return {
        success: false,
        error: 'Cantidad actualizada pero no se pudo cargar el mix',
      }
    }

    // Revalidar rutas
    revalidatePath('/mixes')
    revalidatePath(`/mixes/${validatedData.id_mix}`)

    return {
      success: true,
      data: mixResult.data,
    }
  } catch (error) {
    console.error('Error en actualizarCantidadReceta:', error)
    return {
      success: false,
      error: 'Error inesperado al actualizar cantidad de receta',
    }
  }
}
