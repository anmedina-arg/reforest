'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  registrarEntradaSchema,
  getStockByInsumoSchema,
  movimientosFiltersSchema,
  type RegistrarEntradaInput,
  type GetStockByInsumoInput,
  type MovimientosFiltersInput,
} from '@/lib/validations/stock'
import type {
  StockInsumo,
  MovimientoWithRelations,
  MovimientoLaboratorio,
  PaginatedResponse,
} from '@/types/entities'
import { convertToBaseUnit, convertUnit, getTipoUnidad } from '@/lib/utils/units'

// =====================================================
// RESPONSE TYPES
// =====================================================

type ActionResponse<T = void> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never }

// =====================================================
// 1. GET STOCK ACTUAL
// =====================================================

/**
 * Calcula el stock actual de todos los insumos activos
 * Suma todos los movimientos positivos y negativos por insumo
 */
export async function getStockActual(): Promise<ActionResponse<StockInsumo[]>> {
  try {
    const supabase = await createClient()

    // Obtener todos los insumos activos
    const { data: insumos, error: insumosError } = await supabase
      .from('insumo')
      .select(
        `
        id_insumo,
        nombre,
        nombre_cientifico,
        especie,
        tipo_insumo:id_tipo_insumo(
          id_tipo_insumo,
          descripcion_tipo_insumo
        ),
        unidad:unidad_medida!inner(
          id_unidad,
          nombre,
          abreviatura
        )
      `
      )
      .is('deleted_at', null)
      .order('nombre', { ascending: true })

    if (insumosError) {
      console.error('Error obteniendo insumos:', insumosError)
      return {
        success: false,
        error: 'No se pudieron obtener los insumos',
      }
    }

    if (!insumos || insumos.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    // Para cada insumo, calcular su stock actual sumando movimientos
    const stockPromises = insumos.map(async (insumo: any) => {
      const { data: movimientos, error: movimientosError } = await supabase
        .from('movimiento_laboratorio')
        .select('cantidad, unidad_medida')
        .eq('id_insumo', insumo.id_insumo)
        .is('deleted_at', null)

      if (movimientosError) {
        console.error(`Error calculando stock para insumo ${insumo.id_insumo}:`, movimientosError)
        return null
      }

      // Unidad oficial del insumo (para retornar el stock en esta unidad)
      const unidadInsumo = insumo.unidad?.abreviatura || insumo.unidad?.nombre || 'unidad'

      // Sumar movimientos convirtiendo cada uno a unidad base
      let stockEnBase = 0

      if (movimientos && movimientos.length > 0) {
        try {
          for (const mov of movimientos) {
            const cantidad = mov.cantidad || 0
            const unidadMov = mov.unidad_medida || unidadInsumo

            // Convertir a unidad base (gramos, mililitros o unidades)
            const cantidadBase = convertToBaseUnit(cantidad, unidadMov)
            stockEnBase += cantidadBase
          }

          console.log(
            `[getStockActual] Stock calculado para ${insumo.nombre}: ${stockEnBase} (base) = ${convertUnit(stockEnBase, unidadInsumo, unidadInsumo)} ${unidadInsumo}`
          )
        } catch (error) {
          console.error(
            `[getStockActual] Error convirtiendo unidades para insumo ${insumo.nombre}:`,
            error
          )
          // Si hay error, usar suma directa como fallback
          stockEnBase = movimientos.reduce((sum, mov) => sum + (mov.cantidad || 0), 0)
        }
      }

      // Convertir el stock de unidad base a la unidad del insumo para mostrar
      let stockActual = 0
      try {
        // Determinar la unidad base según el tipo de unidad del insumo
        const tipo = getTipoUnidad(unidadInsumo)
        const unidadBase = tipo === 'peso' ? 'g' : tipo === 'volumen' ? 'ml' : 'u'

        // Convertir de unidad base a unidad del insumo
        stockActual = convertUnit(stockEnBase, unidadBase, unidadInsumo)
      } catch {
        // Si falla conversión, usar valor en base
        stockActual = stockEnBase
      }

      return {
        insumo: insumo,
        stock_actual: Math.round(stockActual * 100) / 100, // Redondear a 2 decimales
        unidad_medida: unidadInsumo,
      } as StockInsumo
    })

    const stockResults = await Promise.all(stockPromises)
    const stockData = stockResults.filter((stock) => stock !== null) as StockInsumo[]

    return {
      success: true,
      data: stockData,
    }
  } catch (error) {
    console.error('Error en getStockActual:', error)
    return {
      success: false,
      error: 'Error inesperado al calcular el stock',
    }
  }
}

// =====================================================
// 2. GET STOCK BY INSUMO
// =====================================================

/**
 * Calcula el stock actual de un insumo específico
 */
export async function getStockByInsumo(
  input: GetStockByInsumoInput
): Promise<ActionResponse<StockInsumo>> {
  try {
    const supabase = await createClient()

    // Validar input
    const validated = getStockByInsumoSchema.safeParse(input)

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Datos inválidos',
      }
    }

    const { id_insumo } = validated.data

    // Obtener el insumo
    const { data: insumo, error: insumoError } = await supabase
      .from('insumo')
      .select(
        `
        id_insumo,
        nombre,
        nombre_cientifico,
        especie,
        tipo_insumo:id_tipo_insumo(
          id_tipo_insumo,
          descripcion_tipo_insumo
        ),
        unidad:unidad_medida!inner(
          id_unidad,
          nombre,
          abreviatura
        )
      `
      )
      .eq('id_insumo', id_insumo)
      .is('deleted_at', null)
      .single()

    if (insumoError || !insumo) {
      return {
        success: false,
        error: 'Insumo no encontrado',
      }
    }

    // Calcular stock actual sumando todos los movimientos con conversión de unidades
    const { data: movimientos, error: movimientosError } = await supabase
      .from('movimiento_laboratorio')
      .select('cantidad, unidad_medida')
      .eq('id_insumo', id_insumo)
      .is('deleted_at', null)

    if (movimientosError) {
      console.error('[getStockByInsumo] Error calculando stock:', movimientosError)
      return {
        success: false,
        error: 'No se pudo calcular el stock del insumo',
      }
    }

    // Unidad oficial del insumo (para retornar el stock en esta unidad)
    const unidadInsumo =
      (insumo as any).unidad?.abreviatura || (insumo as any).unidad?.nombre || 'unidad'

    // Sumar movimientos convirtiendo cada uno a unidad base
    let stockEnBase = 0

    if (movimientos && movimientos.length > 0) {
      try {
        for (const mov of movimientos) {
          const cantidad = mov.cantidad || 0
          const unidadMov = mov.unidad_medida || unidadInsumo

          // Convertir a unidad base (gramos, mililitros o unidades)
          const cantidadBase = convertToBaseUnit(cantidad, unidadMov)
          stockEnBase += cantidadBase

          console.log(`[getStockByInsumo] Movimiento: ${cantidad} ${unidadMov} = ${cantidadBase} (base)`)
        }

        console.log(
          `[getStockByInsumo] Stock total: ${stockEnBase} (base) para ${(insumo as any).nombre}`
        )
      } catch (error) {
        console.error(`[getStockByInsumo] Error convirtiendo unidades:`, error)
        // Si hay error, usar suma directa como fallback
        stockEnBase = movimientos.reduce((sum, mov) => sum + (mov.cantidad || 0), 0)
      }
    }

    // Convertir el stock de unidad base a la unidad del insumo para mostrar
    let stockActual = 0
    try {
      // Determinar la unidad base según el tipo de unidad del insumo
      const tipo = getTipoUnidad(unidadInsumo)
      const unidadBase = tipo === 'peso' ? 'g' : tipo === 'volumen' ? 'ml' : 'u'

      // Convertir de unidad base a unidad del insumo
      stockActual = convertUnit(stockEnBase, unidadBase, unidadInsumo)
      console.log(`[getStockByInsumo] Stock en unidad del insumo: ${stockActual} ${unidadInsumo}`)
    } catch (error) {
      console.error(`[getStockByInsumo] Error convirtiendo a unidad del insumo:`, error)
      // Si falla conversión, usar valor en base
      stockActual = stockEnBase
    }

    return {
      success: true,
      data: {
        insumo: insumo as any,
        stock_actual: Math.round(stockActual * 100) / 100, // Redondear a 2 decimales
        unidad_medida: unidadInsumo,
      },
    }
  } catch (error) {
    console.error('Error en getStockByInsumo:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener el stock',
    }
  }
}

