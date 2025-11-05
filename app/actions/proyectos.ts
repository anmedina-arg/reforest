'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createProyectoSchema,
  updateProyectoSchema,
  proyectoFiltersSchema,
  cambiarEstadoSchema,
  asignarRecetaSchema,
  type CreateProyectoInput,
  type UpdateProyectoInput,
  type ProyectoFilters,
  type CambiarEstadoInput,
  type AsignarRecetaInput,
} from '@/lib/validations/proyecto'
import type { ProyectoWithRelations, PaginatedResponse } from '@/types/entities'

// =====================================================
// TIPOS DE RESPUESTA
// =====================================================

type ActionResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

// =====================================================
// OBTENER LISTA DE PROYECTOS CON FILTROS Y PAGINACIÓN
// =====================================================

/**
 * Obtiene la lista de proyectos con filtros opcionales y paginación
 *
 * @param filters - Filtros opcionales (search, id_cliente, id_estado_proyecto, page, pageSize)
 * @returns Lista paginada de proyectos con sus relaciones
 */
export async function getProyectos(
  filters?: ProyectoFilters
): Promise<ActionResponse<PaginatedResponse<ProyectoWithRelations>>> {
  try {
    // Validar y normalizar filtros
    const validatedFilters = proyectoFiltersSchema.parse(filters || {})
    const { search, id_cliente, id_estado_proyecto } = validatedFilters
    const page = validatedFilters.page || 1
    const pageSize = validatedFilters.pageSize || 10

    const supabase = await createClient()

    // Construir query base con relaciones
    let query = supabase
      .from('proyecto')
      .select(
        `
        *,
        cliente!proyecto_id_cliente_fkey(
          id_cliente,
          nombre_cliente,
          email,
          phone
        ),
        eco_region!proyecto_id_eco_region_fkey(
          id_eco_region,
          nombre
        ),
        estado_proyecto!proyecto_id_estado_proyecto_fkey(
          id_estado_proyecto,
          nombre
        ),
        mix:receta!proyecto_id_mix_fkey(
          id_receta,
          nombre,
          descripcion
        )
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null)

    // Aplicar filtros
    if (id_cliente) {
      query = query.eq('id_cliente', id_cliente)
    }

    if (id_estado_proyecto) {
      query = query.eq('id_estado_proyecto', id_estado_proyecto)
    }

    if (search) {
      query = query.or(
        `nombre_del_proyecto.ilike.%${search}%,codigo_proyecto.ilike.%${search}%,nombre_fantasia.ilike.%${search}%`
      )
    }

    // Calcular offset para paginación
    const offset = (page - 1) * pageSize

    // Aplicar paginación y ordenamiento
    query = query
      .order('nombre_del_proyecto', { ascending: true })
      .range(offset, offset + pageSize - 1)

    // Ejecutar query
    const { data, error, count } = await query

    if (error) {
      console.error('Error obteniendo proyectos:', error)
      return {
        success: false,
        error: 'No se pudieron obtener los proyectos',
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
    console.error('Error en getProyectos:', error)

    // Si es un error de validación de Zod
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: 'Filtros inválidos',
      }
    }

    return {
      success: false,
      error: 'Error inesperado al obtener proyectos',
    }
  }
}

// =====================================================
// OBTENER UN PROYECTO POR ID CON RELACIONES
// =====================================================

/**
 * Obtiene un proyecto específico por su ID con todas sus relaciones
 *
 * @param id - UUID del proyecto
 * @returns Proyecto con sus relaciones: cliente, eco_region, estado, mix
 */
export async function getProyecto(
  id: string
): Promise<ActionResponse<ProyectoWithRelations>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de proyecto requerido',
      }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('proyecto')
      .select(
        `
        *,
        cliente!proyecto_id_cliente_fkey(
          id_cliente,
          nombre_cliente,
          email,
          phone,
          picture
        ),
        eco_region!proyecto_id_eco_region_fkey(
          id_eco_region,
          nombre
        ),
        estado_proyecto!proyecto_id_estado_proyecto_fkey(
          id_estado_proyecto,
          nombre
        ),
        mix:receta!proyecto_id_mix_fkey(
          id_receta,
          nombre,
          descripcion,
          autor
        )
      `
      )
      .eq('id_proyecto', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error obteniendo proyecto:', error)
      return {
        success: false,
        error: 'No se pudo obtener el proyecto',
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Proyecto no encontrado',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error en getProyecto:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener el proyecto',
    }
  }
}

// =====================================================
// CREAR NUEVO PROYECTO
// =====================================================

/**
 * Crea un nuevo proyecto en el sistema
 *
 * @param input - Datos del nuevo proyecto
 * @returns Proyecto creado con sus relaciones
 */
export async function createProyecto(
  input: CreateProyectoInput
): Promise<ActionResponse<ProyectoWithRelations>> {
  try {
    // Validar datos de entrada con Zod
    const validation = createProyectoSchema.safeParse(input)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const validatedData = validation.data

    const supabase = await createClient()

    // Crear el proyecto
    const { data: newProyecto, error: createError } = await supabase
      .from('proyecto')
      .insert({
        nombre_del_proyecto: validatedData.nombre_del_proyecto,
        nombre_fantasia: validatedData.nombre_fantasia || null,
        codigo_proyecto: validatedData.codigo_proyecto || null,
        fecha_inicio: validatedData.fecha_inicio || null,
        fecha_fin: validatedData.fecha_fin || null,
        id_cliente: validatedData.id_cliente || null,
        id_eco_region: validatedData.id_eco_region || null,
        id_estado_proyecto: validatedData.id_estado_proyecto || null,
        id_mix: validatedData.id_mix || null,
        hectareas: validatedData.hectareas || null,
        cantidad_iSeeds: validatedData.cantidad_iSeeds || null,
        poligonos_entregados: validatedData.poligonos_entregados || false,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creando proyecto:', createError)

      // Mensajes de error más amigables
      if (createError.code === '23503') {
        return {
          success: false,
          error: 'Cliente, eco-región, estado o receta no válidos',
        }
      }

      if (createError.code === '23505') {
        return {
          success: false,
          error: 'Ya existe un proyecto con ese código',
        }
      }

      return {
        success: false,
        error: `Error al crear proyecto: ${createError.message}`,
      }
    }

    if (!newProyecto) {
      return {
        success: false,
        error: 'No se pudo crear el proyecto',
      }
    }

    // Obtener el proyecto completo con relaciones
    const proyectoResult = await getProyecto(newProyecto.id_proyecto)

    if (!proyectoResult.success || !proyectoResult.data) {
      return {
        success: false,
        error: 'Proyecto creado pero no se pudieron cargar sus relaciones',
      }
    }

    // Revalidar la ruta de proyectos
    revalidatePath('/proyectos')

    return {
      success: true,
      data: proyectoResult.data,
    }
  } catch (error) {
    console.error('Error en createProyecto:', error)
    return {
      success: false,
      error: 'Error inesperado al crear proyecto',
    }
  }
}

// =====================================================
// ACTUALIZAR PROYECTO EXISTENTE
// =====================================================

/**
 * Actualiza un proyecto existente
 *
 * @param id - UUID del proyecto a actualizar
 * @param input - Datos a actualizar (campos opcionales)
 * @returns Proyecto actualizado con sus relaciones
 */
export async function updateProyecto(
  id: string,
  input: UpdateProyectoInput
): Promise<ActionResponse<ProyectoWithRelations>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de proyecto requerido',
      }
    }

    // Validar datos de entrada con Zod
    const validation = updateProyectoSchema.safeParse(input)

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

    // Verificar que el proyecto existe y no está eliminado
    const { data: existingProyecto, error: checkError } = await supabase
      .from('proyecto')
      .select('id_proyecto')
      .eq('id_proyecto', id)
      .is('deleted_at', null)
      .single()

    if (checkError || !existingProyecto) {
      return {
        success: false,
        error: 'Proyecto no encontrado',
      }
    }

    // Actualizar el proyecto
    const { error: updateError } = await supabase
      .from('proyecto')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id_proyecto', id)

    if (updateError) {
      console.error('Error actualizando proyecto:', updateError)

      // Mensajes de error más amigables
      if (updateError.code === '23503') {
        return {
          success: false,
          error: 'Cliente, eco-región, estado o receta no válidos',
        }
      }

      if (updateError.code === '23505') {
        return {
          success: false,
          error: 'Ya existe un proyecto con ese código',
        }
      }

      return {
        success: false,
        error: `Error al actualizar proyecto: ${updateError.message}`,
      }
    }

    // Obtener el proyecto actualizado con relaciones
    const proyectoResult = await getProyecto(id)

    if (!proyectoResult.success || !proyectoResult.data) {
      return {
        success: false,
        error: 'Proyecto actualizado pero no se pudieron cargar sus relaciones',
      }
    }

    // Revalidar la ruta de proyectos
    revalidatePath('/proyectos')

    return {
      success: true,
      data: proyectoResult.data,
    }
  } catch (error) {
    console.error('Error en updateProyecto:', error)
    return {
      success: false,
      error: 'Error inesperado al actualizar proyecto',
    }
  }
}

// =====================================================
// CAMBIAR ESTADO DEL PROYECTO
// =====================================================

/**
 * Cambia el estado de un proyecto
 *
 * @param input - ID del proyecto y nuevo estado
 * @returns Proyecto actualizado
 */
export async function cambiarEstado(
  input: CambiarEstadoInput
): Promise<ActionResponse<ProyectoWithRelations>> {
  try {
    // Validar datos de entrada con Zod
    const validation = cambiarEstadoSchema.safeParse(input)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const validatedData = validation.data

    const supabase = await createClient()

    // Verificar que el proyecto existe
    const { data: existingProyecto, error: checkError } = await supabase
      .from('proyecto')
      .select('id_proyecto')
      .eq('id_proyecto', validatedData.id_proyecto)
      .is('deleted_at', null)
      .single()

    if (checkError || !existingProyecto) {
      return {
        success: false,
        error: 'Proyecto no encontrado',
      }
    }

    // Verificar que el estado existe
    const { data: existingEstado, error: estadoError } = await supabase
      .from('estado_proyecto')
      .select('id_estado_proyecto')
      .eq('id_estado_proyecto', validatedData.id_estado_proyecto)
      .is('deleted_at', null)
      .single()

    if (estadoError || !existingEstado) {
      return {
        success: false,
        error: 'Estado de proyecto no encontrado',
      }
    }

    // Actualizar el estado del proyecto
    const { error: updateError } = await supabase
      .from('proyecto')
      .update({
        id_estado_proyecto: validatedData.id_estado_proyecto,
        updated_at: new Date().toISOString(),
      })
      .eq('id_proyecto', validatedData.id_proyecto)

    if (updateError) {
      console.error('Error cambiando estado del proyecto:', updateError)
      return {
        success: false,
        error: `Error al cambiar estado: ${updateError.message}`,
      }
    }

    // Obtener el proyecto actualizado con relaciones
    const proyectoResult = await getProyecto(validatedData.id_proyecto)

    if (!proyectoResult.success || !proyectoResult.data) {
      return {
        success: false,
        error: 'Estado actualizado pero no se pudo cargar el proyecto',
      }
    }

    // Revalidar la ruta de proyectos
    revalidatePath('/proyectos')

    return {
      success: true,
      data: proyectoResult.data,
    }
  } catch (error) {
    console.error('Error en cambiarEstado:', error)
    return {
      success: false,
      error: 'Error inesperado al cambiar estado',
    }
  }
}

// =====================================================
// ASIGNAR RECETA (MIX) AL PROYECTO
// =====================================================

/**
 * Asigna una receta (mix) a un proyecto
 *
 * @param input - ID del proyecto e ID de la receta
 * @returns Proyecto actualizado
 */
export async function asignarReceta(
  input: AsignarRecetaInput
): Promise<ActionResponse<ProyectoWithRelations>> {
  try {
    // Validar datos de entrada con Zod
    const validation = asignarRecetaSchema.safeParse(input)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const validatedData = validation.data

    const supabase = await createClient()

    // Verificar que el proyecto existe
    const { data: existingProyecto, error: checkError } = await supabase
      .from('proyecto')
      .select('id_proyecto')
      .eq('id_proyecto', validatedData.id_proyecto)
      .is('deleted_at', null)
      .single()

    if (checkError || !existingProyecto) {
      return {
        success: false,
        error: 'Proyecto no encontrado',
      }
    }

    // Verificar que la receta existe
    const { data: existingReceta, error: recetaError } = await supabase
      .from('receta')
      .select('id_receta')
      .eq('id_receta', validatedData.id_mix)
      .is('deleted_at', null)
      .single()

    if (recetaError || !existingReceta) {
      return {
        success: false,
        error: 'Receta no encontrada',
      }
    }

    // Asignar la receta al proyecto
    const { error: updateError } = await supabase
      .from('proyecto')
      .update({
        id_mix: validatedData.id_mix,
        updated_at: new Date().toISOString(),
      })
      .eq('id_proyecto', validatedData.id_proyecto)

    if (updateError) {
      console.error('Error asignando receta al proyecto:', updateError)
      return {
        success: false,
        error: `Error al asignar receta: ${updateError.message}`,
      }
    }

    // Obtener el proyecto actualizado con relaciones
    const proyectoResult = await getProyecto(validatedData.id_proyecto)

    if (!proyectoResult.success || !proyectoResult.data) {
      return {
        success: false,
        error: 'Receta asignada pero no se pudo cargar el proyecto',
      }
    }

    // Revalidar la ruta de proyectos
    revalidatePath('/proyectos')

    return {
      success: true,
      data: proyectoResult.data,
    }
  } catch (error) {
    console.error('Error en asignarReceta:', error)
    return {
      success: false,
      error: 'Error inesperado al asignar receta',
    }
  }
}

// =====================================================
// OBTENER CATÁLOGOS
// =====================================================

/**
 * Obtiene la lista de estados de proyecto
 *
 * @returns Lista de estados
 */
export async function getEstadosProyecto(): Promise<
  ActionResponse<{ id_estado_proyecto: string; nombre: string }[]>
> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('estado_proyecto')
      .select('id_estado_proyecto, nombre')
      .is('deleted_at', null)
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error obteniendo estados de proyecto:', error)
      return {
        success: false,
        error: 'No se pudieron obtener los estados de proyecto',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error en getEstadosProyecto:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener estados de proyecto',
    }
  }
}

/**
 * Obtiene la lista de eco-regiones
 *
 * @returns Lista de eco-regiones
 */
export async function getEcoRegiones(): Promise<
  ActionResponse<{ id_eco_region: string; nombre: string }[]>
> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('eco_region')
      .select('id_eco_region, nombre')
      .is('deleted_at', null)
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error obteniendo eco-regiones:', error)
      return {
        success: false,
        error: 'No se pudieron obtener las eco-regiones',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error en getEcoRegiones:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener eco-regiones',
    }
  }
}
