'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, ChevronsUpDown, Loader2, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from './data-table-pagination'

// =====================================================
// TYPES
// =====================================================

export interface DataTablePaginationConfig {
  /**
   * Modo de paginación:
   * - 'client': Paginación local (los datos vienen completos)
   * - 'server': Paginación en servidor (solo viene la página actual)
   */
  mode: 'client' | 'server'
  /**
   * Página actual (1-indexed)
   */
  page?: number
  /**
   * Tamaño de página
   */
  pageSize?: number
  /**
   * Total de registros (solo para server-side)
   */
  total?: number
  /**
   * Callback cuando cambia la página
   */
  onPageChange?: (page: number) => void
  /**
   * Callback cuando cambia el tamaño de página
   */
  onPageSizeChange?: (pageSize: number) => void
}

export interface DataTableProps<TData, TValue> {
  /**
   * Definición de columnas de Tanstack Table
   */
  columns: ColumnDef<TData, TValue>[]
  /**
   * Datos a mostrar en la tabla
   */
  data: TData[]
  /**
   * Estado de carga
   */
  loading?: boolean
  /**
   * Configuración de paginación
   */
  pagination?: DataTablePaginationConfig
  /**
   * Habilitar búsqueda global
   */
  searchable?: boolean
  /**
   * Placeholder del input de búsqueda
   */
  searchPlaceholder?: string
  /**
   * Columna en la que aplicar el filtro de búsqueda
   * (usar el campo 'id' o 'accessorKey' de la columna)
   */
  searchColumn?: string
  /**
   * Mensaje a mostrar cuando no hay datos
   */
  emptyMessage?: string
  /**
   * Clase CSS adicional para la tabla
   */
  className?: string
  /**
   * Callback cuando se hace click en una fila
   */
  onRowClick?: (row: TData) => void
}

// =====================================================
// COMPONENT
// =====================================================

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  pagination,
  searchable = false,
  searchPlaceholder = 'Buscar...',
  searchColumn = 'nombre',
  emptyMessage = 'No hay resultados',
  className,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Configurar paginación según el modo
  const paginationConfig = React.useMemo(() => {
    if (!pagination) return undefined

    if (pagination.mode === 'server') {
      // Para server-side, usamos la paginación manual
      return {
        pageIndex: (pagination.page || 1) - 1, // Tanstack Table usa 0-indexed
        pageSize: pagination.pageSize || 10,
      }
    }

    // Para client-side, paginación automática
    return {
      pageIndex: 0,
      pageSize: pagination.pageSize || 10,
    }
  }, [pagination])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Sorting
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    // Filtering
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    // Visibility
    onColumnVisibilityChange: setColumnVisibility,
    // Row selection
    onRowSelectionChange: setRowSelection,
    // Paginación
    ...(pagination?.mode === 'client' && {
      getPaginationRowModel: getPaginationRowModel(),
    }),
    // Manual pagination para server-side
    ...(pagination?.mode === 'server' && {
      manualPagination: true,
      pageCount: pagination.total
        ? Math.ceil(pagination.total / (pagination.pageSize || 10))
        : -1,
    }),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      ...(paginationConfig && { pagination: paginationConfig }),
    },
  })

  // Handler para cambios en la búsqueda
  const handleSearch = React.useCallback(
    (value: string) => {
      table.getColumn(searchColumn)?.setFilterValue(value)
    },
    [table, searchColumn]
  )

  // Handler para cambios de página
  const handlePageChange = React.useCallback(
    (newPage: number) => {
      if (pagination?.mode === 'server' && pagination.onPageChange) {
        pagination.onPageChange(newPage)
      } else {
        table.setPageIndex(newPage - 1) // Convertir a 0-indexed
      }
    },
    [pagination, table]
  )

  // Handler para cambios de tamaño de página
  const handlePageSizeChange = React.useCallback(
    (newPageSize: number) => {
      if (pagination?.mode === 'server' && pagination.onPageSizeChange) {
        pagination.onPageSizeChange(newPageSize)
      } else {
        table.setPageSize(newPageSize)
      }
    },
    [pagination, table]
  )

  return (
    <div className={className}>
      {/* Barra de búsqueda */}
      {searchable && (
        <div className="flex items-center py-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''}
              onChange={(event) => handleSearch(event.target.value)}
              className="pl-8"
              disabled={loading}
            />
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const isSorted = header.column.getIsSorted()

                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            canSort
                              ? 'flex items-center space-x-2 cursor-pointer select-none'
                              : ''
                          }
                          onClick={
                            canSort ? header.column.getToggleSortingHandler() : undefined
                          }
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="ml-2">
                              {isSorted === 'asc' ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : isSorted === 'desc' ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {/* Estado de carga */}
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Cargando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              // Filas con datos
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Estado vacío
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-muted-foreground">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {pagination && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  )
}