// =====================================================
// 3. REGISTRAR ENTRADA
// =====================================================

/**
 * Registra una entrada de stock (movimiento positivo)
 * Crea un movimiento con tipo 'entrada_compra'
 */
export async function registrarEntrada(
  input: RegistrarEntradaInput
): Promise<ActionResponse<MovimientoLaboratorio>> {
  try {
    const supabase = await createClient()

    // Validar input
    const validated = registrarEntradaSchema.safeParse(input)

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Datos inválidos',
      }
    }

    const { id_insumo, cantidad, unidad_medida, fecha, observacion } = validated.data

    // Verificar que el insumo existe
    const { data: insumo, error: insumoError } = await supabase
      .from('insumo')
      .select('id_insumo')
      .eq('id_insumo', id_insumo)
      .is('deleted_at', null)
      .single()

    if (insumoError || !insumo) {
      return {
        success: false,
        error: 'Insumo no encontrado',
      }
    }

    // Buscar o crear el tipo de movimiento 'Entrada/Compra'
    let { data: tipoMovimiento, error: tipoMovError } = await supabase
      .from('tipo_movimiento')
      .select('id_tipo_movimiento')
      .or('descripcion_movimiento.ilike.%entrada%,descripcion_movimiento.ilike.%compra%')
      .is('deleted_at', null)
      .limit(1)
      .single()

    // Si no existe, crearlo
    if (tipoMovError || !tipoMovimiento) {
      const { data: nuevoTipo, error: crearTipoError } = await supabase
        .from('tipo_movimiento')
        .insert({ descripcion_movimiento: 'Entrada/Compra' })
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

    // Crear el movimiento de entrada (cantidad positiva)
    const { data: nuevoMovimiento, error: createError } = await supabase
      .from('movimiento_laboratorio')
      .insert({
        id_insumo,
        cantidad,
        unidad_medida,
        id_tipo_movimiento: tipoMovimiento.id_tipo_movimiento,
        fecha,
        observacion,
      })
      .select()
      .single()

    if (createError || !nuevoMovimiento) {
      console.error('Error creando movimiento:', createError)
      return {
        success: false,
        error: 'No se pudo registrar la entrada',
      }
    }

    // Revalidar rutas
    revalidatePath('/stock')
    revalidatePath('/insumos')

    return {
      success: true,
      data: nuevoMovimiento as MovimientoLaboratorio,
    }
  } catch (error) {
    console.error('Error en registrarEntrada:', error)
    return {
      success: false,
      error: 'Error inesperado al registrar la entrada',
    }
  }
}

