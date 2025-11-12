import Link from 'next/link'
import { Package, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StockTable } from '@/components/stock/StockTable'
import { getStockActual } from '@/app/actions/stock'
import { getTiposInsumo } from '@/app/actions/insumos'

// =====================================================
// SERVER COMPONENT - STOCK PAGE
// =====================================================

export default async function StockPage() {
  // Fetch stock and tipos de insumo in parallel
  const [stockResult, tiposResult] = await Promise.all([
    getStockActual(),
    getTiposInsumo(),
  ])

  const stock = stockResult.success && stockResult.data ? stockResult.data : []
  const tiposInsumo = tiposResult.success && tiposResult.data ? tiposResult.data : []

  // Calculate total items
  const totalItems = stock.length

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">
            Gestión de stock e insumos del laboratorio
          </p>
        </div>
        <Link href="/stock/movimientos">
          <Button variant="outline">
            <History className="mr-2 h-4 w-4" />
            Ver Historial Completo
          </Button>
        </Link>
      </div>

      {/* Featured Card - Total Items */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Total de Items</CardTitle>
                <CardDescription>Insumos registrados en inventario</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-primary">{totalItems}</p>
              <div className="mt-2">
                <Badge variant="default" className="text-sm">
                  Activos
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock de Insumos</CardTitle>
          <CardDescription>
            Control de existencias y movimientos de inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockTable initialStock={stock} tiposInsumo={tiposInsumo} />
        </CardContent>
      </Card>
    </div>
  )
}
