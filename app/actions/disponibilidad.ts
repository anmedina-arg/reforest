'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  registrarConsumoSchema,
  getDisponibilidadesByProduccionSchema,
  getDisponibilidadTotalSchema,
  getConsumosDelProyectoSchema,
  calcularDisponibleSchema,
  type RegistrarConsumoInput,
  type GetDisponibilidadesByProduccionInput,
  type GetDisponibilidadTotalInput,
  type GetConsumosDelProyectoInput,
  type CalcularDisponibleInput,
} from '@/lib/validations/disponibilidad'
import type {
  DisponibilidadWithConsumo,
  ConsumoWithRelations,
  ConsumoProyecto,
} from '@/types/entities'

// =====================================================
// RESPONSE TYPES
// =====================================================

type ActionResponse<T = void> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never }

// =====================================================
// 1. GET DISPONIBILIDADES BY PRODUCCION
// =====================================================

/**
 * Lista disponibilidades de una producción con cantidad consumida y disponible
 */
export async function getDisponibilidadesByProduccion(
  input: GetDisponibilidadesByProduccionInput
): Promise<ActionResponse<DisponibilidadWithConsumo[]>> {
  try {
    const supabase = await createClient()

    // Validar input
    const validated = getDisponibilidadesByProduccionSchema.safeParse(input)

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Datos inválidos',
      }
    }

    const { id_produccion } = validated.data

    // Obtener disponibilidades de la producción
    const { data: disponibilidades, error: disponibilidadesError } = await supabase
      .from('disponibilidad')
      .select('*')
      .eq('id_produccion', id_produccion)
      .is('deleted_at', null)
      .order('fecha_produccion', { ascending: false })

    if (disponibilidadesError) {
      console.error('Error obteniendo disponibilidades:', disponibilidadesError)
      return {
        success: false,
        error: 'No se pudieron obtener las disponibilidades',
      }
    }

    if (!disponibilidades || disponibilidades.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    // Para cada disponibilidad, calcular consumo total
    const disponibilidadesConConsumo: DisponibilidadWithConsumo[] = await Promise.all(
      disponibilidades.map(async (disp) => {
        const { data: consumos, error: consumosError } = await supabase
          .from('consumo_proyecto')
          .select('cantidad_consumida')
          .eq('id_disponibilidad', disp.id_disponibilidad)
          .is('deleted_at', null)

        if (consumosError) {
          console.error('Error calculando consumo:', consumosError)
        }

        const cantidadConsumida =
          consumos?.reduce((sum, c) => sum + (c.cantidad_consumida || 0), 0) || 0
        const cantidadDisponible = disp.cantidad - cantidadConsumida

        return {
          ...disp,
          cantidad_consumida: cantidadConsumida,
          cantidad_disponible: cantidadDisponible,
        }
      })
    )

    return {
      success: true,
      data: disponibilidadesConConsumo,
    }
  } catch (error) {
    console.error('Error en getDisponibilidadesByProduccion:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener disponibilidades',
    }
  }
}

// =====================================================
// 2. GET DISPONIBILIDAD TOTAL
// =====================================================

/**
 * Calcula el total de iSeeds disponibles para un proyecto
 * Suma todas las disponibilidades de producciones del proyecto menos los consumos
 */
export async function getDisponibilidadTotal(
  input: GetDisponibilidadTotalInput
): Promise<ActionResponse<{ total: number }>> {
  try {
    const supabase = await createClient()

    // Validar input
    const validated = getDisponibilidadTotalSchema.safeParse(input)

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Datos inválidos',
      }
    }

    const { id_proyecto } = validated.data

    // Obtener todas las producciones del proyecto
    const { data: producciones, error: produccionesError } = await supabase
      .from('produccion_iseeds')
      .select('id_produccion')
      .eq('id_proyecto', id_proyecto)
      .is('deleted_at', null)

    if (produccionesError) {
      console.error('Error obteniendo producciones:', produccionesError)
      return {
        success: false,
        error: 'No se pudieron obtener las producciones del proyecto',
      }
    }

    if (!producciones || producciones.length === 0) {
      return {
        success: true,
        data: { total: 0 },
      }
    }

    const produccionIds = producciones.map((p) => p.id_produccion)

    // Obtener todas las disponibilidades de esas producciones
    const { data: disponibilidades, error: disponibilidadesError } = await supabase
      .from('disponibilidad')
      .select('id_disponibilidad, cantidad')
      .in('id_produccion', produccionIds)
      .is('deleted_at', null)

    if (disponibilidadesError) {
      console.error('Error obteniendo disponibilidades:', disponibilidadesError)
      return {
        success: false,
        error: 'No se pudieron obtener las disponibilidades',
      }
    }

    if (!disponibilidades || disponibilidades.length === 0) {
      return {
        success: true,
        data: { total: 0 },
      }
    }

    // Calcular total producido
    const totalProducido = disponibilidades.reduce((sum, d) => sum + d.cantidad, 0)

    // Obtener todos los consumos del proyecto
    const { data: consumos, error: consumosError } = await supabase
      .from('consumo_proyecto')
      .select('cantidad_consumida')
      .eq('id_proyecto', id_proyecto)
      .is('deleted_at', null)

    if (consumosError) {
      console.error('Error obteniendo consumos:', consumosError)
      // No es crítico, continuar sin consumos
    }

    const totalConsumido =
      consumos?.reduce((sum, c) => sum + (c.cantidad_consumida || 0), 0) || 0

    const totalDisponible = totalProducido - totalConsumido

    return {
      success: true,
      data: { total: totalDisponible },
    }
  } catch (error) {
    console.error('Error en getDisponibilidadTotal:', error)
    return {
      success: false,
      error: 'Error inesperado al calcular disponibilidad total',
    }
  }
}

