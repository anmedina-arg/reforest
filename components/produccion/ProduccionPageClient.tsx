'use client'

import { useState, useMemo } from 'react'
import { ProduccionFilters } from './ProduccionFilters'
import { ProduccionTable } from './ProduccionTable'
import type { ProduccionWithRelations } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface ProduccionPageClientProps {
  producciones: ProduccionWithRelations[]
  proyectos: { id_proyecto: string; nombre_del_proyecto: string; codigo_proyecto: string }[]
  estados: { id_estado_produccion: string; nombre: string }[]
}

// =====================================================
// COMPONENT
// =====================================================

export function ProduccionPageClient({
  producciones,
  proyectos,
  estados,
}: ProduccionPageClientProps) {
  const [filters, setFilters] = useState({
    id_proyecto: '',
    id_estado_produccion: '',
    searchReceta: '',
  })

  // Filtrar producciones basado en los filtros activos
  const produccionesFiltradas = useMemo(() => {
    return producciones.filter((produccion) => {
      // Filtro por proyecto
      if (filters.id_proyecto && filters.id_proyecto !== 'all') {
        if (produccion.id_proyecto !== filters.id_proyecto) {
          return false
        }
      }

      // Filtro por estado
      if (filters.id_estado_produccion && filters.id_estado_produccion !== 'all') {
        if (produccion.id_estado_produccion !== filters.id_estado_produccion) {
          return false
        }
      }

      // Filtro por búsqueda de receta
      if (filters.searchReceta) {
        const searchLower = filters.searchReceta.toLowerCase()
        const recetaNombre = produccion.receta?.nombre?.toLowerCase() || ''
        if (!recetaNombre.includes(searchLower)) {
          return false
        }
      }

      return true
    })
  }, [producciones, filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? '' : value,
    }))
  }

  return (
    <>
      <ProduccionFilters
        proyectos={proyectos}
        estados={estados}
        onFilterChange={handleFilterChange}
      />

      <div className="mb-4 text-sm text-muted-foreground">
        Mostrando {produccionesFiltradas.length} de {producciones.length} producciones
      </div>

      <ProduccionTable producciones={produccionesFiltradas} />
    </>
  )
}
