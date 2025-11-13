'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

// =====================================================
// TYPES
// =====================================================

interface ProduccionFiltersProps {
  proyectos: { id_proyecto: string; nombre_del_proyecto: string; codigo_proyecto: string }[]
  estados: { id_estado_produccion: string; nombre: string }[]
  onFilterChange: (key: string, value: string) => void
}

// =====================================================
// COMPONENT
// =====================================================

export function ProduccionFilters({ proyectos, estados, onFilterChange }: ProduccionFiltersProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      {/* Filtro por Proyecto */}
      <div className="space-y-2">
        <Label htmlFor="proyecto-filter">Proyecto</Label>
        <Select onValueChange={(value) => onFilterChange('id_proyecto', value)}>
          <SelectTrigger id="proyecto-filter">
            <SelectValue placeholder="Todos los proyectos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proyectos</SelectItem>
            {proyectos.map((proyecto) => (
              <SelectItem key={proyecto.id_proyecto} value={proyecto.id_proyecto}>
                {proyecto.nombre_del_proyecto} ({proyecto.codigo_proyecto})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtro por Estado */}
      <div className="space-y-2">
        <Label htmlFor="estado-filter">Estado</Label>
        <Select onValueChange={(value) => onFilterChange('id_estado_produccion', value)}>
          <SelectTrigger id="estado-filter">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {estados.map((estado) => (
              <SelectItem key={estado.id_estado_produccion} value={estado.id_estado_produccion}>
                {estado.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Búsqueda por Receta */}
      <div className="space-y-2">
        <Label htmlFor="receta-search">Buscar receta</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="receta-search"
            type="text"
            placeholder="Nombre de receta..."
            className="pl-8"
            onChange={(e) => onFilterChange('searchReceta', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
