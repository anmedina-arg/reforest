/**
 * Tipos TypeScript para las entidades de la base de datos
 */

// =====================================================
// TIPOS BÁSICOS
// =====================================================

export type UUID = string

// =====================================================
// CATÁLOGO - TIPOS DE INSUMO
// =====================================================

export interface TipoInsumo {
  id_tipo_insumo: UUID
  descripcion_tipo_insumo: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// =====================================================
// CATÁLOGO - UNIDADES DE MEDIDA
// =====================================================

export interface UnidadMedida {
  id_unidad: UUID
  nombre: string
  abreviatura: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// =====================================================
// CATÁLOGO - ESPECIES
// =====================================================

export interface Especie {
  id_especie: UUID
  descripcion_especie: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// =====================================================
// INSUMOS
// =====================================================

export interface Insumo {
  id_insumo: UUID
  nombre: string
  nombre_cientifico: string | null
  especie: string | null
  id_tipo_insumo: UUID | null
  unidad_medida: UUID | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/**
 * Insumo con relaciones cargadas
 */
export interface InsumoWithRelations extends Insumo {
  tipo_insumo?: TipoInsumo | null
  unidad?: UnidadMedida | null
}

// =====================================================
// INPUTS PARA CREAR Y ACTUALIZAR INSUMOS
// =====================================================

export interface CreateInsumoInput {
  nombre: string
  nombre_cientifico?: string | null
  especie?: string | null
  id_tipo_insumo: UUID
  unidad_medida: UUID
}

export interface UpdateInsumoInput {
  nombre?: string
  nombre_cientifico?: string | null
  especie?: string | null
  id_tipo_insumo?: UUID
  unidad_medida?: UUID
}

// =====================================================
// FILTROS Y PAGINACIÓN
// =====================================================

export interface InsumoFilters {
  tipo?: UUID
  especie?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// =====================================================
// RESPONSABLES DE LABORATORIO
// =====================================================

export interface ResponsableLaboratorio {
  id_responsable_labo: UUID
  nombre_responsable: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// =====================================================
// RECETAS
// =====================================================

export interface Receta {
  id_receta: UUID
  nombre: string
  descripcion: string | null
  autor: UUID | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/**
 * Receta con relaciones básicas (autor y count de insumos)
 */
export interface RecetaWithRelations extends Receta {
  autor?: ResponsableLaboratorio | null
  insumos_count?: number
}

/**
 * Insumo dentro de una receta con cantidad y unidad
 */
export interface InsumoEnReceta {
  id_insumo: UUID
  nombre: string
  nombre_cientifico: string | null
  cantidad: number
  unidad: UnidadMedida
}

/**
 * Receta completa con array de insumos + cantidades + unidades
 */
export interface RecetaConInsumos extends Receta {
  autor?: ResponsableLaboratorio | null
  insumos: InsumoEnReceta[]
}

// =====================================================
// TABLA INTERMEDIA - RECETA_INSUMO
// =====================================================

export interface RecetaInsumo {
  id_receta: UUID
  id_insumo: UUID
  cantidad: number
  id_unidad: UUID
  created_at: string
  updated_at: string
}

// =====================================================
// INPUTS PARA RECETAS
// =====================================================

export interface CreateRecetaInput {
  nombre: string
  descripcion?: string | null
  autor?: UUID | null
}

export interface UpdateRecetaInput {
  nombre?: string
  descripcion?: string | null
  autor?: UUID | null
}

export interface AgregarInsumoInput {
  id_receta: UUID
  id_insumo: UUID
  cantidad: number
  id_unidad: UUID
}

export interface RemoverInsumoInput {
  id_receta: UUID
  id_insumo: UUID
}

// =====================================================
// FILTROS PARA RECETAS
// =====================================================

export interface RecetaFilters {
  search?: string
  autor?: UUID
  page?: number
  pageSize?: number
}

// =====================================================
// MIX DE ISEEDS
// =====================================================

export interface MixISeeds {
  id_mix: UUID
  nombre: string
  descripcion: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// =====================================================
// TABLA INTERMEDIA - MIX_RECETAS
// =====================================================

export interface MixRecetas {
  id_mix: UUID
  id_receta: UUID
  cantidad_iseeds: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/**
 * Receta dentro de un mix con cantidad de iSeeds
 */
export interface RecetaEnMix {
  id_receta: UUID
  nombre: string
  descripcion: string | null
  cantidad_iseeds: number
}

/**
 * Mix completo con array de recetas + cantidades
 */
export interface MixWithRecetas extends MixISeeds {
  recetas: RecetaEnMix[]
}

// =====================================================
// INPUTS PARA MIX DE ISEEDS
// =====================================================

export interface CreateMixInput {
  nombre: string
  descripcion?: string | null
  recetas: Array<{
    id_receta: UUID
    cantidad_iseeds: number
  }>
}

export interface UpdateMixInput {
  nombre?: string
  descripcion?: string | null
}

export interface AgregarRecetaAMixInput {
  id_mix: UUID
  id_receta: UUID
  cantidad_iseeds: number
}

export interface RemoverRecetaDeMixInput {
  id_mix: UUID
  id_receta: UUID
}

export interface MixFilters {
  search?: string
  page?: number
  pageSize?: number
}

// =====================================================
// CLIENTES
// =====================================================

export interface Cliente {
  id_cliente: UUID
  nombre_cliente: string
  phone: string | null
  email: string | null
  picture: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// =====================================================
// ESTADOS
// =====================================================

export interface EstadoProyecto {
  id_estado_proyecto: UUID
  nombre: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface EcoRegion {
  id_eco_region: UUID
  nombre: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// =====================================================
// PROYECTOS
// =====================================================

export interface Proyecto {
  id_proyecto: UUID
  nombre_del_proyecto: string
  fecha_inicio: string | null
  fecha_fin: string | null
  nombre_fantasia: string | null
  codigo_proyecto: string | null
  id_cliente: UUID | null
  id_mix: UUID | null
  hectareas: number | null
  id_eco_region: UUID | null
  cantidad_iseeds: number | null
  id_estado_proyecto: UUID | null
  poligonos_entregados: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/**
 * Proyecto con relaciones cargadas
 */
export interface ProyectoWithRelations extends Proyecto {
  cliente?: Cliente | null
  eco_region?: EcoRegion | null
  estado_proyecto?: EstadoProyecto | null
  mix?: MixWithRecetas | null
}

// =====================================================
// INPUTS PARA CLIENTES
// =====================================================

export interface CreateClienteInput {
  nombre_cliente: string
  email?: string | null
  phone?: string | null
  picture?: string | null
}

export interface UpdateClienteInput {
  nombre_cliente?: string
  email?: string | null
  phone?: string | null
  picture?: string | null
}

export interface ClienteFilters {
  search?: string
  page?: number
  pageSize?: number
}

// =====================================================
// INPUTS PARA PROYECTOS
// =====================================================

export interface CreateProyectoInput {
  nombre_del_proyecto: string
  nombre_fantasia?: string | null
  codigo_proyecto?: string | null
  fecha_inicio?: string | null
  fecha_fin?: string | null
  id_cliente?: UUID | null
  id_eco_region?: UUID | null
  id_estado_proyecto?: UUID | null
  id_mix?: UUID | null
  hectareas?: number | null
  cantidad_iseeds?: number | null
  poligonos_entregados?: boolean
}

export interface UpdateProyectoInput {
  nombre_del_proyecto?: string
  nombre_fantasia?: string | null
  codigo_proyecto?: string | null
  fecha_inicio?: string | null
  fecha_fin?: string | null
  id_cliente?: UUID | null
  id_eco_region?: UUID | null
  id_estado_proyecto?: UUID | null
  id_mix?: UUID | null
  hectareas?: number | null
  cantidad_iseeds?: number | null
  poligonos_entregados?: boolean
}

export interface ProyectoFilters {
  search?: string
  id_cliente?: UUID
  id_estado_proyecto?: UUID
  page?: number
  pageSize?: number
}

export interface CambiarEstadoInput {
  id_proyecto: UUID
  id_estado_proyecto: UUID
}

export interface AsignarRecetaInput {
  id_proyecto: UUID
  id_mix: UUID
}
