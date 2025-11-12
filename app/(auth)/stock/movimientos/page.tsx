import Link from 'next/link'
import { ArrowLeft, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MovimientosTable } from '@/components/stock/MovimientosTable'
import { getMovimientos } from '@/app/actions/stock'
import { getInsumos } from '@/app/actions/insumos'

// =====================================================
// SERVER COMPONENT - MOVIMIENTOS PAGE
// =====================================================

export default async function MovimientosPage() {
  // Fetch initial movimientos and insumos in parallel
  const [movimientosResult, insumosResult] = await Promise.all([
    getMovimientos({ page: 1, pageSize: 50 }),
    getInsumos({ page: 1, pageSize: 1000 }),
  ])

  const movimientosData =
    movimientosResult.success && movimientosResult.data ? movimientosResult.data : null
  const insumos = insumosResult.success && insumosResult.data ? insumosResult.data.data : []

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link href="/stock">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Inventario
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historial de Movimientos</h1>
            <p className="text-muted-foreground">
              Registro completo de entradas y salidas de inventario
            </p>
          </div>
        </div>
      </div>

      {/* Movimientos Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos de Stock</CardTitle>
          <CardDescription>
            Todos los movimientos de insumos ordenados por fecha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MovimientosTable initialData={movimientosData} insumos={insumos} />
        </CardContent>
      </Card>
    </div>
  )
}
