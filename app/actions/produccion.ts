'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createProduccionSchema,
  produccionFiltersSchema,
  iniciarProduccionSchema,
  completarProduccionSchema,
  cancelarProduccionSchema,
  type CreateProduccionInput,
  type ProduccionFiltersInput,
  type IniciarProduccionInput,
  type CompletarProduccionInput,
  type CancelarProduccionInput,
} from '@/lib/validations/produccion'
import type {
  ProduccionWithRelations,
  ProduccionISeeds,
  ProduccionInsumoWithRelations,
  Disponibilidad,
} from '@/types/entities'

// =====================================================
// RESPONSE TYPES
// =====================================================

type ActionResponse<T = void> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never }

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// =====================================================
// 1. GET PRODUCCIONES BY PROYECTO
// =====================================================

/**
 * Obtiene todas las producciones de un proyecto
 * Con relaciones: receta, estado_produccion
 */
export async function getProduccionesByProyecto(
  proyectoId: string,
  filters?: Omit<ProduccionFiltersInput, 'id_proyecto'>
): Promise<ActionResponse<PaginatedResponse<ProduccionWithRelations>>> {
  try {
    const supabase = await createClient()

    // Validar filtros
    const validatedFilters = produccionFiltersSchema.safeParse({
      ...filters,
      id_proyecto: proyectoId,
    })

    if (!validatedFilters.success) {
      return {
        success: false,
        error: validatedFilters.error.issues[0]?.message || 'Filtros inválidos',
      }
    }

    const { page, pageSize, id_estado_produccion } = validatedFilters.data

    // Construir query base
    let query = supabase
      .from('produccion_iseeds')
      .select(
        `
        *,
        receta!id_receta(
          id_receta,
          nombre,
          descripcion
        ),
        estado_produccion!id_estado_produccion(
          id_estado_produccion,
          nombre
        )
      `,
        { count: 'exact' }
      )
      .eq('id_proyecto', proyectoId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Aplicar filtro de estado si existe
    if (id_estado_produccion) {
      query = query.eq('id_estado_produccion', id_estado_produccion)
    }

    // Aplicar paginación
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error obteniendo producciones:', error)
      return {
        success: false,
        error: 'No se pudieron obtener las producciones',
      }
    }

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: {
        data: (data || []) as ProduccionWithRelations[],
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error en getProduccionesByProyecto:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener producciones',
    }
  }
}

// =====================================================
// 2. GET ALL PRODUCCIONES (SIN FILTRO DE PROYECTO)
// =====================================================

/**
 * Obtiene todas las producciones del sistema
 * Con relaciones: proyecto, receta, estado_produccion
 * Permite filtrado por estado y paginación
 */
