'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RegistrarEntradaDialog } from './RegistrarEntradaDialog'
import { MovimientosDialog } from './MovimientosDialog'
import type { StockInsumo, TipoInsumo } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface StockTableProps {
  initialStock: StockInsumo[]
  tiposInsumo: TipoInsumo[]
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getStockBadgeVariant(stock: number): 'destructive' | 'default' | 'success' {
  if (stock === 0) return 'destructive' // Rojo
  if (stock < 100) return 'default' // Amarillo/Azul
  return 'success' // Verde
}

function getStockLabel(stock: number): string {
  if (stock === 0) return 'Sin Stock'
  if (stock < 100) return 'Stock Bajo'
  return 'Stock OK'
}

// =====================================================
// COMPONENT
// =====================================================

export function StockTable({ initialStock, tiposInsumo }: StockTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [registrarEntradaOpen, setRegistrarEntradaOpen] = useState(false)
  const [movimientosOpen, setMovimientosOpen] = useState(false)
  const [selectedInsumoId, setSelectedInsumoId] = useState<string | null>(null)

  // Filter and search stock
  const filteredStock = useMemo(() => {
    return initialStock.filter((item) => {
      // Filter by search term
      const matchesSearch =
        item.insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.insumo.nombre_cientifico?.toLowerCase().includes(searchTerm.toLowerCase())

      // Filter by tipo
      const matchesTipo =
        tipoFilter === 'all' || item.insumo.tipo_insumo?.id_tipo_insumo === tipoFilter

      return matchesSearch && matchesTipo
    })
  }, [initialStock, searchTerm, tipoFilter])

  function handleVerMovimientos(insumoId: string) {
    setSelectedInsumoId(insumoId)
    setMovimientosOpen(true)
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar insumo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Filter by Tipo */}
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de insumo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {tiposInsumo.map((tipo) => (
                  <SelectItem key={tipo.id_tipo_insumo} value={tipo.id_tipo_insumo}>
                    {tipo.descripcion_tipo_insumo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Register Entry Button */}
          <Button onClick={() => setRegistrarEntradaOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Entrada
          </Button>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredStock.length} de {initialStock.length} items
        </div>

        {/* Stock Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Stock Actual</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchTerm || tipoFilter !== 'all'
                        ? 'No se encontraron resultados'
                        : 'No hay insumos registrados'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStock.map((item) => (
                  <TableRow key={item.insumo.id_insumo}>
                    {/* Insumo */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.insumo.nombre}</span>
                        {item.insumo.nombre_cientifico && (
                          <span className="text-sm text-muted-foreground italic">
                            {item.insumo.nombre_cientifico}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Tipo */}
                    <TableCell>
                      {item.insumo.tipo_insumo?.descripcion_tipo_insumo || '-'}
                    </TableCell>

                    {/* Stock Actual */}
                    <TableCell className="text-right">
                      <span className="font-mono font-semibold">
                        {new Intl.NumberFormat('es-AR').format(item.stock_actual)}
                      </span>
                    </TableCell>

                    {/* Unidad */}
                    <TableCell>{item.unidad_medida}</TableCell>

                    {/* Estado */}
                    <TableCell>
                      <Badge variant={getStockBadgeVariant(item.stock_actual)}>
                        {getStockLabel(item.stock_actual)}
                      </Badge>
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerMovimientos(item.insumo.id_insumo)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Movimientos
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialogs */}
      <RegistrarEntradaDialog
        open={registrarEntradaOpen}
        onOpenChange={setRegistrarEntradaOpen}
        insumos={initialStock.map((s) => s.insumo)}
      />

      {selectedInsumoId && (
        <MovimientosDialog
          open={movimientosOpen}
          onOpenChange={setMovimientosOpen}
          insumoId={selectedInsumoId}
        />
      )}
    </>
  )
}