// =====================================================
// 4. GET MOVIMIENTOS
// =====================================================

/**
 * Obtiene el historial de movimientos con filtros y paginación
 * Incluye relaciones con insumo y tipo_movimiento
 */
export async function getMovimientos(
  filters?: MovimientosFiltersInput
): Promise<ActionResponse<PaginatedResponse<MovimientoWithRelations>>> {
  try {
    const supabase = await createClient()

    // Validar filtros
    const validatedFilters = movimientosFiltersSchema.safeParse(filters || {})

    if (!validatedFilters.success) {
      return {
        success: false,
        error: validatedFilters.error.issues[0]?.message || 'Filtros inválidos',
      }
    }

    const { id_insumo, fecha_desde, fecha_hasta, page, pageSize } = validatedFilters.data

    // Construir query base
    let query = supabase
      .from('movimiento_laboratorio')
      .select(
        `
        *,
        insumo:id_insumo(
          id_insumo,
          nombre,
          nombre_cientifico,
          tipo_insumo:id_tipo_insumo(
            id_tipo_insumo,
            descripcion_tipo_insumo
          )
        ),
        tipo_movimiento:id_tipo_movimiento(
          id_tipo_movimiento,
          descripcion_movimiento
        ),
        tipo_consumo:id_consumo(
          id_consumo,
          descripcion_consumo
        )
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })

    // Aplicar filtro de insumo si existe
    if (id_insumo) {
      query = query.eq('id_insumo', id_insumo)
    }

    // Aplicar filtro de fecha desde
    if (fecha_desde) {
      query = query.gte('fecha', fecha_desde)
    }

    // Aplicar filtro de fecha hasta
    if (fecha_hasta) {
      query = query.lte('fecha', fecha_hasta)
    }

    // Aplicar paginación
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error obteniendo movimientos:', error)
      return {
        success: false,
        error: 'No se pudieron obtener los movimientos',
      }
    }

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: {
        data: (data || []) as MovimientoWithRelations[],
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error en getMovimientos:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener movimientos',
    }
  }
}
