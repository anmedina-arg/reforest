import { z } from 'zod'

/**
 * Schemas de validación para Mix de iSeeds
 */

// Validación de UUID
const uuidSchema = z.string().uuid('Debe ser un UUID válido')

// =====================================================
// SCHEMAS PARA MIX DE ISEEDS
// =====================================================

export const createMixSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim(),
  descripcion: z.string().max(1000, 'La descripción no puede exceder 1000 caracteres').optional().nullable(),
  recetas: z
    .array(
      z.object({
        id_receta: uuidSchema,
        cantidad_iseeds: z
          .number()
          .int('La cantidad debe ser un número entero')
          .min(0, 'La cantidad no puede ser negativa'),
      })
    )
    .optional()
    .default([]),
})

export type CreateMixInput = z.infer<typeof createMixSchema>

export const updateMixSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim()
    .optional(),
  descripcion: z.string().max(1000, 'La descripción no puede exceder 1000 caracteres').optional().nullable(),
})

export type UpdateMixInput = z.infer<typeof updateMixSchema>

export const mixFiltersSchema = z.object({
  search: z.string().trim().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(1000).optional(),
})

export type MixFilters = z.infer<typeof mixFiltersSchema>

// =====================================================
// SCHEMAS PARA GESTIÓN DE RECETAS EN MIX
// =====================================================

export const agregarRecetaAMixSchema = z.object({
  id_mix: uuidSchema,
  id_receta: uuidSchema,
  cantidad_iseeds: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(0, 'La cantidad no puede ser negativa'),
})

export type AgregarRecetaAMixInput = z.infer<typeof agregarRecetaAMixSchema>

export const removerRecetaDeMixSchema = z.object({
  id_mix: uuidSchema,
  id_receta: uuidSchema,
})

export type RemoverRecetaDeMixInput = z.infer<typeof removerRecetaDeMixSchema>

export const actualizarCantidadRecetaSchema = z.object({
  id_mix: uuidSchema,
  id_receta: uuidSchema,
  cantidad_iseeds: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(0, 'La cantidad no puede ser negativa'),
})

export type ActualizarCantidadRecetaInput = z.infer<typeof actualizarCantidadRecetaSchema>