export async function getAllProducciones(
  filters?: {
    page?: number
    pageSize?: number
    id_estado_produccion?: string
  }
): Promise<ActionResponse<PaginatedResponse<ProduccionWithRelations>>> {
  try {
    const supabase = await createClient()

    // Valores por defecto
    const page = filters?.page || 1
    const pageSize = filters?.pageSize || 10
    const id_estado_produccion = filters?.id_estado_produccion

    // Construir query base
    let query = supabase
      .from('produccion_iseeds')
      .select(
        `
        *,
        proyecto!produccion_iseeds_id_proyecto_fkey(
          id_proyecto,
          nombre_del_proyecto,
          codigo_proyecto
        ),
        receta!id_receta(
          id_receta,
          nombre,
          descripcion
        ),
        estado_produccion!id_estado_produccion(
          id_estado_produccion,
          nombre
        )
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .order('fecha_inicio', { ascending: false })

    // Aplicar filtro de estado si existe
    if (id_estado_produccion) {
      query = query.eq('id_estado_produccion', id_estado_produccion)
    }

    // Aplicar paginación
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error obteniendo producciones:', error)
      return {
        success: false,
        error: 'No se pudieron obtener las producciones',
      }
    }

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: {
        data: (data || []) as ProduccionWithRelations[],
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error en getAllProducciones:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener producciones',
    }
  }
}

// =====================================================
// 3. GET PRODUCCION (DETALLE COMPLETO)
// =====================================================

/**
 * Obtiene el detalle completo de una producción
 * Incluye: receta, insumos consumidos, disponibilidades generadas
 */
export async function getProduccion(
  id: string
): Promise<ActionResponse<ProduccionWithRelations>> {
  try {
    const supabase = await createClient()

    // Obtener la producción básica
    const { data: produccion, error: produccionError } = await supabase
      .from('produccion_iseeds')
      .select(
        `
        *,
        receta!id_receta(
          id_receta,
          nombre,
          descripcion
        ),
        estado_produccion!id_estado_produccion(
          id_estado_produccion,
          nombre
        )
      `
      )
      .eq('id_produccion', id)
      .is('deleted_at', null)
      .single()

    if (produccionError) {
      console.error('Error obteniendo producción:', produccionError)
      return {
        success: false,
        error: 'No se pudo obtener la producción',
      }
    }

    if (!produccion) {
      return {
        success: false,
        error: 'Producción no encontrada',
      }
    }

    // Obtener insumos consumidos
    const { data: insumosData, error: insumosError } = await supabase
      .from('produccion_insumo')
      .select(
        `
        *,
        insumo:insumo!produccion_insumo_id_insumo_fkey(
          id_insumo,
          nombre,
          nombre_cientifico,
          tipo_insumo:tipo_insumo!insumo_id_tipo_insumo_fkey(
            id_tipo_insumo,
            descripcion_tipo_insumo
          )
        ),
        unidad:unidad_medida!produccion_insumo_unidad_medida_fkey(
          id_unidad,
          nombre,
          abreviatura
        )
      `
      )
      .eq('id_produccion', id)
      .is('deleted_at', null)

    if (insumosError) {
      console.error('Error obteniendo insumos de producción:', insumosError)
      return {
        success: false,
        error: 'No se pudieron obtener los insumos de la producción',
      }
    }

    // Obtener disponibilidades generadas
    const { data: disponibilidades, error: disponibilidadesError } = await supabase
      .from('disponibilidad')
      .select('*')
      .eq('id_produccion', id)
      .is('deleted_at', null)

    if (disponibilidadesError) {
      console.error('Error obteniendo disponibilidades:', disponibilidadesError)
      // No es crítico, continuamos sin disponibilidades
    }

    // Construir respuesta completa
    const produccionCompleta: ProduccionWithRelations = {
      ...produccion,
      insumos: (insumosData || []) as ProduccionInsumoWithRelations[],
      disponibilidades: (disponibilidades || []) as Disponibilidad[],
    }

    return {
      success: true,
      data: produccionCompleta,
    }
  } catch (error) {
    console.error('Error en getProduccion:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener la producción',
    }
  }
}

// =====================================================
// 3. CREATE PRODUCCION
// =====================================================

/**
 * Crea una nueva producción en estado 'planificada'
 * Registra los insumos según la receta, pero NO descuenta stock aún
 */
export async function createProduccion(
  input: CreateProduccionInput
): Promise<ActionResponse<ProduccionISeeds>> {
  try {
    const supabase = await createClient()

    // Validar input
    const validated = createProduccionSchema.safeParse(input)

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Datos inválidos',
      }
    }

    const { id_proyecto, id_receta, cantidad_planificada, fecha_inicio } = validated.data

    // Verificar que el proyecto existe
    const { data: proyecto, error: proyectoError } = await supabase
      .from('proyecto')
      .select('id_proyecto')
      .eq('id_proyecto', id_proyecto)
      .is('deleted_at', null)
      .single()

    if (proyectoError || !proyecto) {
      return {
        success: false,
        error: 'Proyecto no encontrado',
      }
    }

    // Verificar que la receta existe
    const { data: receta, error: recetaError } = await supabase
      .from('receta')
      .select('id_receta')
      .eq('id_receta', id_receta)
      .is('deleted_at', null)
      .single()

    if (recetaError || !receta) {
      return {
        success: false,
        error: 'Receta no encontrada',
      }
    }

    // Obtener el estado 'planificada'
    const { data: estadoPlanificada, error: estadoError } = await supabase
      .from('estado_produccion')
      .select('id_estado_produccion')
      .ilike('nombre', '%planificada%')
      .is('deleted_at', null)
      .single()

    if (estadoError || !estadoPlanificada) {
      return {
        success: false,
        error: 'Estado "planificada" no encontrado en el sistema',
      }
    }

    // Crear la producción con cantidad_planificada
    const { data: nuevaProduccion, error: createError } = await supabase
      .from('produccion_iseeds')
      .insert({
        id_proyecto,
        id_receta,
        cantidad_planificada,
        fecha_inicio,
        id_estado_produccion: estadoPlanificada.id_estado_produccion,
      })
      .select()
      .single()

    if (createError || !nuevaProduccion) {
      console.error('Error creando producción:', createError)
      return {
        success: false,
        error: 'No se pudo crear la producción',
      }
    }

    // Revalidar rutas
    revalidatePath('/proyectos')
    revalidatePath(`/proyectos/${id_proyecto}`)
    revalidatePath('/produccion')

    return {
      success: true,
      data: nuevaProduccion as ProduccionISeeds,
    }
  } catch (error) {
    console.error('Error en createProduccion:', error)
    return {
      success: false,
      error: 'Error inesperado al crear la producción',
    }
  }
}

// =====================================================
// 4. INICIAR PRODUCCION
// =====================================================

/**
 * Inicia una producción: cambia estado a 'en_curso'
 * El descuento de stock se realiza al completar la producción
 */
export async function iniciarProduccion(
  input: IniciarProduccionInput
): Promise<ActionResponse<ProduccionISeeds>> {
  try {
    const supabase = await createClient()

    // Validar input
    const validated = iniciarProduccionSchema.safeParse(input)

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Datos inválidos',
      }
    }

    const { id_produccion } = validated.data

    // Obtener la producción con su estado
    const { data: produccion, error: produccionError } = await supabase
      .from('produccion_iseeds')
      .select(
        `
        *,
        estado_produccion!id_estado_produccion(
          id_estado_produccion,
          nombre
        )
      `
      )
      .eq('id_produccion', id_produccion)
      .is('deleted_at', null)
      .single()

    if (produccionError || !produccion) {
      return {
        success: false,
        error: 'Producción no encontrada',
      }
    }

    // Validar que esté en estado 'planificada'
    const estadoNombre = produccion.estado_produccion?.nombre?.toLowerCase() || ''
    if (!estadoNombre.includes('planificada')) {
      return {
        success: false,
        error: `No se puede iniciar: la producción está en estado "${produccion.estado_produccion?.nombre}". Solo se pueden iniciar producciones planificadas.`,
      }
    }

    // Obtener el estado 'en_curso'
    const { data: estadoEnCurso, error: estadoError } = await supabase
      .from('estado_produccion')
      .select('id_estado_produccion')
      .ilike('nombre', '%curso%')
      .is('deleted_at', null)
      .single()

    if (estadoError || !estadoEnCurso) {
      return {
        success: false,
        error: 'Estado "en_curso" no encontrado en el sistema',
      }
    }

    // Cambiar estado de la producción a 'en_curso'
    const { error: updateError } = await supabase
      .from('produccion_iseeds')
      .update({ id_estado_produccion: estadoEnCurso.id_estado_produccion })
      .eq('id_produccion', id_produccion)

    if (updateError) {
      console.error('Error actualizando estado de producción:', updateError)
      return {
        success: false,
        error: 'No se pudo cambiar el estado de la producción',
      }
    }

    // Obtener la producción actualizada
    const { data: produccionActualizada, error: getError } = await supabase
      .from('produccion_iseeds')
      .select('*')
      .eq('id_produccion', id_produccion)
      .single()

    if (getError || !produccionActualizada) {
      console.error('Error obteniendo producción actualizada:', getError)
      // La producción se inició correctamente, solo falló al obtenerla
    }

    // Revalidar rutas
    revalidatePath('/proyectos')
    revalidatePath(`/proyectos/${produccion.id_proyecto}`)
    revalidatePath('/produccion')

    return {
      success: true,
      data: (produccionActualizada || produccion) as ProduccionISeeds,
    }
  } catch (error) {
    console.error('Error en iniciarProduccion:', error)
    return {
      success: false,
      error: 'Error inesperado al iniciar la producción',
    }
  }
}

// =====================================================
// 5. COMPLETAR PRODUCCION
// =====================================================

/**
 * Completa una producción:
 * - Guarda cantidad_real en produccion_iseeds
 * - Lee receta completa y calcula cantidades: cantidad_receta × cantidad_real
 * - Valida stock suficiente
 * - Crea movimientos negativos de stock con observación legible
 * - Genera disponibilidad con cantidad_real
 * - Cambia estado a 'completada'
 */
export async function completarProduccion(
  input: CompletarProduccionInput
): Promise<ActionResponse<ProduccionISeeds>> {
  try {
    const supabase = await createClient()

    // Validar input
    const validated = completarProduccionSchema.safeParse(input)

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Datos inválidos',
      }
    }

    const { id_produccion, cantidad_real, fecha_fin } = validated.data

    console.log('[completarProduccion] 1. Input validado:', { id_produccion, cantidad_real, fecha_fin })

    // Obtener la producción con relaciones completas
    const { data: produccion, error: produccionError } = await supabase
      .from('produccion_iseeds')
      .select(
        `
        *,
        proyecto:id_proyecto(
          id_proyecto,
          nombre_del_proyecto,
          codigo_proyecto
        ),
        receta:id_receta(
          id_receta,
          nombre,
          descripcion
        ),
        estado_produccion:id_estado_produccion(
          id_estado_produccion,
          nombre
        )
      `
      )
      .eq('id_produccion', id_produccion)
      .is('deleted_at', null)
      .single()

    console.log('[completarProduccion] 2. Query ejecutada')
    console.log('[completarProduccion] 3. Resultado:', produccion)
    console.log('[completarProduccion] 4. Error:', produccionError)

    if (produccionError || !produccion) {
      console.error('[completarProduccion] 5. Producción no encontrada')
      console.error('[completarProduccion] - Error completo:', JSON.stringify(produccionError, null, 2))
      console.error('[completarProduccion] - ID buscado:', id_produccion)

      // Intento de búsqueda más simple para diagnóstico
      const { data: produccionSimple, error: errorSimple } = await supabase
        .from('produccion_iseeds')
        .select('*')
        .eq('id_produccion', id_produccion)
        .single()

      console.error('[completarProduccion] - Búsqueda simple (sin joins):', {
        encontrada: !!produccionSimple,
        error: errorSimple,
        data: produccionSimple,
      })

      return {
        success: false,
        error: `Producción no encontrada. ID: ${id_produccion}. Error: ${produccionError?.message || 'Desconocido'}`,
      }
    }

    console.log('[completarProduccion] 6. Producción encontrada:', {
      id: produccion.id_produccion,
      proyecto: produccion.proyecto?.nombre_del_proyecto || 'Sin nombre',
      receta: produccion.receta?.nombre || 'Sin receta',
      estado: produccion.estado_produccion?.nombre || 'Sin estado',
      id_estado_produccion: produccion.id_estado_produccion,
    })

    // Validar que esté en estado 'en_curso'
    const estadoNombre = produccion.estado_produccion?.nombre?.toLowerCase() || ''
    console.log('[completarProduccion] 7. Validando estado:', {
      estadoNombre,
      includesCurso: estadoNombre.includes('curso'),
    })

    if (!estadoNombre.includes('curso')) {
      console.error('[completarProduccion] 8. Estado inválido:', produccion.estado_produccion?.nombre)
      return {
        success: false,
        error: `No se puede completar: la producción está en estado "${produccion.estado_produccion?.nombre}". Solo se pueden completar producciones en curso.`,
      }
    }

    // Validar que tenga receta
    if (!produccion.id_receta) {
      console.error('[completarProduccion] 9. Sin receta asignada')
      return {
        success: false,
        error: 'La producción no tiene una receta asignada',
      }
    }

    console.log('[completarProduccion] 10. Validaciones pasadas, continuando...')

    // Obtener los insumos de la receta con cantidades y unidades
    const { data: recetaInsumos, error: insumosError } = await supabase
      .from('receta_insumo')
      .select(
        `
        id_insumo,
        cantidad_teorica,
        unidad:unidad_medida!inner(
          id_unidad,
          nombre,
          abreviatura
        ),
        insumo:id_insumo(
          id_insumo,
          nombre
        )
      `
      )
      .eq('id_receta', produccion.id_receta)
      .is('deleted_at', null)

    if (insumosError) {
      console.error('Error obteniendo insumos de receta:', insumosError)
      return {
        success: false,
        error: 'No se pudieron obtener los insumos de la receta',
      }
    }

    if (!recetaInsumos || recetaInsumos.length === 0) {
      return {
        success: false,
        error: 'La receta no tiene insumos registrados',
      }
    }

    // Calcular cantidades necesarias: cantidad_teorica × cantidad_real
    const insumosCalculados = recetaInsumos.map((ri: any) => ({
      id_insumo: ri.id_insumo,
      nombre_insumo: ri.insumo?.nombre || 'Sin nombre',
      cantidad_necesaria: (ri.cantidad_teorica || 0) * cantidad_real,
      unidad_medida: ri.unidad?.abreviatura || ri.unidad?.nombre || 'unidad',
    }))

    // Validar stock suficiente para cada insumo
    const stockInsuficiente: string[] = []

    for (const insumo of insumosCalculados) {
      // Calcular stock actual sumando todos los movimientos
      const { data: movimientos, error: movimientosError } = await supabase
        .from('movimiento_laboratorio')
        .select('cantidad')
        .eq('id_insumo', insumo.id_insumo)
        .is('deleted_at', null)

      if (movimientosError) {
        console.error('Error calculando stock:', movimientosError)
        return {
          success: false,
          error: `No se pudo calcular el stock del insumo ${insumo.nombre_insumo}`,
        }
      }

      const stockActual = movimientos?.reduce((sum, mov) => sum + (mov.cantidad || 0), 0) || 0

      // Verificar si hay stock suficiente
      if (stockActual < insumo.cantidad_necesaria) {
        stockInsuficiente.push(
          `${insumo.nombre_insumo}: disponible ${stockActual}, necesario ${insumo.cantidad_necesaria} ${insumo.unidad_medida}`
        )
      }
    }

    // Si hay stock insuficiente, no completar
    if (stockInsuficiente.length > 0) {
      return {
        success: false,
        error: `Stock insuficiente para completar la producción:\n${stockInsuficiente.join('\n')}`,
      }
    }

    // Obtener el estado 'completada'
    const { data: estadoCompletada, error: estadoError } = await supabase
      .from('estado_produccion')
      .select('id_estado_produccion')
      .ilike('nombre', '%completada%')
      .is('deleted_at', null)
      .single()

    if (estadoError || !estadoCompletada) {
      return {
        success: false,
        error: 'Estado "completada" no encontrado en el sistema',
      }
    }

    // Obtener o crear el tipo de movimiento 'Consumo Producción'
    let { data: tipoMovimiento, error: tipoMovError } = await supabase
      .from('tipo_movimiento')
      .select('id_tipo_movimiento')
      .or('descripcion_movimiento.ilike.%consumo%,descripcion_movimiento.ilike.%produccion%')
      .is('deleted_at', null)
      .limit(1)
      .single()

    if (tipoMovError || !tipoMovimiento) {
      const { data: nuevoTipo, error: crearTipoError } = await supabase
        .from('tipo_movimiento')
        .insert({ descripcion_movimiento: 'Consumo Producción' })
        .select('id_tipo_movimiento')
        .single()

      if (crearTipoError || !nuevoTipo) {
        return {
          success: false,
          error: 'No se pudo crear el tipo de movimiento',
        }
      }

      tipoMovimiento = nuevoTipo
    }

    // Calcular fecha_fin (usar la proporcionada o la fecha actual)
    const fechaFinFinal = fecha_fin || new Date().toISOString().split('T')[0]

    // Crear observación legible
    const nombreProyecto = produccion.proyecto?.nombre_del_proyecto || 'Sin nombre'
    const nombreReceta = produccion.receta?.nombre || 'Sin nombre'
    const observacion = `Producción ${nombreReceta} - Proyecto ${nombreProyecto} - ${fechaFinFinal}`

    // Crear movimientos negativos para descontar stock
    const movimientosData = insumosCalculados.map((insumo) => ({
      id_insumo: insumo.id_insumo,
      cantidad: -insumo.cantidad_necesaria, // Negativo para descontar
      unidad_medida: insumo.unidad_medida,
      id_tipo_movimiento: tipoMovimiento.id_tipo_movimiento,
      fecha: fechaFinFinal,
      observacion,
    }))

    const { error: movimientosError } = await supabase
      .from('movimiento_laboratorio')
      .insert(movimientosData)

    if (movimientosError) {
      console.error('Error creando movimientos de stock:', movimientosError)
      return {
        success: false,
        error: 'No se pudo descontar el stock de los insumos',
      }
    }

    // Actualizar la producción: guardar cantidad_real, cambiar estado y fecha_fin
    const { error: updateError } = await supabase
      .from('produccion_iseeds')
      .update({
        cantidad_real,
        id_estado_produccion: estadoCompletada.id_estado_produccion,
        fecha_fin: fechaFinFinal,
      })
      .eq('id_produccion', id_produccion)

    if (updateError) {
      console.error('Error actualizando producción:', updateError)
      // Intentar revertir los movimientos creados
      await supabase
        .from('movimiento_laboratorio')
        .delete()
        .eq('observacion', observacion)

      return {
        success: false,
        error: 'No se pudo actualizar la producción',
      }
    }

    // Crear registro en disponibilidad
    const { error: disponibilidadError } = await supabase
      .from('disponibilidad')
      .insert({
        id_produccion,
        cantidad: cantidad_real,
        fecha_produccion: fechaFinFinal,
      })

    if (disponibilidadError) {
      console.error('Error creando disponibilidad:', disponibilidadError)
      // Intentar revertir cambios
      await supabase
        .from('movimiento_laboratorio')
        .delete()
        .eq('observacion', observacion)

      await supabase
        .from('produccion_iseeds')
        .update({
          cantidad_real: null,
          id_estado_produccion: produccion.id_estado_produccion,
          fecha_fin: produccion.fecha_fin,
        })
        .eq('id_produccion', id_produccion)

      return {
        success: false,
        error: 'No se pudo registrar la disponibilidad de iSeeds',
      }
    }

    // Obtener la producción actualizada
    const { data: produccionActualizada, error: getError } = await supabase
      .from('produccion_iseeds')
      .select('*')
      .eq('id_produccion', id_produccion)
      .single()

    if (getError || !produccionActualizada) {
      console.error('Error obteniendo producción actualizada:', getError)
      // La producción se completó correctamente, solo falló al obtenerla
    }

    // Revalidar rutas
    revalidatePath('/proyectos')
    revalidatePath(`/proyectos/${produccion.id_proyecto}`)
    revalidatePath('/produccion')

    return {
      success: true,
      data: (produccionActualizada || produccion) as ProduccionISeeds,
    }
  } catch (error) {
    console.error('Error en completarProduccion:', error)
    return {
      success: false,
      error: 'Error inesperado al completar la producción',
    }
  }
}

// =====================================================
// 6. CANCELAR PRODUCCION
// =====================================================

/**
 * Cancela una producción
 * Como el stock solo se descuenta al completar, no es necesario devolver insumos
 */
export async function cancelarProduccion(
  input: CancelarProduccionInput
): Promise<ActionResponse<ProduccionISeeds>> {
  try {
    const supabase = await createClient()

    // Validar input
    const validated = cancelarProduccionSchema.safeParse(input)

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Datos inválidos',
      }
    }

    const { id_produccion, motivo } = validated.data

    // Obtener la producción con su estado
    const { data: produccion, error: produccionError } = await supabase
      .from('produccion_iseeds')
      .select(
        `
        *,
        estado_produccion!id_estado_produccion(
          id_estado_produccion,
          nombre
        )
      `
      )
      .eq('id_produccion', id_produccion)
      .is('deleted_at', null)
      .single()

    if (produccionError || !produccion) {
      return {
        success: false,
        error: 'Producción no encontrada',
      }
    }

    // Validar que no esté ya cancelada o completada
    const estadoNombre = produccion.estado_produccion?.nombre?.toLowerCase() || ''
    if (estadoNombre.includes('cancelada')) {
      return {
        success: false,
        error: 'La producción ya está cancelada',
      }
    }
    if (estadoNombre.includes('completada')) {
      return {
        success: false,
        error: 'No se puede cancelar una producción completada',
      }
    }

    // Obtener el estado 'cancelada'
    const { data: estadoCancelada, error: estadoError } = await supabase
      .from('estado_produccion')
      .select('id_estado_produccion')
      .ilike('nombre', '%cancelada%')
      .is('deleted_at', null)
      .single()

    if (estadoError || !estadoCancelada) {
      return {
        success: false,
        error: 'Estado "cancelada" no encontrado en el sistema',
      }
    }

    // Cambiar estado de la producción a 'cancelada'
    const { error: updateError } = await supabase
      .from('produccion_iseeds')
      .update({ id_estado_produccion: estadoCancelada.id_estado_produccion })
      .eq('id_produccion', id_produccion)

    if (updateError) {
      console.error('Error actualizando estado de producción:', updateError)
      return {
        success: false,
        error: 'No se pudo cancelar la producción',
      }
    }

    // Obtener la producción actualizada
    const { data: produccionActualizada, error: getError } = await supabase
      .from('produccion_iseeds')
      .select('*')
      .eq('id_produccion', id_produccion)
      .single()

    if (getError || !produccionActualizada) {
      console.error('Error obteniendo producción actualizada:', getError)
      // La producción se canceló correctamente, solo falló al obtenerla
    }

    // Revalidar rutas
    revalidatePath('/proyectos')
    revalidatePath(`/proyectos/${produccion.id_proyecto}`)
    revalidatePath('/produccion')

    return {
      success: true,
      data: (produccionActualizada || produccion) as ProduccionISeeds,
    }
  } catch (error) {
    console.error('Error en cancelarProduccion:', error)
    return {
      success: false,
      error: 'Error inesperado al cancelar la producción',
    }
  }
}

// =====================================================
// 7. GET ESTADOS PRODUCCION
// =====================================================

/**
 * Obtiene todos los estados de producción disponibles
 */
export async function getEstadosProduccion(): Promise<
  ActionResponse<{ id_estado_produccion: string; nombre: string }[]>
> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('estado_produccion')
      .select('id_estado_produccion, nombre')
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error obteniendo estados de producción:', error)
      return {
        success: false,
        error: 'No se pudieron obtener los estados de producción',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error en getEstadosProduccion:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener estados de producción',
    }
  }
}