// =====================================================
// 3. REGISTRAR CONSUMO
// =====================================================

/**
 * Registra un consumo de iSeeds desde una disponibilidad
 * Valida que no se consuma más de lo disponible
 */
export async function registrarConsumo(
  input: RegistrarConsumoInput
): Promise<ActionResponse<ConsumoProyecto>> {
  try {
    const supabase = await createClient()

    // Validar input
    const validated = registrarConsumoSchema.safeParse(input)

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Datos inválidos',
      }
    }

    const { id_proyecto, id_disponibilidad, cantidad, fecha_consumo } = validated.data

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

    // Verificar que la disponibilidad existe
    const { data: disponibilidad, error: disponibilidadError } = await supabase
      .from('disponibilidad')
      .select('id_disponibilidad, cantidad')
      .eq('id_disponibilidad', id_disponibilidad)
      .is('deleted_at', null)
      .single()

    if (disponibilidadError || !disponibilidad) {
      return {
        success: false,
        error: 'Disponibilidad no encontrada',
      }
    }

    // Calcular cantidad ya consumida de esta disponibilidad
    const { data: consumosExistentes, error: consumosError } = await supabase
      .from('consumo_proyecto')
      .select('cantidad_consumida')
      .eq('id_disponibilidad', id_disponibilidad)
      .is('deleted_at', null)

    if (consumosError) {
      console.error('Error calculando consumo existente:', consumosError)
      return {
        success: false,
        error: 'No se pudo verificar el consumo existente',
      }
    }

    const cantidadConsumida =
      consumosExistentes?.reduce((sum, c) => sum + (c.cantidad_consumida || 0), 0) || 0
    const cantidadDisponible = disponibilidad.cantidad - cantidadConsumida

    // Validar que no se exceda la cantidad disponible
    if (cantidad > cantidadDisponible) {
      return {
        success: false,
        error: `No hay suficientes iSeeds disponibles. Disponible: ${cantidadDisponible}, solicitado: ${cantidad}`,
      }
    }

    // Calcular fecha de consumo (usar la proporcionada o la fecha actual)
    const fechaConsumoFinal = fecha_consumo || new Date().toISOString().split('T')[0]

    // Crear el registro de consumo
    const { data: nuevoConsumo, error: createError } = await supabase
      .from('consumo_proyecto')
      .insert({
        id_proyecto,
        id_disponibilidad,
        cantidad_consumida: cantidad,
        fecha_consumo: fechaConsumoFinal,
      })
      .select()
      .single()

    if (createError || !nuevoConsumo) {
      console.error('Error registrando consumo:', createError)
      return {
        success: false,
        error: 'No se pudo registrar el consumo',
      }
    }

    // Revalidar rutas
    revalidatePath('/proyectos')
    revalidatePath(`/proyectos/${id_proyecto}`)

    return {
      success: true,
      data: nuevoConsumo as ConsumoProyecto,
    }
  } catch (error) {
    console.error('Error en registrarConsumo:', error)
    return {
      success: false,
      error: 'Error inesperado al registrar el consumo',
    }
  }
}

// =====================================================
// 4. GET CONSUMOS DEL PROYECTO
// =====================================================

/**
 * Lista todos los consumos de un proyecto con detalles de disponibilidad y producción
 */
