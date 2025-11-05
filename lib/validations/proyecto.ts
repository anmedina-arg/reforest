import { z } from 'zod'

/**
 * Schemas de validación para Clientes y Proyectos
 */

// Validación de UUID
const uuidSchema = z.string().uuid('Debe ser un UUID válido')

// =====================================================
// SCHEMAS PARA CLIENTES
// =====================================================

export const createClienteSchema = z.object({
  nombre_cliente: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim(),
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .trim()
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(50, 'El teléfono no puede exceder 50 caracteres')
    .trim()
    .optional()
    .nullable(),
  picture: z
    .string()
    .url('Debe ser una URL válida')
    .max(255, 'La URL no puede exceder 255 caracteres')
    .optional()
    .nullable(),
})

export type CreateClienteInput = z.infer<typeof createClienteSchema>

export const updateClienteSchema = z.object({
  nombre_cliente: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .trim()
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(50, 'El teléfono no puede exceder 50 caracteres')
    .trim()
    .optional()
    .nullable(),
  picture: z
    .string()
    .url('Debe ser una URL válida')
    .max(255, 'La URL no puede exceder 255 caracteres')
    .optional()
    .nullable(),
})

export type UpdateClienteInput = z.infer<typeof updateClienteSchema>

export const clienteFiltersSchema = z.object({
  search: z.string().trim().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(1000).optional(),
})

export type ClienteFilters = z.infer<typeof clienteFiltersSchema>

// =====================================================
// SCHEMAS PARA PROYECTOS
// =====================================================

export const createProyectoSchema = z.object({
  nombre_del_proyecto: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim(),
  nombre_fantasia: z
    .string()
    .max(255, 'El nombre fantasía no puede exceder 255 caracteres')
    .trim()
    .optional()
    .nullable(),
  codigo_proyecto: z
    .string()
    .max(50, 'El código no puede exceder 50 caracteres')
    .trim()
    .optional()
    .nullable(),
  fecha_inicio: z
    .string()
    .date('Fecha de inicio inválida')
    .optional()
    .nullable(),
  fecha_fin: z
    .string()
    .date('Fecha de fin inválida')
    .optional()
    .nullable(),
  id_cliente: uuidSchema.optional().nullable(),
  id_eco_region: uuidSchema.optional().nullable(),
  id_estado_proyecto: uuidSchema.optional().nullable(),
  id_mix: uuidSchema.optional().nullable(),
  hectareas: z
    .number()
    .int('Las hectáreas deben ser un número entero')
    .min(0, 'Las hectáreas no pueden ser negativas')
    .optional()
    .nullable(),
  cantidad_iSeeds: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(0, 'La cantidad no puede ser negativa')
    .optional()
    .nullable(),
  poligonos_entregados: z.boolean().optional(),
})

export type CreateProyectoInput = z.infer<typeof createProyectoSchema>

export const updateProyectoSchema = z.object({
  nombre_del_proyecto: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim()
    .optional(),
  nombre_fantasia: z
    .string()
    .max(255, 'El nombre fantasía no puede exceder 255 caracteres')
    .trim()
    .optional()
    .nullable(),
  codigo_proyecto: z
    .string()
    .max(50, 'El código no puede exceder 50 caracteres')
    .trim()
    .optional()
    .nullable(),
  fecha_inicio: z
    .string()
    .date('Fecha de inicio inválida')
    .optional()
    .nullable(),
  fecha_fin: z
    .string()
    .date('Fecha de fin inválida')
    .optional()
    .nullable(),
  id_cliente: uuidSchema.optional().nullable(),
  id_eco_region: uuidSchema.optional().nullable(),
  id_estado_proyecto: uuidSchema.optional().nullable(),
  id_mix: uuidSchema.optional().nullable(),
  hectareas: z
    .number()
    .int('Las hectáreas deben ser un número entero')
    .min(0, 'Las hectáreas no pueden ser negativas')
    .optional()
    .nullable(),
  cantidad_iSeeds: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(0, 'La cantidad no puede ser negativa')
    .optional()
    .nullable(),
  poligonos_entregados: z.boolean().optional(),
})

export type UpdateProyectoInput = z.infer<typeof updateProyectoSchema>

export const proyectoFiltersSchema = z.object({
  search: z.string().trim().optional(),
  id_cliente: uuidSchema.optional(),
  id_estado_proyecto: uuidSchema.optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(1000).optional(),
})

export type ProyectoFilters = z.infer<typeof proyectoFiltersSchema>

export const cambiarEstadoSchema = z.object({
  id_proyecto: uuidSchema,
  id_estado_proyecto: uuidSchema,
})

export type CambiarEstadoInput = z.infer<typeof cambiarEstadoSchema>

export const asignarRecetaSchema = z.object({
  id_proyecto: uuidSchema,
  id_mix: uuidSchema,
})

export type AsignarRecetaInput = z.infer<typeof asignarRecetaSchema>
