'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createRecetaSchema,
  updateRecetaSchema,
  agregarInsumoSchema,
  removerInsumoSchema,
  recetaFiltersSchema,
  type CreateRecetaInput,
  type UpdateRecetaInput,
  type AgregarInsumoInput,
  type RemoverInsumoInput,
  type RecetaFilters,
} from '@/lib/validations/receta'
import type {
  RecetaWithRelations,
  RecetaConInsumos,
  InsumoEnReceta,
  PaginatedResponse,
} from '@/types/entities'

// =====================================================
// TIPOS DE RESPUESTA
// =====================================================

type ActionResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

// =====================================================
// OBTENER LISTA DE RECETAS CON FILTROS Y PAGINACIÓN
// =====================================================

/**
 * Obtiene la lista de recetas con filtros opcionales y paginación
 *
 * @param filters - Filtros opcionales (search, autor, page, pageSize)
 * @returns Lista paginada de recetas con autor y count de insumos
 */
export async function getRecetas(
  filters?: RecetaFilters
): Promise<ActionResponse<PaginatedResponse<RecetaWithRelations>>> {
  try {
    // Validar y normalizar filtros
    const validatedFilters = recetaFiltersSchema.parse(filters || {})
    const { search, autor } = validatedFilters
    const page = validatedFilters.page || 1
    const pageSize = validatedFilters.pageSize || 10

    const supabase = await createClient()

    // Construir query base
    let query = supabase
      .from('receta')
      .select(
        `
        *,
        responsables_laboratorio!autor(
          id_responsable_labo,
          nombre_responsable
        )
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null)

    // Aplicar filtros
    if (autor) {
      query = query.eq('autor', autor)
    }

    if (search) {
      query = query.or(`nombre.ilike.%${search}%,descripcion.ilike.%${search}%`)
    }

    // Calcular offset para paginación
    const offset = (page - 1) * pageSize

    // Aplicar paginación y ordenamiento
    query = query.order('nombre', { ascending: true }).range(offset, offset + pageSize - 1)

    // Ejecutar query
    const { data: recetas, error, count } = await query

    if (error) {
      console.error('Error obteniendo recetas:', error)
      return {
        success: false,
        error: 'No se pudieron obtener las recetas',
      }
    }

    // Mapear responsables_laboratorio a autor para compatibilidad con tipos
    const recetasMapeadas = recetas?.map((receta: any) => ({
      ...receta,
      autor: receta.responsables_laboratorio,
      responsables_laboratorio: undefined,
    }))

    // Para cada receta, obtener el count de insumos
    if (recetasMapeadas && recetasMapeadas.length > 0) {
      const recetasConCount = await Promise.all(
        recetasMapeadas.map(async (receta) => {
          const { count: insumosCount } = await supabase
            .from('receta_insumo')
            .select('*', { count: 'exact', head: true })
            .eq('id_receta', receta.id_receta)

          return {
            ...receta,
            insumos_count: insumosCount || 0,
          }
        })
      )

      const totalPages = count ? Math.ceil(count / pageSize) : 0

      return {
        success: true,
        data: {
          data: recetasConCount || [],
          total: count || 0,
          page,
          pageSize,
          totalPages,
        },
      }
    }

    const totalPages = count ? Math.ceil(count / pageSize) : 0

    return {
      success: true,
      data: {
        data: recetasMapeadas || [],
        total: count || 0,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error en getRecetas:', error)

    // Si es un error de validación de Zod
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: 'Filtros inválidos',
      }
    }

    return {
      success: false,
      error: 'Error inesperado al obtener recetas',
    }
  }
}

// =====================================================
// OBTENER UNA RECETA POR ID CON INSUMOS COMPLETOS
// =====================================================

/**
 * Obtiene una receta específica por su ID con array completo de insumos + cantidades + unidades
 *
 * @param id - UUID de la receta
 * @returns Receta con su autor y array de insumos completo
 */
export async function getReceta(id: string): Promise<ActionResponse<RecetaConInsumos>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de receta requerido',
      }
    }

    const supabase = await createClient()

    // Obtener la receta básica con autor
    const { data: receta, error: recetaError } = await supabase
      .from('receta')
      .select(
        `
        *,
        responsables_laboratorio!autor(
          id_responsable_labo,
          nombre_responsable
        )
      `
      )
      .eq('id_receta', id)
      .is('deleted_at', null)
      .single()

    if (recetaError) {
      console.error('Error obteniendo receta:', recetaError)
      return {
        success: false,
        error: 'No se pudo obtener la receta',
      }
    }

    if (!receta) {
      return {
        success: false,
        error: 'Receta no encontrada',
      }
    }

    // Obtener los insumos de la receta con sus relaciones
    const { data: recetaInsumos, error: insumosError } = await supabase
      .from('receta_insumo')
      .select(
        `
        cantidad_teorica,
        insumo:insumo!receta_insumo_id_insumo_fkey(
          id_insumo,
          nombre,
          nombre_cientifico
        ),
        unidad:unidad_medida!receta_insumo_unidad_medida_fkey(
          id_unidad,
          nombre,
          abreviatura
        )
      `
      )
      .eq('id_receta', id)

    if (insumosError) {
      console.error('Error obteniendo insumos de receta:', insumosError)
      return {
        success: false,
        error: 'No se pudieron obtener los insumos de la receta',
      }
    }

    // Transformar los insumos al formato InsumoEnReceta
    const insumos: InsumoEnReceta[] =
      recetaInsumos?.map((ri: any) => ({
        id_insumo: ri.insumo.id_insumo,
        nombre: ri.insumo.nombre,
        nombre_cientifico: ri.insumo.nombre_cientifico,
        cantidad: ri.cantidad_teorica,
        unidad: ri.unidad,
      })) || []

    // Mapear responsables_laboratorio a autor para compatibilidad con tipos
    const recetaMapeada = {
      ...receta,
      autor: (receta as any).responsables_laboratorio,
      responsables_laboratorio: undefined,
      insumos,
    }

    return {
      success: true,
      data: recetaMapeada,
    }
  } catch (error) {
    console.error('Error en getReceta:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener la receta',
    }
  }
}

// =====================================================
// CREAR NUEVA RECETA
// =====================================================

/**
 * Crea una nueva receta en el sistema
 *
 * @param input - Datos de la nueva receta
 * @returns Receta creada con sus relaciones
 */
export async function createReceta(
  input: CreateRecetaInput
): Promise<ActionResponse<RecetaConInsumos>> {
  try {
    // Validar datos de entrada con Zod
    const validation = createRecetaSchema.safeParse(input)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const validatedData = validation.data

    const supabase = await createClient()

    // Crear la receta
    const { data: newReceta, error: createError } = await supabase
      .from('receta')
      .insert({
        nombre: validatedData.nombre,
        descripcion: validatedData.descripcion || null,
        autor: validatedData.autor || null,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creando receta:', createError)

      // Mensajes de error más amigables
      if (createError.code === '23503') {
        return {
          success: false,
          error: 'El autor especificado no existe',
        }
      }

      if (createError.code === '23505') {
        return {
          success: false,
          error: 'Ya existe una receta con ese nombre',
        }
      }

      return {
        success: false,
        error: `Error al crear receta: ${createError.message}`,
      }
    }

    if (!newReceta) {
      return {
        success: false,
        error: 'No se pudo crear la receta',
      }
    }

    // Obtener la receta completa con relaciones
    const recetaResult = await getReceta(newReceta.id_receta)

    if (!recetaResult.success || !recetaResult.data) {
      return {
        success: false,
        error: 'Receta creada pero no se pudieron cargar sus relaciones',
      }
    }

    // Revalidar la ruta de recetas
    revalidatePath('/recetas')

    return {
      success: true,
      data: recetaResult.data,
    }
  } catch (error) {
    console.error('Error en createReceta:', error)
    return {
      success: false,
      error: 'Error inesperado al crear receta',
    }
  }
}

// =====================================================
// ACTUALIZAR RECETA EXISTENTE
// =====================================================

/**
 * Actualiza una receta existente
 *
 * @param id - UUID de la receta a actualizar
 * @param input - Datos a actualizar (campos opcionales)
 * @returns Receta actualizada con sus relaciones
 */
export async function updateReceta(
  id: string,
  input: UpdateRecetaInput
): Promise<ActionResponse<RecetaConInsumos>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de receta requerido',
      }
    }

    // Validar datos de entrada con Zod
    const validation = updateRecetaSchema.safeParse(input)

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

    // Verificar que la receta existe y no está eliminada
    const { data: existingReceta, error: checkError } = await supabase
      .from('receta')
      .select('id_receta')
      .eq('id_receta', id)
      .is('deleted_at', null)
      .single()

    if (checkError || !existingReceta) {
      return {
        success: false,
        error: 'Receta no encontrada',
      }
    }

    // Actualizar la receta
    const { error: updateError } = await supabase
      .from('receta')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id_receta', id)

    if (updateError) {
      console.error('Error actualizando receta:', updateError)

      // Mensajes de error más amigables
      if (updateError.code === '23503') {
        return {
          success: false,
          error: 'El autor especificado no existe',
        }
      }

      if (updateError.code === '23505') {
        return {
          success: false,
          error: 'Ya existe una receta con ese nombre',
        }
      }

      return {
        success: false,
        error: `Error al actualizar receta: ${updateError.message}`,
      }
    }

    // Obtener la receta actualizada con relaciones
    const recetaResult = await getReceta(id)

    if (!recetaResult.success || !recetaResult.data) {
      return {
        success: false,
        error: 'Receta actualizada pero no se pudieron cargar sus relaciones',
      }
    }

    // Revalidar la ruta de recetas
    revalidatePath('/recetas')

    return {
      success: true,
      data: recetaResult.data,
    }
  } catch (error) {
    console.error('Error en updateReceta:', error)
    return {
      success: false,
      error: 'Error inesperado al actualizar receta',
    }
  }
}

// =====================================================
// ELIMINAR RECETA (SOFT DELETE)
// =====================================================

/**
 * Elimina una receta de forma lógica (soft delete)
 * Establece el campo deleted_at en lugar de eliminar el registro
 *
 * @param id - UUID de la receta a eliminar
 * @returns Confirmación de eliminación
 */
export async function deleteReceta(id: string): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de receta requerido',
      }
    }

    const supabase = await createClient()

    // Verificar que la receta existe y no está ya eliminada
    const { data: existingReceta, error: checkError } = await supabase
      .from('receta')
      .select('id_receta')
      .eq('id_receta', id)
      .is('deleted_at', null)
      .single()

    if (checkError || !existingReceta) {
      return {
        success: false,
        error: 'Receta no encontrada',
      }
    }

    // Soft delete: actualizar deleted_at
    const { error: deleteError } = await supabase
      .from('receta')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id_receta', id)

    if (deleteError) {
      console.error('Error eliminando receta:', deleteError)
      return {
        success: false,
        error: `Error al eliminar receta: ${deleteError.message}`,
      }
    }

    // Revalidar la ruta de recetas
    revalidatePath('/recetas')

    return {
      success: true,
      data: { id },
    }
  } catch (error) {
    console.error('Error en deleteReceta:', error)
    return {
      success: false,
      error: 'Error inesperado al eliminar receta',
    }
  }
}

// =====================================================
// AGREGAR INSUMO A RECETA
// =====================================================

/**
 * Agrega un insumo a una receta con cantidad y unidad específica
 *
 * @param input - Datos del insumo a agregar (id_receta, id_insumo, cantidad, id_unidad)
 * @returns Receta actualizada con todos sus insumos
 */
export async function agregarInsumo(
  input: AgregarInsumoInput
): Promise<ActionResponse<RecetaConInsumos>> {
  try {
    // Validar datos de entrada con Zod
    const validation = agregarInsumoSchema.safeParse(input)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const validatedData = validation.data

    const supabase = await createClient()

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

    // Verificar que el insumo existe
    const { data: existingInsumo, error: insumoError } = await supabase
      .from('insumo')
      .select('id_insumo')
      .eq('id_insumo', validatedData.id_insumo)
      .is('deleted_at', null)
      .single()

    if (insumoError || !existingInsumo) {
      return {
        success: false,
        error: 'Insumo no encontrado',
      }
    }

    // Verificar que la unidad existe
    const { data: existingUnidad, error: unidadError } = await supabase
      .from('unidad_medida')
      .select('id_unidad')
      .eq('id_unidad', validatedData.id_unidad)
      .is('deleted_at', null)
      .single()

    if (unidadError || !existingUnidad) {
      return {
        success: false,
        error: 'Unidad de medida no encontrada',
      }
    }

    // Verificar si el insumo ya existe en la receta
    const { data: existingRelation } = await supabase
      .from('receta_insumo')
      .select('*')
      .eq('id_receta', validatedData.id_receta)
      .eq('id_insumo', validatedData.id_insumo)
      .single()

    if (existingRelation) {
      // Si ya existe, actualizar la cantidad y unidad
      const { error: updateError } = await supabase
        .from('receta_insumo')
        .update({
          cantidad_teorica: validatedData.cantidad,
          unidad_medida: validatedData.id_unidad,
          updated_at: new Date().toISOString(),
        })
        .eq('id_receta', validatedData.id_receta)
        .eq('id_insumo', validatedData.id_insumo)

      if (updateError) {
        console.error('Error actualizando insumo en receta:', updateError)
        return {
          success: false,
          error: `Error al actualizar insumo en receta: ${updateError.message}`,
        }
      }
    } else {
      // Si no existe, insertar la relación
      const { error: insertError } = await supabase.from('receta_insumo').insert({
        id_receta: validatedData.id_receta,
        id_insumo: validatedData.id_insumo,
        cantidad_teorica: validatedData.cantidad,
        unidad_medida: validatedData.id_unidad,
      })

      if (insertError) {
        console.error('Error agregando insumo a receta:', insertError)
        return {
          success: false,
          error: `Error al agregar insumo a receta: ${insertError.message}`,
        }
      }
    }

    // Obtener la receta actualizada con todos sus insumos
    const recetaResult = await getReceta(validatedData.id_receta)

    if (!recetaResult.success || !recetaResult.data) {
      return {
        success: false,
        error: 'Insumo agregado pero no se pudo cargar la receta actualizada',
      }
    }

    // Revalidar la ruta de recetas
    revalidatePath('/recetas')

    return {
      success: true,
      data: recetaResult.data,
    }
  } catch (error) {
    console.error('Error en agregarInsumo:', error)
    return {
      success: false,
      error: 'Error inesperado al agregar insumo',
    }
  }
}

// =====================================================
// REMOVER INSUMO DE RECETA
// =====================================================

/**
 * Remueve un insumo de una receta
 *
 * @param input - IDs de receta e insumo a remover
 * @returns Receta actualizada con todos sus insumos
 */
export async function removerInsumo(
  input: RemoverInsumoInput
): Promise<ActionResponse<RecetaConInsumos>> {
  try {
    // Validar datos de entrada con Zod
    const validation = removerInsumoSchema.safeParse(input)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const validatedData = validation.data

    const supabase = await createClient()

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

    // Verificar que la relación existe
    const { data: existingRelation } = await supabase
      .from('receta_insumo')
      .select('*')
      .eq('id_receta', validatedData.id_receta)
      .eq('id_insumo', validatedData.id_insumo)
      .single()

    if (!existingRelation) {
      return {
        success: false,
        error: 'El insumo no está en la receta',
      }
    }

    // Eliminar la relación
    const { error: deleteError } = await supabase
      .from('receta_insumo')
      .delete()
      .eq('id_receta', validatedData.id_receta)
      .eq('id_insumo', validatedData.id_insumo)

    if (deleteError) {
      console.error('Error removiendo insumo de receta:', deleteError)
      return {
        success: false,
        error: `Error al remover insumo de receta: ${deleteError.message}`,
      }
    }

    // Obtener la receta actualizada con todos sus insumos
    const recetaResult = await getReceta(validatedData.id_receta)

    if (!recetaResult.success || !recetaResult.data) {
      return {
        success: false,
        error: 'Insumo removido pero no se pudo cargar la receta actualizada',
      }
    }

    // Revalidar la ruta de recetas
    revalidatePath('/recetas')

    return {
      success: true,
      data: recetaResult.data,
    }
  } catch (error) {
    console.error('Error en removerInsumo:', error)
    return {
      success: false,
      error: 'Error inesperado al remover insumo',
    }
  }
}

// =====================================================
// OBTENER CATÁLOGOS - RESPONSABLES DE LABORATORIO
// =====================================================

/**
 * Obtiene la lista de responsables de laboratorio
 *
 * @returns Lista de responsables
 */
export async function getResponsablesLaboratorio(): Promise<
  ActionResponse<{ id_responsable_labo: string; nombre_responsable: string }[]>
> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('responsables_laboratorio')
      .select('id_responsable_labo, nombre_responsable')
      .is('deleted_at', null)
      .order('nombre_responsable', { ascending: true })

    if (error) {
      console.error('Error obteniendo responsables de laboratorio:', error)
      return {
        success: false,
        error: 'No se pudieron obtener los responsables de laboratorio',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error en getResponsablesLaboratorio:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener responsables de laboratorio',
    }
  }
}
