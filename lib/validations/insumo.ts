import { z } from 'zod'

/**
 * Schemas de validación para Insumos
 */

// Validación de UUID
const uuidSchema = z.string().uuid('Debe ser un UUID válido')

// =====================================================
// SCHEMA PARA CREAR INSUMO
// =====================================================

export const createInsumoSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim(),
  nombre_cientifico: z
    .string()
    .max(255, 'El nombre científico no puede exceder 255 caracteres')
    .trim()
    .optional()
    .nullable(),
  especie: z
    .string()
    .max(255, 'La especie no puede exceder 255 caracteres')
    .trim()
    .optional()
    .nullable(),
  id_tipo_insumo: uuidSchema,
  unidad_medida: uuidSchema,
})

export type CreateInsumoInput = z.infer<typeof createInsumoSchema>

// =====================================================
// SCHEMA PARA ACTUALIZAR INSUMO
// =====================================================

export const updateInsumoSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim()
    .optional(),
  nombre_cientifico: z
    .string()
    .max(255, 'El nombre científico no puede exceder 255 caracteres')
    .trim()
    .optional()
    .nullable(),
  especie: z
    .string()
    .max(255, 'La especie no puede exceder 255 caracteres')
    .trim()
    .optional()
    .nullable(),
  id_tipo_insumo: uuidSchema.optional(),
  unidad_medida: uuidSchema.optional(),
})

export type UpdateInsumoInput = z.infer<typeof updateInsumoSchema>

// =====================================================
// SCHEMA PARA FILTROS DE BÚSQUEDA
// =====================================================

export const insumoFiltersSchema = z.object({
  tipo: uuidSchema.optional(),
  especie: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(1000).optional(), // Aumentado a 1000 para permitir cargar todos los datos
})

export type InsumoFilters = z.infer<typeof insumoFiltersSchema>
