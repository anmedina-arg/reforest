import { getAllProducciones, getEstadosProduccion } from '@/app/actions/produccion'
import { getProyectos } from '@/app/actions/proyectos'
import { ProduccionPageClient } from '@/components/produccion/ProduccionPageClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ProduccionPage() {
  // Obtener todas las producciones, proyectos y estados en paralelo
  const [produccionesResult, proyectosResult, estadosResult] = await Promise.all([
    getAllProducciones({
      page: 1,
      pageSize: 1000, // Traer todas para filtrado client-side
    }),
    getProyectos({
      page: 1,
      pageSize: 1000,
    }),
    getEstadosProduccion(),
  ])

  const producciones = produccionesResult.success ? produccionesResult.data.data : []
  const total = produccionesResult.success ? produccionesResult.data.total : 0

  // Extraer datos para filtros
  const proyectos = proyectosResult.success && proyectosResult.data
    ? proyectosResult.data.data.map((p) => ({
        id_proyecto: p.id_proyecto,
        nombre_del_proyecto: p.nombre_del_proyecto,
        codigo_proyecto: p.codigo_proyecto || '',
      }))
    : []

  const estados = estadosResult.success ? estadosResult.data : []

  return (
    <div className="container mx-auto p-6 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Producción</h1>
        <p className="text-muted-foreground">
          Visualiza y gestiona todas las producciones del sistema
        </p>
      </div>

      {/* Contenido */}
      <Card>
        <CardHeader>
          <CardTitle>Producciones</CardTitle>
          <CardDescription>
            {total === 0
              ? 'No hay producciones registradas'
              : `${new Intl.NumberFormat('es-AR').format(total)} ${
                  total === 1 ? 'producción registrada' : 'producciones registradas'
                }`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {producciones.length > 0 ? (
            <ProduccionPageClient
              producciones={producciones}
              proyectos={proyectos}
              estados={estados}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <svg
                  className="h-6 w-6 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-1">No hay producciones</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Las producciones se crean desde la página de cada proyecto
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
