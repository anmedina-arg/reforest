'use client'

import * as React from 'react'
import { Table } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTablePaginationConfig } from './data-table'

// =====================================================
// TYPES
// =====================================================

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pagination: DataTablePaginationConfig
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

// =====================================================
// COMPONENT
// =====================================================

export function DataTablePagination<TData>({
  table,
  pagination,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps<TData>) {
  const isServerSide = pagination.mode === 'server'

  // Calcular información de paginación
  const currentPage = isServerSide
    ? pagination.page || 1
    : table.getState().pagination.pageIndex + 1

  const pageSize = isServerSide
    ? pagination.pageSize || 10
    : table.getState().pagination.pageSize

  const totalPages = isServerSide
    ? Math.ceil((pagination.total || 0) / pageSize)
    : table.getPageCount()

  const totalRows = isServerSide ? pagination.total || 0 : table.getFilteredRowModel().rows.length

  // Calcular rango de filas mostradas
  const startRow = (currentPage - 1) * pageSize + 1
  const endRow = Math.min(currentPage * pageSize, totalRows)

  // Handlers
  const handleFirstPage = () => {
    if (isServerSide) {
      onPageChange(1)
    } else {
      table.setPageIndex(0)
    }
  }

  const handlePreviousPage = () => {
    if (isServerSide) {
      onPageChange(Math.max(1, currentPage - 1))
    } else {
      table.previousPage()
    }
  }

  const handleNextPage = () => {
    if (isServerSide) {
      onPageChange(Math.min(totalPages, currentPage + 1))
    } else {
      table.nextPage()
    }
  }

  const handleLastPage = () => {
    if (isServerSide) {
      onPageChange(totalPages)
    } else {
      table.setPageIndex(table.getPageCount() - 1)
    }
  }

  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value)
    onPageSizeChange(newSize)
  }

  // Determinar si los botones están deshabilitados
  const canGoPrevious = isServerSide ? currentPage > 1 : table.getCanPreviousPage()
  const canGoNext = isServerSide ? currentPage < totalPages : table.getCanNextPage()

  return (
    <div className="flex items-center justify-between px-2 py-4">
      {/* Información de filas */}
      <div className="flex-1 text-sm text-muted-foreground">
        {totalRows > 0 ? (
          <>
            Mostrando {startRow} a {endRow} de {totalRows} resultado
            {totalRows !== 1 && 's'}
          </>
        ) : (
          'No hay resultados'
        )}
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center space-x-6 lg:space-x-8">
        {/* Selector de tamaño de página */}
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Filas por página</p>
          <Select value={`${pageSize}`} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Indicador de página */}
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Página {currentPage} de {totalPages || 1}
        </div>

        {/* Botones de navegación */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={handleFirstPage}
            disabled={!canGoPrevious}
          >
            <span className="sr-only">Ir a la primera página</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={handlePreviousPage}
            disabled={!canGoPrevious}
          >
            <span className="sr-only">Ir a la página anterior</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={handleNextPage}
            disabled={!canGoNext}
          >
            <span className="sr-only">Ir a la página siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={handleLastPage}
            disabled={!canGoNext}
          >
            <span className="sr-only">Ir a la última página</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
