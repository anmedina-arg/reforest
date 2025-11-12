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
// CREATE PRODUCCION SCHEMA
// =====================================================

export const createProduccionSchema = z.object({
  id_proyecto: uuidSchema,
  id_receta: uuidSchema,
  cantidad_planificada: z.number().int().positive('La cantidad planificada debe ser mayor a 0'),
  fecha_inicio: dateStringSchema,
})

export type CreateProduccionInput = z.infer<typeof createProduccionSchema>

// =====================================================
// FILTERS SCHEMA
// =====================================================

export const produccionFiltersSchema = z.object({
  id_proyecto: uuidSchema.optional(),
  id_estado_produccion: uuidSchema.optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(1000).optional().default(50),
})

export type ProduccionFiltersInput = z.infer<typeof produccionFiltersSchema>

// =====================================================
// INICIAR PRODUCCION SCHEMA
// =====================================================

export const iniciarProduccionSchema = z.object({
  id_produccion: uuidSchema,
})

export type IniciarProduccionInput = z.infer<typeof iniciarProduccionSchema>

// =====================================================
// COMPLETAR PRODUCCION SCHEMA
// =====================================================

export const completarProduccionSchema = z.object({
  id_produccion: uuidSchema,
  cantidad_real: z.number().int().positive('La cantidad real debe ser mayor a 0'),
  fecha_fin: dateStringSchema.optional(),
})

export type CompletarProduccionInput = z.infer<typeof completarProduccionSchema>

// =====================================================
// CANCELAR PRODUCCION SCHEMA
// =====================================================

export const cancelarProduccionSchema = z.object({
  id_produccion: uuidSchema,
  motivo: z.string().max(500).optional(),
})

export type CancelarProduccionInput = z.infer<typeof cancelarProduccionSchema>
