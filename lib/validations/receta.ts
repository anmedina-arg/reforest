import { z } from 'zod'

/**
 * Schemas de validación para Recetas
 */

// Validación de UUID
const uuidSchema = z.string().uuid('Debe ser un UUID válido')

// =====================================================
// SCHEMA PARA CREAR RECETA
// =====================================================

export const createRecetaSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim(),
  descripcion: z
    .string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .trim()
    .optional()
    .nullable(),
  autor: uuidSchema.optional().nullable(),
})

export type CreateRecetaInput = z.infer<typeof createRecetaSchema>

// =====================================================
// SCHEMA PARA ACTUALIZAR RECETA
// =====================================================

export const updateRecetaSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim()
    .optional(),
  descripcion: z
    .string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .trim()
    .optional()
    .nullable(),
  autor: uuidSchema.optional().nullable(),
})

export type UpdateRecetaInput = z.infer<typeof updateRecetaSchema>

// =====================================================
// SCHEMA PARA AGREGAR INSUMO A RECETA
// =====================================================

export const agregarInsumoSchema = z.object({
  id_receta: uuidSchema,
  id_insumo: uuidSchema,
  cantidad: z
    .number()
    .positive('La cantidad debe ser un número positivo')
    .finite('La cantidad debe ser un número finito'),
  id_unidad: uuidSchema,
})

export type AgregarInsumoInput = z.infer<typeof agregarInsumoSchema>

// =====================================================
// SCHEMA PARA REMOVER INSUMO DE RECETA
// =====================================================

export const removerInsumoSchema = z.object({
  id_receta: uuidSchema,
  id_insumo: uuidSchema,
})

export type RemoverInsumoInput = z.infer<typeof removerInsumoSchema>

// =====================================================
// SCHEMA PARA FILTROS DE BÚSQUEDA
// =====================================================

export const recetaFiltersSchema = z.object({
  search: z.string().trim().optional(),
  autor: uuidSchema.optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(1000).optional(),
})

export type RecetaFilters = z.infer<typeof recetaFiltersSchema>