export async function getConsumosDelProyecto(
  input: GetConsumosDelProyectoInput
): Promise<ActionResponse<ConsumoWithRelations[]>> {
  try {
    const supabase = await createClient()

    // Validar input
    const validated = getConsumosDelProyectoSchema.safeParse(input)

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Datos inválidos',
      }
    }

    const { id_proyecto } = validated.data

    // Obtener consumos del proyecto con relaciones
    const { data: consumos, error: consumosError } = await supabase
      .from('consumo_proyecto')
      .select(
        `
        *,
        disponibilidad:disponibilidad!consumo_proyecto_id_disponibilidad_fkey(
          id_disponibilidad,
          cantidad,
          fecha_produccion,
          id_produccion
        )
      `
      )
      .eq('id_proyecto', id_proyecto)
      .is('deleted_at', null)
      .order('fecha_consumo', { ascending: false })

    if (consumosError) {
      console.error('Error obteniendo consumos:', consumosError)
      return {
        success: false,
        error: 'No se pudieron obtener los consumos del proyecto',
      }
    }

    if (!consumos || consumos.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    // Para cada consumo, agregar información de cuánto se consumió vs disponible
    const consumosConRelaciones: ConsumoWithRelations[] = await Promise.all(
      consumos.map(async (consumo) => {
        if (consumo.disponibilidad) {
          // Calcular consumo total de esta disponibilidad
          const { data: todosConsumos, error: consumosTotalError } = await supabase
            .from('consumo_proyecto')
            .select('cantidad_consumida')
            .eq('id_disponibilidad', consumo.disponibilidad.id_disponibilidad)
            .is('deleted_at', null)

          if (consumosTotalError) {
            console.error('Error calculando consumo total:', consumosTotalError)
          }

          const cantidadConsumida =
            todosConsumos?.reduce((sum, c) => sum + (c.cantidad_consumida || 0), 0) || 0
          const cantidadDisponible =
            consumo.disponibilidad.cantidad - cantidadConsumida

          return {
            ...consumo,
            disponibilidad: {
              ...consumo.disponibilidad,
              cantidad_consumida: cantidadConsumida,
              cantidad_disponible: cantidadDisponible,
            },
          }
        }

        return consumo
      })
    )

    return {
      success: true,
      data: consumosConRelaciones as ConsumoWithRelations[],
    }
  } catch (error) {
    console.error('Error en getConsumosDelProyecto:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener los consumos',
    }
  }
}

// =====================================================
// 5. CALCULAR DISPONIBLE
// =====================================================

/**
 * Calcula la cantidad disponible de una disponibilidad específica
 * Cantidad original menos suma de consumos
 */
export async function calcularDisponible(
  input: CalcularDisponibleInput
): Promise<ActionResponse<{ cantidad_original: number; cantidad_consumida: number; cantidad_disponible: number }>> {
  try {
    const supabase = await createClient()

    // Validar input
    const validated = calcularDisponibleSchema.safeParse(input)

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Datos inválidos',
      }
    }

    const { id_disponibilidad } = validated.data

    // Verificar que la disponibilidad existe
    const { data: disponibilidad, error: disponibilidadError } = await supabase
      .from('disponibilidad')
      .select('id_disponibilidad, cantidad')
      .eq('id_disponibilidad', id_disponibilidad)
      .is('deleted_at', null)
      .single()

    if (disponibilidadError || !disponibilidad) {
      return {
        success: false,
        error: 'Disponibilidad no encontrada',
      }
    }

    // Obtener todos los consumos de esta disponibilidad
    const { data: consumos, error: consumosError } = await supabase
      .from('consumo_proyecto')
      .select('cantidad_consumida')
      .eq('id_disponibilidad', id_disponibilidad)
      .is('deleted_at', null)

    if (consumosError) {
      console.error('Error obteniendo consumos:', consumosError)
      return {
        success: false,
        error: 'No se pudieron obtener los consumos',
      }
    }

    const cantidadConsumida =
      consumos?.reduce((sum, c) => sum + (c.cantidad_consumida || 0), 0) || 0
    const cantidadDisponible = disponibilidad.cantidad - cantidadConsumida

    return {
      success: true,
      data: {
        cantidad_original: disponibilidad.cantidad,
        cantidad_consumida: cantidadConsumida,
        cantidad_disponible: cantidadDisponible,
      },
    }
  } catch (error) {
    console.error('Error en calcularDisponible:', error)
    return {
      success: false,
      error: 'Error inesperado al calcular disponibilidad',
    }
  }
}
