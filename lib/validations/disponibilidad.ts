import { z } from 'zod'

// =====================================================
// HELPERS
// =====================================================

// UUID validation helper
const uuidSchema = z.string().uuid('ID inválido')

// Date string validation (ISO format or SQL date format)
const dateStringSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  'Fecha inválida'
)

// =====================================================
// REGISTRAR CONSUMO SCHEMA
// =====================================================

export const registrarConsumoSchema = z.object({
  id_proyecto: uuidSchema,
  id_disponibilidad: uuidSchema,
  cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
  fecha_consumo: dateStringSchema.optional(),
})

export type RegistrarConsumoInput = z.infer<typeof registrarConsumoSchema>

// =====================================================
// GET DISPONIBILIDADES BY PRODUCCION
// =====================================================

export const getDisponibilidadesByProduccionSchema = z.object({
  id_produccion: uuidSchema,
})

export type GetDisponibilidadesByProduccionInput = z.infer<
  typeof getDisponibilidadesByProduccionSchema
>

// =====================================================
// GET DISPONIBILIDAD TOTAL
// =====================================================

export const getDisponibilidadTotalSchema = z.object({
  id_proyecto: uuidSchema,
})

export type GetDisponibilidadTotalInput = z.infer<typeof getDisponibilidadTotalSchema>

// =====================================================
// GET CONSUMOS DEL PROYECTO
// =====================================================

export const getConsumosDelProyectoSchema = z.object({
  id_proyecto: uuidSchema,
})

export type GetConsumosDelProyectoInput = z.infer<typeof getConsumosDelProyectoSchema>

// =====================================================
// CALCULAR DISPONIBLE
// =====================================================

export const calcularDisponibleSchema = z.object({
  id_disponibilidad: uuidSchema,
})

export type CalcularDisponibleInput = z.infer<typeof calcularDisponibleSchema>
