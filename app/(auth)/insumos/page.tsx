import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserRole } from '@/lib/auth'
import { getInsumos, getTiposInsumo, getUnidadesMedida } from '@/app/actions/insumos'
import { InsumosTable } from '@/components/insumos/InsumosTable'

export default async function InsumosPage() {
  // Obtener rol del usuario
  const userRole = await getUserRole()

  // Si el usuario no tiene rol, redirigir al dashboard
  if (!userRole) {
    redirect('/dashboard')
  }

  // Obtener datos iniciales en paralelo
  const [insumosResult, tiposInsumoResult, unidadesMedidaResult] = await Promise.all([
    getInsumos({ pageSize: 1000 }), // Traer todos los insumos para client-side filtering
    getTiposInsumo(),
    getUnidadesMedida(),
  ])

  // Manejar errores
  if (!insumosResult.success || !insumosResult.data) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              No se pudieron cargar los insumos: {insumosResult.error}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!tiposInsumoResult.success || !tiposInsumoResult.data) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              No se pudieron cargar los tipos de insumo: {tiposInsumoResult.error}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!unidadesMedidaResult.success || !unidadesMedidaResult.data) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              No se pudieron cargar las unidades de medida: {unidadesMedidaResult.error}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const insumos = insumosResult.data.data
  const tiposInsumo = tiposInsumoResult.data
  const unidadesMedida = unidadesMedidaResult.data

  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Insumos</h1>
        <p className="text-muted-foreground">
          Administra el inventario de insumos forestales: semillas, sustratos, promotores y
          cápsulas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insumos</CardTitle>
          <CardDescription>
            {insumos.length} {insumos.length === 1 ? 'insumo registrado' : 'insumos registrados'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InsumosTable
            initialData={insumos}
            tiposInsumo={tiposInsumo}
            unidadesMedida={unidadesMedida}
            userRole={userRole}
          />
        </CardContent>
      </Card>
    </div>
  )
}
