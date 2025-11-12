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
// REGISTRAR ENTRADA SCHEMA
// =====================================================

export const registrarEntradaSchema = z.object({
  id_insumo: uuidSchema,
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  unidad_medida: z.string().min(1, 'La unidad de medida es requerida'),
  fecha: dateStringSchema,
  observacion: z.string().max(500).optional().nullable(),
})

export type RegistrarEntradaInput = z.infer<typeof registrarEntradaSchema>

// =====================================================
// GET STOCK BY INSUMO SCHEMA
// =====================================================

export const getStockByInsumoSchema = z.object({
  id_insumo: uuidSchema,
})

export type GetStockByInsumoInput = z.infer<typeof getStockByInsumoSchema>

// =====================================================
// GET MOVIMIENTOS FILTERS SCHEMA
// =====================================================

export const movimientosFiltersSchema = z.object({
  id_insumo: uuidSchema.optional(),
  fecha_desde: dateStringSchema.optional(),
  fecha_hasta: dateStringSchema.optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(1000).optional().default(50),
})

export type MovimientosFiltersInput = z.infer<typeof movimientosFiltersSchema>
